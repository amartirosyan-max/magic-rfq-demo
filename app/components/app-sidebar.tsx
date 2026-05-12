import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { Check } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

const items = [
  { id: "info", title: "Information about the Client", checked: true },
  { id: "hw", title: "Hardware Infrastructure", checked: true },
  { id: "str", title: "AI Strategy and Use cases", badge: undefined },
  { id: "plat", title: "AI Platform", badge: 5 },
  { id: "apps", title: "AI Applications and Solutions" },
];

const active = "str";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {/*<SidebarMenuButton size="lg" asChild>*/}
            <h2 className="text-xl font-semibold text-[var(--card-foreground)] text-center">
              Project Name
            </h2>
            {/*</SidebarMenuButton>*/}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="p-4">
          <ul className="space-y-2">
            {items.map((item) => {
              const isActive = item.id === active;
              return (
                <li
                  key={item.id}
                  className={cn(
                    "relative flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer overflow-visible text-[var(--primary)]",
                    isActive
                      ? "bg-[var(--secondary)] border-[var(--secondary)]"
                      : "bg-white border-gray-200 hover:bg-gray-50",
                  )}
                >
                  <span>{item.title}</span>
                  <div className="flex items-center space-x-2">
                    {item.checked && (
                      <Check className="w-4 h-4 text-amber-500" />
                    )}
                    {typeof item.badge === "number" && (
                      <Badge variant="secondary">{item.badge}</Badge>
                    )}
                  </div>

                  {isActive && (
                    <div
                      className="
        absolute -right-2 top-1/2 -translate-y-1/2
        w-0 h-0
        border-t-8 border-t-transparent
         border-b-8 border-b-transparent
        border-l-8 border-l-[var(--secondary)]
      "
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-3 p-2">
          <div className="text-sm font-medium">Price Range</div>
          <div className="text-sm font-medium">Proposal Progress</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
