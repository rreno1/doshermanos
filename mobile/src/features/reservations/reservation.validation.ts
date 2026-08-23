import type { ReservationRequestInput } from './reservation.types';

export type ReservationFormValues = {
  startDate: string;
  endDate: string;
  location: string;
  guestCount: string;
  serviceRequirements: string;
};

export type ReservationValidationResult = {
  value: ReservationRequestInput | null;
  message: string | null;
};

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function todayDateOnly(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function validateReservationForm(
  form: ReservationFormValues,
): ReservationValidationResult {
  const location = form.location.trim();
  const serviceRequirements = form.serviceRequirements.trim();
  const guestCount = Number(form.guestCount);

  if (!isValidDateOnly(form.startDate) || !isValidDateOnly(form.endDate)) {
    return { value: null, message: 'Choose valid event dates.' };
  }

  if (form.startDate < todayDateOnly()) {
    return { value: null, message: 'The event start date cannot be in the past.' };
  }

  if (form.endDate < form.startDate) {
    return { value: null, message: 'The end date cannot be before the start date.' };
  }

  if (location.length === 0 || location.length > 300) {
    return { value: null, message: 'Enter an event location within 300 characters.' };
  }

  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 10000) {
    return { value: null, message: 'Enter a guest count from 1 to 10,000.' };
  }

  if (serviceRequirements.length > 1000) {
    return { value: null, message: 'Keep service requirements within 1,000 characters.' };
  }

  return {
    value: {
      startDate: form.startDate,
      endDate: form.endDate,
      location,
      guestCount,
      serviceRequirements,
    },
    message: null,
  };
}
