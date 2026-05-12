// @ts-nocheck — this file is a documentation template, not real code.
//                See app/docs/05-state-and-data-fetching.md and
//                app/docs/14-implementation-playbook.md.

/**
 * Template: TanStack Query / mutation patterns used across the app.
 *
 * Drop the snippets you need into your component. They are written so they
 * compile in isolation only when wired to real API + EQueryKey entries.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import { EQueryKey } from "~/constants/queryKeys";

// 1) Basic read (project-scoped)
//    - Always include scoping ids in the key.
//    - Always guard `enabled`.
//    - Disable refetch on window focus for chatty queries.
export function useExampleReadQuery() {
  const { id: projectId } = useParams();
  return useQuery({
    queryKey: [EQueryKey.PROJECT_DATA, projectId],
    queryFn: async () => {
      // return getProject(String(projectId));
      return null as unknown;
    },
    enabled: !!projectId && projectId !== "",
    refetchOnWindowFocus: false,
  });
}

// 2) Polling read
//    - Use a predicate `refetchInterval` so polling stops automatically.
//    - 1000 ms for fast (project/subsystem polling), 2000–5000 ms for less critical.
export function useExamplePollingQuery(projectId: string) {
  return useQuery({
    queryKey: [EQueryKey.PROJECT_DATA, projectId],
    queryFn: async () => {
      // return getProject(projectId);
      return null as unknown as { status: "init" | "in_progress" | "completed" | "failed" };
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && (data.status === "init" || data.status === "in_progress")
        ? 1000
        : false;
    },
    refetchOnWindowFocus: false,
    enabled: !!projectId && projectId !== "",
  });
}

// 3) Optimistic mutation (rename, qty change, status change)
//    - Cancel in-flight queries
//    - Snapshot previous data
//    - Apply optimistic update
//    - Rollback on error
//    - Always invalidate on settle
export function useExampleOptimisticMutation() {
  const queryClient = useQueryClient();
  const { id: projectId } = useParams();

  return useMutation({
    mutationFn: async (input: { title: string }) => {
      // return updateProject(String(projectId), input);
      return input;
    },
    onMutate: async (input) => {
      const key = [EQueryKey.PROJECT_DATA, String(projectId)];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      if (previous && typeof previous === "object") {
        queryClient.setQueryData(key, { ...previous, ...input });
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
        queryKey: [EQueryKey.PROJECT_DATA, String(projectId)],
      });
    },
  });
}

// 4) Mutation that triggers a backend job; we then enable polling
//    - Don't poll inside the mutation. Trigger polling from a context or local state.
export function useExampleStartGeneration(onStart: (projectId: string) => void) {
  return useMutation({
    mutationFn: async (projectId: string) => {
      // return generateSystemTree(projectId);
    },
    onSuccess: (_data, projectId) => {
      onStart(projectId);
    },
  });
}

// 5) Setting a derived flag in the cache (no fetch)
//    - Useful for cross-component "session" booleans like `USE_CASES_GENERATED`.
export function useExampleDerivedFlag(projectId: string) {
  const queryClient = useQueryClient();
  const flagKey = [EQueryKey.USE_CASES_GENERATED, projectId];

  const { data: isReady = false } = useQuery({
    queryKey: flagKey,
    queryFn: () => false,
    enabled: false,
    initialData: false,
  });

  const setReady = (value: boolean) =>
    queryClient.setQueryData(flagKey, value);

  return { isReady, setReady };
}
