import { Separator } from "@radix-ui/react-separator";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProjectSubsystem,
  getProjectTree,
  updateProductFamilyStatus,
  updateProductStatus,
  updateSystemStatus,
} from "~/api/systems";
import { EQueryKey } from "~/constants/queryKeys";
import { useEffectiveSubsystemId } from "~/hooks/useEffectiveSubsystemId";
import { type EUserProjectSelection } from "~/types/systemResponse";
import Products from "./customComponents/Products";
import Systems from "./customComponents/Systems";

import type { AxiosError } from "axios";
import { Loader2 } from "lucide-react";
import type { SystemTreeResponse } from "~/types/tree";

export function Options({
  isSidebar,
  category,
}: {
  isSidebar: boolean;
  category?: "ecosystem" | "infrastructure" | undefined;
}) {
  const { id, effectiveSubsystemId } = useEffectiveSubsystemId();
  const queryClient = useQueryClient();

  const {
    data: subsystemData,
    isPending: isLoadingSubsystem,
    isRefetching: isRefetchingSubsystem,
  } = useQuery({
    queryKey: [EQueryKey.PROJECT_SUBSYSTEM, id, effectiveSubsystemId],
    queryFn: () => getProjectSubsystem(String(id), effectiveSubsystemId!),
    enabled: !!id && !!effectiveSubsystemId,
  });

  const { data: treeData } = useQuery<SystemTreeResponse[], AxiosError>({
    queryKey: [EQueryKey.PROJECT_TREE, id],
    queryFn: () => getProjectTree(id as string),
    enabled: !!id,
    retry: false,
  });

  const updateSystemStatusMutation = useMutation({
    mutationFn: ({
      status,
      systemId,
    }: {
      status: EUserProjectSelection | null;
      systemId?: string;
    }) =>
      updateSystemStatus(String(id), systemId || effectiveSubsystemId!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [EQueryKey.PROJECT_SUBSYSTEM, id, effectiveSubsystemId],
      });
      queryClient.invalidateQueries({
        queryKey: [EQueryKey.PROJECT_PRICE_DATA, id],
      });
      queryClient.invalidateQueries({
        queryKey: [EQueryKey.PROJECT_TREE, id],
      });
    },
  });

  const updateProductStatusMutation = useMutation({
    mutationFn: ({
      status,
      productId,
    }: {
      status: EUserProjectSelection | null;
      productId: string;
    }) => updateProductStatus(String(id), productId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [EQueryKey.PROJECT_SUBSYSTEM, id, effectiveSubsystemId],
      });
      queryClient.invalidateQueries({
        queryKey: [EQueryKey.PROJECT_PRICE_DATA, id],
      });
      queryClient.invalidateQueries({
        queryKey: [EQueryKey.PROJECT_TREE, id],
      });
    },
  });

  const updateProductFamilyStatusMutation = useMutation({
    mutationFn: ({
      status,
      productFamilyId,
    }: {
      status: EUserProjectSelection | null;
      productFamilyId: string;
    }) => updateProductFamilyStatus(String(id), productFamilyId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [EQueryKey.PROJECT_SUBSYSTEM, id, effectiveSubsystemId],
      });
      queryClient.invalidateQueries({
        queryKey: [EQueryKey.PROJECT_PRICE_DATA, id],
      });
      queryClient.invalidateQueries({
        queryKey: [EQueryKey.PROJECT_TREE, id],
      });
    },
  });

  const ecosystemCategories = subsystemData?.subsystems.filter(
    (s) => s.category === "ecosystem",
  );
  const infrastructureCategories = subsystemData?.subsystems.filter(
    (s) => s.category === "infrastructure",
  );

  console.log("subsystem data", isLoadingSubsystem);

  if (isLoadingSubsystem || !subsystemData) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        {/* <Loader2 className="animate-spin" /> */}
        <div className="text-gray-500 text-center">
          This Catalog tab is not active in the current Project and Proposal
          workspaces.
        </div>
      </div>
    );
  }
  return (
    <>
      {subsystemData?.products.length > 0 && (
        <Products
          products={subsystemData?.products || []}
          type="products"
          onUpdateStatus={(
            status: EUserProjectSelection | null,
            productId: string,
          ) =>
            updateProductStatusMutation.mutate({
              status,
              productId,
            })
          }
          isSidebar={isSidebar}
        />
      )}
      {subsystemData?.product_families.length > 0 && (
        <Products
          products={subsystemData?.product_families || []}
          type="productFamilies"
          onUpdateStatus={(
            status: EUserProjectSelection | null,
            productFamilyId: string,
          ) =>
            updateProductFamilyStatusMutation.mutate({
              status,
              productFamilyId,
            })
          }
          isSidebar={isSidebar}
        />
      )}
      <Separator />
      {subsystemData?.subsystems.length > 0 && !category && (
        <Systems
          systems={subsystemData?.subsystems || []}
          onUpdateStatus={(
            status: EUserProjectSelection | null,
            systemId: string,
          ) => updateSystemStatusMutation.mutate({ status, systemId })}
          isSidebar={isSidebar}
        />
      )}
      {subsystemData?.subsystems.length > 0 &&
        category === "infrastructure" && (
          <Systems
            systems={infrastructureCategories || []}
            onUpdateStatus={(
              status: EUserProjectSelection | null,
              systemId: string,
            ) => updateSystemStatusMutation.mutate({ status, systemId })}
            isSidebar={isSidebar}
          />
        )}
      {subsystemData?.subsystems.length > 0 && category === "ecosystem" && (
        <Systems
          systems={ecosystemCategories || []}
          onUpdateStatus={(
            status: EUserProjectSelection | null,
            systemId: string,
          ) => updateSystemStatusMutation.mutate({ status, systemId })}
          isSidebar={isSidebar}
        />
      )}
    </>
  );
}
