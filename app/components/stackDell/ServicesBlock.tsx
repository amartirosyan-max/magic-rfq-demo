import { useCallback, useEffect, useRef, useState } from "react";
import type { Box, LayerData } from "../stack/constants";
import { sortingByRankLayerData } from "./hooks/sortingByRankLayerData";
import "./styles/gradients-styles.css";
import { useMouseGradient } from "./hooks/useMouseGradient";
import { useNavigate, useOutletContext } from "react-router";
import { BOXES_PER_BLOCK } from "./utils";
import DellContentBox from "./DellContentBox";
import type { ProjectLayoutContext } from "~/layouts/project";
import { animate } from "animejs";

interface ServicesBlockProps {
  layerData: LayerData[];
  isSubsystemsAvailable: boolean;
  isProposalGeneration: boolean;
  isActive: boolean;
  isRootSystem: boolean;
  onContentReadyChange?: (isReady: boolean) => void;
}

const ServicesBlock: React.FC<ServicesBlockProps> = ({
  layerData,
  isSubsystemsAvailable,
  isProposalGeneration,
  isActive,
  isRootSystem,
  onContentReadyChange,
}) => {
  const [appearingData, setAppearingData] = useState<Box[]>([]);
  const [dataVisibleAmount, setDataVisibleAmount] = useState<number>(0);
  const [isDataVisible, setIsDataVisible] = useState<boolean>(true);
  const [hasFinalRevealCompleted, setHasFinalRevealCompleted] = useState(false);
  const [completedVisualItems, setCompletedVisualItems] = useState<
    Record<number, boolean>
  >({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  const hasData = layerData.length > 0;

  const data =
    hasData && dataVisibleAmount > 0 ? sortingByRankLayerData(layerData) : [];

  const dataToShow = isActive ? data : data.slice(0, dataVisibleAmount);
  const usesStagedReveal = isProposalGeneration && !isActive;
  const visibleItemIdsSignature = dataToShow.map((item) => item.id).join(":");
  const areVisibleItemsCompleted = dataToShow.every((item) =>
    Boolean(item.design_completed),
  );
  const areVisibleItemsVisuallyCompleted = dataToShow.every(
    (item) => completedVisualItems[item.id],
  );
  const { openRightOptions } = useOutletContext<ProjectLayoutContext>();

  const dataBoxesRestAmount = Math.max(0, data.length - dataToShow.length);
  const subsystemUrl = hasData ? (layerData[0].url ?? "") : "";

  const navigate = useNavigate();

  const handleNavigateToSubsystem = (url: string) => {
    openRightOptions();
    navigate(url, {
      state: { activeTab: "design" },
    });
  };

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;

      if (w >= 1900) setDataVisibleAmount(6);
      else if (w >= 1700) setDataVisibleAmount(5);
      else if (w >= 1550) setDataVisibleAmount(BOXES_PER_BLOCK);
      else if (w >= 1440) setDataVisibleAmount(3);
      else setDataVisibleAmount(2);
    };

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    setHasFinalRevealCompleted(!usesStagedReveal || dataToShow.length === 0);
    setCompletedVisualItems({});
  }, [dataToShow.length, usesStagedReveal, visibleItemIdsSignature]);

  const handleVisualCompletionChange = useCallback(
    (boxId: number, isCompleted: boolean) => {
      setCompletedVisualItems((prev) =>
        prev[boxId] === isCompleted ? prev : { ...prev, [boxId]: isCompleted },
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
    if (isActive) {
      setIsDataVisible(false);
      animate(containerRef.current, {
        width: [0, "100%"],
        onComplete: () => {
          setIsDataVisible(true);
          if (!containerRef.current) return;
          if (isActive) animate(containerRef.current, { height: "100%" });
        },
      });
    }
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
      {!isRootSystem &&
        data.map((d, index) => (
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
      role="button"
      tabIndex={0}
      ref={containerRef}
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
      className="services-block
      relative overflow-hidden
      flex flex-col items-center justify-between gap-[20px] 
      h-[124px] w-full pt-[8px] pb-[23px] px-[35px]
      bg-[#00217E] 
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
          : "polygon(0% 0%, calc(100% - 27px) 0%, 100% 100%, calc(0% + 27px) 100%)",
        cursor: hasData ? "pointer" : "default",
        blockSize: isActive ? "auto" : "124px",
      }}
    >
      {isSubsystemsAvailable && (
        <>
          <div className="flex justify-center items-center gap-[8px] leading-[1.2]">
            <h2 className="text-[12px] font-semibold">SERVICES</h2>
            {dataBoxesRestAmount > 0 && (
              <div className="flex justify-center items-center px-[6px] py-[2px] border border-[#FFFFFF33] rounded-sm">
                <span className="text-[10px] font-semibold ">
                  +{dataBoxesRestAmount}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {isDataVisible && (
        <div
          className="flex items-start gap-[8px] w-full"
          style={{
            flexWrap: isActive ? "wrap" : "nowrap",
            justifyContent: isActive ? "center" : "space-evenly",
          }}
        >
          {isActive
            ? productsDataLayout
            : isProposalGeneration
              ? proposalGenerationDataLayout
              : designDataLayout}
        </div>
      )}
    </div>
  );
};

export default ServicesBlock;
