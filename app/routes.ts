import {
  index,
  layout,
  route,
  type RouteConfig,
} from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),

  // Hardware configurator demos — open directly, no auth.
  // See app/docs/features/hardware-configurator/PROGRESS.md.
  route("avaya", "routes/avaya/index.tsx"),
  route("adgsa-ai", "routes/adgsa-ai/index.tsx"),

  layout("./auth/layout.tsx", [
    route("login", "routes/login.tsx"),
    route("register", "auth/register.tsx"),
  ]),

  layout("layouts/dashboard.tsx", [
    route("dashboard", "routes/dashboard/index.tsx"),
  ]),

  layout("routes/PrivateRoute.tsx", [
    layout("layouts/lead-score.tsx", [
      route("projects/:id/lead-score", "routes/lead-score.tsx", {
        id: "project-lead-score",
      }),
    ]),

    layout("layouts/project.tsx", [
      // Корневой проект
      route("projects/:id", "routes/project-root.tsx", { id: "project-root" }),
      // Экран системы
      route("projects/:id/systems/:systemId", "routes/project.tsx", {
        id: "project-system",
      }),
      // Экран подсистемы (может быть вложенным)
      route("projects/:id/systems/:systemId/*", "routes/project.tsx", {
        id: "project-subsystem",
      }),
    ]),
  ]),
] satisfies RouteConfig;
