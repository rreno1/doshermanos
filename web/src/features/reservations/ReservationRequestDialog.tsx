import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthProvider';
import type { CateringPackage } from '../packages/package.types';
import { createReservationRequest } from './reservation.service';
import {
  validateReservationForm,
  type ReservationFormValues,
} from './reservation.validation';
import './reservations.css';

type ReservationRequestDialogProps = {
  cateringPackage: CateringPackage | null;
  onClose: () => void;
};

const emptyForm: ReservationFormValues = {
  startDate: '',
  endDate: '',
  location: '',
  guestCount: '',
  serviceRequirements: '',
};

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function ReservationRequestDialog({
  cateringPackage,
  onClose,
}: ReservationRequestDialogProps) {
  const { authState } = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<ReservationFormValues>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ReservationFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (cateringPackage && dialog && !dialog.open) {
      setForm(emptyForm);
      setErrors({});
      setSubmitMessage(null);
      setIsComplete(false);
      dialog.showModal();
    }

    if (!cateringPackage && dialog?.open) {
      dialog.close();
    }
  }, [cateringPackage]);

  function updateField(field: keyof ReservationFormValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cateringPackage) {
      return;
    }

    if (authState.status !== 'active' || authState.profile?.role !== 'customer') {
      setSubmitMessage('Sign in with an active customer account before sending a reservation request.');
      return;
    }

    const validation = validateReservationForm(form);
    setErrors(validation.errors);

    if (!validation.value) {
      setSubmitMessage('Check the highlighted fields and try again.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      await createReservationRequest(
        authState.profile.id,
        cateringPackage,
        validation.value,
      );
      setIsComplete(true);
      setSubmitMessage('Reservation request sent. Dos Hermanos still needs to review and confirm it.');
    } catch {
      setSubmitMessage('We could not send your reservation request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const canRequest = authState.status === 'active' && authState.profile?.role === 'customer';

  return (
    <dialog
      ref={dialogRef}
      className="reservation-dialog"
      onCancel={(event) => {
        event.preventDefault();
        if (!isSubmitting) {
          onClose();
        }
      }}
      onClose={onClose}
      aria-labelledby="reservation-dialog-title"
    >
      {cateringPackage ? (
        <div className="reservation-dialog-content">
          <div className="reservation-dialog-heading">
            <div>
              <p className="eyebrow">Reservation request</p>
              <h2 id="reservation-dialog-title">{cateringPackage.name}</h2>
              <p>
                Starting at {pesoFormatter.format(cateringPackage.priceInCentavos / 100)}.
                Final details remain subject to review.
              </p>
            </div>
            <button
              className="quiet-button"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Close
            </button>
          </div>

          {!canRequest ? (
            <div className="reservation-access-note" role="status">
              {authState.status === 'loading'
                ? 'Checking your account…'
                : 'Sign in from Account in the header with an active customer account to request this package.'}
            </div>
          ) : isComplete ? (
            <div className="reservation-success" role="status">
              <strong>Request received.</strong>
              <p>{submitMessage}</p>
              <button className="primary-button" type="button" onClick={onClose}>
                Done
              </button>
            </div>
          ) : (
            <form className="reservation-form" onSubmit={handleSubmit} noValidate>
              <div className="reservation-form-grid">
                <label>
                  <span>Start date</span>
                  <input
                    type="date"
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
                <span>Service requirements <em>Optional</em></span>
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
                Sending this form creates a request only. It does not reserve or confirm the event automatically.
              </p>

              {submitMessage ? <p className="reservation-submit-message" role="alert">{submitMessage}</p> : null}

              <button className="primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending request…' : 'Send reservation request'}
              </button>
            </form>
          )}
        </div>
      ) : null}
    </dialog>
  );
}
