import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { SystemGenerationStatus } from "~/types/project";

const animatedIndices = new Set<number>();

interface AnimatedMarkdownProps {
  children: React.ReactNode;
  delay?: number;
  index?: number;
  systemGenerationStatus?: SystemGenerationStatus;
  diagram: "nvidia" | "dell";
}

export const AnimatedMarkdown: React.FC<AnimatedMarkdownProps> = ({
  children,
  delay = 0,
  index = 0,
  systemGenerationStatus,
  diagram,
}) => {
  // Skip animation if system generation is completed or failed
  const shouldSkipAnimation =
    systemGenerationStatus === SystemGenerationStatus.COMPLETED ||
    systemGenerationStatus === SystemGenerationStatus.FAILED;

  // If already animated this index or should skip animation — show immediately
  const initiallyVisible = animatedIndices.has(index) || shouldSkipAnimation;
  const [isVisible, setIsVisible] = useState(initiallyVisible);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // if already visible or should skip animation — exit without timer
    if (initiallyVisible) return;

    const timer = setTimeout(
      () => {
        setIsVisible(true);
        animatedIndices.add(index);
        // scroll only if animation is not skipped
        if (!shouldSkipAnimation && diagram === "nvidia") {
          elementRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      },
      2000 * (index + 1) + delay,
    );

    return () => clearTimeout(timer);
  }, [delay, index, initiallyVisible, shouldSkipAnimation]);

  return (
    <motion.div
      ref={elementRef}
      // Skip initial animation if already visible or should skip animation
      initial={initiallyVisible ? undefined : { opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1 }}
    >
      {children}
    </motion.div>
  );
};
