import { Outlet } from "react-router";
import { SidebarProvider } from "~/components/ui/sidebar";
import { SiteHeader } from "~/components/site-header";

export default function LeadScoreLayout() {
  return (
    <SidebarProvider className="[--header-height:calc(--spacing(14))]">
      <SiteHeader />
      <div className="flex flex-1 justify-center">
        <div className="w-full max-w-3xl px-6 pb-10">
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
}
