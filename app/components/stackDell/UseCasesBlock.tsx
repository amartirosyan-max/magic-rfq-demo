import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router";
import type { Box, LayerData } from "../stack/constants";
import {
  BOXES_PER_BLOCK,
  USE_CASES_TIP_OFFSET,
  createUseCasesClipPath,
} from "./utils";
import { useMouseGradient } from "./hooks/useMouseGradient";
import { sortingByRankLayerData } from "./hooks/sortingByRankLayerData";
import loadingAnimation from "./assets/loading_animation.webm";
import DellContentBox from "./DellContentBox";

import "./styles/gradients-styles.css";
import { animate, set } from "animejs";
import type { CSSProperties } from "react";

interface UseCasesBlockProps {
  layerData: LayerData[];
  layerProductsData: LayerData[];
  isSubsystemsAvailable: boolean;
  isProposalGeneration: boolean;
  boxesLayout: boolean;
  isNotchStyleExternallyControlled?: boolean;
  isActive: boolean;
  onContentReadyChange?: (isReady: boolean) => void;
}

type UseCasesBlockStyle = CSSProperties & {
  "--use-cases-left-notch"?: string;
};

const UseCasesBlock = forwardRef<HTMLDivElement, UseCasesBlockProps>(
  (
    {
      layerData,
      layerProductsData,
      isSubsystemsAvailable,
      isProposalGeneration,
      boxesLayout,
      isNotchStyleExternallyControlled = false,
      isActive,
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

    const subsystemUrl =
      hasProductsData && layerProductsData[0]?.url
        ? layerProductsData[0].url
        : "";

    const navigate = useNavigate();

    const getItemOffsets = (count: number) =>
      count === 1
        ? // ? [11]
          // : count === 2
          //   ? [11, 11]
          //   : count === 3
          //     ? [-7, 11, -7]
          //     : [-7, 11, 11, -7];
          [16]
        : count === 2
          ? [16, 16]
          : count === 3
            ? [-2, 16, -2]
            : [-2, 16, 16, -2];

    const offsets = getItemOffsets(data.length);

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
          animate(containerRef.current, {
            height: ["45px", "100%"],
          });
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
                style={{
                  marginLeft: boxesLayout ? offsets[index] : "",
                  maxInlineSize: "144px",
                }}
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
                marginLeft: boxesLayout ? offsets[index] : "",
                maxInlineSize: "144px",
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

    const useCasesBlockStyle: UseCasesBlockStyle = {
      clipPath: isActive
        ? ""
        : createUseCasesClipPath("var(--use-cases-left-notch, 0px)"),
      cursor: hasData ? "pointer" : "default",
      minInlineSize: isActive ? "100%" : "200px",
      minBlockSize: isActive ? "45px" : "",
      blockSize: isActive ? "auto" : "384px",
      marginInlineStart: isActive ? "" : boxesLayout ? "-19px" : "0",
    };

    if (!isNotchStyleExternallyControlled) {
      useCasesBlockStyle["--use-cases-left-notch"] = boxesLayout
        ? `${USE_CASES_TIP_OFFSET}px`
        : "0px";
    }

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
        className="use-cases-block
          relative overflow-hidden
          p-[8px] 
          flex flex-col justify-center items-center
          bg-[#0972CB] 
          before:content-['']
          before:absolute
          before:inset-0
          before:opacity-0
          before:transition-opacity
          before:duration-300
          hover:before:opacity-100
        "
        style={useCasesBlockStyle}
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
              <h2 className="text-[12px] font-semibold">USE CASES</h2>
              {dataBoxesRestAmount > 0 && (
                <div className="flex justify-center items-center px-[6px] py-[2px] border border-[#FFFFFF33] rounded-sm">
                  <span className="text-[10px] font-semibold ">
                    +{dataBoxesRestAmount}
                  </span>
                </div>
              )}
            </div>
            {/* <div className="flex flex-col w-full h-full items-center justify-center"> */}
            {isDataVisible && (
              <div
                className="flex gap-[16px] items-center gap-[16px] w-full h-full pt-[15px]"
                style={{
                  marginInlineStart: boxesLayout ? "" : "-15px",
                  flexWrap: isActive ? "wrap" : "nowrap",
                  flexDirection: isActive ? "row" : "column",
                  maxInlineSize: isActive ? "100%" : "144px",
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
            {/* </div> */}
          </>
        )}
      </div>
    );
  },
);

export default UseCasesBlock;
