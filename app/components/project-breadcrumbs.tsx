import { Link, useLocation } from "react-router";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { findPathByIds } from "~/utils/tree";
import type { SystemTreeResponse } from "~/types/tree";
import { useMemo, useRef, useLayoutEffect, useState } from "react";
import { cn } from "~/lib/utils";

type BreadcrumbItem = {
  label: string;
  to: string;
};

interface ProjectBreadcrumbsProps {
  treeData?: SystemTreeResponse[];
  projectId?: string;
  systemId?: string;
  subsystemPath?: string;
}

export function ProjectBreadcrumbs({
  treeData,
  projectId,
  systemId,
  subsystemPath,
}: ProjectBreadcrumbsProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const containerRef = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLElement>(null);
  const [shouldCollapse, setShouldCollapse] = useState(false);

  // Generate breadcrumb items with memoization
  const breadcrumbItems = useMemo(() => {
    if (!projectId) return [];

    const items: BreadcrumbItem[] = [
      { label: "Project", to: `/projects/${projectId}` },
    ];

    if (treeData?.length && treeData[0]) {
      const firstSystem = treeData[0];
      const firstSystemPath = `/projects/${projectId}/systems/${firstSystem.id}`;

      // Always add system level when at project level or navigating to a specific system
      items.push({
        label: firstSystem.title,
        to: firstSystemPath,
      });

      // Handle system navigation
      if (systemId) {
        // If navigating to a system other than the first one
        if (systemId !== String(firstSystem.id)) {
          items.pop(); // Remove first system

          const subsystemIds = subsystemPath
            ? subsystemPath.split("/").filter((_, i) => i % 2 === 1)
            : [];
          const ids = [systemId, ...subsystemIds];
          const path = findPathByIds(treeData, ids);

          // Add current system
          let url = `/projects/${projectId}/systems/${systemId}`;
          if (path.length > 0) {
            items.push({
              label: path[0].title,
              to: url,
            });

            // Add subsystems
            for (let i = 1; i < path.length; i++) {
              url += `/subsystem/${path[i].id}`;
              items.push({
                label: path[i].title,
                to: url,
              });
            }
          }
        } else if (subsystemPath) {
          // Navigating to subsystems of the first system
          const subsystemIds = subsystemPath
            .split("/")
            .filter((_, i) => i % 2 === 1);
          const ids = [systemId, ...subsystemIds];
          const path = findPathByIds(treeData, ids);

          // Add subsystem path
          let url = firstSystemPath;
          for (let i = 1; i < path.length; i++) {
            url += `/subsystem/${path[i].id}`;
            items.push({
              label: path[i].title,
              to: url,
            });
          }
        }
      }
    }

    return items;
  }, [treeData, projectId, systemId, subsystemPath]);

  // Simple overflow check
  useLayoutEffect(() => {
    if (
      !containerRef.current ||
      !measureRef.current ||
      breadcrumbItems.length <= 2
    ) {
      setShouldCollapse(false);
      return;
    }

    const container = containerRef.current;
    const measurer = measureRef.current;

    const parentWidth = container.parentElement?.offsetWidth || 0;
    const fullWidth = measurer.scrollWidth;

    setShouldCollapse(fullWidth > parentWidth);
  }, [breadcrumbItems]);

  if (!projectId || breadcrumbItems.length === 0) {
    return null;
  }

  // Helper function to render a breadcrumb item
  const renderBreadcrumbItem = (item: BreadcrumbItem, isLast: boolean) => (
    <BreadcrumbItem key={item.to}>
      <BreadcrumbLink asChild>
        <Link
          to={item.to}
          className={cn(item.to === currentPath && "font-bold")}
        >
          {item.label}
        </Link>
      </BreadcrumbLink>
      {!isLast && <BreadcrumbSeparator />}
    </BreadcrumbItem>
  );

  const isSystemLevelCurrent =
    breadcrumbItems.length > 1 && breadcrumbItems[1].to === currentPath;

  return (
    <>
      {/* Hidden measurer for full width */}
      <Breadcrumb
        className="absolute invisible pointer-events-none"
        ref={measureRef}
      >
        <BreadcrumbList>
          {breadcrumbItems.map((item, idx) =>
            renderBreadcrumbItem(item, idx === breadcrumbItems.length - 1),
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Visible breadcrumb */}
      <Breadcrumb className="absolute w-max" ref={containerRef}>
        <BreadcrumbList>
          {!shouldCollapse || breadcrumbItems.length <= 2 ? (
            // Show all items
            breadcrumbItems.map((item, idx) =>
              renderBreadcrumbItem(item, idx === breadcrumbItems.length - 1),
            )
          ) : (
            // Show collapsed version
            <>
              {renderBreadcrumbItem(breadcrumbItems[0], false)}

              {isSystemLevelCurrent ? (
                renderBreadcrumbItem(
                  breadcrumbItems[1],
                  breadcrumbItems.length === 2,
                )
              ) : (
                <BreadcrumbItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1">
                      <BreadcrumbEllipsis className="size-4" />
                      <span className="sr-only">Show more breadcrumbs</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {breadcrumbItems.slice(1, -1).map((item) => (
                        <DropdownMenuItem key={item.to} asChild>
                          <Link
                            to={item.to}
                            className={cn(
                              item.to === currentPath && "font-bold",
                            )}
                          >
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <BreadcrumbSeparator />
                </BreadcrumbItem>
              )}

              {!isSystemLevelCurrent &&
                renderBreadcrumbItem(
                  breadcrumbItems[breadcrumbItems.length - 1],
                  true,
                )}
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}
