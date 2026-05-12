import React, { useEffect, useMemo, useRef, useState } from "react";
import { createTimeline, stagger } from "animejs";
import LayerBlock from "./LayerBlock";
import {
  imagesMapping,
  type LayerData,
  MAX_IMAGES,
} from "~/components/customAnimations/constants";
import { detailedDiff } from "deep-object-diff";

/** Represents deleted items from layer comparison */
interface LayerDeletions {
  deletedLayers: number[];
  deletedBoxes: Record<number, number[]>;
}

/** Represents the structure of diff for layer boxes */
interface LayerBoxDiff {
  boxes: Record<string, unknown>;
}

interface StackAnimatorProps {
  stackData: LayerData[]; // Array of layer data to animate
}

/**
 * Collects information about deleted layers and boxes by comparing previous and next layer states
 * @param prev - Previous layer state
 * @param next - Next layer state
 * @returns Object containing arrays of deleted layer indices and boxes
 */
function collectDeletions(
  prev: LayerData[],
  next: LayerData[],
): LayerDeletions {
  const diff = detailedDiff(prev, next);
  const deletedLayers: number[] = [];
  const deletedBoxes: Record<number, number[]> = {};

  const isValidLayerBoxDiff = (value: unknown): value is LayerBoxDiff => {
    return value !== null && typeof value === "object" && "boxes" in value;
  };

  const parseLayerIndex = (indexStr: string): number | null => {
    const index = Number(indexStr);
    return Number.isNaN(index) ? null : index;
  };

  Object.entries(diff.deleted ?? {}).forEach(([layerIndexStr, diffValue]) => {
    const layerIndex = parseLayerIndex(layerIndexStr);
    if (layerIndex === null) return;

    if (next[layerIndex] === undefined) {
      deletedLayers.push(layerIndex);
      return;
    }

    if (isValidLayerBoxDiff(diffValue)) {
      deletedBoxes[layerIndex] = Object.keys(diffValue.boxes)
        .map(Number)
        .filter((n) => !Number.isNaN(n));
    }
  });

  return { deletedLayers, deletedBoxes };
}

/** Result of layer update detection */
interface LayerUpdateResult {
  /** Array of indices for layers that were updated */
  updatedLayers: number[];
}

/** Properties that indicate a complete layer change when modified */
const LAYER_CHANGE_INDICATORS = ["layer", "brand", "title"] as const;

/**
 * Detects layers that have been completely replaced or significantly changed
 */
function detectLayerReplacements(
  prev: LayerData[],
  next: LayerData[],
): LayerUpdateResult {
  // Будем считать слой обновленным, если:
  // 1. Изменились ключевые свойства
  // 2. ИЛИ изменился layer.id
  // 3. ИЛИ изменилось большинство боксов

  const updatedLayers: number[] = [];

  // Проверяем каждый слой в новом состоянии
  next.forEach((layer, idx) => {
    if (idx >= prev.length) {
      // Новый слой (уже будет в addedLayers)
      return;
    }

    const prevLayer = prev[idx];

    // 1. Проверяем изменение ключевых свойств
    const hasKeyPropertyChange = LAYER_CHANGE_INDICATORS.some(
      (prop) => layer[prop] !== prevLayer[prop],
    );

    if (hasKeyPropertyChange) {
      updatedLayers.push(idx);
      return;
    }

    // 2. Проверяем изменение контента боксов
    // Если содержимое боксов сильно изменилось, считаем слой обновленным
    const prevBoxes = prevLayer.boxes;
    const nextBoxes = layer.boxes;

    // Сравниваем количество боксов
    if (prevBoxes.length !== nextBoxes.length) {
      updatedLayers.push(idx);
      return;
    }

    // Если более 50% боксов изменились, считаем слой обновленным
    let changedBoxCount = 0;
    const minBoxes = Math.min(prevBoxes.length, nextBoxes.length);

    for (let i = 0; i < minBoxes; i++) {
      if (JSON.stringify(prevBoxes[i]) !== JSON.stringify(nextBoxes[i])) {
        changedBoxCount++;
      }
    }

    if (changedBoxCount > minBoxes / 2) {
      updatedLayers.push(idx);
    }
  });

  return { updatedLayers };
}

interface AdditionsResult {
  addedLayers: number[];
  addedBoxes: Record<number, number[]>;
}

/**
 * Detects newly added layers and boxes between two layer data sets
 * @param prev Previous layer data
 * @param next Current layer data
 * @returns Object containing indices of added layers and boxes
 */
function collectAdditions(
  prev: LayerData[],
  next: LayerData[],
): AdditionsResult {
  const diff = detailedDiff(prev, next);
  const addedLayers: number[] = [];
  const addedBoxes: Record<number, number[]> = {};

  // Find completely new layers
  for (let idx = prev.length; idx < next.length; idx++) {
    addedLayers.push(idx);
  }

  // Find added boxes in existing layers
  Object.entries(diff.added || {}).forEach(([idxStr, val]) => {
    const idx = Number(idxStr);

    // Skip if not a valid layer index or if the entire layer is new
    if (
      Number.isNaN(idx) ||
      addedLayers.includes(idx) ||
      !prev[idx] ||
      !next[idx]
    ) {
      return;
    }

    // Check for new boxes in existing layers
    if (val && typeof val === "object" && "boxes" in val) {
      const boxDiff = val.boxes as Record<string, unknown>;

      addedBoxes[idx] = Object.keys(boxDiff)
        .map(Number)
        .filter((boxIdx) => !Number.isNaN(boxIdx));
    }
  });

  return { addedLayers, addedBoxes };
}

// Define the structure for text changes
interface TextChange {
  oldText: string;
  newText: string;
}

// Define the return type for better type safety
interface TextChangesResult {
  changedTexts: Record<number, Record<number, TextChange>>;
}

/**
 * Detects text changes between previous and next layer data
 * @param prevLayers - Previous layer data
 * @param nextLayers - Next layer data
 * @returns Object containing text changes indexed by layer and box
 */
function collectTextChanges(
  prevLayers: LayerData[],
  nextLayers: LayerData[],
): TextChangesResult {
  const changedTexts: Record<number, Record<number, TextChange>> = {};

  prevLayers.forEach((prevLayer, layerIndex) => {
    // Skip if the layer doesn't exist in the next state
    if (!nextLayers[layerIndex]) return;

    const nextLayer = nextLayers[layerIndex];

    prevLayer.boxes.forEach((prevBox, boxIndex) => {
      // Skip if the box doesn't exist in the next state
      if (boxIndex >= nextLayer.boxes.length) return;

      const nextBox = nextLayer.boxes[boxIndex];

      // Check if both boxes are strings and have different text
      if (
        typeof prevBox === "string" &&
        typeof nextBox === "string" &&
        prevBox !== nextBox
      ) {
        // Initialize the layer entry if it doesn't exist
        if (!changedTexts[layerIndex]) {
          changedTexts[layerIndex] = {};
        }

        // Record the text change
        changedTexts[layerIndex][boxIndex] = {
          oldText: prevBox,
          newText: nextBox,
        };
      }
    });
  });

  return { changedTexts };
}

// Component that animates a stack of layers with titles and boxes
function StackAnimator({ stackData }: StackAnimatorProps) {
  const [renderStack, setRenderStack] = useState<LayerData[]>(stackData);
  // Track if this is the first render
  const isFirstRender = useRef(true);
  // Keep previous data to compute diffs
  const prevStackRef = useRef<LayerData[]>([]);
  // Флаг, который указывает, что выполняется анимация
  const isAnimating = useRef(false);

  console.log("prev: ", prevStackRef.current);
  console.log("diff: ", detailedDiff(prevStackRef.current, stackData));
  // Reference to the outer container element for sizing and animation
  const containerRef = useRef<HTMLDivElement>(null);
  // Reference to the inner content element that will be scaled to fit
  const contentRef = useRef<HTMLDivElement>(null);

  // Memoize processing of stackData to replace certain text items with images
  const processedStack = useMemo(() => {
    let imageCount = 0; // Keep track of how many images we've inserted

    return renderStack.map((layer) => {
      const boxes = layer.boxes.map((box) => {
        // Only process string boxes (skip React nodes)
        if (typeof box === "string") {
          // Check if text matches a key in our images mapping, and limit to MAX_IMAGES
          const mappedSrc = imagesMapping[box.toLowerCase()];
          if (mappedSrc && imageCount < MAX_IMAGES) {
            imageCount += 1;
            return (
              <img
                key={`${layer.layer}-${box}`} // Unique key per image
                src={mappedSrc} // Image source from mapping
                alt={box} // Alt text set to original string
                className="max-w-20" // Tailwind class to limit width
              />
            );
          }
        }
        // Return original content if no mapping or limit reached
        return box;
      });
      // Return a new layer object with updated boxes array
      return { ...layer, boxes };
    });
  }, [renderStack]);

  const changedIndexes = useMemo(() => {
    if (isFirstRender.current || prevStackRef.current.length === 0) {
      return Array.from({ length: stackData.length }, (_, i) => i);
    }

    const prev = prevStackRef.current;
    const changed: number[] = [];

    // Найдем добавленные слои
    for (let i = prev.length; i < stackData.length; i++) {
      changed.push(i);
    }

    // Найдем изменившиеся слои
    for (let i = 0; i < Math.min(prev.length, stackData.length); i++) {
      const oldLayer = prev[i];
      const newLayer = stackData[i];
      if (JSON.stringify(oldLayer) !== JSON.stringify(newLayer)) {
        changed.push(i);
      }
    }

    return changed;
  }, [stackData]);

  // Effect to auto-scale content to fit inside the container
  useEffect(() => {
    function updateSize() {
      if (!containerRef.current || !contentRef.current) return;
      // Calculate available height minus fixed padding
      const avail = containerRef.current.clientHeight - 88;
      // Height needed by content
      const need = contentRef.current.scrollHeight;
      // Determine scale factor (never exceed 1)
      const scale = Math.min(1, avail / need);
      // Apply CSS transform to scale content
      contentRef.current.style.transform = `scale(${scale})`;
      contentRef.current.style.transformOrigin = "center center";
    }

    // Initial sizing
    setTimeout(updateSize, 100); // Добавляем задержку для надежности
    // Listen for window resize to recalculate
    window.addEventListener("resize", updateSize);
    // Clean up listener on unmount or when data changes
    return () => window.removeEventListener("resize", updateSize);
  }, [renderStack]); // Изменили зависимость с stackData на renderStack

  // Effect to create and play the animation timeline
  useEffect(() => {
    const prev = prevStackRef.current;

    // Первый рендеринг - просто запускаем стандартную анимацию
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setRenderStack(stackData);
      prevStackRef.current = JSON.parse(JSON.stringify(stackData)); // Глубокое копирование

      // Код для анимации первого рендера остается без изменений
      const container = containerRef.current;
      if (!container) return;

      const layers = Array.from(
        container.querySelectorAll<HTMLElement>(".layer-block"),
      );

      // Create a new anime.js timeline with custom defaults
      const tl = createTimeline({
        autoplay: false,
        defaults: { ease: "easeOutQuad" },
        onComplete: () => {
          // После завершения анимации, исправляем возможные проблемы с видимостью
          const allLetters = container.querySelectorAll<HTMLElement>(".letter");
          allLetters.forEach((letter) => {
            letter.style.opacity = "1";
            letter.style.transform = "translateY(0)";
            letter.classList.remove("opacity-0");
          });
        },
      });

      // Define overlapping offsets in milliseconds
      const overlapTitle = 400; // Overlap for title letters
      const overlapFirstBox = 500; // Overlap for first box animation
      const overlapLayer = 800; // Overlap between layer enters

      // Animate layers from bottom to top (reverse order)
      changedIndexes
        .sort((a, b) => b - a)
        .forEach((idx) => {
          const layerEl = layers[idx];
          if (!layerEl) return;

          // 1) Animate the layer block scaling and fading in
          const layerOffset =
            idx === layers.length - 1 ? undefined : `-=${overlapLayer}`;
          tl.add(
            layerEl,
            {
              scaleX: [0, 1], // Grow horizontally from zero to full width
              opacity: [0, 1], // Fade in from transparent to opaque
              duration: 500,
              easing: "easeOutExpo",
            },
            layerOffset,
          );

          // 2) Animate each letter in the title with a slight stagger effect
          const titleLetters = layerEl.querySelectorAll<HTMLElement>(
            ".layer-title .letter",
          );
          tl.add(
            titleLetters,
            {
              opacity: [0, 1], // Fade letters in
              translateY: ["0.5em", "0em"], // Slide letters up into place
              duration: 30,
              delay: stagger(30), // 30ms between each letter
            },
            `-=${overlapTitle}`, // Start before previous animation ends
          );

          // 3) Animate content boxes within this layer
          const boxEls = Array.from(
            layerEl.querySelectorAll<HTMLElement>(".content-box"),
          );
          boxEls.forEach((boxEl, bi) => {
            // Slide and fade in the box background
            const boxOffset = bi === 0 ? `-=${overlapFirstBox}` : undefined;
            tl.add(
              boxEl,
              {
                translateY: [-20, 0], // Move up into view
                backgroundColor: ["rgba(0,0,0,0)", "rgba(0,0,0,0.25)"],
                opacity: [0, 1], // Fade in box
                duration: 350,
                easing: "easeOutExpo",
              },
              boxOffset,
            );

            // Animate text letters inside the box, if any
            const letters = boxEl.querySelectorAll<HTMLElement>(".letter");
            if (letters.length) {
              tl.add(
                letters,
                {
                  opacity: [0, 1],
                  duration: 20,
                  delay: stagger(30), // Stagger each letter
                },
                "-=300", // Start slightly before box background animation ends
              );
            }

            // Animate an image inside the box, if present
            const img = boxEl.querySelector<HTMLImageElement>("img");
            if (img) {
              // Set initial hidden and scaled state
              img.style.opacity = "0";
              img.style.transform = "scale(0.8)";
              // Animate image scaling up and fading in
              tl.add(
                img,
                {
                  opacity: [0, 1],
                  scale: [0.8, 1],
                  duration: 300,
                  easing: "easeOutQuad",
                },
                "-=200", // Overlap with text animation
              );
            }
          });
        });

      // Start the animation sequence
      tl.play();
      // Optionally scroll down after animation completes
      window.scrollTo(0, document.body.scrollHeight + 200);

      return;
    }

    // Для последующих рендеров - обрабатываем изменения

    // Если уже выполняется анимация, пропускаем
    if (isAnimating.current) return;

    // Анализируем изменения
    const { deletedLayers, deletedBoxes } = collectDeletions(prev, stackData);
    const { addedLayers, addedBoxes } = collectAdditions(prev, stackData);
    const { changedTexts } = collectTextChanges(prev, stackData);
    const { updatedLayers } = detectLayerReplacements(prev, stackData);

    console.log("deletedLayers:", deletedLayers);
    console.log("deletedBoxes:", deletedBoxes);
    console.log("addedLayers:", addedLayers);
    console.log("addedBoxes:", addedBoxes);
    console.log("changedTexts:", changedTexts);
    console.log("updatedLayers:", updatedLayers);

    // Для слоев, которые полностью обновились, будем их анимировать как новые
    // добавим их в списки для анимации добавления
    const combinedAddedLayers = [...addedLayers];
    updatedLayers.forEach((layerIdx) => {
      if (!combinedAddedLayers.includes(layerIdx)) {
        combinedAddedLayers.push(layerIdx);
      }
    });

    // Если нет изменений, просто обновляем состояние
    if (
      deletedLayers.length === 0 &&
      Object.keys(deletedBoxes).length === 0 &&
      combinedAddedLayers.length === 0 &&
      Object.keys(addedBoxes).length === 0 &&
      Object.keys(changedTexts).length === 0
    ) {
      setRenderStack(stackData);
      prevStackRef.current = JSON.parse(JSON.stringify(stackData)); // Глубокое копирование
      return;
    }

    isAnimating.current = true;

    // Функция для создания промежуточного состояния (после удалений, но перед изменениями)
    function createIntermediateState() {
      // Копируем предыдущее состояние
      const intermediate = JSON.parse(JSON.stringify(prev));

      // Удаляем слои, которые должны быть удалены
      deletedLayers.forEach((idx) => {
        // Используем undefined вместо splice, чтобы сохранить индексы
        intermediate[idx] = undefined;
      });

      // Компактное промежуточное состояние без undefined
      const compactIntermediate = intermediate.filter(
        (layer: LayerData | undefined) => layer !== undefined,
      );

      // Добавляем новые слои из stackData
      addedLayers.forEach((idx) => {
        compactIntermediate.push(stackData[idx]);
      });

      // Обновляем полностью измененные слои
      updatedLayers.forEach((idx) => {
        if (idx < compactIntermediate.length) {
          compactIntermediate[idx] = stackData[idx];
        }
      });

      // Удаляем боксы, которые должны быть удалены
      Object.entries(deletedBoxes).forEach(([layerIdxStr, boxIdxArr]) => {
        const layerIdx = Number(layerIdxStr);
        if (
          layerIdx < compactIntermediate.length &&
          compactIntermediate[layerIdx]
        ) {
          // Создаем новый массив боксов без удаленных
          compactIntermediate[layerIdx].boxes = compactIntermediate[
            layerIdx
          ].boxes.filter(
            (_: any, boxIdx: number) => !boxIdxArr.includes(boxIdx),
          );
        }
      });

      return compactIntermediate;
    }

    // Функция для анимации добавлений новых слоев
    function animateAdditions() {
      const container = containerRef.current;
      if (!container) {
        isAnimating.current = false;
        prevStackRef.current = JSON.parse(JSON.stringify(stackData));
        return;
      }

      const layers = Array.from(
        container.querySelectorAll<HTMLElement>(".layer-block"),
      );

      // Теперь разделим анимацию на две части:
      // 1. Сначала анимируем полностью новые слои
      // 2. После завершения анимации новых слоев анимируем измененные боксы

      if (combinedAddedLayers.length > 0) {
        // Готовим элементы к анимации - сбрасываем все стили
        combinedAddedLayers.forEach((idx) => {
          const layerEl = layers[idx];
          if (!layerEl) return;

          // Скрываем слой перед анимацией
          layerEl.style.opacity = "0";
          layerEl.style.transform = "scaleX(0)";

          // Скрываем буквы заголовка
          const titleLetters = layerEl.querySelectorAll<HTMLElement>(
            ".layer-title .letter",
          );
          titleLetters.forEach((letter) => {
            letter.style.opacity = "0";
            letter.style.transform = "translateY(0.5em)";
            letter.classList.add("opacity-0");
          });

          // Скрываем боксы и их содержимое
          const boxEls = Array.from(
            layerEl.querySelectorAll<HTMLElement>(".content-box"),
          );
          boxEls.forEach((boxEl) => {
            boxEl.style.opacity = "0";
            boxEl.style.transform = "translateY(-20px)";
            boxEl.style.backgroundColor = "rgba(0,0,0,0)";

            // Скрываем буквы
            const letters = boxEl.querySelectorAll<HTMLElement>(".letter");
            letters.forEach((letter) => {
              letter.style.opacity = "0";
              letter.classList.add("opacity-0");
            });

            // Скрываем изображения
            const img = boxEl.querySelector<HTMLImageElement>("img");
            if (img) {
              img.style.opacity = "0";
              img.style.transform = "scale(0.8)";
            }
          });
        });

        // Создаем таймлайн только для новых слоев
        const newLayersTl = createTimeline({
          autoplay: false,
          defaults: { ease: "easeOutQuad" },
          onComplete: () => {
            // После завершения анимации новых слоев
            // переходим к анимации измененных боксов БЕЗ обновления состояния
            setTimeout(() => {
              // Вместо обновления всего renderStack, будем манипулировать только с DOM
              animateUpdatedBoxes();
            }, 100);
          },
        });

        // Анимируем добавленные слои и обновленные слои
        combinedAddedLayers
          .sort((a, b) => b - a)
          .forEach((idx) => {
            const layerEl = layers[idx];
            if (!layerEl) return;

            // Определяем offset, как в начальной анимации
            const overlapTitle = 400; // Overlap for title letters
            const overlapFirstBox = 500; // Overlap for first box animation
            const overlapLayer = 800; // Overlap between layer enters

            // 1) Сначала появляется сам слой - используем такой же offset, как в начальной анимации
            const layerOffset =
              idx === layers.length - 1 ? undefined : `-=${overlapLayer}`;
            newLayersTl.add(
              layerEl,
              {
                scaleX: [0, 1],
                opacity: [0, 1],
                duration: 500,
                easing: "easeOutExpo",
              },
              layerOffset,
            );

            // 2) Затем анимируем буквы заголовка
            const titleLetters = layerEl.querySelectorAll<HTMLElement>(
              ".layer-title .letter",
            );
            newLayersTl.add(
              titleLetters,
              {
                opacity: [0, 1],
                translateY: ["0.5em", "0em"],
                duration: 30,
                delay: stagger(30),
              },
              `-=${overlapTitle}`,
            );

            // 3) Анимация боксов - последовательно, как в начальной анимации
            const boxEls = Array.from(
              layerEl.querySelectorAll<HTMLElement>(".content-box"),
            );
            boxEls.forEach((boxEl, bi) => {
              // Определяем offset для бокса
              const boxOffset = bi === 0 ? `-=${overlapFirstBox}` : undefined;

              // Сначала анимируем фон бокса
              newLayersTl.add(
                boxEl,
                {
                  translateY: [-20, 0],
                  backgroundColor: ["rgba(0,0,0,0)", "rgba(0,0,0,0.25)"],
                  opacity: [0, 1],
                  duration: 350,
                  easing: "easeOutExpo",
                },
                boxOffset,
              );

              // Затем анимируем буквы внутри бокса
              const letters = boxEl.querySelectorAll<HTMLElement>(".letter");
              if (letters.length) {
                newLayersTl.add(
                  letters,
                  {
                    opacity: [0, 1],
                    duration: 20,
                    delay: stagger(30),
                  },
                  "-=300",
                );
              }

              // Анимация изображений
              const img = boxEl.querySelector<HTMLImageElement>("img");
              if (img) {
                newLayersTl.add(
                  img,
                  {
                    opacity: [0, 1],
                    scale: [0.8, 1],
                    duration: 300,
                    easing: "easeOutQuad",
                  },
                  "-=200",
                );
              }
            });
          });

        // Запускаем анимацию новых слоев
        newLayersTl.play();
      } else {
        // Если нет новых слоев, переходим к анимации измененных боксов
        // (без обновления состояния)
        setTimeout(() => {
          animateUpdatedBoxes();
        }, 100);
      }
    }

    // Отдельная функция для анимации измененных боксов
    function animateUpdatedBoxes() {
      const container = containerRef.current;
      if (!container) {
        isAnimating.current = false;
        prevStackRef.current = JSON.parse(JSON.stringify(stackData));
        return;
      }

      const layers = Array.from(
        container.querySelectorAll<HTMLElement>(".layer-block"),
      );

      // Объединяем обработку добавленных боксов и измененных текстов
      const allUpdatedBoxes: Record<number, number[]> = { ...addedBoxes };

      // Добавляем боксы с измененным текстом
      Object.entries(changedTexts).forEach(([layerIdxStr, boxes]) => {
        const layerIdx = Number(layerIdxStr);
        if (!allUpdatedBoxes[layerIdx]) {
          allUpdatedBoxes[layerIdx] = [];
        }

        // Добавляем индексы боксов с измененным текстом
        Object.keys(boxes).forEach((boxIdxStr) => {
          const boxIdx = Number(boxIdxStr);
          if (!allUpdatedBoxes[layerIdx].includes(boxIdx)) {
            allUpdatedBoxes[layerIdx].push(boxIdx);
          }
        });
      });

      // Проверяем, есть ли измененные боксы
      const layersToAnimate = Object.keys(allUpdatedBoxes)
        .map(Number)
        .filter((layerIdx) => !combinedAddedLayers.includes(layerIdx))
        .sort();

      if (layersToAnimate.length === 0) {
        // Если нет измененных боксов, просто обновляем состояние и завершаем анимацию
        setRenderStack(stackData);
        isAnimating.current = false;
        prevStackRef.current = JSON.parse(JSON.stringify(stackData));
        return;
      }

      // Создаем таймлайн для сначала скрытия всех боксов
      const hideAllTl = createTimeline({
        autoplay: false,
        defaults: { ease: "easeInQuad" },
        onComplete: () => {
          // После скрытия всех боксов обновляем состояние
          setRenderStack(stackData);

          // После обновления состояния стартуем анимацию появления
          setTimeout(() => {
            animateBoxesAppear();
          }, 50);
        },
      });

      // Собираем все боксы, которые нужно анимировать
      const boxesToAnimate: HTMLElement[] = [];

      // Получаем все боксы, которые нужно будет анимировать
      layersToAnimate.forEach((layerIdx) => {
        const layerEl = layers[layerIdx];
        if (!layerEl) return;

        const boxEls = Array.from(
          layerEl.querySelectorAll<HTMLElement>(".content-box"),
        );
        const boxIdxArr = allUpdatedBoxes[layerIdx];

        boxIdxArr.forEach((boxIdx) => {
          const boxEl = boxEls[boxIdx];
          if (boxEl) {
            boxesToAnimate.push(boxEl);
          }
        });
      });

      // Анимируем исчезновение всех боксов
      hideAllTl.add(
        boxesToAnimate,
        {
          opacity: [1, 0],
          duration: 200,
        },
        0,
      );

      // Запускаем анимацию исчезновения
      hideAllTl.play();

      // Функция для анимации появления боксов после обновления состояния
      function animateBoxesAppear() {
        // Получаем обновленные ссылки на DOM-элементы после ререндера
        if (!containerRef.current) return;

        const updatedLayers = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(".layer-block"),
        );

        // Предварительно подготавливаем элементы для анимации
        layersToAnimate.forEach((layerIdx) => {
          const layerEl = updatedLayers[layerIdx];
          if (!layerEl) return;

          const boxEls = Array.from(
            layerEl.querySelectorAll<HTMLElement>(".content-box"),
          );
          const boxIdxArr = allUpdatedBoxes[layerIdx];

          boxIdxArr.forEach((boxIdx) => {
            const boxEl = boxEls[boxIdx];
            if (!boxEl) return;

            // Предварительно скрываем бокс и его содержимое
            boxEl.style.opacity = "0";
            boxEl.style.transform = "translateY(-20px)";
            boxEl.style.backgroundColor = "rgba(0,0,0,0)";

            // Скрываем буквы
            const letters = boxEl.querySelectorAll<HTMLElement>(".letter");
            letters.forEach((letter) => {
              letter.style.opacity = "0";
              letter.classList.add("opacity-0");
            });

            // Скрываем изображения
            const img = boxEl.querySelector<HTMLImageElement>("img");
            if (img) {
              img.style.opacity = "0";
              img.style.transform = "scale(0.8)";
            }
          });
        });

        // Создаем таймлайн для анимации появления
        const showTl = createTimeline({
          autoplay: false,
          defaults: { ease: "easeOutQuad" },
          onComplete: () => {
            // Финальная очистка стилей
            setTimeout(() => {
              if (containerRef.current) {
                const allLetters =
                  containerRef.current.querySelectorAll<HTMLElement>(".letter");
                allLetters.forEach((letter) => {
                  letter.style.opacity = "1";
                  letter.style.transform = "translateY(0)";
                  letter.classList.remove("opacity-0");
                });

                const allBoxes =
                  containerRef.current.querySelectorAll<HTMLElement>(
                    ".content-box",
                  );
                allBoxes.forEach((box) => {
                  box.style.transform = "";
                });
              }

              // Завершаем анимацию
              isAnimating.current = false;
              prevStackRef.current = JSON.parse(JSON.stringify(stackData));
            }, 100);
          },
        });

        // Анимируем появление боксов последовательно
        layersToAnimate.forEach((layerIdx, layerSeqIdx) => {
          const layerEl = updatedLayers[layerIdx];
          if (!layerEl) return;

          const boxEls = Array.from(
            layerEl.querySelectorAll<HTMLElement>(".content-box"),
          );
          const boxIdxArr = allUpdatedBoxes[layerIdx];

          // Сортируем индексы боксов, чтобы анимировать их по порядку
          boxIdxArr.sort().forEach((boxIdx, boxSeqIdx) => {
            const boxEl = boxEls[boxIdx];
            if (!boxEl) return;

            // Различные offset для разных боксов
            const isFirstBox = layerSeqIdx === 0 && boxSeqIdx === 0;
            const boxOffset = isFirstBox ? undefined : "-=200"; // Небольшое перекрытие

            // Анимируем бокс
            showTl.add(
              boxEl,
              {
                translateY: [-20, 0],
                backgroundColor: ["rgba(0,0,0,0)", "rgba(0,0,0,0.25)"],
                opacity: [0, 1],
                duration: 350,
                easing: "easeOutExpo",
              },
              boxOffset,
            );

            // Анимируем буквы
            const letters = boxEl.querySelectorAll<HTMLElement>(".letter");
            if (letters.length) {
              showTl.add(
                letters,
                {
                  opacity: [0, 1],
                  duration: 20,
                  delay: stagger(30),
                },
                "-=300",
              );
            }

            // Анимация изображений
            const img = boxEl.querySelector<HTMLImageElement>("img");
            if (img) {
              showTl.add(
                img,
                {
                  opacity: [0, 1],
                  scale: [0.8, 1],
                  duration: 300,
                  easing: "easeOutQuad",
                },
                "-=200",
              );
            }
          });
        });

        // Запускаем анимацию появления
        showTl.play();
      }
    }

    // 1. Сначала анимируем удаления
    if (
      deletedLayers.length ||
      Object.keys(deletedBoxes).length ||
      updatedLayers.length
    ) {
      const layersEls = Array.from(
        containerRef.current!.querySelectorAll<HTMLElement>(".layer-block"),
      );

      const tl = createTimeline({
        autoplay: false,
        defaults: { ease: "easeInQuad" },
        onComplete: () => {
          // После завершения анимации удаления обновляем состояние
          // но только с удалениями и новыми слоями, без измененных боксов
          const intermediateState = createIntermediateState();
          setRenderStack(intermediateState);

          // Небольшая задержка, чтобы DOM успел обновиться
          setTimeout(() => {
            animateAdditions();
          }, 150); // Увеличим задержку для надежности
        },
      });

      // Анимируем удаление слоев
      deletedLayers.forEach((idx) => {
        const el = layersEls[idx];
        if (el)
          tl.add(
            el,
            {
              opacity: [1, 0],
              duration: 600,
            },
            0,
          );
      });

      // Анимируем исчезновение обновленных слоев (как перед удалением)
      updatedLayers.forEach((idx) => {
        const el = layersEls[idx];
        if (el)
          tl.add(el, { opacity: [1, 0], scaleX: [1, 0.5], duration: 400 }, 0);
      });

      // Анимируем удаление боксов
      Object.entries(deletedBoxes).forEach(([layerIdxStr, boxIdxArr]) => {
        const layerIdx = Number(layerIdxStr);
        const boxEls =
          layersEls[layerIdx]?.querySelectorAll<HTMLElement>(".content-box") ??
          [];

        boxIdxArr.forEach((boxIdx) => {
          const boxEl = boxEls[boxIdx];
          if (boxEl) {
            tl.add(
              boxEl,
              { opacity: [1, 0], translateX: [0, 20], duration: 300 },
              0,
            );
          }
        });
      });

      tl.play();
    } else {
      // Если нет удалений или полных обновлений слоев, используем промежуточное состояние
      const intermediateState = createIntermediateState();
      setRenderStack(intermediateState);

      // Небольшая задержка, чтобы DOM успел обновиться
      setTimeout(() => {
        animateAdditions();
      }, 150); // Увеличим задержку для надежности
    }

    // Очистка при размонтировании компонента
    return () => {
      isAnimating.current = false;
    };
  }, [stackData, changedIndexes]);

  // Render the animated stack inside a responsive container
  return (
    <div
      ref={containerRef}
      className="
        stack-animator
        w-full
        h-[calc(100svh-56px)]
        {/*py-11 px-24*/}
        overflow-hidden
        flex items-center justify-center
      "
    >
      <div
        ref={contentRef}
        className="w-full flex flex-col items-center justify-center"
      >
        {processedStack.map((layer, idx) => (
          <LayerBlock
            key={layer.layer ?? idx}
            layerData={layer}
            className={idx === processedStack.length - 1 ? "mb-0" : ""}
          />
        ))}
      </div>
    </div>
  );
}

export default StackAnimator;
