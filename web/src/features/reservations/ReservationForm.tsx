import { useState, type FormEvent, type ReactNode } from 'react';
import type { CateringPackage } from '../packages/package.types';
import type { ReservationRequestInput } from './reservation.types';
import {
  validateReservationForm,
  type ReservationFormValues,
} from './reservation.validation';

const emptyForm: ReservationFormValues = {
  startDate: '',
  endDate: '',
  location: '',
  guestCount: '',
  serviceRequirements: '',
  menuRequest: '',
  foodQuantityRequest: '',
  supplyRequest: '',
};

type ReservationFormProps = {
  cateringPackage: CateringPackage;
  onSubmitRequest: (input: ReservationRequestInput) => Promise<void>;
  onSubmitted: () => void;
  leadingFields?: ReactNode;
  beforeSubmit?: () => boolean;
  submitLabel?: string;
  submittingLabel?: string;
  failureMessage?: string;
};

export function ReservationForm({
  cateringPackage,
  onSubmitRequest,
  onSubmitted,
  leadingFields,
  beforeSubmit,
  submitLabel = 'Send reservation request',
  submittingLabel = 'Sending request…',
  failureMessage = 'We could not send your reservation request. Please try again.',
}: ReservationFormProps) {
  const [form, setForm] = useState<ReservationFormValues>(emptyForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ReservationFormValues, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const minimumDate = todayDateOnly();

  function updateField(field: keyof ReservationFormValues, value: string) {
    setForm((current) => {
      if (field === 'startDate' && current.endDate && value > current.endDate) {
        return { ...current, startDate: value, endDate: value };
      }

      return { ...current, [field]: value };
    });
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateReservationForm(form);
    setErrors(validation.errors);
    const leadingFieldsValid = beforeSubmit ? beforeSubmit() : true;

    if (!validation.value || !leadingFieldsValid) {
      setSubmitMessage('Check the highlighted fields and try again.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      await onSubmitRequest(validation.value);
      onSubmitted();
    } catch {
      setSubmitMessage(failureMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="reservation-form" onSubmit={handleSubmit} noValidate>
      {leadingFields}

      <div className="reservation-form-grid">
        <label>
          <span>Start date</span>
          <input
            type="date"
            min={minimumDate}
            value={form.startDate}
            onChange={(event) => updateField('startDate', event.target.value)}
            aria-invalid={Boolean(errors.startDate)}
          />
          {errors.startDate ? <small>{errors.startDate}</small> : null}
        </label>

        <label>
          <span>End date</span>
          <input
            type="date"
            min={form.startDate || minimumDate}
            value={form.endDate}
            onChange={(event) => updateField('endDate', event.target.value)}
            aria-invalid={Boolean(errors.endDate)}
          />
          {errors.endDate ? <small>{errors.endDate}</small> : null}
        </label>
      </div>

      <label>
        <span>Event location</span>
        <input
          type="text"
          value={form.location}
          onChange={(event) => updateField('location', event.target.value)}
          maxLength={300}
          autoComplete="street-address"
          placeholder="Venue or complete event location"
          aria-invalid={Boolean(errors.location)}
        />
        {errors.location ? <small>{errors.location}</small> : null}
      </label>

      <label>
        <span>Guest count</span>
        <input
          type="number"
          value={form.guestCount}
          onChange={(event) => updateField('guestCount', event.target.value)}
          min="1"
          max="10000"
          inputMode="numeric"
          placeholder="Expected number of guests"
          aria-invalid={Boolean(errors.guestCount)}
        />
        {errors.guestCount ? <small>{errors.guestCount}</small> : null}
      </label>

      <label>
        <span>
          Requested menu choices or changes <em>Optional</em>
        </span>
        <textarea
          value={form.menuRequest}
          onChange={(event) => updateField('menuRequest', event.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Menu choices, substitutions, or additions you want Dos Hermanos to review"
          aria-invalid={Boolean(errors.menuRequest)}
        />
        {errors.menuRequest ? <small>{errors.menuRequest}</small> : null}
      </label>

      <label>
        <span>
          Food quantity requirements <em>Optional</em>
        </span>
        <textarea
          value={form.foodQuantityRequest}
          onChange={(event) => updateField('foodQuantityRequest', event.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Serving or food quantity adjustments that need review"
          aria-invalid={Boolean(errors.foodQuantityRequest)}
        />
        {errors.foodQuantityRequest ? <small>{errors.foodQuantityRequest}</small> : null}
      </label>

      <label>
        <span>
          Needed supplies <em>Optional</em>
        </span>
        <textarea
          value={form.supplyRequest}
          onChange={(event) => updateField('supplyRequest', event.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Serving supplies, tables, linens, or other event supplies to review"
          aria-invalid={Boolean(errors.supplyRequest)}
        />
        {errors.supplyRequest ? <small>{errors.supplyRequest}</small> : null}
      </label>

      <label>
        <span>
          Service requirements <em>Optional</em>
        </span>
        <textarea
          value={form.serviceRequirements}
          onChange={(event) => updateField('serviceRequirements', event.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Setup, service, dietary, or other event requirements"
          aria-invalid={Boolean(errors.serviceRequirements)}
        />
        {errors.serviceRequirements ? <small>{errors.serviceRequirements}</small> : null}
      </label>

      <p className="reservation-form-note">
        Customization details are requests for review. The package amount shown in the catalog is the base package price, not an approved customized total. Final menu, quantities, supplies, pricing, and event confirmation remain subject to Dos Hermanos review.
      </p>

      {submitMessage ? (
        <p className="reservation-submit-message" role="alert">
          {submitMessage}
        </p>
      ) : null}

      <button className="primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}

function todayDateOnly() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
