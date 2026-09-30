import { useContext } from "react";
import { BrandingContext } from "./context";

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error("useBranding must be used inside BrandingProviderRoot");
  return ctx;
}
