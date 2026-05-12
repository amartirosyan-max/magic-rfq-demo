// @ts-nocheck — this file is a documentation template, not a real route.
//                See app/docs/14-implementation-playbook.md (Recipe A).

/**
 * Template: a new tabbed page route.
 *
 * Where to put the real file:
 *   1. Save as `app/routes/<your-page>.tsx`.
 *   2. Register it in `app/routes.ts` (probably inside the existing
 *      `layout("layouts/project.tsx", [...])` block).
 *   3. Run `npm run typecheck` to regenerate `+types/...`.
 *
 * Conventions used here:
 *   - Default export (React Router resolves route components by default export).
 *   - Server data via TanStack Query, with EQueryKey + scoped ids + `enabled` guard.
 *   - URL is the source of truth for which tab is active; we mirror it via `?tab=`.
 *   - Mutations follow the optimistic update + invalidate pattern.
 *   - Right sidebar mode toggling via the layout's outlet context.
 *
 * Replace XYZ everywhere.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams, useLocation } from "react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Button } from "~/components/ui/button";
import { EQueryKey } from "~/constants/queryKeys";
import { useEffectiveSubsystemId } from "~/hooks/useEffectiveSubsystemId";
import type { ProjectLayoutContext } from "~/layouts/project";
// import the API functions you need:
// import { getXyz, updateXyz } from "~/api/xyz";

const VALID_TABS = ["overview", "details"] as const;
type TabValue = (typeof VALID_TABS)[number];

export default function XyzPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { effectiveSubsystemId } = useEffectiveSubsystemId();

  // Right-sidebar control from the project layout
  const { openRightOptions, openRightChat } =
    useOutletContext<ProjectLayoutContext>();

  // Tab state mirrored to the URL via ?tab=
  const [activeTab, setActiveTab] = useState<TabValue>("overview");
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab && (VALID_TABS as readonly string[]).includes(tab)) {
      setActiveTab(tab as TabValue);
    } else {
      setActiveTab("overview");
    }
  }, [location.search]);
  const handleTabChange = (next: string) => {
    setActiveTab(next as TabValue);
    navigate(`${location.pathname}?tab=${next}`, { replace: true });
  };

  // Switch the right sidebar based on tab
  useEffect(() => {
    if (activeTab === "details") openRightOptions("infrastructure");
    return () => openRightChat();
  }, [activeTab, openRightOptions, openRightChat]);

  // Server data
  const {
    data: xyz,
    isPending,
    isError,
  } = useQuery({
    // queryKey: [EQueryKey.PROJECT_XYZ, id, effectiveSubsystemId],
    queryKey: [EQueryKey.PROJECT_DATA, id, effectiveSubsystemId],
    // queryFn: () => getXyz(String(id), effectiveSubsystemId!),
    queryFn: async () => null,
    enabled: !!id && !!effectiveSubsystemId,
  });

  // A mutation with optimistic update + rollback + invalidate
  const updateXyzMutation = useMutation({
    mutationFn: async (next: { title: string }) => {
      // return updateXyz(String(id), effectiveSubsystemId!, next);
      return next;
    },
    onMutate: async (next) => {
      const key = [EQueryKey.PROJECT_DATA, id, effectiveSubsystemId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      if (previous) {
        queryClient.setQueryData(key, { ...previous, ...next });
      }
      return { previous, key };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous && ctx.key) {
        queryClient.setQueryData(ctx.key, ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [EQueryKey.PROJECT_DATA, id, effectiveSubsystemId],
      });
      // also invalidate any dependent caches:
      // queryClient.invalidateQueries({ queryKey: [EQueryKey.PROJECT_TREE, id] });
      // queryClient.invalidateQueries({ queryKey: [EQueryKey.PROJECT_PRICE_DATA, id] });
    },
  });

  if (isPending) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (isError || !xyz) {
    return (
      <div className="flex items-center justify-center w-full h-full text-gray-500">
        Nothing to show here yet.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 pb-2.5">
      <div className="bg-white rounded-md w-full h-full px-6 pb-5 flex flex-col gap-6">
        <Tabs
          defaultValue="overview"
          className="w-full h-full gap-2.5"
          onValueChange={handleTabChange}
          value={activeTab}
        >
          <div className="w-full bg-white sticky top-0 z-10 py-2.5 flex justify-between">
            <TabsList className="bg-white">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger
                value="details"
                className="border-l-1 border-r-1 border-l-primary border-r-primary"
              >
                Details
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <div className="flex flex-col gap-6">
              <h2 className="text-[24px] font-bold leading-[140%] font-[Roboto_Serif] text-[#3a3540]">
                XYZ overview
              </h2>
              <Button onClick={() => updateXyzMutation.mutate({ title: "New title" })}>
                Rename
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="details">
            <div className="flex flex-col gap-6">
              {/* details UI goes here */}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
