import type { ReactNode } from "react";
import TrendingBadge from "./trending-badge";

interface TrendingWrapperProps {
  isTrending: boolean;
  children: ReactNode;
}

const TrendingWrapper = ({ isTrending, children }: TrendingWrapperProps) => {
  return (
    <div
      className={`flex flex-col gap-2 ${
        isTrending ? "bg-[#F3F8FF] p-2 -mx-2" : ""
      }`}
    >
      <TrendingBadge isTrending={isTrending} />
      {children}
    </div>
  );
};

export default TrendingWrapper;
