/**
 * Hardware-configurator project context.
 *
 * The feature tree (TopChrome, ScreenA, ScreenC, Rack, CatalogPanel,
 * sidebars, hooks) used to import a singleton `hardwareProject` from
 * `fake-data.ts`. Now that we have multiple projects (Avaya and
 * ADGSA-AI today, more later), every consumer reads its project from
 * this context instead, and each route wraps `<HardwareLayout>` with
 * the right project.
 *
 * Adapter helpers in `adapter.ts` accept the project as a plain
 * parameter (React hooks can't be called from non-component functions),
 * so this context is only consumed by components and React hooks.
 */

import { createContext, useContext, type ReactNode } from "react";

import type { HardwareProject } from "./types";

const HardwareProjectContext = createContext<HardwareProject | null>(null);

interface HardwareProjectProviderProps {
  project: HardwareProject;
  children: ReactNode;
}

export function HardwareProjectProvider({
  project,
  children,
}: HardwareProjectProviderProps) {
  return (
    <HardwareProjectContext.Provider value={project}>
      {children}
    </HardwareProjectContext.Provider>
  );
}

/**
 * Read the current `HardwareProject` from context.
 *
 * Throws if called outside `<HardwareProjectProvider>` — that's a
 * developer error (a route forgot to wrap its layout) and is louder
 * than silently rendering with stale/empty data.
 */
export function useHardwareProject(): HardwareProject {
  const project = useContext(HardwareProjectContext);
  if (!project) {
    throw new Error(
      "useHardwareProject() called outside <HardwareProjectProvider>. " +
        "Make sure the route wraps <HardwareLayout> (which provides the context).",
    );
  }
  return project;
}
