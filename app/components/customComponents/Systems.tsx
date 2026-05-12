import { Link, useLocation, useNavigate } from "react-router";
import TrendingWrapper from "~/components/ui/trending-wrapper";
import { useEffectiveSubsystemId } from "~/hooks/useEffectiveSubsystemId";
import {
  EUserProjectSelection,
  type SubsystemInnerAResponse,
} from "~/types/systemResponse";
import { Button } from "../ui/button";
import { SidebarHeader } from "../ui/sidebar";
import ActionsButtons from "./ActionsButtons";

interface ISystemsProps {
  systems: SubsystemInnerAResponse[];
  onUpdateStatus: (status: EUserProjectSelection | null, id: string) => void;
  isSidebar: boolean;
}

const Systems = ({ systems, onUpdateStatus, isSidebar }: ISystemsProps) => {
  const location = useLocation();
  const currentYear = String(new Date().getFullYear());
  const { id, effectiveSubsystemId, systemId } = useEffectiveSubsystemId();
  const navigate = useNavigate();

  const isRootSystem = systemId === effectiveSubsystemId;

  const createSystemUrl = (systemId: string) => {
    return `${location.pathname}/subsystem/${systemId}`;
  };

  // console.log("systems", systems);
  const handleBackNavigation = () => {
    navigate(-1);
  };

  return (
    <div className="flex flex-col gap-6">
      {isSidebar ? (
        !isRootSystem && (
          <SidebarHeader className="border-sidebar-border h-10 flex">
            <Button
              variant="outline"
              className="self-start"
              onClick={handleBackNavigation}
            >
              Back
            </Button>
          </SidebarHeader>
        )
      ) : (
        <h2 className="text-[24px] font-bold leading-[140%] font-[Roboto_Serif] text-[#3a3540]">
          Select Options
        </h2>
      )}
      <div className="flex flex-col gap-5 select-text">
        {systems
          .sort((a, b) => {
            // Recommended products first
            if (a.recommended && !b.recommended) return -1;
            if (!a.recommended && b.recommended) return 1;
            // Then by id
            return Number(a.id) - Number(b.id);
          })
          .map((system) => {
            const isTrending = system.trending === currentYear;

            return (
              <TrendingWrapper isTrending={isTrending} key={system.id}>
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-col flex gap-1 justify-start pt-1.5">
                    <Link to={createSystemUrl(String(system.id))}>
                      <p className="text-black text-[16px] font-bold">
                        {system.title}
                      </p>
                    </Link>
                    {isSidebar && (
                      <ActionsButtons
                        system={{
                          id: system.id,
                          status: system.status,
                          recommended: system.recommended,
                          design_completed: system.design_completed,
                          title: system.title,
                        }}
                        isSidebar={isSidebar}
                        onUpdateStatus={onUpdateStatus}
                      />
                    )}
                    <p className="text-black text-[14px] font-normal">
                      {system.description}
                    </p>
                  </div>
                  {!isSidebar && (
                    <ActionsButtons
                      system={{
                        id: system.id,
                        status: system.status,
                        recommended: system.recommended,
                        design_completed: system.design_completed,
                        title: system.title,
                      }}
                      isSidebar={isSidebar}
                      onUpdateStatus={onUpdateStatus}
                    />
                  )}
                </div>
              </TrendingWrapper>
            );
          })}
      </div>
    </div>
  );
};

export default Systems;
