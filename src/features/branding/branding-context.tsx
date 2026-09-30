import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { bookingConfig } from "@/config/booking";
import { fetchBranding, type Branding } from "./api";
import { BrandingContext } from "./context";

// Only a component is exported here so React Fast Refresh can hot-swap it.
export function BrandingProviderRoot({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>({ companyName: null, logoUrl: null, bookingIntro: null, timezone: "UTC" });
  const [loaded, setLoaded] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    // Branding is decoration: if it can't load, the app name stands in.
    fetchBranding()
      .then(setBranding, () => undefined)
      .finally(() => setLoaded(true));
  }, [version]);

  const name = branding.companyName || bookingConfig.appName;
  useEffect(() => {
    document.title = name;
  }, [name]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const value = useMemo(() => ({ name, ...branding, loaded, reload }), [name, branding, loaded, reload]);
  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}
