import { createContext } from "react";

export type BrandingContextValue = {
  /** Company name from Settings, or the app name until one is set. */
  name: string;
  logoUrl: string | null;
  /** The saved company name, without the fallback (for the settings form). */
  companyName: string | null;
  /** Booking page intro as saved; null until an admin writes one. */
  bookingIntro: string | null;
  /** IANA zone the availability and bookings are in ("UTC" until set). */
  timezone: string;
  /** False until the first load finishes, so forms don't fill with placeholders. */
  loaded: boolean;
  reload: () => void;
};

export const BrandingContext = createContext<BrandingContextValue | null>(null);
