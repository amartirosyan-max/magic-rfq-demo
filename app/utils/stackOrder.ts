import { type NavItem } from "~/types/navigation";

export const STACK_ORDER: Record<string, number> = {
  "#enterprise_ai_strategy": 1,
  "#enterprise_apps_and_usecases": 2,
  "#enterprise_systems": 3,
  "#nvidia_ai_enterprise": 4,
  "#mlops_platforms": 5,
  "#data_infrastructure": 6,
  "#cluster_virtualization": 7,
  "#cloud_infrastructure": 8,
  "#data_center_hardware": 9,
};

/**
 * Helper function to get order value for a specific hr_uid
 */
export function getNavItemOrder(item: NavItem): number {
  // Return the order value if defined, otherwise a high number (to sort to end)
  if (!item.hr_uid) return 100;
  return STACK_ORDER[item.hr_uid] || 100;
}
