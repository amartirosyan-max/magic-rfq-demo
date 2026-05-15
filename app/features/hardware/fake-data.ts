/**
 * Transitional re-export.
 *
 * The Avaya project's data moved to `projects/avaya.ts` once the feature
 * grew to support multiple hardware projects. This file is preserved so
 * existing direct imports of `hardwareProject` keep compiling during the
 * Step 3 / Step 4 refactor of `adgsa-ai-route_…plan.md`. It can be
 * deleted once every consumer reads its project via
 * `useHardwareProject()`.
 */

export { avayaProject, avayaProject as hardwareProject } from "./projects/avaya";
