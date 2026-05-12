import { BadgeCheck, ChevronsUpDown, LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { useAuth } from "~/context/AuthContext";
import { ELocalStorageKey } from "~/constants/localstorage";
import { useNavigate } from "react-router";
import { ChatBubbleAvatar } from "~/components/ui/chat/chat-bubble";
import * as React from "react";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const { setUser } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarMenu className="w-full sm:ml-auto sm:w-auto max-h-(--header-height)">
      <SidebarMenuItem className="max-h-(--header-height)">
        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            className="bg-red py-0 max-h-(--header-height)"
          >
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground text-white max-h-(--header-height) min-h-(--header-height)!"
            >
              <Avatar className="h-8 w-8">
                <ChatBubbleAvatar
                  className="text-black"
                  fallback={user.name.slice(0, 2).toUpperCase()}
                  src={undefined}
                />

                <AvatarFallback>MW</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8">
                  <ChatBubbleAvatar
                    className="text-black"
                    fallback={user.name.slice(0, 2).toUpperCase()}
                    src={undefined}
                  />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium ct">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setUser(null);
                window.localStorage.setItem(
                  ELocalStorageKey.IsUserLoggedIn,
                  "false",
                );
                navigate("/login", {
                  replace: true,
                });
              }}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
