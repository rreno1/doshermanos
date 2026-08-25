import { useEffect, useState } from 'react';
import { StaffPaymentLinkCard } from './PaymentLinkCards';
import { PaymentRecordDialog } from './PaymentRecordDialog';
import {
  subscribeToPayableReservations,
  subscribeToRecentPayments,
} from './payment.service';
import type { PaymentRecord, PaymentReservation } from './payment.types';
import './payments.css';

type PaymentsPanelProps = {
  staffId: string;
  staffName: string;
};

export function PaymentsPanel({ staffId, staffName }: PaymentsPanelProps) {
  const [reservations, setReservations] = useState<PaymentReservation[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(true);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [reservationError, setReservationError] = useState(false);
  const [paymentError, setPaymentError] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<PaymentReservation | null>(null);

  useEffect(() => {
    setIsLoadingReservations(true);
    setReservationError(false);

    return subscribeToPayableReservations(
      (nextReservations) => {
        setReservations(nextReservations);
        setIsLoadingReservations(false);
      },
      () => {
        setReservationError(true);
        setIsLoadingReservations(false);
      },
    );
  }, []);

  useEffect(() => {
    setIsLoadingPayments(true);
    setPaymentError(false);

    return subscribeToRecentPayments(
      (nextPayments) => {
        setPayments(nextPayments);
        setIsLoadingPayments(false);
      },
      () => {
        setPaymentError(true);
        setIsLoadingPayments(false);
      },
    );
  }, []);

  return (
    <section className="payments-section" id="payments" aria-label="Payments">
      <StaffPaymentLinkCard />

      <div className="payments-layout">
        <div className="payments-main-column">
          <div className="payments-subheading">
            <h3>Reservations</h3>
            <span>{reservations.length} shown</span>
          </div>
          {renderReservationList()}
        </div>

        <aside className="payments-activity" aria-labelledby="payments-activity-title">
          <div className="payments-subheading">
            <h3 id="payments-activity-title">Recent payments</h3>
            <span>Latest 50</span>
          </div>
          {renderPaymentList()}
        </aside>
      </div>

      <PaymentRecordDialog
        reservation={selectedReservation}
        recordedBy={staffId}
        recordedByName={staffName}
        onClose={() => setSelectedReservation(null)}
      />
    </section>
  );

  function renderReservationList() {
    if (isLoadingReservations) {
      return <PaymentStatusBox message="Loading reservations…" />;
    }

    if (reservationError) {
      return <PaymentStatusBox message="Reservations could not be loaded." error />;
    }

    if (reservations.length === 0) {
      return <PaymentStatusBox message="No reservations are ready for payment recording." />;
    }

    return (
      <div className="payment-reservation-list">
        {reservations.map((reservation) => (
          <article key={reservation.id} className="payment-reservation-row">
            <div className="payment-reservation-main">
              <strong>{reservation.packageName}</strong>
              <span>{formatEventDate(reservation.eventStartDate)}</span>
            </div>
            <div className="payment-reservation-meta">
              <span>{formatReservationStatus(reservation.status)}</span>
              <span>{formatMoney(reservation.packageBasePriceInCentavos)}</span>
            </div>
            <button
              type="button"
              className="payment-secondary-button"
              onClick={() => setSelectedReservation(reservation)}
            >
              Record cash
            </button>
          </article>
        ))}
      </div>
    );
  }

  function renderPaymentList() {
    if (isLoadingPayments) {
      return <PaymentStatusBox message="Loading payments…" compact />;
    }

    if (paymentError) {
      return <PaymentStatusBox message="Recent payments could not be loaded." error compact />;
    }

    if (payments.length === 0) {
      return <PaymentStatusBox message="No payments recorded yet." compact />;
    }

    return (
      <ol className="payment-history-list">
        {payments.map((payment) => (
          <li key={payment.id} className="payment-history-entry">
            <div className="payment-history-heading">
              <strong>{formatMoney(payment.amountInCentavos)}</strong>
              <span>Cash</span>
            </div>
            <span className="payment-history-package">{payment.packageName}</span>
            <div className="payment-history-meta">
              <span>{payment.recordedByName}</span>
              <time dateTime={payment.createdAt.toISOString()}>
                {formatPaymentTime(payment.createdAt)}
              </time>
            </div>
            {payment.reference ? <p>Reference: {payment.reference}</p> : null}
            {payment.note ? <p>{payment.note}</p> : null}
          </li>
        ))}
      </ol>
    );
  }
}

function PaymentStatusBox({
  message,
  error = false,
  compact = false,
}: {
  message: string;
  error?: boolean;
  compact?: boolean;
}) {
  const className = [
    'payment-status-box',
    error ? 'payment-status-box-error' : '',
    compact ? 'payment-status-box-compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} role={error ? 'alert' : 'status'}>
      {message}
    </div>
  );
}

function formatMoney(amountInCentavos: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amountInCentavos / 100);
}

function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatPaymentTime(date: Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatReservationStatus(status: PaymentReservation['status']): string {
  if (status === 'pending_review') {
    return 'Pending review';
  }

  if (status === 'confirmed') {
    return 'Confirmed';
  }

  return 'Completed';
}
