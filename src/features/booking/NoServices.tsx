import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/use-auth";

/** Visitors get a short note; a signed-in admin also learns what makes a service bookable. */
export function NoServices() {
  const { user } = useAuth();
  return (
    <div className="space-y-2 px-4 py-6 text-sm">
      <p className="text-muted-foreground">No services are open for booking yet. Check back soon.</p>
      {user ? (
        <p className="border border-dashed bg-muted p-3">
          <span className="rx-meta block text-foreground">Admin tip</span>
          A service shows here once it’s bookable and at least one active staff member performs it. Tick it on their page under{" "}
          <Link to="/app/staff" className="text-brand hover:underline">Staff</Link>, and give them working hours so there are times to pick.
        </p>
      ) : null}
    </div>
  );
}
