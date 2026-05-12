import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Box, LayerData } from "../stack/constants";
import { sortingByRankLayerData } from "./hooks/sortingByRankLayerData";
import { useMouseGradient } from "./hooks/useMouseGradient";
import { useNavigate } from "react-router";
import { BOXES_PER_BLOCK } from "./utils";

import DellContentBox from "./DellContentBox";
import "./styles/gradients-styles.css";
import { animate } from "animejs";

interface DataBlockProps {
  layerData: LayerData[];
  layerProductsData: LayerData[];
  isSubsystemsAvailable: boolean;
  isProposalGeneration: boolean;
  isActive: boolean;
  isProposalPhaseCollapsed?: boolean;
  onContentReadyChange?: (isReady: boolean) => void;
}

const DataBlock = forwardRef<HTMLDivElement, DataBlockProps>(
  (
    {
      layerData,
      layerProductsData,
      isSubsystemsAvailable,
      isProposalGeneration,
      isActive,
      isProposalPhaseCollapsed = false,
      onContentReadyChange,
    },
    ref,
  ) => {
    const [appearingData, setAppearingData] = useState<Box[]>([]);
    const [isDataVisible, setIsDataVisible] = useState<boolean>(true);
    const [hasFinalRevealCompleted, setHasFinalRevealCompleted] =
      useState(false);
    const [completedVisualItems, setCompletedVisualItems] = useState<
      Record<number, boolean>
    >({});
    const containerRef = useRef<HTMLDivElement | null>(null);

    const hasData = layerData.length > 0;
    const hasProductsData = layerProductsData.length > 0;

    const data = hasData ? sortingByRankLayerData(layerData) : [];
    const productsData = hasProductsData
      ? sortingByRankLayerData(layerProductsData)
      : [];

    const dataToShow = data.slice(0, BOXES_PER_BLOCK);
    const usesStagedReveal = isProposalGeneration && !isActive;
    const visibleItemIdsSignature = dataToShow.map((item) => item.id).join(":");
    const areVisibleItemsCompleted = dataToShow.every((item) =>
      Boolean(item.design_completed),
    );
    const areVisibleItemsVisuallyCompleted = dataToShow.every(
      (item) => completedVisualItems[item.id],
    );

    const dataBoxesRestAmount = Math.max(0, data.length - dataToShow.length);
    const subsystemUrl = layerProductsData?.[0]?.url ?? "";

    const navigate = useNavigate();

    const handleNavigateToSubsystem = (url: string) => {
      navigate(url, {
        state: { activeTab: "design" },
      });
    };

    useEffect(() => {
      setHasFinalRevealCompleted(!usesStagedReveal || dataToShow.length === 0);
      setCompletedVisualItems({});
    }, [dataToShow.length, usesStagedReveal, visibleItemIdsSignature]);

    const handleVisualCompletionChange = useCallback(
      (boxId: number, isCompleted: boolean) => {
        setCompletedVisualItems((prev) =>
          prev[boxId] === isCompleted
            ? prev
            : { ...prev, [boxId]: isCompleted },
        );
      },
      [],
    );

    useEffect(() => {
      if (!dataToShow.length) return;

      const interval = setInterval(
        () => {
          setAppearingData((prev) => {
            if (prev.length >= dataToShow.length) {
              clearInterval(interval);
              return prev;
            }

            return [...prev, dataToShow[prev.length]];
          });
        },
        Math.floor(Math.random() * 3000),
      );

      return () => clearInterval(interval);
    }, [dataToShow]);

    useEffect(() => {
      setAppearingData((prev) => {
        if (!prev.length) return prev;

        const latestVisibleItems = new Map(
          dataToShow.map((item) => [item.id, item] as const),
        );
        const syncedItems = prev
          .map((item) => latestVisibleItems.get(item.id) ?? item)
          .filter((item) => latestVisibleItems.has(item.id));

        if (
          syncedItems.length === prev.length &&
          syncedItems.every((item, index) => item === prev[index])
        ) {
          return prev;
        }

        return syncedItems;
      });
    }, [dataToShow]);

    useEffect(() => {
      if (!onContentReadyChange) return;

      if (!isSubsystemsAvailable) {
        onContentReadyChange(false);
        return;
      }

      if (dataToShow.length === 0) {
        onContentReadyChange(true);
        return;
      }

      if (!usesStagedReveal) {
        onContentReadyChange(areVisibleItemsCompleted);
        return;
      }

      onContentReadyChange(
        hasFinalRevealCompleted &&
          areVisibleItemsCompleted &&
          areVisibleItemsVisuallyCompleted,
      );
    }, [
      areVisibleItemsCompleted,
      areVisibleItemsVisuallyCompleted,
      dataToShow.length,
      hasFinalRevealCompleted,
      isSubsystemsAvailable,
      onContentReadyChange,
      usesStagedReveal,
    ]);

    useEffect(() => {
      if (!containerRef.current) return;
      setIsDataVisible(false);
      animate(containerRef.current, {
        minWidth: [0, "100%"],
        onComplete: () => {
          setIsDataVisible(true);
          if (!containerRef.current) return;
          if (isActive) animate(containerRef.current, { height: "100%" });
        },
      });
    }, [isActive]);

    const proposalGenerationDataLayout = (
      <>
        {appearingData.length > 0 &&
          appearingData.map((d, index) => (
            <div
              key={index}
              className="diagram-enter-y"
              onAnimationEnd={() => {
                if (
                  index === dataToShow.length - 1 &&
                  appearingData.length >= dataToShow.length
                ) {
                  setHasFinalRevealCompleted(true);
                }
              }}
            >
              <DellContentBox
                data={d}
                isProposal={isProposalGeneration}
                style={{ inlineSize: "144px" }}
                isActive={isActive}
                onVisualCompletionChange={handleVisualCompletionChange}
              />
            </div>
          ))}
      </>
    );

    const designDataLayout = (
      <>
        {dataToShow.length > 0 &&
          dataToShow.map((d, index) => (
            <DellContentBox
              key={d.title ?? index}
              data={d}
              isProposal={isProposalGeneration}
              style={{
                inlineSize: "144px",
              }}
              isActive={isActive}
            />
          ))}
      </>
    );

    const productsDataLayout = (
      <>
        {productsData.length > 0 &&
          productsData.map((d, index) => (
            <div key={d.title ?? index} className="diagram-enter-x">
              <DellContentBox
                key={d.title ?? index}
                data={d}
                isProposal={isProposalGeneration}
                style={{
                  inlineSize: "144px",
                }}
                isActive={isActive}
              />
            </div>
          ))}
      </>
    );

    return (
      <div
        ref={isActive ? containerRef : ref}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            (event: React.KeyboardEvent) => {
              event.stopPropagation();
              if (subsystemUrl) handleNavigateToSubsystem(subsystemUrl);
            };
          }
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (subsystemUrl) handleNavigateToSubsystem(subsystemUrl);
        }}
        onMouseMove={useMouseGradient}
        className="data-block
        relative overflow-hidden
        flex flex-col justify-center 
        p-[8px] 
        bg-[#0D2155] 
        before:content-['']
        before:absolute
        before:inset-0
        before:opacity-0
        before:transition-opacity
        before:duration-300
        hover:before:opacity-100
        "
        style={{
          clipPath: isActive
            ? ""
            : "polygon(0% 0%, calc(100% - 42px) 0%, 100% 50%, calc(100% - 42px) 100%, 0% 100%)",
          cursor: hasData ? "pointer" : "default",
          minInlineSize: isActive
            ? "100%"
            : isProposalPhaseCollapsed
              ? "0px"
              : "200px",
          minBlockSize: isActive ? "45px" : "",
          blockSize: isActive ? "auto" : "100%",
        }}
      >
        {isSubsystemsAvailable && (
          <>
            <div
              className="absolute top-[8px]
                flex justify-center items-center gap-[8px] 
                max-w-[144px] w-full 
                leading-[1.2]"
              style={{
                left: "50%",
                transform: "translateX(calc(-50% - 11px))",
              }}
            >
              <h2 className="text-[12px] font-semibold">DATA</h2>
              {dataBoxesRestAmount > 0 && (
                <div className="flex justify-center items-center px-[6px] py-[2px] border border-[#FFFFFF33] rounded-sm">
                  <span className="text-[10px] font-semibold ">
                    +{dataBoxesRestAmount}
                  </span>
                </div>
              )}
            </div>
            {isDataVisible && (
              <div
                className="flex flex-col items-center gap-[16px] w-full h-full pt-[15px]"
                style={{
                  marginInlineStart: isProposalGeneration
                    ? "-12px"
                    : isActive
                      ? ""
                      : "-6px",
                  flexWrap: isActive ? "wrap" : "nowrap",
                  flexDirection: isActive ? "row" : "column",
                  justifyContent: isActive ? "center" : "space-evenly",
                  padding: isActive ? "30px 10px 10px 10px" : "",
                }}
              >
                {isActive
                  ? productsDataLayout
                  : isProposalGeneration
                    ? proposalGenerationDataLayout
                    : designDataLayout}
              </div>
            )}
          </>
        )}
      </div>
    );
  },
);

export default DataBlock;
