import { hardwareProject } from "~/features/hardware/fake-data";

/**
 * Hardware configurator demo entry — placeholder for Step 2.
 *
 * Renders a minimal page that proves:
 *   1. the new route works,
 *   2. `~/features/hardware/fake-data` imports cleanly,
 *   3. the Avaya project tree is readable end-to-end.
 *
 * Real UI (Screens A/B/C) lands here from Step 3 onwards.
 * See app/docs/features/hardware-configurator/PROGRESS.md.
 */
export default function AvayaDemoEntry() {
  return (
    <main className="mx-auto max-w-2xl px-8 py-16 font-sans">
      <h1 className="text-3xl font-semibold tracking-tight">
        {hardwareProject.name}
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Lead score: {hardwareProject.leadScore} · Grand Total: $
        {hardwareProject.grandTotalUSD.toLocaleString("en-US")}
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Subsystems</h2>
        <ul className="mt-3 space-y-1.5 text-sm">
          {hardwareProject.subsystems.map((s) => (
            <li key={s.id} className="flex justify-between gap-4">
              <span>{s.name}</span>
              <span className="text-muted-foreground">
                {s.qty} × {s.chassis.name}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Racks</h2>
        <ul className="mt-3 space-y-1.5 text-sm">
          {hardwareProject.racks.map((r) => (
            <li key={r.id} className="flex justify-between gap-4">
              <span>{r.isEmpty ? <em>Empty Rack</em> : r.name}</span>
              <span className="text-muted-foreground">
                {r.units.length} unit{r.units.length === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-muted-foreground mt-10 text-xs">
        Step 2 placeholder. Screen A (multi-rack overview) replaces this page in
        Step 3.
      </p>
    </main>
  );
}
