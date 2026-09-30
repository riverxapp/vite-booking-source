import { Outlet } from "react-router-dom";
import { DatabaseSetup } from "@/components/common/States";
import { isDatabaseConfigured } from "@/db/client";

/** Data pages render only once a database is connected. */
export function DatabaseGate() {
  return isDatabaseConfigured ? <Outlet /> : <DatabaseSetup />;
}
