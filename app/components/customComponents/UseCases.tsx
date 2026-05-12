import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  exportUseCases,
  useExtendUseCases,
  useUpdateUseCaseStatus,
  useUseCases,
} from "~/api/useCases";
import { Button } from "~/components/ui/button";
import { EQueryKey } from "~/constants/queryKeys";
import { useProject } from "~/context/ProjectContext";
import {
  EUserProjectSelection,
  type SubsystemInnerAResponse,
  type SubsystemResponse,
} from "~/types/systemResponse";
import TrendingWrapper from "~/components/ui/trending-wrapper";
import ActionsButtons from "./ActionsButtons";

type UseCasesProps = {
  isActive: boolean;
  onGenerationStateChange?: (isGenerating: boolean) => void;
};

const UseCases = ({ isActive, onGenerationStateChange }: UseCasesProps) => {
  const { project } = useProject();
  const queryClient = useQueryClient();
  const projectId = project?.id ? String(project.id) : "";
  const currentYear = String(new Date().getFullYear());
  const [shouldFetchUseCases, setShouldFetchUseCases] = useState(false);
  const [useCases, setUseCases] = useState<SubsystemInnerAResponse[]>([]);
  const [updatingUseCaseId, setUpdatingUseCaseId] = useState<string | null>(
    null,
  );

  const {
    data: useCasesResponse,
    isLoading: isLoadingUseCases,
    isFetching: isFetchingUseCases,
  } = useUseCases({
    projectId,
    enabled: shouldFetchUseCases && !!projectId,
    refetchInterval: (query) =>
      query.state.data?.subsystems && query.state.data.subsystems.length > 0
        ? false
        : 5000,
  });

  const { mutate: extendUseCases, isPending: isExtending } = useExtendUseCases({
    onSuccess: (response: SubsystemResponse) => {
      setUseCases((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const newItems = response.subsystems.filter(
          (item: SubsystemInnerAResponse) => !existingIds.has(item.id),
        );
        return [...prev, ...newItems];
      });
    },
  });

  const { mutate: updateUseCaseStatus, isPending: isUpdatingStatus } =
    useUpdateUseCaseStatus({
      onMutate: ({ useCaseId }: { useCaseId: string }) => {
        setUpdatingUseCaseId(useCaseId);
      },
      onSuccess: (
        _: void,
        {
          useCaseId,
          status,
        }: { useCaseId: string; status: EUserProjectSelection | null },
      ) => {
        setUseCases((prev) =>
          prev.map((item) =>
            item.id === Number(useCaseId)
              ? { ...item, status: status ?? null }
              : item,
          ),
        );
      },
      onSettled: () => {
        setUpdatingUseCaseId(null);
      },
    });

  const { mutate: exportUseCasesMutation, isPending: isExporting } =
    useMutation({
      mutationFn: () => exportUseCases(projectId),
    });

  useEffect(() => {
    setUseCases([]);
    setShouldFetchUseCases(false);
  }, [projectId]);

  useEffect(() => {
    if (!isActive || !projectId) return;

    setShouldFetchUseCases(true);
    queryClient.setQueryData([EQueryKey.USE_CASES_GENERATED, projectId], true);
    onGenerationStateChange?.(true);
  }, [isActive, projectId, queryClient, onGenerationStateChange]);

  useEffect(() => {
    if (!useCasesResponse?.subsystems) return;
    setUseCases(useCasesResponse.subsystems);
    if (useCasesResponse.subsystems.length > 0) {
      queryClient.setQueryData(
        [EQueryKey.USE_CASES_GENERATED, projectId],
        true,
      );
    }
  }, [projectId, queryClient, useCasesResponse?.subsystems]);

  const sortedUseCases = useMemo(() => {
    return [...useCases].sort((a, b) => {
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      return Number(a.id) - Number(b.id);
    });
  }, [useCases]);

  const handleUpdateStatus = (
    status: EUserProjectSelection | null,
    useCaseId: string,
  ) => {
    if (!projectId) return;
    updateUseCaseStatus({ projectId, useCaseId, status });
  };

  const hasUseCases = useCases.length > 0;
  const isListLoading =
    (isLoadingUseCases || isFetchingUseCases) && !hasUseCases;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[24px] font-bold leading-[140%] font-[Roboto_Serif] text-[#3a3540]">
          Use cases
        </h2>
        {useCases.length > 0 && (
          <Button
            variant="ghost"
            className="bg-[#EEF3F9] rounded-none px-5 py-3 relative text-primary self-end h-10 w-[180px] justify-center"
            onClick={() => exportUseCasesMutation()}
            disabled={!projectId || isExporting || !hasUseCases}
          >
            {isExporting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Download /> Export use cases
              </>
            )}
          </Button>
        )}
      </div>

      {isListLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="animate-spin mb-4" />
          <p>Getting use cases...</p>
        </div>
      )}

      <div className="flex flex-col gap-5 select-text">
        {sortedUseCases.map((useCase) => {
          const isTrending = useCase.trending === currentYear;

          return (
            <TrendingWrapper isTrending={isTrending} key={useCase.id}>
              <div className="flex items-start justify-between gap-6">
                <div className="flex-col flex gap-1 justify-start pt-1.5">
                  <p className="text-black text-[16px] font-bold">
                    {useCase.title}
                  </p>
                  <p className="text-black text-[14px] font-normal">
                    {useCase.description}
                  </p>
                </div>
                <ActionsButtons
                  system={{
                    id: useCase.id,
                    status: useCase.status,
                    recommended: useCase.recommended,
                    design_completed: useCase.design_completed,
                    title: useCase.title,
                  }}
                  isSidebar={false}
                  onUpdateStatus={handleUpdateStatus}
                  isLoading={
                    isUpdatingStatus && updatingUseCaseId === String(useCase.id)
                  }
                />
              </div>
            </TrendingWrapper>
          );
        })}
      </div>

      {useCases.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            disabled={!projectId || isExtending}
            onClick={() => {
              if (!projectId) return;
              extendUseCases({ projectId });
            }}
          >
            {isExtending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Getting more use cases...
              </>
            ) : (
              "Generate more new use cases"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default UseCases;
