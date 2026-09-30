import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/** The flow's choices, in order. Each lives in the URL so back/forward and deep links work. */
export const CHOICES = ["service", "staff", "date", "time"] as const;
export type Choice = (typeof CHOICES)[number];

const positiveInt = (value: string | null) => {
  const n = Number(value);
  return value && Number.isInteger(n) && n >= 0 ? n : undefined;
};

export function useBookingParams() {
  const [params, setParams] = useSearchParams();

  /** Sets one choice and drops every later one: picking a new staff member clears date and time. */
  const choose = useCallback(
    (key: Choice, value: string | number) => {
      const next = new URLSearchParams();
      for (const k of CHOICES.slice(0, CHOICES.indexOf(key))) {
        const v = params.get(k);
        if (v) next.set(k, v);
      }
      next.set(key, String(value));
      setParams(next);
    },
    [params, setParams],
  );

  /** Clears a choice and every later one, i.e. goes back to that step. */
  const clearFrom = useCallback(
    (key: Choice) => {
      const next = new URLSearchParams();
      for (const k of CHOICES.slice(0, CHOICES.indexOf(key))) {
        const v = params.get(k);
        if (v) next.set(k, v);
      }
      setParams(next);
    },
    [params, setParams],
  );

  const date = params.get("date");
  return {
    serviceId: positiveInt(params.get("service")),
    staffId: positiveInt(params.get("staff")),
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
    time: positiveInt(params.get("time")),
    choose,
    clearFrom,
  };
}
