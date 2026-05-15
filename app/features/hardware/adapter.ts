/**
 * Hardware demo — adapters.
 *
 * Translates a `HardwareProject` value into the shapes the existing
 * `~/components/sidebar-left.tsx` / `~/components/sidebar-right.tsx`
 * components already expect. The goal is to REUSE those components
 * as-is and only feed them fake values, not to build parallel
 * sidebar UIs.
 *
 *  - `getFakeProject(project)`        → ProjectResponse (left-sidebar header)
 *  - `getFakeProjectPrice(project)`   → IProjectPriceResponse (left-sidebar price)
 *  - `getFakeNavItems(selectedId, project, subsystems?)` → NavItem[] for `<NavMain>`
 *
 * Functions are plain (not hooks) so they're safe to call from
 * `useMemo` / inside other hooks. Each route's `HardwareLayout` reads
 * its project from `HardwareProjectContext` and threads it through.
 */

import type { IProjectPriceResponse } from "~/api/billing";
import {
  CreatingStatus,
  type ProjectResponse,
  SystemGenerationStatus,
} from "~/types/project";
import type { NavItem } from "~/types/navigation";
import type { HardwareProject, Subsystem } from "./types";

const FAKE_PROJECT_ID = 1001;

/** Minimal `ProjectResponse` strong-typed for the left sidebar. */
export function getFakeProject(project: HardwareProject): ProjectResponse {
  return {
    id: FAKE_PROJECT_ID,
    name: project.name,
    client_name: project.clientName,
    description: project.description,
    industry: project.industry,
    budget_estimation: null,
    timeline: null,
    submission_deadline: null,
    creating_progress: 100,
    creating_message: "",
    creating_status: CreatingStatus.COMPLETED,
    system_generation_progress: 100,
    system_generation_message: "",
    system_generation_status: SystemGenerationStatus.COMPLETED,
    organization_id: 1,
    organization_name: "Magic UI Demo",
    user_division: null,
    user_location: null,
    user_name: null,
    /* Must be > 2.0 so the left sidebar doesn't redirect to /lead-score */
    lead_score: project.leadScore,
    proposal_confidence: 0.92,
    questionnaire_completion: 1,
  };
}

/** Fake price for the sidebar header. We render a single "Grand Total" so we
 *  collapse the min/max range to the same number. */
export function getFakeProjectPrice(
  project: HardwareProject,
): IProjectPriceResponse {
  return {
    id: FAKE_PROJECT_ID,
    name: project.name,
    description: "Grand Total",
    price: String(project.grandTotalUSD),
    price_max: String(project.grandTotalUSD),
  };
}

/**
 * Build the left-sidebar nav from `project.subsystems`.
 *
 * Top-level row = the project itself; each subsystem is nested under it.
 * `selectedSubsystemId` controls which sub-item renders with the "selected"
 * highlight — passing `null` clears all sub selections (Screen A default).
 * `subsystems` is the (optionally edited) list — pass the
 * `effectiveSubsystems` projection from `SubsystemEditsContext` so
 * deletes and renames flow into the sidebar.
 *
 * URLs are placeholders; the hardware demo intercepts clicks via
 * `onItemSelect` on `<NavMain>`, so they never actually navigate.
 */
export function getFakeNavItems(
  selectedSubsystemId: string | null,
  project: HardwareProject,
  subsystems: Subsystem[] = project.subsystems,
): NavItem[] {
  return [
    {
      title: project.name,
      url: project.routePath,
      isActive: true,
      /* Project row stays highlighted while we're inside this demo. */
      isSelected: true,
      hr_uid: null,
      category: "infrastructure",
      items: subsystems.map((s) => ({
        title: s.name,
        url: `${project.routePath}#${s.id}`,
        isActive: false,
        isSelected: s.id === selectedSubsystemId,
        hr_uid: s.id,
        category: "infrastructure",
        items: [],
      })),
    },
  ];
}
