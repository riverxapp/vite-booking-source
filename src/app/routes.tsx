import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { AuthPage } from "@/pages/AuthPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { LandingPage } from "@/pages/LandingPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { DatabaseGate } from "./DatabaseGate";

// The booking flow and the admin pages load on demand so the landing and auth pages stay light.
const page = (load: () => Promise<Record<string, React.ComponentType>>, name: string): RouteObject["lazy"] =>
  async () => ({ Component: (await load())[name] });

export const router = createBrowserRouter(
  [
    { path: "/", element: <LandingPage /> },
    // Public booking flow: no login, over /api/booking.
    { path: "/book", lazy: page(() => import("@/pages/BookPage"), "BookPage") },
    { path: "/book/confirmed", lazy: page(() => import("@/pages/BookingConfirmedPage"), "BookingConfirmedPage") },
    { path: "/login", element: <AuthPage mode="login" /> },
    { path: "/signup", element: <AuthPage mode="signup" /> },
    { path: "/forgot-password", element: <ForgotPasswordPage /> },
    { path: "/reset-password", element: <ResetPasswordPage /> },
    {
      // Admin dashboard: admins only, over the Data API.
      path: "/app",
      element: <RequireAuth />,
      children: [
        {
          element: <AppLayout />,
          children: [
            {
              element: <DatabaseGate />,
              children: [
                { index: true, lazy: page(() => import("@/pages/DashboardPage"), "DashboardPage") },
                { path: "bookings", lazy: page(() => import("@/pages/BookingsPage"), "BookingsPage") },
                { path: "bookings/:reference", lazy: page(() => import("@/pages/BookingDetailPage"), "BookingDetailPage") },
                { path: "services", lazy: page(() => import("@/pages/ServicesPage"), "ServicesPage") },
                { path: "staff", lazy: page(() => import("@/pages/StaffPage"), "StaffPage") },
                { path: "staff/:id", lazy: page(() => import("@/pages/StaffDetailPage"), "StaffDetailPage") },
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
