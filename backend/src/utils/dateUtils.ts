import { addBusinessDays as dateFnsAddBusinessDays } from 'date-fns';

export function addBusinessDays(date: Date, days: number): Date {
  return dateFnsAddBusinessDays(date, days);
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function todayISO(): string {
  return toISODate(new Date());
}
