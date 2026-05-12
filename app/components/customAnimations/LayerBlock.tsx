import { CORPORATE_COLORS, type LayerData } from "./constants";
import { spanifyText } from "./utils";
import ContentBox from "./ContentBox";
import { cn } from "~/lib/utils";

export interface LayerBlockProps {
  className?: string;
  layerData: LayerData;
}

const LayerBlock: React.FC<LayerBlockProps> = ({ className, layerData }) => {
  const { title, brand, boxes } = layerData;
  const bg = CORPORATE_COLORS[brand] ?? CORPORATE_COLORS.placeholder;

  return (
    <div
      className={cn(
        "layer-block flex flex-col items-center mb-2.5 opacity-0 w-full p-2.5",
        className,
      )}
      style={{
        backgroundColor: bg,
        transition: "none",
      }}
    >
      <div className="layer-title text-white font-bold text-base mb-2 text-center text-[18px]">
        {spanifyText(title)}
      </div>

      <div className="boxes-container flex items-stretch justify-between w-full gap-2.5">
        {boxes.map((box, i) => (
          <ContentBox key={i} content={box} />
        ))}
      </div>
    </div>
  );
};

export default LayerBlock;
