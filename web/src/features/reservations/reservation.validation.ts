import type { ReservationRequestInput } from './reservation.types';

export type ReservationFormValues = {
  startDate: string;
  endDate: string;
  location: string;
  guestCount: string;
  serviceRequirements: string;
};

type ReservationField = keyof ReservationFormValues;

export type ReservationValidationResult = {
  value: ReservationRequestInput | null;
  errors: Partial<Record<ReservationField, string>>;
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

export function validateReservationForm(
  form: ReservationFormValues,
): ReservationValidationResult {
  const errors: ReservationValidationResult['errors'] = {};
  const location = form.location.trim();
  const serviceRequirements = form.serviceRequirements.trim();
  const guestCount = Number(form.guestCount);

  if (!isValidDateOnly(form.startDate)) {
    errors.startDate = 'Choose a valid event start date.';
  }

  if (!isValidDateOnly(form.endDate)) {
    errors.endDate = 'Choose a valid event end date.';
  } else if (isValidDateOnly(form.startDate) && form.endDate < form.startDate) {
    errors.endDate = 'The end date cannot be before the start date.';
  }

  if (location.length === 0) {
    errors.location = 'Enter the event location.';
  } else if (location.length > 300) {
    errors.location = 'Keep the event location within 300 characters.';
  }

  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 10000) {
    errors.guestCount = 'Enter a guest count from 1 to 10,000.';
  }

  if (serviceRequirements.length > 1000) {
    errors.serviceRequirements = 'Keep service requirements within 1,000 characters.';
  }

  if (Object.keys(errors).length > 0) {
    return { value: null, errors };
  }

  return {
    value: {
      startDate: form.startDate,
      endDate: form.endDate,
      location,
      guestCount,
      serviceRequirements,
    },
    errors: {},
  };
}
