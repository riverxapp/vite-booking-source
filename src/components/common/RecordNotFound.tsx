import { Link } from "react-router-dom";
import { SearchX } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./States";

export function RecordNotFound({ label, backTo, backLabel }: { label: string; backTo: string; backLabel: string }) {
  return (
    <div className="p-6">
      <EmptyState
        icon={SearchX}
        title={`${label} not found`}
        description="It may have been deleted."
        action={
          <Button asChild variant="outline">
            <Link to={backTo}>{backLabel}</Link>
          </Button>
        }
      />
    </div>
  );
}
