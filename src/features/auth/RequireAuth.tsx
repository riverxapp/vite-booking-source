import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { isAdmin } from "./api";
import { useAuth } from "./use-auth";

/** Gates the admin dashboard: signed-out visitors go to the login page and come back after. */
export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center" role="status" aria-label="Checking session">
        <Spinner />
      </div>
    );
  }
  if (!user || !isAdmin(user)) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <Outlet />;
}
