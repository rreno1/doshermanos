import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { subscribeToOwnReservations } from './reservation.service';
import type { ReservationRecord, ReservationStatus } from './reservation.types';
import './reservations.css';

type ReservationListState =
  | { status: 'loading'; reservations: ReservationRecord[] }
  | { status: 'ready'; reservations: ReservationRecord[] }
  | { status: 'error'; reservations: ReservationRecord[] };

const statusLabels: Record<ReservationStatus, string> = {
  pending_review: 'Pending review',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

const eventDateFormatter = new Intl.DateTimeFormat('en-PH', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

const sentDateFormatter = new Intl.DateTimeFormat('en-PH', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

function formatEventDates(reservation: ReservationRecord): string {
  const startDate = reservation.event.startDate;
  const endDate = reservation.event.endDate;
  const startLabel = eventDateFormatter.format(startDate);

  if (startDate.getTime() === endDate.getTime()) {
    return startLabel;
  }

  return `${startLabel} to ${eventDateFormatter.format(endDate)}`;
}

export function MyReservations() {
  const { authState } = useAuth();
  const [listState, setListState] = useState<ReservationListState>({
    status: 'loading',
    reservations: [],
  });

  const customerId =
    authState.status === 'active' && authState.profile?.role === 'customer'
      ? authState.profile.id
      : null;

  useEffect(() => {
    if (!customerId) {
      setListState({ status: 'loading', reservations: [] });
      return;
    }

    setListState({ status: 'loading', reservations: [] });

    return subscribeToOwnReservations(
      customerId,
      (reservations) => {
        setListState({ status: 'ready', reservations });
      },
      () => {
        setListState({ status: 'error', reservations: [] });
      },
    );
  }, [customerId]);

  if (!customerId) {
    return null;
  }

  return (
    <section
      className="my-reservations"
      id="my-reservations"
      aria-labelledby="my-reservations-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">My requests</p>
          <h2 id="my-reservations-title">Track your events.</h2>
        </div>
        <p>Your latest reservation requests appear here as Dos Hermanos reviews them.</p>
      </div>

      {listState.status === 'loading' ? (
        <div className="catalog-status" role="status">
          Loading your reservation requests…
        </div>
      ) : null}

      {listState.status === 'error' ? (
        <div className="catalog-status catalog-error" role="alert">
          We could not load your reservation requests right now.
        </div>
      ) : null}

      {listState.status === 'ready' && listState.reservations.length === 0 ? (
        <div className="catalog-status">
          You have no reservation requests yet. Choose a package above when you are ready.
        </div>
      ) : null}

      {listState.status === 'ready' && listState.reservations.length > 0 ? (
        <div className="reservation-list">
          {listState.reservations.map((reservation) => (
            <article className="reservation-row" key={reservation.id}>
              <div>
                <div className="reservation-row-heading">
                  <h3>{reservation.package.packageName}</h3>
                  <span className={`reservation-status reservation-status-${reservation.status}`}>
                    {statusLabels[reservation.status]}
                  </span>
                </div>
                <p>
                  {formatEventDates(reservation)} ·{' '}
                  {reservation.event.guestCount.toLocaleString('en-PH')} guests
                </p>
                <p>{reservation.event.location}</p>
                {reservation.event.serviceRequirements ? (
                  <p className="reservation-requirements">
                    {reservation.event.serviceRequirements}
                  </p>
                ) : null}
              </div>
              <time dateTime={reservation.createdAt.toISOString()}>
                Sent {sentDateFormatter.format(reservation.createdAt)}
              </time>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
