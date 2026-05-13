/**
 * Hardware demo — adapters.
 *
 * Translates the hardware-feature data tree (`fake-data.ts`) into the shapes
 * the existing `~/components/sidebar-left.tsx` / `~/components/sidebar-right.tsx`
 * components already expect. The goal is to REUSE those components as-is and
 * only feed them fake values, not to build parallel sidebar UIs.
 *
 *  - `getFakeProject()`        → ProjectResponse (left-sidebar header)
 *  - `getFakeProjectPrice()`   → IProjectPriceResponse (left-sidebar price)
 *  - `getFakeNavItems()`       → NavItem[] for `<NavMain>`
 */

import type { IProjectPriceResponse } from "~/api/billing";
import {
  CreatingStatus,
  type ProjectResponse,
  SystemGenerationStatus,
} from "~/types/project";
import type { NavItem } from "~/types/navigation";
import { hardwareProject } from "./fake-data";
import type { Subsystem } from "./types";

const FAKE_PROJECT_ID = 1001;

/** Minimal `ProjectResponse` strong-typed for the left sidebar. */
export function getFakeProject(): ProjectResponse {
  return {
    id: FAKE_PROJECT_ID,
    name: hardwareProject.name,
    client_name: "Avaya",
    description:
      "Avaya POD Cluster — IPO200. Two-rack Hyper-V + VMware infrastructure.",
    industry: "Telecom",
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
    lead_score: hardwareProject.leadScore,
    proposal_confidence: 0.92,
    questionnaire_completion: 1,
  };
}

/** Fake price for the sidebar header. We render a single "Grand Total" so we
 *  collapse the min/max range to the same number. */
export function getFakeProjectPrice(): IProjectPriceResponse {
  return {
    id: FAKE_PROJECT_ID,
    name: hardwareProject.name,
    description: "Grand Total",
    price: String(hardwareProject.grandTotalUSD),
    price_max: String(hardwareProject.grandTotalUSD),
  };
}

/**
 * Build the left-sidebar nav from `hardwareProject.subsystems`.
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
  selectedSubsystemId: string | null = null,
  subsystems: Subsystem[] = hardwareProject.subsystems,
): NavItem[] {
  return [
    {
      title: hardwareProject.name,
      url: "/avaya",
      isActive: true,
      /* Project row stays highlighted while we're in the Avaya demo. */
      isSelected: true,
      hr_uid: null,
      category: "infrastructure",
      items: subsystems.map((s) => ({
        title: s.name,
        url: `/avaya#${s.id}`,
        isActive: false,
        isSelected: s.id === selectedSubsystemId,
        hr_uid: s.id,
        category: "infrastructure",
        items: [],
      })),
    },
  ];
}
