import { useNavigate } from "react-router";
import type { Box } from "../stack/constants";
import { normalizeIconUrl } from "./hooks/normalizeIconUrl";
import { shortenProductsTitle } from "./hooks/shortenProductsTitles";
import { useEffect, useRef, type CSSProperties } from "react";
import { animate } from "animejs";

interface DellContentBoxProps {
  data: Box;
  isProposal?: boolean;
  style?: CSSProperties;
  isActive: boolean;
  onVisualCompletionChange?: (boxId: number, isCompleted: boolean) => void;
}

const DellContentBox: React.FC<DellContentBoxProps> = ({
  data,
  isProposal,
  style,
  isActive,
  onVisualCompletionChange,
}) => {
  const navigate = useNavigate();

  const handleNavigateToSubsystem = (url: string) => {
    navigate(url, {
      state: { activeTab: "design" },
    });
  };

  const boxRef = useRef<HTMLDivElement | null>(null);
  const shimmerAnimationRef = useRef<ReturnType<typeof animate> | null>(null);

  useEffect(() => {
    const boxElement = boxRef.current;

    if (!boxElement) return;

    shimmerAnimationRef.current?.cancel();
    shimmerAnimationRef.current = null;

    if (!isProposal) {
      boxElement.style.opacity = "1";
      onVisualCompletionChange?.(data.id, true);
      return;
    }

    if (!data.design_completed) {
      onVisualCompletionChange?.(data.id, false);
      shimmerAnimationRef.current = animate(boxElement, {
        opacity: [0.4, 0.8],
        duration: 1000,
        loopDelay: 3000 + Math.random() * 3000,
        direction: "alternate",
        easing: "easeInOutSine",
        loop: true,
      });
    } else {
      shimmerAnimationRef.current = animate(boxElement, {
        opacity: 1,
        duration: 200,
        onComplete: () => {
          onVisualCompletionChange?.(data.id, true);
          shimmerAnimationRef.current = null;
        },
      });
    }

    return () => {
      shimmerAnimationRef.current?.cancel();
      shimmerAnimationRef.current = null;
    };
  }, [data.design_completed, data.id, isProposal, onVisualCompletionChange]);

  return (
    <div
      ref={boxRef}
      className="relative flex flex-col items-center gap-[8px] cursor-pointer font-['Helvetica_Neue']"
      style={{
        ...style,
        inlineSize: isActive ? "144px" : "",
        maxInlineSize: "144px",
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (data?.url) handleNavigateToSubsystem(data.url);
      }}
    >
      <div className="block">
        {data.diagram_icon_url ? (
          <img
            src={normalizeIconUrl(data.diagram_icon_url)}
            alt=""
            className="w-[28px] h-[28px] block"
          />
        ) : (
          icon
        )}
      </div>
      <p
        className="text-[12px] text-center font-normal leading-[1.2]"
        title={data.title}
      >
        {shortenProductsTitle(data.title)}
      </p>
    </div>
  );
};

const icon = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clip-path="url(#clip0_560_5497)">
      <path
        d="M21.8984 12V5.175C21.8984 2.265 17.6084 0 12.1484 0C6.68844 0 2.39844 2.265 2.39844 5.175V12C2.39844 15.495 2.39844 19.02 2.39844 19.095C2.66844 21.9 6.85344 24 12.1484 24C17.4434 24 21.5834 21.915 21.8834 19.155C21.8834 19.155 21.8834 15.525 21.8834 12.03V12H21.8984ZM20.2934 12C20.2934 13.68 16.9334 15.555 12.1484 15.555C7.36344 15.555 4.01844 13.695 4.00344 12V8.04C6.11169 9.495 8.72169 10.3643 11.5349 10.3643C11.7509 10.3643 11.9654 10.359 12.1784 10.3492L12.1484 10.3507C12.3314 10.3597 12.5459 10.365 12.7619 10.365C15.5752 10.365 18.1852 9.49575 20.3384 8.0115L20.2934 8.04075V12ZM12.1484 1.605C16.9484 1.605 20.2934 3.48 20.2934 5.175C20.2934 6.87 16.9484 8.745 12.1484 8.745C7.34844 8.745 4.00344 6.855 4.00344 5.175C4.00344 3.495 7.34844 1.605 12.1484 1.605ZM12.1484 22.395C7.46844 22.395 4.15344 20.625 4.00344 19.005V14.88C6.10719 16.3267 8.70969 17.19 11.5139 17.19C11.7367 17.19 11.9587 17.1847 12.1792 17.1735L12.1484 17.175C12.3352 17.184 12.5542 17.19 12.7739 17.19C15.5812 17.19 18.1867 16.3267 20.3392 14.8507L20.2934 14.88C20.2934 17.1 20.2934 18.87 20.2934 18.975C20.1134 20.625 16.7984 22.395 12.1484 22.395Z"
        fill="white"
      />
    </g>
    <defs>
      <clipPath id="clip0_560_5497">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export default DellContentBox;
