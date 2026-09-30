import { apiRequest } from "@/lib/api";

/** Public booking calls (server/booking.ts). No login: customers book as guests. */

export type PublicService = { id: number; name: string; description: string | null; durationMinutes: number; priceCents: number };
export type PublicStaff = { id: number; name: string };
/** A date in the booking window with its free start times (minutes from midnight), possibly none. */
export type BookableDay = { date: string; times: number[] };
export type Slots = { timezone: string; days: BookableDay[] };

export type BookingInput = {
  serviceId: number;
  staffId: number;
  date: string;
  startMinute: number;
  name: string;
  email: string;
  phone: string;
  notes?: string;
};

export type ConfirmedBooking = {
  reference: string;
  serviceName: string;
  staffName: string;
  date: string;
  startMinute: number;
  endMinute: number;
  durationMinutes: number;
  priceCents: number;
  customerName: string;
  email: string;
  timezone: string;
};

export async function listServices() {
  const { services } = await apiRequest<{ services: PublicService[] }>("booking/services");
  return services;
}

export async function listStaffFor(serviceId: number) {
  const { staff } = await apiRequest<{ staff: PublicStaff[] }>(`booking/staff?service=${serviceId}`);
  return staff;
}

export async function getSlots(serviceId: number, staffId: number) {
  return apiRequest<Slots>(`booking/slots?service=${serviceId}&staff=${staffId}`);
}

/** Rejects with status 409 when the slot was taken in the meantime. */
export async function createBooking(input: BookingInput) {
  return apiRequest<{ booking: ConfirmedBooking; emailSent: boolean }>("booking/bookings", { method: "POST", body: input });
}
