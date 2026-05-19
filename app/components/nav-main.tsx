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
  isActive: boolean;
  isSelected: boolean;
  /** Domain id for the item (e.g. subsystem id). Used by `onItemSelect`. */
  hr_uid: string | null;
  items: NavItem[];
  category: string;
};

/**
 * When provided, the parent intercepts the click: `preventDefault()` runs and
 * the callback fires with the clicked `item`. Routing is suppressed entirely,
 * so the URL never changes — used by the hardware demo where the nav drives
 * pure client-state selection instead of navigation.
 */
type OnItemSelect = (item: NavItem) => void;

function NavMenuItem({
  item,
  level = 0,
  onItemSelect,
}: {
  item: NavItem;
  level?: number;
  onItemSelect?: OnItemSelect;
}) {
  const hasChildren = item.items.length > 0;

  const handleItemClick = (e: React.MouseEvent) => {
    if (onItemSelect) {
      e.preventDefault();
      onItemSelect(item);
    }
  };

  return (
    <Collapsible
      asChild
      defaultOpen={item.isActive}
      className="group/collapsible"
    >
      <SidebarMenuItem className="w-full">
        <div
          className={`flex w-full min-w-0 items-center gap-2 rounded-none px-2.5 border border-[var(--active-tab)] ${
            item.isSelected
              ? "bg-[var(--active-tab)] text-white hover:bg-[var(--active-tab)] hover:text-white"
              : level === 1
                ? "bg-[var(--chat-background)] hover:bg-[#b1c9ef]"
                : "bg-white hover:bg-gray-100"
          }`}
        >
          <SidebarMenuButton
            asChild
            className="min-h-0 min-w-0 shrink flex-1 bg-transparent text-inherit shadow-none ring-0 hover:bg-transparent hover:text-inherit active:bg-transparent active:text-inherit data-[active=true]:bg-transparent data-[active=true]:text-inherit data-[state=open]:hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={handleItemClick}
          >
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
          <CollapsibleContent className="w-full min-w-0">
            <SidebarMenuSub className="w-full min-w-0 translate-x-0 border-0 pl-2 pr-0">
              {item.items.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  {subItem.items.length > 0 ? (
                    <NavMenuItem
                      item={subItem}
                      level={level + 1}
                      onItemSelect={onItemSelect}
                    />
                  ) : (
                    <SidebarMenuSubButton
                      asChild
                      className={`w-full min-w-0 translate-x-0 rounded-none hover:text-inherit active:bg-transparent active:text-inherit data-[active=true]:bg-transparent data-[active=true]:text-inherit ${subItem.isSelected ? "border-[var(--active-tab)] bg-[var(--active-tab)] text-white hover:bg-[var(--active-tab)] hover:text-white active:bg-[var(--active-tab)] active:text-white" : "active:bg-gray-100"}`}
                      onClick={(e) => {
                        if (onItemSelect) {
                          e.preventDefault();
                          onItemSelect(subItem);
                        }
                      }}
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

export function NavMain({
  items,
  onItemSelect,
}: {
  items: NavItem[];
  /**
   * Optional click interceptor — when provided, routing is suppressed and
   * the callback fires with the clicked item. Used by demos that drive
   * client-state selection from the sidebar nav.
   */
  onItemSelect?: OnItemSelect;
}) {
  return (
    <SidebarGroup className="text-primary p-0">
      <SidebarMenu className="w-full">
        {items.map((item) => (
          <NavMenuItem
            key={item.title}
            item={item}
            level={0}
            onItemSelect={onItemSelect}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
