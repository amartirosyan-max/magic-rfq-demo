import type { ReactNode } from "react";
import { SidebarLeft } from "./SidebarLeft";
import { SidebarRight } from "./SidebarRight";

/**
 * Three-column shell for the hardware configurator demo:
 *  [ left sidebar | center canvas | right sidebar ]
 *
 * Used by every screen (A, B, C). The middle column slot is filled
 * with whatever screen component is passed as `children`.
 */
export function HardwareLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-screen w-screen grid-cols-[260px_1fr_360px] bg-white text-slate-900 antialiased">
      <SidebarLeft />
      <main className="h-screen overflow-hidden">{children}</main>
      <SidebarRight />
    </div>
  );
}
