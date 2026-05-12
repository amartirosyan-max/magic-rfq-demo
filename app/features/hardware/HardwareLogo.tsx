import logoMarkUrl from "~/assets/hardware/verstka/Logo.svg";
import logoTextUrl from "~/assets/hardware/verstka/Logo_text.svg";

/**
 * Logo lockup for the hardware demo's left sidebar.
 *
 * Renders the icon mark (`Logo.svg`) next to the wordmark (`Logo_text.svg`)
 * scaled to fill the sidebar width — the wordmark stretches edge-to-edge
 * (with a thin margin) and the icon sits to its left at matching height.
 */
export function HardwareLogo() {
  return (
    <div className="flex w-full items-center justify-center gap-3 px-3 py-4">
      <img
        src={logoMarkUrl}
        alt=""
        className="h-12 w-auto shrink-0"
      />
      <img
        src={logoTextUrl}
        alt="Magic"
        className="h-10 w-auto max-w-[60%]"
      />
    </div>
  );
}
