import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

export const ISO = "yyyy-MM-dd";

export function today(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function todayISO(): string {
  return format(today(), ISO);
}

export function iso(date: Date): string {
  return format(date, ISO);
}

export function shift(days: number): string {
  return iso(addDays(today(), days));
}

export function pretty(dateISO: string): string {
  return format(parseISO(dateISO), "dd MMM yyyy");
}

export function daysUntil(dateISO: string): number {
  return differenceInCalendarDays(parseISO(dateISO), today());
}

/** Inclusive-start, exclusive-end overlap test on ISO date strings. */
export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}
