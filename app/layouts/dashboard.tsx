import { Outlet } from "react-router";
import { SiteHeader } from "~/components/site-header";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";

export default function DashboardLayout() {
  return (
    <>
      <SidebarProvider className="[--header-height:calc(--spacing(14))]">
        <SiteHeader />
        <div className="flex flex-1 gap-4">
          <SidebarInset>
            <header className="sticky top-0 flex items-end h-11 shrink-0 gap-2 bg-background"></header>
            <div className="flex flex-1 flex-col gap-4 py-3">
              <Outlet />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </>
  );
}
