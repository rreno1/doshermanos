export type ManualReservationCustomerValues = {
  name: string;
  contact: string;
};

type ManualCustomerField = keyof ManualReservationCustomerValues;

export type ManualReservationCustomerValidation = {
  value: ManualReservationCustomerValues | null;
  errors: Partial<Record<ManualCustomerField, string>>;
};

export function validateManualReservationCustomer(
  customer: ManualReservationCustomerValues,
): ManualReservationCustomerValidation {
  const name = customer.name.trim();
  const contact = customer.contact.trim();
  const errors: ManualReservationCustomerValidation['errors'] = {};

  if (name.length === 0) {
    errors.name = 'Enter the customer name.';
  } else if (name.length > 100) {
    errors.name = 'Keep the customer name within 100 characters.';
  }

  if (contact.length === 0) {
    errors.contact = 'Enter a phone number or other contact detail.';
  } else if (contact.length > 200) {
    errors.contact = 'Keep the contact detail within 200 characters.';
  }

  if (Object.keys(errors).length > 0) {
    return { value: null, errors };
  }

  return {
    value: { name, contact },
    errors: {},
  };
}
