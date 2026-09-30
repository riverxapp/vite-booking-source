import { createContext } from "react";

export type BrandingContextValue = {
  /** Company name from Settings, or the app name until one is set. */
  name: string;
  logoUrl: string | null;
  /** The saved company name, without the fallback (for the settings form). */
  companyName: string | null;
  /** Portal dashboard intro as saved; null until an admin writes one. */
  portalIntro: string | null;
  reload: () => void;
};

export const BrandingContext = createContext<BrandingContextValue | null>(null);
