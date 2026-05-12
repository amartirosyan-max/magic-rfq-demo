import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { loadAllImages } from "~/constants/assetMapping";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Toaster } from "~/components/ui/sonner";
import { AuthProvider } from "~/context/AuthContext";
import { ProjectProvider } from "~/context/ProjectContext";
import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Roboto+Serif:ital,opsz,wght@0,8..144,100..900;1,8..144,100..900&display=swap",
  },
];

const envCustomer = import.meta.env.VITE_APP_CUSTOMER;
const customerList: string[] = (
  import.meta.env.VITE_CUSTOMER_LIST || "mindware,datamonsters"
)
  .split(",")
  .map((s: string) => s.trim());
let customer = envCustomer;
if (!customer && typeof window !== "undefined") {
  const host = window.location.host;
  const match = customerList.find((c) => host.includes(c));
  if (match) {
    customer = match;
  } else {
    customer = customerList[0];
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-customer={customer}
      className="scrollbar-thumb-[#E5E5E5]"
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <title>Magic</title>
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const queryClient = new QueryClient({});

export default function App() {
  useEffect(() => {
    if (customer) {
      document.documentElement.setAttribute("data-customer", customer);
    }
  }, [customer]);

  useEffect(() => {
    loadAllImages();
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ProjectProvider initialProject={null}>
          <Outlet />
        </ProjectProvider>
        <Toaster
          position="bottom-center"
          toastOptions={{
            classNames: {
              description: "text-black!",
            },
          }}
        />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
