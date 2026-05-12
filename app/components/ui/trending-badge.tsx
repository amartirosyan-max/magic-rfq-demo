import trendingIcon from "~/assets/trending.svg";

interface TrendingBadgeProps {
  isTrending: boolean;
}

const TrendingBadge = ({ isTrending }: TrendingBadgeProps) => {
  if (!isTrending) return null;

  return (
    <div className="flex items-center gap-2">
      <img src={trendingIcon} alt="Trending" className="h-5 w-5" />
      <span className="text-[16px] font-bold leading-[140%] text-[#EF6800]">
        Trending
      </span>
    </div>
  );
};

export default TrendingBadge;
