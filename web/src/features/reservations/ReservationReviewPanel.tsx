import { useEffect, useState } from 'react';
import {
  rejectReservation,
  subscribeToPendingReservations,
} from './reservation.service';
import type { ReservationRecord } from './reservation.types';
import './reservations.css';

type ReservationReviewPanelProps = {
  staffId: string;
  staffName: string;
};

export function ReservationReviewPanel({ staffId, staffName }: ReservationReviewPanelProps) {
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [busyReservationId, setBusyReservationId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    return subscribeToPendingReservations(
      (nextReservations) => {
        setReservations(nextReservations);
        setIsLoading(false);
      },
      () => {
        setReservations([]);
        setHasError(true);
        setIsLoading(false);
      },
    );
  }, []);

  return (
    <section className="reservation-review-section" id="reservation-review" aria-labelledby="reservation-review-title">
      <div className="reservation-review-heading">
        <div>
          <p className="reservation-review-kicker">Reservation review</p>
          <h2 id="reservation-review-title">Pending requests</h2>
          <p>
            Review submitted event and customization details before taking an operational decision.
            Rejection is available now; confirmation remains intentionally gated until the
            simultaneous-event capacity and authoritative customization rules are approved.
          </p>
        </div>
        <span className="reservation-review-count">{reservations.length} shown · up to 50</span>
      </div>

      <div className="reservation-capacity-note" role="status">
        Overlapping events are allowed in principle, and customization requests do not establish a
        final menu, quantity, supply allocation, or price. Confirmation will be enabled only when
        the approved capacity and package-calculation rules can be enforced consistently.
      </div>

      {actionError ? <div className="reservation-review-error" role="alert">{actionError}</div> : null}
      {renderContent()}
    </section>
  );

  function renderContent() {
    if (isLoading) {
      return <ReservationReviewStatus message="Loading pending reservation requests…" />;
    }

    if (hasError) {
      return <ReservationReviewStatus message="Pending reservation requests could not be loaded." error />;
    }

    if (reservations.length === 0) {
      return <ReservationReviewStatus message="There are no pending reservation requests in the current view." />;
    }

    return (
      <div className="reservation-review-list">
        {reservations.map((reservation) => {
          const isBusy = busyReservationId === reservation.id;

          return (
            <article key={reservation.id} className="reservation-review-row">
              <div className="reservation-review-main">
                <div className="reservation-review-row-heading">
                  <strong>{reservation.package.packageName}</strong>
                  <span>Pending review</span>
                </div>
                <p>{formatEventRange(reservation.event.startDate, reservation.event.endDate)}</p>
                <dl className="reservation-review-details">
                  <div>
                    <dt>Location</dt>
                    <dd>{reservation.event.location}</dd>
                  </div>
                  <div>
                    <dt>Guests</dt>
                    <dd>{reservation.event.guestCount.toLocaleString('en-PH')}</dd>
                  </div>
                  <div>
                    <dt>Package base</dt>
                    <dd>{formatMoney(reservation.package.priceInCentavos)}</dd>
                  </div>
                  <div>
                    <dt>Submitted</dt>
                    <dd>{formatSubmittedTime(reservation.createdAt)}</dd>
                  </div>
                </dl>
                {reservation.customization.menuRequest ? (
                  <p className="reservation-review-requirements">
                    <strong>Menu request:</strong> {reservation.customization.menuRequest}
                  </p>
                ) : null}
                {reservation.customization.foodQuantityRequest ? (
                  <p className="reservation-review-requirements">
                    <strong>Food quantity request:</strong>{' '}
                    {reservation.customization.foodQuantityRequest}
                  </p>
                ) : null}
                {reservation.customization.supplyRequest ? (
                  <p className="reservation-review-requirements">
                    <strong>Supply request:</strong> {reservation.customization.supplyRequest}
                  </p>
                ) : null}
                {reservation.event.serviceRequirements ? (
                  <p className="reservation-review-requirements">
                    <strong>Service requirements:</strong> {reservation.event.serviceRequirements}
                  </p>
                ) : null}
              </div>

              <div className="reservation-review-actions">
                <button type="button" disabled title="Confirmation requires approved capacity and customization rules">
                  Confirm unavailable
                </button>
                <button
                  type="button"
                  className="reservation-reject-button"
                  disabled={isBusy}
                  onClick={() => handleReject(reservation)}
                >
                  {isBusy ? 'Rejecting…' : 'Reject request'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  async function handleReject(reservation: ReservationRecord) {
    const shouldReject = window.confirm(
      `Reject the ${reservation.package.packageName} request for ${formatEventRange(reservation.event.startDate, reservation.event.endDate)}?`,
    );

    if (!shouldReject) {
      return;
    }

    setBusyReservationId(reservation.id);
    setActionError(null);

    try {
      await rejectReservation(reservation.id, staffId, staffName);
    } catch {
      setActionError('The reservation could not be rejected. Refresh the request list and try again.');
    } finally {
      setBusyReservationId(null);
    }
  }
}

function ReservationReviewStatus({ message, error = false }: { message: string; error?: boolean }) {
  return (
    <div className={error ? 'reservation-review-status reservation-review-status-error' : 'reservation-review-status'} role={error ? 'alert' : 'status'}>
      {message}
    </div>
  );
}

function formatEventRange(startDate: Date, endDate: Date): string {
  const formatter = new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const start = formatter.format(startDate);
  const end = formatter.format(endDate);

  return start === end ? start : `${start} – ${end}`;
}

function formatMoney(amountInCentavos: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amountInCentavos / 100);
}

function formatSubmittedTime(date: Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
