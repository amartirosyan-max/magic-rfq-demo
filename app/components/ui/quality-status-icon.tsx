import type { FeedbackStatus } from "~/api/feedback";
import goodStatusSvg from "~/assets/good-status.svg";
import noneStatusSvg from "~/assets/none-status.svg";
import suggestionStatusSvg from "~/assets/suggestion-status.svg";

const CONFIG: Record<
  "good" | "suggestion" | "none",
  { src: string; bg: string }
> = {
  good: { src: goodStatusSvg, bg: "#C7F5C5" },
  suggestion: { src: suggestionStatusSvg, bg: "#FFE8CE" },
  none: { src: noneStatusSvg, bg: "#E6E6E6" },
};

type QualityStatusIconProps = {
  status: FeedbackStatus | undefined | null;
  active?: boolean;
};

export function QualityStatusIcon({
  status,
  active = true,
}: QualityStatusIconProps) {
  const key =
    status === "good"
      ? "good"
      : status === "suggestion"
        ? "suggestion"
        : "none";
  const { src, bg } = CONFIG[key];

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-[#D5D7DA]"
      style={{
        width: 40,
        height: 40,
        backgroundColor: active ? bg : "transparent",
      }}
    >
      <img
        src={src}
        alt=""
        width={22}
        height={22}
        aria-hidden
        style={
          active
            ? undefined
            : {
                filter:
                  "brightness(0) saturate(100%) invert(84%) sepia(2%) saturate(500%) hue-rotate(180deg) brightness(96%) contrast(89%)",
              }
        }
      />
    </div>
  );
}
