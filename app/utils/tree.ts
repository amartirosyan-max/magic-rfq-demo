import { EUserProjectSelection } from "~/types/systemResponse";
import type { SystemTreeResponse } from "~/types/tree";
import { type NavItem } from "~/types/navigation";

/**
 * Find path in tree by array of ids (systemId, ...subsystemIds)
 */
export function findPathByIds(
  tree: SystemTreeResponse[],
  ids: string[],
): SystemTreeResponse[] {
  let path: SystemTreeResponse[] = [];
  let current = tree.find((n) => String(n.id) === ids[0]);
  if (!current) return [];
  path.push(current);
  for (let i = 1; i < ids.length; i++) {
    if (!current.subsystems) break;
    current = current.subsystems.find((s) => String(s.id) === ids[i]);
    if (!current) break;
    path.push(current);
  }
  return path;
}

/**
 * Convert tree structure to sidebar navigation format
 */
export function mapTreeToSidebar(
  tree: SystemTreeResponse[],
  projectId: string,
  parentUrl?: string,
  openFirst = true,
  currentPath = "",
): NavItem[] {
  const sortedTree = tree
    .filter((item) => item.status !== EUserProjectSelection.Removed)
    .slice()
    .sort((a, b) => a.order - b.order);

  return sortedTree.map((node, idx) => {
    const url = parentUrl
      ? `${parentUrl}/subsystem/${node.id}`
      : `/projects/${projectId}/systems/${node.id}`;
    const hasChildren = node.subsystems && node.subsystems.length > 0;
    const isSelected = currentPath === url; // highlight only if exact match
    const isActive = openFirst && idx === 0 && hasChildren; // only for open state
    return {
      title: node.title,
      url,
      isActive,
      isSelected,
      hr_uid: node.hr_uid,
      category: node.category,
      items: hasChildren
        ? mapTreeToSidebar(node.subsystems, projectId, url, false, currentPath)
        : [],
    };
  });
}
