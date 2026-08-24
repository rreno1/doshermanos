import type { CashPaymentInput } from './payment.types';

type ValidationResult<T> =
  | { value: T; message: null }
  | { value: null; message: string };

export function validateCashPayment(
  amount: string,
  reference: string,
  note: string,
): ValidationResult<CashPaymentInput> {
  const amountInCentavos = parsePesoAmount(amount);
  const cleanReference = reference.trim();
  const cleanNote = note.trim();

  if (amountInCentavos === null || amountInCentavos <= 0) {
    return invalid('Enter a payment amount greater than zero.');
  }

  if (amountInCentavos > 100000000) {
    return invalid('Payment amount is too large.');
  }

  if (cleanReference.length > 120) {
    return invalid('Reference must be 120 characters or fewer.');
  }

  if (cleanNote.length > 300) {
    return invalid('Internal note must be 300 characters or fewer.');
  }

  return {
    value: {
      amountInCentavos,
      reference: cleanReference,
      note: cleanNote,
    },
    message: null,
  };
}

function parsePesoAmount(value: string): number | null {
  const cleanValue = value.trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(cleanValue)) {
    return null;
  }

  const [pesoPart, centavoPart = ''] = cleanValue.split('.');
  const pesos = Number(pesoPart);
  const centavos = Number(centavoPart.padEnd(2, '0'));

  if (!Number.isSafeInteger(pesos) || !Number.isSafeInteger(centavos)) {
    return null;
  }

  const total = pesos * 100 + centavos;
  return Number.isSafeInteger(total) ? total : null;
}

function invalid<T>(message: string): ValidationResult<T> {
  return { value: null, message };
}
