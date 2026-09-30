import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { homeFor, isStaff } from "./api";
import { useAuth } from "./use-auth";

/** Gates a route tree to one audience; the other audience is sent to its own home. */
export function RequireAuth({ audience }: { audience: "staff" | "customer" }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center" role="status" aria-label="Checking session">
        <Spinner />
      </div>
    );
  }
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  if ((audience === "staff") !== isStaff(user)) return <Navigate to={homeFor(user)} replace />;
  return <Outlet />;
}
