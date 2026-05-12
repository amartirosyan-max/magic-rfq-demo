import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "~/components/ui/sidebar";
import { Link } from "react-router";

type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  isSelected?: boolean;
  items?: NavItem[];
  category: string;
};

function NavMenuItem({ item, level = 0 }: { item: NavItem; level?: number }) {
  const hasChildren = item.items && item.items.length > 0;

  return (
    <Collapsible
      asChild
      defaultOpen={item.isActive}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <div
          className={`flex items-center gap-2 px-2.5 border border-[var(--active-tab)] ${
            item.isSelected
              ? "bg-[var(--active-tab)] text-white hover:bg-[var(--active-tab)] hover:text-white"
              : level === 1
                ? "bg-[var(--chat-background)] hover:bg-[#b1c9ef] active:bg-sidebar-accent active:text-sidebar-accent-foreground"
                : "bg-white hover:bg-gray-100 active:bg-sidebar-accent active:text-sidebar-accent-foreground"
          }`}
        >
          <SidebarMenuButton asChild>
            <Link to={item.url} tabIndex={0}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
          {hasChildren && (
            <CollapsibleTrigger asChild>
              <ChevronRight className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 size-4 min-w-4 min-h-4 cursor-pointer" />
            </CollapsibleTrigger>
          )}
        </div>
        {hasChildren && (
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items!.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  {subItem.items && subItem.items.length > 0 ? (
                    <NavMenuItem item={subItem} level={level + 1} />
                  ) : (
                    <SidebarMenuSubButton
                      asChild
                      className={`${subItem.isSelected ? "bg-[var(--active-tab)] text-white hover:bg-[var(--active-tab)] hover:text-white" : ""}`}
                    >
                      <Link to={subItem.url}>
                        <span>{subItem.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  )}
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function NavMain({ items }: { items: NavItem[] }) {
  return (
    <SidebarGroup className="text-primary">
      <SidebarMenu>
        {items.map((item) => (
          <NavMenuItem key={item.title} item={item} level={0} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
