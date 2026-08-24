import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  createPaymentId,
  getPaymentErrorMessage,
  recordCashPayment,
} from './payment.service';
import type { PaymentReservation } from './payment.types';
import { validateCashPayment } from './payment.validation';

type PaymentRecordDialogProps = {
  reservation: PaymentReservation | null;
  recordedBy: string;
  recordedByName: string;
  onClose: () => void;
};

export function PaymentRecordDialog({
  reservation,
  recordedBy,
  recordedByName,
  onClose,
}: PaymentRecordDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (reservation && !dialog?.open) {
      dialog?.showModal();
    }

    if (!reservation && dialog?.open) {
      dialog.close();
    }
  }, [reservation]);

  return (
    <dialog
      ref={dialogRef}
      className="payment-dialog"
      aria-labelledby="payment-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      {reservation ? (
        <CashPaymentForm
          key={reservation.id}
          reservation={reservation}
          recordedBy={recordedBy}
          recordedByName={recordedByName}
          onClose={onClose}
        />
      ) : null}
    </dialog>
  );
}

function CashPaymentForm({
  reservation,
  recordedBy,
  recordedByName,
  onClose,
}: {
  reservation: PaymentReservation;
  recordedBy: string;
  recordedByName: string;
  onClose: () => void;
}) {
  const [paymentOperationId] = useState(() => createPaymentId());
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const validation = validateCashPayment(amount, reference, note);

    if (!validation.value) {
      setMessage(validation.message);
      return;
    }

    setIsSaving(true);

    try {
      await recordCashPayment(
        paymentOperationId,
        reservation.id,
        validation.value,
        recordedBy,
        recordedByName,
      );
      onClose();
    } catch (error) {
      setMessage(getPaymentErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="payment-dialog-panel" onSubmit={handleSubmit}>
      <div className="payment-dialog-heading">
        <div>
          <p className="payment-kicker">Record payment</p>
          <h3 id="payment-dialog-title">Cash received</h3>
          <p className="payment-dialog-copy">
            {reservation.packageName} · {formatEventDate(reservation.eventStartDate)}
          </p>
        </div>
        <button
          className="payment-close-button"
          type="button"
          aria-label="Close payment form"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <label className="payment-field">
        <span>Amount received</span>
        <div className="payment-money-input">
          <span aria-hidden="true">₱</span>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            autoFocus
            required
          />
        </div>
      </label>

      <label className="payment-field">
        <span>Receipt or reference</span>
        <input
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          maxLength={120}
          placeholder="Optional receipt or reference number"
        />
      </label>

      <label className="payment-field">
        <span>Internal note</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Optional staff-only context"
        />
        <small>This note is not included in the customer payment receipt.</small>
      </label>

      <div className="payment-policy-note">
        This records money received. It does not confirm the reservation, calculate a final balance,
        or trigger an online payment.
      </div>

      {message ? (
        <div className="payment-message payment-message-error" role="alert">
          {message}
        </div>
      ) : null}

      <div className="payment-dialog-actions">
        <button type="button" className="payment-secondary-button" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="payment-primary-button" disabled={isSaving}>
          {isSaving ? 'Recording…' : 'Record cash payment'}
        </button>
      </div>
    </form>
  );
}

function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
