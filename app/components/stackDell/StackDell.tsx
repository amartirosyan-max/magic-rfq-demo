import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { LayerData, StackGeneratingInfo } from "../stack/constants";
import DataBlock from "./DataBlock";
import DiagramLoaderOverlay from "./DiagramLoaderOverlay";
import EcosystemBlock from "./EcosystemBlock";
import InfrastructureBlock from "./InfrastructureBlock";
import ServicesBlock from "./ServicesBlock";
import UseCasesBlock from "./UseCasesBlock";
import { animate, set } from "animejs";
import { splitSubsystemByZones } from "./hooks/splitSubsytemsByZones";
import {
  CATEGORY_TO_ZONE,
  DATA_BLOCK_WIDTH,
  MIDDLE_BLOCK_ANIMATION_MARGIN_LEFT,
  MIDDLE_BLOCK_ANIMATION_MARGIN_RIGHT,
  USE_CASES_BLOCK_WIDTH,
  USE_CASES_TIP_OFFSET,
  createUseCasesClipPath,
  type DiagramZone,
} from "./utils";
import { cn } from "~/lib/utils";
import { useEffectiveSubsystemId } from "~/hooks/useEffectiveSubsystemId";
import type { DellCategories } from "~/types/systemResponse";

interface StackDellProps {
  stackData: LayerData[];
  subsystemsStackData: LayerData[];
  isLoading?: boolean;
  isProposal: boolean;
  stackGeneratingInfo?: StackGeneratingInfo;
  isRootSystem?: boolean;
  activeSubsystemId?: number | null;
}

type SubsystemEnabled = {
  data: boolean;
  useCases: boolean;
  infrastructure: boolean;
  ecosystem: boolean;
  services: boolean;
};

const INITIAL_ZONE_COMPLETION_STATE: Record<DiagramZone, boolean> = {
  DATA: false,
  SERVICES: false,
  OPEN_ECOSYSTEM: false,
  INFRASTRUCTURE: false,
  USE_CASES: false,
};

const USE_CASES_COLLAPSED_NOTCH_PX = 0;
function resetAnimatedLayoutStyles(elements: Array<HTMLElement | null>) {
  elements.forEach((element) => {
    if (!element) return;

    element.style.position = "";
    element.style.width = "";
    element.style.opacity = "";
    element.style.margin = "";
    element.style.justifyContent = "";
    element.style.alignItems = "";
    element.style.left = "";
    element.style.right = "";
  });
}

function restoreSideBlockBaseStyles(
  dataBlock: HTMLElement | null,
  useCasesBlock: HTMLElement | null,
) {
  if (dataBlock) {
    dataBlock.style.minWidth = `${DATA_BLOCK_WIDTH}px`;
    dataBlock.style.minInlineSize = `${DATA_BLOCK_WIDTH}px`;
    dataBlock.style.width = "";
  }

  if (useCasesBlock) {
    useCasesBlock.style.minWidth = `${USE_CASES_BLOCK_WIDTH}px`;
    useCasesBlock.style.minInlineSize = `${USE_CASES_BLOCK_WIDTH}px`;
    useCasesBlock.style.width = "";
  }
}

function StackDell({
  stackData,
  subsystemsStackData,
  isProposal,
  stackGeneratingInfo,
  isRootSystem,
  activeSubsystemId,
}: StackDellProps) {
  const [isSubsystemsEnabled, setIsSubsystemsEnabled] =
    useState<SubsystemEnabled>({
      data: false,
      useCases: false,
      infrastructure: false,
      ecosystem: false,
      services: false,
    });

  const [useCasesBoxesLayout, setUseCasesBoxesLayout] =
    useState<boolean>(false);

  const [activeBlock, setActiveBlock] = useState<DiagramZone | null>(null);
  const [isLoaderGeometryStable, setIsLoaderGeometryStable] = useState(false);
  const [
    isUseCasesNotchExternallyControlled,
    setIsUseCasesNotchExternallyControlled,
  ] = useState(false);
  const [isDataBlockProposalCollapsed, setIsDataBlockProposalCollapsed] =
    useState(false);
  const [zoneCompletionState, setZoneCompletionState] = useState<
    Record<DiagramZone, boolean>
  >(INITIAL_ZONE_COMPLETION_STATE);

  const proposalStepsRef = useRef({
    first: false,
    second: false,
    third: false,
    forth: false,
  });
  const queuedProposalPhasesRef = useRef({
    second: false,
    third: false,
  });

  const stackRef = useRef<HTMLDivElement | null>(null);
  const useCasesRef = useRef<HTMLDivElement | null>(null);
  const middleBlockRef = useRef<HTMLDivElement | null>(null);
  const dataRef = useRef<HTMLDivElement | null>(null);

  const { effectiveSubsystemId } = useEffectiveSubsystemId();
  const resolvedActiveSubsystemId =
    activeSubsystemId ?? Number(effectiveSubsystemId);

  const zoneToShow = stackData.find((d) => d.id === resolvedActiveSubsystemId);

  const zones = useMemo(() => splitSubsystemByZones(stackData), [stackData]);
  const designProgress = stackGeneratingInfo?.design_progress;
  const useCasesData = subsystemsStackData.filter(
    (s) => s.category === "use_cases",
  );
  const dataData = subsystemsStackData.filter((s) => s.category === "data");

  const middleBlockActive =
    activeBlock === "SERVICES" ||
    activeBlock === "OPEN_ECOSYSTEM" ||
    activeBlock === "INFRASTRUCTURE";

  const setZoneCompletion = useCallback(
    (zone: DiagramZone, isCompleted: boolean) => {
      setZoneCompletionState((prev) =>
        prev[zone] === isCompleted ? prev : { ...prev, [zone]: isCompleted },
      );
    },
    [],
  );

  const handleDataReadyChange = useCallback(
    (isReady: boolean) => setZoneCompletion("DATA", isReady),
    [setZoneCompletion],
  );

  const handleUseCasesReadyChange = useCallback(
    (isReady: boolean) => setZoneCompletion("USE_CASES", isReady),
    [setZoneCompletion],
  );

  const handleServicesReadyChange = useCallback(
    (isReady: boolean) => setZoneCompletion("SERVICES", isReady),
    [setZoneCompletion],
  );

  const handleEcosystemReadyChange = useCallback(
    (isReady: boolean) => setZoneCompletion("OPEN_ECOSYSTEM", isReady),
    [setZoneCompletion],
  );

  const handleInfrastructureReadyChange = useCallback(
    (isReady: boolean) => setZoneCompletion("INFRASTRUCTURE", isReady),
    [setZoneCompletion],
  );

  const visibleZones = useMemo<DiagramZone[]>(() => {
    if (!activeBlock) {
      return [
        "DATA",
        "SERVICES",
        "OPEN_ECOSYSTEM",
        "INFRASTRUCTURE",
        "USE_CASES",
      ];
    }

    return [activeBlock];
  }, [activeBlock]);

  const areVisibleZonesReady = useMemo(
    () => visibleZones.every((zone) => zoneCompletionState[zone]),
    [zoneCompletionState, visibleZones],
  );

  const loaderCompletionState = useMemo(
    () => ({
      DATA: zoneCompletionState.DATA,
      USE_CASES: zoneCompletionState.USE_CASES,
      MIDDLE_STACK:
        zoneCompletionState.SERVICES &&
        zoneCompletionState.OPEN_ECOSYSTEM &&
        zoneCompletionState.INFRASTRUCTURE,
    }),
    [zoneCompletionState],
  );

  const shouldFinishLoader = Boolean(
    isProposal && stackGeneratingInfo?.design_completed && areVisibleZonesReady,
  );

  const shouldShowLoader = Boolean(
    isProposal &&
      (!stackGeneratingInfo?.design_completed || !areVisibleZonesReady),
  );

  const proposalAnimationPhaseFirst = () => {
    if (
      !useCasesRef.current ||
      !dataRef.current ||
      !middleBlockRef.current ||
      !stackRef.current
    )
      return;

    const useCasesBlock = useCasesRef.current;
    const dataBlock = dataRef.current;
    const middleBlock = middleBlockRef.current;
    const parent = stackRef.current;

    const fullWidth = parent.getBoundingClientRect().width;

    set(dataBlock, {
      position: "absolute",
      opacity: 0,
      zIndex: 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    });
    set(useCasesBlock, {
      position: "absolute",
      clipPath: createUseCasesClipPath("var(--use-cases-left-notch, 0px)"),
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    });
    useCasesBlock.style.setProperty(
      "--use-cases-left-notch",
      `${USE_CASES_COLLAPSED_NOTCH_PX}px`,
    );
    setIsUseCasesNotchExternallyControlled(true);
    set(middleBlock, {
      opacity: 0,
      marginLeft: MIDDLE_BLOCK_ANIMATION_MARGIN_LEFT,
      marginRight: MIDDLE_BLOCK_ANIMATION_MARGIN_RIGHT,
      zIndex: 0,
    });

    setIsSubsystemsEnabled((prev) => ({ ...prev, useCases: true }));

    animate(useCasesBlock, {
      width: fullWidth,
      duration: 2000,
      ease: "inOut",
      onComplete: () => {
        setIsLoaderGeometryStable(true);
      },
    });
  };

  const proposalAnimationPhaseSecond = () => {
    if (
      !useCasesRef.current ||
      !dataRef.current ||
      !middleBlockRef.current ||
      !stackRef.current
    )
      return;

    const useCasesBlock = useCasesRef.current;
    const dataBlock = dataRef.current;
    const parent = stackRef.current;

    const fullWidth = parent.getBoundingClientRect().width;

    setIsLoaderGeometryStable(false);
    setIsDataBlockProposalCollapsed(true);
    setIsSubsystemsEnabled((prev) => ({
      ...prev,
      data: true,
    }));
    set(dataBlock, {
      width: 0,
      minWidth: 0,
      minInlineSize: 0,
    });
    const useCasesNotchState = {
      value:
        Number.parseFloat(
          useCasesBlock.style.getPropertyValue("--use-cases-left-notch"),
        ) || USE_CASES_COLLAPSED_NOTCH_PX,
    };

    let completedAnimations = 0;
    const handlePhaseComplete = () => {
      completedAnimations += 1;

      if (completedAnimations >= 3) {
        setIsLoaderGeometryStable(true);
      }
    };

    animate(useCasesBlock, {
      width: fullWidth / 2 + 15,
      duration: 2000,
      ease: "inOut",
      right: 0,
      onComplete: () => {
        setUseCasesBoxesLayout(true);
        setIsUseCasesNotchExternallyControlled(false);
        handlePhaseComplete();
      },
    });
    animate(useCasesNotchState, {
      value: USE_CASES_TIP_OFFSET,
      duration: 1000,
      ease: "out",
      onUpdate: () => {
        useCasesBlock.style.setProperty(
          "--use-cases-left-notch",
          `${useCasesNotchState.value}px`,
        );
      },
      onComplete: handlePhaseComplete,
    });
    animate(dataBlock, {
      width: fullWidth / 2 + 15,
      duration: 2000,
      opacity: 1,
      ease: "inOut",
      onComplete: handlePhaseComplete,
    });
  };

  const proposalAnimationPhaseThird = () => {
    if (
      !useCasesRef.current ||
      !dataRef.current ||
      !middleBlockRef.current ||
      !stackRef.current
    )
      return;

    const useCasesBlock = useCasesRef.current;
    const dataBlock = dataRef.current;
    const middleBlock = middleBlockRef.current;

    setIsLoaderGeometryStable(false);
    set(middleBlock, {
      opacity: 0,
      marginLeft: MIDDLE_BLOCK_ANIMATION_MARGIN_LEFT,
      marginRight: MIDDLE_BLOCK_ANIMATION_MARGIN_RIGHT,
      zIndex: 0,
    });

    animate(middleBlock, {
      opacity: [0, 0.5, 1],
    });
    animate([dataBlock, useCasesBlock], {
      width: USE_CASES_BLOCK_WIDTH,
      duration: 1000,
      onComplete: () => {
        setIsSubsystemsEnabled((prev) => ({
          ...prev,
          services: true,
          ecosystem: true,
          infrastructure: true,
        }));
        setIsDataBlockProposalCollapsed(false);
        resetAnimatedLayoutStyles([middleBlock, useCasesBlock, dataBlock]);
        restoreSideBlockBaseStyles(dataBlock, useCasesBlock);
        useCasesBlock.style.setProperty(
          "--use-cases-left-notch",
          `${USE_CASES_TIP_OFFSET}px`,
        );
        setIsLoaderGeometryStable(true);
      },
    });
  };

  function flushQueuedProposalPhase() {
    if (!isProposal || !isLoaderGeometryStable) {
      return;
    }

    if (
      queuedProposalPhasesRef.current.second &&
      !proposalStepsRef.current.second
    ) {
      queuedProposalPhasesRef.current.second = false;
      proposalStepsRef.current.second = true;
      proposalAnimationPhaseSecond();
      return;
    }

    if (
      queuedProposalPhasesRef.current.third &&
      proposalStepsRef.current.second &&
      !proposalStepsRef.current.third
    ) {
      queuedProposalPhasesRef.current.third = false;
      proposalStepsRef.current.third = true;
      proposalAnimationPhaseThird();
    }
  }

  const handleAnimateDesign = () => {
    if (
      !useCasesRef.current ||
      !dataRef.current ||
      !middleBlockRef.current ||
      !stackRef.current
    )
      return;

    const useCasesBlock = useCasesRef.current;
    const dataBlock = dataRef.current;
    const middleBlock = middleBlockRef.current;
    const parent = stackRef.current;

    const fullWidth = parent.getBoundingClientRect().width;

    set(dataBlock, {
      position: "absolute",
      opacity: 0,
      zIndex: 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    });
    set(useCasesBlock, {
      position: "absolute",
      clipPath: createUseCasesClipPath("var(--use-cases-left-notch, 0px)"),
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      left: "24px",
    });
    useCasesBlock.style.setProperty(
      "--use-cases-left-notch",
      `${USE_CASES_COLLAPSED_NOTCH_PX}px`,
    );
    setIsUseCasesNotchExternallyControlled(true);
    set(middleBlock, {
      opacity: 0,
      marginLeft: MIDDLE_BLOCK_ANIMATION_MARGIN_LEFT,
      marginRight: MIDDLE_BLOCK_ANIMATION_MARGIN_RIGHT,
      zIndex: 0,
    });

    animate(useCasesBlock, {
      width: fullWidth,
      duration: 1000,
      ease: "inOut",
      onComplete: () => {
        setIsSubsystemsEnabled((prev) => ({
          ...prev,
          useCases: true,
          data: true,
        }));
        set(dataBlock, {
          width: 0,
          minWidth: 0,
          minInlineSize: 0,
        });
        useCasesBlock.style.left = "";
        const useCasesNotchState = {
          value: USE_CASES_COLLAPSED_NOTCH_PX,
        };
        animate(useCasesBlock, {
          width: fullWidth / 2 + 15,
          duration: 1000,
          right: 0,
        });
        animate(useCasesNotchState, {
          value: USE_CASES_TIP_OFFSET,
          duration: 700,
          ease: "out",
          onUpdate: () => {
            useCasesBlock.style.setProperty(
              "--use-cases-left-notch",
              `${useCasesNotchState.value}px`,
            );
          },
          onComplete: () => {
            setUseCasesBoxesLayout(true);
            setIsUseCasesNotchExternallyControlled(false);
          },
        });
        animate(dataBlock, {
          width: fullWidth / 2 + 15,
          duration: 1000,
          opacity: 1,
          onComplete: () => {
            setIsSubsystemsEnabled((prev) => ({
              ...prev,
              data: true,
            }));
            animate(middleBlock, {
              opacity: [0, 0.5, 1],
            });
            animate([dataBlock, useCasesBlock], {
              width: USE_CASES_BLOCK_WIDTH,
              duration: 1000,
              onComplete: () => {
                setIsSubsystemsEnabled((prev) => ({
                  ...prev,
                  services: true,
                  ecosystem: true,
                  infrastructure: true,
                }));
                [middleBlock, useCasesBlock, dataBlock].forEach((el) => {
                  el.style.position = "";
                  el.style.width = "";
                  el.style.opacity = "";
                  el.style.margin = "";
                  el.style.justifyContent = "";
                  el.style.alignItems = "";
                  el.style.left = "";
                  el.style.right = "";
                });
                restoreSideBlockBaseStyles(dataBlock, useCasesBlock);
              },
            });
          },
        });
      },
    });
  };

  useEffect(() => {
    if (!isProposal) {
      setIsLoaderGeometryStable(false);
      setIsDataBlockProposalCollapsed(false);
      setIsUseCasesNotchExternallyControlled(false);
      queuedProposalPhasesRef.current.second = false;
      queuedProposalPhasesRef.current.third = false;
    }
  }, [isProposal]);

  useEffect(() => {
    if (!isProposal) {
      setUseCasesBoxesLayout(!isRootSystem);
      setIsLoaderGeometryStable(false);
      setIsDataBlockProposalCollapsed(false);
      setIsUseCasesNotchExternallyControlled(false);

      setIsSubsystemsEnabled({
        data: true,
        useCases: true,
        infrastructure: true,
        ecosystem: true,
        services: true,
      });
      if (isRootSystem) {
        handleAnimateDesign();
      } else {
        return;
      }
      return;
    }

    if (stackGeneratingInfo?.design_completed) {
      setUseCasesBoxesLayout(true);
      setIsDataBlockProposalCollapsed(false);
      setIsUseCasesNotchExternallyControlled(false);
      queuedProposalPhasesRef.current.second = false;
      queuedProposalPhasesRef.current.third = false;

      setIsSubsystemsEnabled({
        data: true,
        useCases: true,
        infrastructure: true,
        ecosystem: true,
        services: true,
      });

      if (dataRef.current && useCasesRef.current && middleBlockRef.current) {
        resetAnimatedLayoutStyles([
          dataRef.current,
          useCasesRef.current,
          middleBlockRef.current,
        ]);
        restoreSideBlockBaseStyles(dataRef.current, useCasesRef.current);
      }

      return;
    }

    if (!designProgress) return;

    if (!proposalStepsRef.current.first) {
      setIsLoaderGeometryStable(false);
      proposalStepsRef.current.first = true;
      proposalAnimationPhaseFirst();
    }

    if (designProgress >= 24 && !proposalStepsRef.current.second) {
      queuedProposalPhasesRef.current.second = true;
    }

    if (designProgress >= 45 && !proposalStepsRef.current.third) {
      queuedProposalPhasesRef.current.third = true;
    }
  }, [
    designProgress,
    isProposal,
    stackGeneratingInfo?.design_completed,
    activeBlock,
  ]);

  useEffect(() => {
    if (!zoneToShow) {
      setActiveBlock(null);
      return;
    }

    const category = zoneToShow.category as DellCategories | undefined;

    if (category) {
      setActiveBlock(CATEGORY_TO_ZONE[category]);
    } else {
      setActiveBlock(null);
    }
  }, [zoneToShow]);

  return (
    <div
      ref={stackRef}
      className={cn(
        "relative flex w-full text-white font-['Helvetica_Neue']",
        isProposal &&
          !stackGeneratingInfo?.design_completed &&
          !proposalStepsRef.current.first &&
          "opacity-0",
      )}
      style={{
        blockSize: !activeBlock ? "384px" : "",
      }}
    >
      <DiagramLoaderOverlay
        isVisible={shouldShowLoader}
        isGeometryStable={isLoaderGeometryStable}
        hideStrategy={shouldFinishLoader ? "finish" : "immediate"}
        stackRef={stackRef}
        dataRef={dataRef}
        useCasesRef={useCasesRef}
        middleBlockRef={middleBlockRef}
        useCasesHasLeftNotch={useCasesBoxesLayout}
        loaderCompletionState={loaderCompletionState}
        onPassComplete={flushQueuedProposalPhase}
      />
      {(!activeBlock || activeBlock === "DATA") && (
        <DataBlock
          ref={dataRef}
          layerData={dataData ?? []}
          layerProductsData={zones.DATA ?? []}
          isProposalGeneration={isProposal}
          isSubsystemsAvailable={isSubsystemsEnabled.data}
          isActive={activeBlock === "DATA"}
          isProposalPhaseCollapsed={isDataBlockProposalCollapsed}
          onContentReadyChange={handleDataReadyChange}
        />
      )}
      {(!activeBlock || middleBlockActive) && (
        <div
          ref={middleBlockRef}
          className="flex flex-col w-full gap-[6px] min-w-0"
          style={{
            marginInlineStart: middleBlockActive ? "0" : "-34px",
          }}
        >
          {(!activeBlock || activeBlock === "SERVICES") && (
            <ServicesBlock
              layerData={zones.SERVICES ?? []}
              isProposalGeneration={isProposal}
              isSubsystemsAvailable={isSubsystemsEnabled.services}
              isActive={activeBlock === "SERVICES"}
              isRootSystem={isRootSystem!}
              onContentReadyChange={handleServicesReadyChange}
            />
          )}
          {(!activeBlock || activeBlock === "OPEN_ECOSYSTEM") && (
            <EcosystemBlock
              layerData={zones.OPEN_ECOSYSTEM ?? []}
              isProposalGeneration={isProposal}
              isSubsystemsAvailable={isSubsystemsEnabled.ecosystem}
              isActive={activeBlock === "OPEN_ECOSYSTEM"}
              isRootSystem={isRootSystem!}
              onContentReadyChange={handleEcosystemReadyChange}
            />
          )}
          {(!activeBlock || activeBlock === "INFRASTRUCTURE") && (
            <InfrastructureBlock
              layerData={zones.INFRASTRUCTURE ?? []}
              isProposalGeneration={isProposal}
              isSubsystemsAvailable={isSubsystemsEnabled.infrastructure}
              isActive={activeBlock === "INFRASTRUCTURE"}
              isRootSystem={isRootSystem!}
              onContentReadyChange={handleInfrastructureReadyChange}
            />
          )}
        </div>
      )}
      {(!activeBlock || activeBlock === "USE_CASES") && (
        <UseCasesBlock
          ref={useCasesRef}
          layerData={useCasesData ?? []}
          layerProductsData={zones.USE_CASES ?? []}
          isSubsystemsAvailable={isSubsystemsEnabled.useCases}
          isProposalGeneration={isProposal}
          boxesLayout={useCasesBoxesLayout}
          isNotchStyleExternallyControlled={isUseCasesNotchExternallyControlled}
          isActive={activeBlock === "USE_CASES"}
          onContentReadyChange={handleUseCasesReadyChange}
        />
      )}
    </div>
  );
}

export default StackDell;
