import { CORPORATE_COLORS, type LayerData } from "./constants";
import { spanifyText } from "./utils";
import ContentBox from "./ContentBox";
import { cn } from "~/lib/utils";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import {
  isometricImageMap,
  isometricImagePrices,
} from "~/constants/assetMapping";

export interface LayerBlockProps {
  className?: string;
  layerData: LayerData;
  resetKey?: string | number;
  animationDelay?: number;
}

const MAX_BOXES = 5;

// Function to process boxes with isometric images according to the algorithm
// @ts-ignore
const processBoxesWithIsometric = (boxes) => {
  // Находим набор продуктов с изометрической картинкой
  // 2. Выбираем самы дорогой продукт с изометрической картинкой (Главный продукт)
  // 3. Считаем четное или нечетное количество блоков.
  // 4. Если нечетное (есть центральный слот), то меняем порядок перемещая Главный продукт в центральную позицию
  // 5. Если четное, то оставляем порядок как есть, но вставляем еще один блок по центру (но без тултипа). Таким образом у нас будут два блока относящихся к одному продукту и по клику на обе из них мы будем переходить туда.
  // 6. Рисуем в изометрии только одну иконку (центральную), остальные блоки идут текстом

  let processedBoxes = [...boxes];

  // Find boxes with isometric images
  const isometricBoxes = processedBoxes.filter(
    (box) => isometricImageMap[box.hr_uid?.replace(/^\$/, "") || ""],
  );

  const hasIsometric = isometricBoxes.length > 0;

  if (!hasIsometric) {
    return { processedBoxes, isometricCenterIndex: null };
  }

  // Find the most expensive isometric product
  const mainIsometricBox =
    isometricBoxes?.reduce((prev, current) => {
      return (isometricImagePrices[current?.hr_uid.replace(/^\$/, "")] || 0) >
        (isometricImagePrices[prev?.hr_uid.replace(/^\$/, "")] || 0)
        ? current
        : prev;
    }, isometricBoxes[0]) || null;

  const isOddCount = processedBoxes.length % 2 === 1;
  const centralIndex = Math.floor(processedBoxes.length / 2);
  if (isOddCount) {
    // If odd count, replace center with main isometric box
    const newBoxes = [...processedBoxes];
    newBoxes.splice(centralIndex, 1); // Remove center element
    newBoxes.splice(centralIndex, 0, mainIsometricBox); // Insert main product in center
    processedBoxes = newBoxes;
  } else if (hasIsometric) {
    // If even count, add isometric box in the center
    const newBoxes = [...processedBoxes];
    newBoxes.splice(centralIndex, 0, mainIsometricBox); // Insert main product in center
    processedBoxes = newBoxes;
  }

  // Return the processed boxes and the index of isometric center
  return { processedBoxes, isometricCenterIndex: centralIndex };
};

// Helper function to create a unique key for a box
const getBoxKey = (box: any, isometricImage: string | null) => {
  // Use only content-based key, not index
  return `${box.hr_uid || "no-uid"}-${box.title || "no-title"}-${box.url || "no-url"}-${isometricImage || "no-image"}`;
};

const LayerBlock: React.FC<LayerBlockProps> = ({
  className,
  layerData,
  animationDelay = 0,
}) => {
  const { title, brand, boxes } = layerData;
  const navigate = useNavigate();

  const bg =
    layerData.color ||
    (CORPORATE_COLORS[brand] ?? CORPORATE_COLORS.placeholder);

  // Get visible boxes
  let initialVisibleBoxes = boxes.slice(0, MAX_BOXES);
  const hiddenCount = boxes.length - MAX_BOXES;

  // Process boxes with isometric images
  const { processedBoxes, isometricCenterIndex } =
    processBoxesWithIsometric(initialVisibleBoxes);

  return (
    <div
      className={cn(
        "layer-block flex flex-col items-center mb-2.5 w-full p-2.5 relative cursor-pointer",
        className,
      )}
      style={{
        backgroundColor: bg,
        transition: "none",
      }}
      onClick={() => {
        if (layerData.url) {
          navigate(layerData.url);
        }
      }}
    >
      {hiddenCount > 0 && (
        <span className="absolute top-2 right-2 bg-black/30 text-white text-xs font-bold px-2 py-0.5 z-9">
          +{hiddenCount}
        </span>
      )}
      <div className="layer-title text-white font-bold text-base mb-2 text-center text-[18px]">
        {spanifyText(title)}
      </div>

      <div className="boxes-container flex items-stretch justify-between w-full gap-2.5 relative">
        <AnimatePresence mode="popLayout">
          {processedBoxes.map((box, activeIndex) => {
            const isIsometricCenter = activeIndex === isometricCenterIndex;
            const isometricImage = isIsometricCenter
              ? isometricImageMap[box.hr_uid?.replace(/^\$/, "") || ""]
              : null;

            // Calculate stagger delay for boxes within this layer
            const boxStaggerDelay = animationDelay + activeIndex * 0.1;

            return (
              <motion.div
                key={getBoxKey(box, isometricImage)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut",
                  delay: boxStaggerDelay,
                }}
                className="flex-1"
                layout="position"
              >
                <ContentBox content={box} isometricImage={isometricImage} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LayerBlock;
