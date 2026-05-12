import { type RefObject, useId, useLayoutEffect, useMemo, useRef } from "react";
import type { DiagramZone } from "./utils";

type DiagramLoaderGroup = "DATA" | "MIDDLE_STACK" | "USE_CASES";

type ElementRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

interface DiagramLoaderOverlayProps {
  isVisible: boolean;
  isGeometryStable: boolean;
  hideStrategy?: "immediate" | "finish";
  stackRef: RefObject<HTMLDivElement | null>;
  dataRef: RefObject<HTMLDivElement | null>;
  useCasesRef: RefObject<HTMLDivElement | null>;
  middleBlockRef: RefObject<HTMLDivElement | null>;
  useCasesHasLeftNotch: boolean;
  loaderCompletionState: Record<DiagramLoaderGroup, boolean>;
  onPassComplete?: () => void;
}

const DATA_TIP_OFFSET = 42;
const USE_CASES_TIP_OFFSET = 42;
const SERVICES_TIP_OFFSET = 27;
const ECOSYSTEM_TIP_OFFSET = 14.16;
const INFRASTRUCTURE_TIP_OFFSET = 27;
const LOADER_TRAVEL_MULTIPLIER = 2.2;
const MAX_POLYGONS_COUNT = 5;
const CYCLE_DURATION_MS = 590;
const END_PAUSE_MS = 2500;
const MIN_VELOCITY_RATIO = 0.22;
const ACCELERATION_POWER = 2.4;
const MIN_MEASURABLE_ARROW_WIDTH_PX = 4;
const LOADER_KEYFRAME_STEPS = 24;

function roundRect(value: number) {
  return Math.round(value * 100) / 100;
}

function pointsToPolygon(points: Array<[number, number]>) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

function getVisibleRect(
  element: HTMLElement | null,
  containerRect: DOMRect,
  containerElement: HTMLElement,
): ElementRect | null {
  if (!element) return null;

  let currentElement: HTMLElement | null = element;

  while (currentElement) {
    const computedStyle = window.getComputedStyle(currentElement);

    if (
      computedStyle.display === "none" ||
      computedStyle.visibility === "hidden" ||
      Number.parseFloat(computedStyle.opacity) < 0.05
    ) {
      return null;
    }

    if (currentElement === containerElement) {
      break;
    }

    currentElement = currentElement.parentElement;
  }

  const rect = element.getBoundingClientRect();

  if (rect.width < 4 || rect.height < 4) {
    return null;
  }

  return {
    x: roundRect(rect.left - containerRect.left),
    y: roundRect(rect.top - containerRect.top),
    width: roundRect(rect.width),
    height: roundRect(rect.height),
  };
}

function createDataPolygon(rect: ElementRect) {
  return pointsToPolygon([
    [rect.x, rect.y],
    [rect.x + rect.width - DATA_TIP_OFFSET, rect.y],
    [rect.x + rect.width, rect.y + rect.height / 2],
    [rect.x + rect.width - DATA_TIP_OFFSET, rect.y + rect.height],
    [rect.x, rect.y + rect.height],
  ]);
}

function createUseCasesPolygon(rect: ElementRect, hasLeftNotch: boolean) {
  if (!hasLeftNotch) {
    return pointsToPolygon([
      [rect.x, rect.y],
      [rect.x + rect.width - USE_CASES_TIP_OFFSET, rect.y],
      [rect.x + rect.width, rect.y + rect.height / 2],
      [rect.x + rect.width - USE_CASES_TIP_OFFSET, rect.y + rect.height],
      [rect.x, rect.y + rect.height],
    ]);
  }

  return pointsToPolygon([
    [rect.x, rect.y],
    [rect.x + rect.width - USE_CASES_TIP_OFFSET, rect.y],
    [rect.x + rect.width, rect.y + rect.height / 2],
    [rect.x + rect.width - USE_CASES_TIP_OFFSET, rect.y + rect.height],
    [rect.x, rect.y + rect.height],
    [rect.x + USE_CASES_TIP_OFFSET, rect.y + rect.height / 2],
  ]);
}

function createServicesPolygon(rect: ElementRect) {
  return pointsToPolygon([
    [rect.x, rect.y],
    [rect.x + rect.width - SERVICES_TIP_OFFSET, rect.y],
    [rect.x + rect.width, rect.y + rect.height],
    [rect.x + SERVICES_TIP_OFFSET, rect.y + rect.height],
  ]);
}

function createEcosystemPolygon(rect: ElementRect) {
  return pointsToPolygon([
    [rect.x, rect.y],
    [rect.x + rect.width - ECOSYSTEM_TIP_OFFSET, rect.y],
    [rect.x + rect.width, rect.y + rect.height / 2],
    [rect.x + rect.width - ECOSYSTEM_TIP_OFFSET, rect.y + rect.height],
    [rect.x, rect.y + rect.height],
    [rect.x + ECOSYSTEM_TIP_OFFSET, rect.y + rect.height / 2],
  ]);
}

function createInfrastructurePolygon(rect: ElementRect) {
  return pointsToPolygon([
    [rect.x + INFRASTRUCTURE_TIP_OFFSET, rect.y],
    [rect.x + rect.width, rect.y],
    [rect.x + rect.width - INFRASTRUCTURE_TIP_OFFSET, rect.y + rect.height],
    [rect.x, rect.y + rect.height],
  ]);
}

function syncPolygonRefs(
  polygonRefs: Array<SVGPolygonElement | null>,
  polygons: string[],
) {
  polygonRefs.forEach((polygonRef, index) => {
    if (!polygonRef) return;

    const points = polygons[index];

    if (points) {
      polygonRef.setAttribute("points", points);
      polygonRef.style.display = "";
    } else {
      polygonRef.setAttribute("points", "");
      polygonRef.style.display = "none";
    }
  });
}

function getLoaderDistanceRatio(progress: number) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const accelerationDistance =
    Math.pow(clampedProgress, ACCELERATION_POWER + 1) /
    (ACCELERATION_POWER + 1);
  const integratedVelocity =
    MIN_VELOCITY_RATIO * clampedProgress +
    (1 - MIN_VELOCITY_RATIO) * accelerationDistance;
  const normalizationFactor =
    MIN_VELOCITY_RATIO + (1 - MIN_VELOCITY_RATIO) / (ACCELERATION_POWER + 1);

  return integratedVelocity / normalizationFactor;
}

function createLoaderKeyframes(travelDistance: number) {
  const cycleDuration = CYCLE_DURATION_MS + END_PAUSE_MS;
  const movementOffset = CYCLE_DURATION_MS / cycleDuration;
  const keyframes: Keyframe[] = [];

  for (let step = 0; step <= LOADER_KEYFRAME_STEPS; step += 1) {
    const progress = step / LOADER_KEYFRAME_STEPS;
    keyframes.push({
      offset: progress * movementOffset,
      transform: `translate3d(${roundRect(
        travelDistance * getLoaderDistanceRatio(progress),
      )}px, 0px, 0px)`,
    });
  }

  keyframes.push({
    offset: 1,
    transform: `translate3d(${roundRect(travelDistance)}px, 0px, 0px)`,
  });

  return keyframes;
}

function isNonNull<T>(value: T): value is NonNullable<T> {
  return value !== null;
}

export default function DiagramLoaderOverlay({
  isVisible,
  isGeometryStable,
  hideStrategy = "finish",
  stackRef,
  dataRef,
  useCasesRef,
  middleBlockRef,
  useCasesHasLeftNotch,
  loaderCompletionState,
  onPassComplete,
}: DiagramLoaderOverlayProps) {
  const rawClipPathSeed = useId();
  const clipPathIds = useMemo(
    () => ({
      loading: `diagram-loader-clip-loading-${rawClipPathSeed.replace(/:/g, "")}`,
      ready: `diagram-loader-clip-ready-${rawClipPathSeed.replace(/:/g, "")}`,
    }),
    [rawClipPathSeed],
  );
  const loadingOverlayRef = useRef<HTMLDivElement | null>(null);
  const readyOverlayRef = useRef<HTMLDivElement | null>(null);
  const loadingArrowRef = useRef<HTMLDivElement | null>(null);
  const readyArrowRef = useRef<HTMLDivElement | null>(null);
  const loadingPolygonRefs = useRef<Array<SVGPolygonElement | null>>([]);
  const readyPolygonRefs = useRef<Array<SVGPolygonElement | null>>([]);
  const currentTravelDistanceRef = useRef<number | null>(null);
  const currentArrowWidthRef = useRef<number | null>(null);
  const loaderCompletionStateRef = useRef(loaderCompletionState);
  const isOverlayVisibleRef = useRef(isVisible);
  const isGeometryStableRef = useRef(isGeometryStable);
  const shouldAnimateLoaderRef = useRef(false);
  const finishAtTimestampRef = useRef<number | null>(null);
  const cycleStartedAtTimestampRef = useRef<number | null>(null);
  const polygonCountsRef = useRef({ loading: 0, ready: 0 });
  const wasInPauseRef = useRef(false);
  const onPassCompleteRef = useRef(onPassComplete);
  const geometryDirtyRef = useRef(true);
  const previousSignatureRef = useRef("");
  const arrowAnimationsRef = useRef<Array<Animation | null>>([null, null]);
  const geometryFrameIdRef = useRef<number | null>(null);
  const passCompleteTimeoutRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const scheduleGeometryUpdateRef = useRef<(() => void) | null>(null);
  const startLoaderCycleRef = useRef<(() => void) | null>(null);
  const stopLoaderCycleRef = useRef<((resetPosition?: boolean) => void) | null>(
    null,
  );
  const syncOverlayVisibilityRef = useRef<(() => void) | null>(null);

  loaderCompletionStateRef.current = loaderCompletionState;
  onPassCompleteRef.current = onPassComplete;
  isGeometryStableRef.current = isGeometryStable;

  useLayoutEffect(() => {
    if (isVisible) {
      isOverlayVisibleRef.current = true;
      finishAtTimestampRef.current = null;
      syncOverlayVisibilityRef.current?.();
      if (
        isGeometryStableRef.current &&
        cycleStartedAtTimestampRef.current == null
      ) {
        startLoaderCycleRef.current?.();
      }
      return;
    }

    if (hideStrategy === "immediate") {
      isOverlayVisibleRef.current = false;
      finishAtTimestampRef.current = null;
      stopLoaderCycleRef.current?.();
      syncOverlayVisibilityRef.current?.();
      return;
    }

    if (!isOverlayVisibleRef.current) {
      return;
    }

    const now = performance.now();
    const cycleDuration = CYCLE_DURATION_MS + END_PAUSE_MS;
    const cycleStartedAt = cycleStartedAtTimestampRef.current ?? now;
    const elapsedCycleTime = Math.max(now - cycleStartedAt, 0) % cycleDuration;
    const remainingDuration =
      elapsedCycleTime === 0 ? 0 : cycleDuration - elapsedCycleTime;

    finishAtTimestampRef.current = now + remainingDuration;
    startLoaderCycleRef.current?.();
  }, [hideStrategy, isVisible]);

  useLayoutEffect(() => {
    const overlayElements = [
      loadingOverlayRef.current,
      readyOverlayRef.current,
    ];

    if (overlayElements.every((element) => !element)) return;

    const getLoaderArrowWidth = () => {
      const arrowElement = loadingArrowRef.current ?? readyArrowRef.current;
      const measuredWidth = arrowElement?.getBoundingClientRect().width ?? 0;

      if (measuredWidth >= MIN_MEASURABLE_ARROW_WIDTH_PX) {
        currentArrowWidthRef.current = roundRect(measuredWidth);
        return currentArrowWidthRef.current;
      }

      return currentArrowWidthRef.current;
    };

    const markGeometryDirty = () => {
      geometryDirtyRef.current = true;
    };

    const clearWindowTimer = (timerRef: { current: number | null }) => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const resetArrowPosition = () => {
      [loadingArrowRef.current, readyArrowRef.current].forEach((element) => {
        if (element) {
          element.style.transform = "translate3d(0px, 0px, 0px)";
        }
      });
    };

    const cancelArrowAnimations = () => {
      arrowAnimationsRef.current.forEach((animation, index) => {
        animation?.cancel();
        arrowAnimationsRef.current[index] = null;
      });
    };

    const getCycleElapsedTime = (now = performance.now()) => {
      const cycleStartedAt = cycleStartedAtTimestampRef.current;

      if (cycleStartedAt == null) {
        return 0;
      }

      return (
        Math.max(now - cycleStartedAt, 0) % (CYCLE_DURATION_MS + END_PAUSE_MS)
      );
    };

    const syncOverlayVisibility = () => {
      if (loadingOverlayRef.current) {
        loadingOverlayRef.current.style.opacity = isOverlayVisibleRef.current
          ? polygonCountsRef.current.loading > 0
            ? "1"
            : "0"
          : "0";
      }

      if (readyOverlayRef.current) {
        readyOverlayRef.current.style.opacity = isOverlayVisibleRef.current
          ? polygonCountsRef.current.ready > 0
            ? "1"
            : "0"
          : "0";
      }
    };

    const syncArrowAnimations = () => {
      const travelDistance = currentTravelDistanceRef.current;

      if (
        !shouldAnimateLoaderRef.current ||
        travelDistance == null ||
        (!polygonCountsRef.current.loading && !polygonCountsRef.current.ready)
      ) {
        cancelArrowAnimations();
        resetArrowPosition();
        return;
      }

      const elapsedCycleTime = getCycleElapsedTime();
      const keyframes = createLoaderKeyframes(travelDistance);
      const animationOptions: KeyframeAnimationOptions = {
        duration: CYCLE_DURATION_MS + END_PAUSE_MS,
        easing: "linear",
        fill: "both",
        iterations: Infinity,
      };

      [loadingArrowRef.current, readyArrowRef.current].forEach(
        (element, index) => {
          if (!element) return;

          arrowAnimationsRef.current[index]?.cancel();
          const animation = element.animate(keyframes, animationOptions);
          animation.currentTime = elapsedCycleTime;
          arrowAnimationsRef.current[index] = animation;
        },
      );
    };

    const schedulePassComplete = () => {
      clearWindowTimer(passCompleteTimeoutRef);

      if (
        !shouldAnimateLoaderRef.current ||
        cycleStartedAtTimestampRef.current == null
      ) {
        return;
      }

      const cycleDuration = CYCLE_DURATION_MS + END_PAUSE_MS;
      const elapsedCycleTime = getCycleElapsedTime();
      const delay =
        elapsedCycleTime < CYCLE_DURATION_MS
          ? CYCLE_DURATION_MS - elapsedCycleTime
          : cycleDuration - elapsedCycleTime + CYCLE_DURATION_MS;

      passCompleteTimeoutRef.current = window.setTimeout(function handlePass() {
        if (!shouldAnimateLoaderRef.current) {
          passCompleteTimeoutRef.current = null;
          return;
        }

        onPassCompleteRef.current?.();
        passCompleteTimeoutRef.current = window.setTimeout(
          handlePass,
          cycleDuration,
        );
      }, delay);
    };

    const hideOverlay = () => {
      isOverlayVisibleRef.current = false;
      finishAtTimestampRef.current = null;
      syncOverlayVisibility();
      stopLoaderCycleRef.current?.();
    };

    const scheduleFinish = () => {
      clearWindowTimer(hideTimeoutRef);

      if (finishAtTimestampRef.current == null) {
        return;
      }

      const delay = Math.max(
        finishAtTimestampRef.current - performance.now(),
        0,
      );
      hideTimeoutRef.current = window.setTimeout(() => {
        hideOverlay();
      }, delay);
    };

    const stopLoaderCycle = (resetPosition = true) => {
      shouldAnimateLoaderRef.current = false;
      cycleStartedAtTimestampRef.current = null;
      finishAtTimestampRef.current = null;
      wasInPauseRef.current = false;
      clearWindowTimer(passCompleteTimeoutRef);
      clearWindowTimer(hideTimeoutRef);
      cancelArrowAnimations();
      if (resetPosition) {
        resetArrowPosition();
      }
    };

    const startLoaderCycle = () => {
      if (!isOverlayVisibleRef.current) {
        return;
      }

      if (cycleStartedAtTimestampRef.current == null) {
        cycleStartedAtTimestampRef.current = performance.now();
      }

      shouldAnimateLoaderRef.current = true;
      wasInPauseRef.current = false;
      syncArrowAnimations();
      schedulePassComplete();

      if (finishAtTimestampRef.current != null) {
        scheduleFinish();
      }
    };

    const recomputeOverlayGeometry = () => {
      const stackElement = stackRef.current;

      if (
        !stackElement ||
        !loadingOverlayRef.current ||
        !readyOverlayRef.current ||
        !isGeometryStableRef.current
      ) {
        return;
      }

      const containerRect = stackElement.getBoundingClientRect();
      const loadingPolygons: string[] = [];
      const readyPolygons: string[] = [];

      const assignPolygon = (
        loaderGroup: DiagramLoaderGroup,
        polygon: string,
      ) => {
        if (loaderCompletionStateRef.current[loaderGroup]) {
          readyPolygons.push(polygon);
          return;
        }

        loadingPolygons.push(polygon);
      };

      const dataRect = getVisibleRect(
        dataRef.current,
        containerRect,
        stackElement,
      );
      if (dataRect) assignPolygon("DATA", createDataPolygon(dataRect));

      const useCasesRect = getVisibleRect(
        useCasesRef.current,
        containerRect,
        stackElement,
      );
      if (useCasesRect) {
        assignPolygon(
          "USE_CASES",
          createUseCasesPolygon(useCasesRect, useCasesHasLeftNotch),
        );
      }

      const middleChildren = Array.from(middleBlockRef.current?.children ?? []);

      middleChildren.forEach((child, index) => {
        const childRect = getVisibleRect(
          child as HTMLElement,
          containerRect,
          stackElement,
        );
        if (!childRect) return;

        if (index === 0) {
          assignPolygon("MIDDLE_STACK", createServicesPolygon(childRect));
        }
        if (index === 1) {
          assignPolygon("MIDDLE_STACK", createEcosystemPolygon(childRect));
        }
        if (index === 2) {
          assignPolygon("MIDDLE_STACK", createInfrastructurePolygon(childRect));
        }
      });

      const signature = [
        roundRect(containerRect.width),
        roundRect(containerRect.height),
        loadingPolygons.join("|"),
        readyPolygons.join("|"),
      ].join("::");

      if (signature === previousSignatureRef.current) {
        geometryDirtyRef.current = false;
        return;
      }

      previousSignatureRef.current = signature;

      const arrowWidth = getLoaderArrowWidth();
      const travelDistance =
        arrowWidth == null
          ? null
          : roundRect(
              containerRect.width + arrowWidth * LOADER_TRAVEL_MULTIPLIER,
            );

      currentTravelDistanceRef.current = travelDistance;
      polygonCountsRef.current = {
        loading: loadingPolygons.length,
        ready: readyPolygons.length,
      };

      overlayElements.forEach((element) => {
        if (!element) return;

        element.style.inlineSize = `${roundRect(containerRect.width)}px`;
        element.style.blockSize = `${roundRect(containerRect.height)}px`;
      });

      syncPolygonRefs(loadingPolygonRefs.current, loadingPolygons);
      syncPolygonRefs(readyPolygonRefs.current, readyPolygons);
      syncOverlayVisibility();
      syncArrowAnimations();

      geometryDirtyRef.current = false;
    };

    const scheduleGeometryUpdate = () => {
      if (geometryFrameIdRef.current != null) {
        return;
      }

      geometryFrameIdRef.current = window.requestAnimationFrame(() => {
        geometryFrameIdRef.current = null;

        if (geometryDirtyRef.current) {
          recomputeOverlayGeometry();
        }

        if (
          isOverlayVisibleRef.current &&
          isGeometryStableRef.current &&
          cycleStartedAtTimestampRef.current == null &&
          (polygonCountsRef.current.loading > 0 ||
            polygonCountsRef.current.ready > 0)
        ) {
          startLoaderCycle();
        }
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      markGeometryDirty();
      scheduleGeometryUpdate();
    });

    const observedElements = [
      stackRef.current,
      dataRef.current,
      useCasesRef.current,
      middleBlockRef.current,
      loadingArrowRef.current,
      readyArrowRef.current,
    ].filter(isNonNull);

    observedElements.forEach((element) => {
      resizeObserver.observe(element);
    });

    scheduleGeometryUpdateRef.current = scheduleGeometryUpdate;
    startLoaderCycleRef.current = startLoaderCycle;
    stopLoaderCycleRef.current = stopLoaderCycle;
    syncOverlayVisibilityRef.current = syncOverlayVisibility;

    scheduleGeometryUpdate();

    return () => {
      if (geometryFrameIdRef.current != null) {
        window.cancelAnimationFrame(geometryFrameIdRef.current);
        geometryFrameIdRef.current = null;
      }
      resizeObserver.disconnect();
      clearWindowTimer(passCompleteTimeoutRef);
      clearWindowTimer(hideTimeoutRef);
      cancelArrowAnimations();
      currentTravelDistanceRef.current = null;
      currentArrowWidthRef.current = null;
      finishAtTimestampRef.current = null;
      cycleStartedAtTimestampRef.current = null;
      shouldAnimateLoaderRef.current = false;
      wasInPauseRef.current = false;
      geometryDirtyRef.current = true;
      previousSignatureRef.current = "";
      scheduleGeometryUpdateRef.current = null;
      startLoaderCycleRef.current = null;
      stopLoaderCycleRef.current = null;
      syncOverlayVisibilityRef.current = null;
    };
  }, [dataRef, middleBlockRef, stackRef, useCasesHasLeftNotch, useCasesRef]);

  useLayoutEffect(() => {
    geometryDirtyRef.current = true;
    scheduleGeometryUpdateRef.current?.();

    if (
      isVisible &&
      isGeometryStable &&
      cycleStartedAtTimestampRef.current == null
    ) {
      startLoaderCycleRef.current?.();
    }
  }, [
    isGeometryStable,
    isVisible,
    loaderCompletionState,
    useCasesHasLeftNotch,
  ]);

  return (
    <>
      <svg aria-hidden="true" className="absolute size-0 pointer-events-none">
        <defs>
          <clipPath id={clipPathIds.loading} clipPathUnits="userSpaceOnUse">
            {Array.from({ length: MAX_POLYGONS_COUNT }, (_, index) => (
              <polygon
                key={`loading-${index}`}
                ref={(element) => {
                  loadingPolygonRefs.current[index] = element;
                }}
                points=""
                style={{ display: "none" }}
              />
            ))}
          </clipPath>
          <clipPath id={clipPathIds.ready} clipPathUnits="userSpaceOnUse">
            {Array.from({ length: MAX_POLYGONS_COUNT }, (_, index) => (
              <polygon
                key={`ready-${index}`}
                ref={(element) => {
                  readyPolygonRefs.current[index] = element;
                }}
                points=""
                style={{ display: "none" }}
              />
            ))}
          </clipPath>
        </defs>
      </svg>
      <div
        ref={readyOverlayRef}
        className="diagram-loader-overlay diagram-loader-overlay--ready"
        style={{
          clipPath: `url(#${clipPathIds.ready})`,
          opacity: 0,
        }}
      >
        <div
          ref={readyArrowRef}
          className="diagram-loader-arrow diagram-loader-arrow--ready"
        />
      </div>
      <div
        ref={loadingOverlayRef}
        className="diagram-loader-overlay diagram-loader-overlay--loading"
        style={{
          clipPath: `url(#${clipPathIds.loading})`,
          opacity: 0,
        }}
      >
        <div ref={loadingArrowRef} className="diagram-loader-arrow" />
      </div>
    </>
  );
}
