import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { AuthPage } from "@/pages/AuthPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { LandingPage } from "@/pages/LandingPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { DatabaseGate } from "./DatabaseGate";

// Signed-in pages load on demand so the landing and auth pages stay light.
const page = (load: () => Promise<Record<string, React.ComponentType>>, name: string): RouteObject["lazy"] =>
  async () => ({ Component: (await load())[name] });

export const router = createBrowserRouter(
  [
    { path: "/", element: <LandingPage /> },
    { path: "/login", element: <AuthPage mode="login" /> },
    { path: "/signup", element: <AuthPage mode="signup" /> },
    { path: "/agent/signup", element: <AuthPage mode="agent-signup" /> },
    { path: "/forgot-password", element: <ForgotPasswordPage /> },
    { path: "/reset-password", element: <ResetPasswordPage /> },
    {
      // Agent dashboard: admins and agents, over the Data API.
      path: "/app",
      element: <RequireAuth audience="staff" />,
      children: [
        {
          element: <AppLayout />,
          children: [
            {
              element: <DatabaseGate />,
              children: [
                { index: true, lazy: page(() => import("@/pages/TicketsPage"), "InboxPage") },
                { path: "tickets", lazy: page(() => import("@/pages/TicketsPage"), "AllTicketsPage") },
                { path: "tickets/:number", lazy: page(() => import("@/pages/TicketDetailPage"), "TicketDetailPage") },
                { path: "customers", lazy: page(() => import("@/pages/CustomersPage"), "CustomersPage") },
                { path: "customers/:id", lazy: page(() => import("@/pages/CustomerDetailPage"), "CustomerDetailPage") },
                { path: "settings", lazy: page(() => import("@/pages/SettingsPage"), "SettingsPage") },
              ],
            },
            { path: "*", element: <NotFoundPage /> },
          ],
        },
      ],
    },
    {
      // Customer portal: customers only, over /api/portal.
      path: "/portal",
      element: <RequireAuth audience="customer" />,
      children: [
        {
          element: <PortalLayout />,
          children: [
            { index: true, lazy: page(() => import("@/pages/PortalDashboardPage"), "PortalDashboardPage") },
            { path: "tickets", lazy: page(() => import("@/pages/PortalTicketsPage"), "PortalTicketsPage") },
            { path: "tickets/new", lazy: page(() => import("@/pages/PortalNewTicketPage"), "PortalNewTicketPage") },
            { path: "tickets/:number", lazy: page(() => import("@/pages/PortalTicketPage"), "PortalTicketPage") },
            { path: "settings", lazy: page(() => import("@/pages/PortalSettingsPage"), "PortalSettingsPage") },
            { path: "*", element: <NotFoundPage /> },
          ],
        },
      ],
    },
    { path: "*", element: <NotFoundPage /> },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);
