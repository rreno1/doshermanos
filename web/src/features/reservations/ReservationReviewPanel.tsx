import { useEffect, useMemo, useState } from 'react';
import {
  ManagementFilterField,
  ManagementPagination,
  ManagementTabs,
  ManagementToolbar,
  useManagementPage,
} from '../../app/ManagementControls';
import {
  rejectReservation,
  subscribeToPendingReservations,
} from './reservation.service';
import type { ReservationRecord } from './reservation.types';
import './reservations.css';

type ReservationSort = 'event' | 'submitted' | 'package' | 'guests';
type SortDirection = 'asc' | 'desc';

const tabs = [{ value: 'pending', label: 'Pending requests' }] as const;

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
  const [queryText, setQueryText] = useState('');
  const [sortBy, setSortBy] = useState<ReservationSort>('submitted');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  const visibleReservations = useMemo(
    () => filterReservations(reservations, queryText, sortBy, sortDirection),
    [reservations, queryText, sortBy, sortDirection],
  );
  const page = useManagementPage(
    visibleReservations,
    `${queryText}|${sortBy}|${sortDirection}`,
  );

  return (
    <section className="reservation-review-section" id="reservation-review" aria-label="Reservations">
      <ManagementTabs value="pending" options={[...tabs]} onChange={() => undefined} label="Reservation views" />

      <ManagementToolbar
        summary={[{ label: 'pending requests', value: reservations.length }]}
        searchValue={queryText}
        searchPlaceholder="Search pending requests"
        onSearchChange={setQueryText}
        filterContent={(
          <>
            <ManagementFilterField label="Sort by">
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as ReservationSort)}>
                <option value="submitted">Submitted date</option>
                <option value="event">Event date</option>
                <option value="package">Package</option>
                <option value="guests">Guest count</option>
              </select>
            </ManagementFilterField>
            <ManagementFilterField label="Direction">
              <select value={sortDirection} onChange={(event) => setSortDirection(event.target.value as SortDirection)}>
                <option value="asc">Ascending</option><option value="desc">Descending</option>
              </select>
            </ManagementFilterField>
            <button type="button" className="management-secondary-button" onClick={() => { setSortBy('submitted'); setSortDirection('desc'); }}>
              Reset sort
            </button>
          </>
        )}
      />

      <div className="management-info-note" role="status">
        Confirmation stays disabled until approved event-capacity and customization-pricing rules are available.
      </div>

      {actionError ? <div className="reservation-review-error" role="alert">{actionError}</div> : null}
      {renderContent()}
    </section>
  );

  function renderContent() {
    if (isLoading) return <ReservationReviewStatus message="Loading pending requests…" />;
    if (hasError) return <ReservationReviewStatus message="Pending requests could not be loaded." error />;
    if (visibleReservations.length === 0) {
      return <ReservationReviewStatus message={reservations.length === 0 ? 'No pending reservation requests.' : 'No pending requests match the current search.'} />;
    }

    return (
      <>
        <div className="management-table-wrap">
          <table className="management-table">
            <thead>
              <tr>
                <th scope="col">Package</th>
                <th scope="col">Event</th>
                <th scope="col">Location</th>
                <th scope="col">Guests</th>
                <th scope="col">Package base</th>
                <th scope="col">Requests</th>
                <th scope="col">Submitted</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {page.pageItems.map((reservation) => {
                const isBusy = busyReservationId === reservation.id;
                return (
                  <tr key={reservation.id}>
                    <td><div className="management-table-primary"><strong>{reservation.package.packageName}</strong><span><span className="management-status-badge management-status-badge-warn">Pending review</span></span></div></td>
                    <td>{formatEventRange(reservation.event.startDate, reservation.event.endDate)}</td>
                    <td>{reservation.event.location}</td>
                    <td>{reservation.event.guestCount.toLocaleString('en-PH')}</td>
                    <td>{formatMoney(reservation.package.priceInCentavos)}</td>
                    <td><span className="management-table-muted">{formatRequests(reservation)}</span></td>
                    <td>{formatSubmittedTime(reservation.createdAt)}</td>
                    <td>
                      <div className="management-table-actions">
                        <button type="button" className="management-row-button" disabled title="Confirmation requires approved capacity and customization rules">Confirm</button>
                        <button type="button" className="management-danger-button" disabled={isBusy} onClick={() => void handleReject(reservation)}>
                          {isBusy ? 'Rejecting…' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ManagementPagination page={page.page} totalItems={visibleReservations.length} onPageChange={page.setPage} />
      </>
    );
  }

  async function handleReject(reservation: ReservationRecord) {
    const shouldReject = window.confirm(`Reject the ${reservation.package.packageName} request for ${formatEventRange(reservation.event.startDate, reservation.event.endDate)}?`);
    if (!shouldReject) return;

    setBusyReservationId(reservation.id);
    setActionError(null);
    try {
      await rejectReservation(reservation.id, staffId, staffName);
    } catch {
      setActionError('The reservation could not be rejected. Refresh the list and try again.');
    } finally {
      setBusyReservationId(null);
    }
  }
}

function filterReservations(reservations: ReservationRecord[], query: string, sortBy: ReservationSort, direction: SortDirection) {
  const text = query.trim().toLocaleLowerCase();
  return [...reservations]
    .filter((reservation) => !text || [
      reservation.package.packageName,
      reservation.event.location,
      reservation.event.serviceRequirements,
      reservation.customization.menuRequest,
      reservation.customization.foodQuantityRequest,
      reservation.customization.supplyRequest,
    ].join(' ').toLocaleLowerCase().includes(text))
    .sort((left, right) => {
      const leftValue = sortBy === 'event' ? left.event.startDate.getTime() : sortBy === 'package' ? left.package.packageName : sortBy === 'guests' ? left.event.guestCount : left.createdAt.getTime();
      const rightValue = sortBy === 'event' ? right.event.startDate.getTime() : sortBy === 'package' ? right.package.packageName : sortBy === 'guests' ? right.event.guestCount : right.createdAt.getTime();
      const result = typeof leftValue === 'number' && typeof rightValue === 'number' ? leftValue - rightValue : String(leftValue).localeCompare(String(rightValue), 'en-PH', { sensitivity: 'base' });
      return direction === 'asc' ? result : -result;
    });
}

function formatRequests(reservation: ReservationRecord) {
  const requests = [
    reservation.customization.menuRequest ? `Menu: ${reservation.customization.menuRequest}` : '',
    reservation.customization.foodQuantityRequest ? `Food: ${reservation.customization.foodQuantityRequest}` : '',
    reservation.customization.supplyRequest ? `Supplies: ${reservation.customization.supplyRequest}` : '',
    reservation.event.serviceRequirements ? `Service: ${reservation.event.serviceRequirements}` : '',
  ].filter(Boolean);
  return requests.length > 0 ? requests.join(' · ') : 'No special requests';
}

function ReservationReviewStatus({ message, error = false }: { message: string; error?: boolean }) {
  return <div className={error ? 'management-empty-state management-empty-state-error' : 'management-empty-state'} role={error ? 'alert' : 'status'}>{message}</div>;
}

function formatEventRange(startDate: Date, endDate: Date) {
  const formatter = new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  const start = formatter.format(startDate);
  const end = formatter.format(endDate);
  return start === end ? start : `${start} – ${end}`;
}
function formatMoney(amountInCentavos: number) { return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amountInCentavos / 100); }
function formatSubmittedTime(date: Date) { return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(date); }
