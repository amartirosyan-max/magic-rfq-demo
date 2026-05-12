import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTimeoutFn } from "react-use";
import LayerBlock from "./LayerBlock";
import { type LayerData } from "~/components/stack/constants";
import { Loader2 } from "lucide-react";

interface StackProps {
  stackData: LayerData[];
  isLoading?: boolean;
}

interface LayerDiff {
  layer: LayerData;
  status: "new" | "existing" | "removing";
  key: string;
}

// Helper function to create a unique key for a layer
const getLayerKey = (layer: LayerData, index: number) => {
  return `${layer.layer || "no-layer"}-${layer.hr_uid || "no-uid"}-${layer.title || "no-title"}-${index}`;
};

function Stack({ stackData, isLoading }: StackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [previousStackData, setPreviousStackData] = useState<LayerData[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldShowLoader, setShouldShowLoader] = useState(false);

  console.log("stack data", stackData);

  // Calculate diff between previous and current stackData
  const layerDiffs = useMemo(() => {
    if (previousStackData.length === 0) {
      // First load - all layers are new
      return stackData.map((layer, index) => ({
        layer,
        status: "new" as const,
        key: getLayerKey(layer, index),
      }));
    }

    const currentKeys = new Set(
      stackData.map((layer, index) => getLayerKey(layer, index)),
    );
    const previousKeys = new Set(
      previousStackData.map((layer, index) => getLayerKey(layer, index)),
    );

    const diffs: LayerDiff[] = [];

    // Add existing and new layers
    stackData.forEach((layer, index) => {
      const key = getLayerKey(layer, index);
      diffs.push({
        layer,
        status: previousKeys.has(key) ? "existing" : "new",
        key,
      });
    });

    // Add removing layers
    previousStackData.forEach((layer, index) => {
      const key = getLayerKey(layer, index);
      if (!currentKeys.has(key)) {
        diffs.push({
          layer,
          status: "removing",
          key,
        });
      }
    });

    return diffs;
  }, [stackData, previousStackData]);

  // Update previous state when stackData changes
  useEffect(() => {
    if (stackData !== previousStackData) {
      const hasRemovedLayers = layerDiffs.some(
        (diff) => diff.status === "removing",
      );
      if (hasRemovedLayers) {
        setIsAnimating(true);
      }

      // Delay updating previous state to allow exit animations
      const timeoutId = setTimeout(
        () => {
          setPreviousStackData(stackData);
          setIsAnimating(false);
        },
        hasRemovedLayers ? 300 : 0,
      );

      return () => clearTimeout(timeoutId);
    }
  }, [stackData, layerDiffs]);

  // Properly implement loading delay with useTimeoutFn
  const [, , resetLoaderTimeout] = useTimeoutFn(() => {
    if (isLoading) {
      setShouldShowLoader(true);
    }
  }, 3000);

  // Handle loader visibility based on loading state
  useEffect(() => {
    if (isLoading) {
      // Start the timer when loading begins
      resetLoaderTimeout();
    } else {
      // Hide loader immediately when loading ends
      setShouldShowLoader(false);
    }
  }, [isLoading, resetLoaderTimeout]);

  console.log("shouldShowLoader", shouldShowLoader);

  return (
    <div className="p-3">
      <div
        ref={containerRef}
        className="
        stack
        w-full
        h-full
        flex items-center justify-center
        font-[SofiaSans]
        border
        py-2.5
        overflow-visible
      "
      >
        <div
          ref={contentRef}
          className="w-full flex flex-col items-center justify-center px-2.5 relative"
        >
          {isLoading && !isAnimating && shouldShowLoader && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center w-full h-full absolute bg-background/20 top-0 left-0 z-10 backdrop-blur-xs"
            >
              <Loader2 className="animate-spin" />
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {layerDiffs.map((diff, idx) => {
              const isLast =
                diff.status !== "removing" &&
                idx ===
                  layerDiffs.filter((d) => d.status !== "removing").length - 1;

              // Calculate stagger delay for sequential animation (bottom to top)
              const newLayers = layerDiffs.filter((d) => d.status === "new");
              const newLayerIndex = newLayers.findIndex(
                (d) => d.key === diff.key,
              );
              const reversedIndex = newLayers.length - 1 - newLayerIndex;
              const staggerDelay =
                diff.status === "new" ? reversedIndex * 0.2 : 0;

              return (
                <motion.div
                  key={diff.key}
                  layout
                  initial={
                    diff.status === "new"
                      ? {
                          opacity: 0,
                          scaleX: 0.1, // Start almost collapsed horizontally
                          scale: 0.95, // Slightly smaller overall
                          transformOrigin: "center", // Unfold from center
                        }
                      : false
                  }
                  animate={{
                    opacity: 1,
                    scaleX: 1, // Expand to full width
                    scale: 1, // Full size
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 1 },
                  }}
                  transition={{
                    duration: 0.3,
                    ease: "easeInOut",
                    delay: staggerDelay,
                  }}
                  className="w-full"
                >
                  <LayerBlock
                    layerData={diff.layer}
                    className={isLast ? "mb-0" : ""}
                    animationDelay={staggerDelay}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default Stack;
