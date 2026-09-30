import { Link, useLocation } from "react-router-dom";
import { Compass } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/States";

export function NotFoundPage() {
  const { pathname } = useLocation();
  const home = pathname.startsWith("/app") ? { to: "/app", label: "Go to dashboard" } : { to: "/", label: "Go home" };
  return (
    <div className="p-6">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you’re looking for doesn’t exist."
        action={<Button asChild variant="outline"><Link to={home.to}>{home.label}</Link></Button>}
      />
    </div>
  );
}
