import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { helpdeskConfig } from "@/config/helpdesk";
import { fetchBranding, type Branding } from "./api";
import { BrandingContext } from "./context";

// Only a component is exported here so React Fast Refresh can hot-swap it.
export function BrandingProviderRoot({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>({ companyName: null, logoUrl: null, portalIntro: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    // Branding is decoration: if it can't load, the app name stands in.
    fetchBranding().then(setBranding, () => undefined);
  }, [version]);

  const name = branding.companyName || helpdeskConfig.appName;
  useEffect(() => {
    document.title = name;
  }, [name]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const value = useMemo(
    () => ({ name, logoUrl: branding.logoUrl, companyName: branding.companyName, portalIntro: branding.portalIntro, reload }),
    [name, branding, reload],
  );
  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}
