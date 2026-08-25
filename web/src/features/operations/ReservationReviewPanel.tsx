import { useEffect, useMemo, useState } from 'react';
import {
  ManagementFilterField,
  ManagementSelect,
  ManagementTableFrame,
  ManagementTabs,
  ManagementToolbar,
  useManagementPage,
} from '../../app/ManagementControls';
import { useToast } from '../../app/ToastProvider';
import { ManualReservationPanel } from './ManualReservationPanel';
import {
  rejectReservation,
  subscribeToPendingReservations,
} from './reservation.service';
import type { ReservationRecord } from './reservation.types';
import './reservations.css';

type ReservationTab = 'manual' | 'pending';
type ReservationSort = 'event' | 'submitted' | 'package' | 'guests';
type SortDirection = 'asc' | 'desc';

const tabs = [
  { value: 'manual', label: 'Manual reservation' },
  { value: 'pending', label: 'Pending requests' },
] satisfies { value: ReservationTab; label: string }[];

type ReservationReviewPanelProps = {
  staffId: string;
  staffName: string;
};

export function ReservationReviewPanel({ staffId, staffName }: ReservationReviewPanelProps) {
  const { showToast } = useToast();
  const [tab, setTab] = useState<ReservationTab>('manual');
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [busyReservationId, setBusyReservationId] = useState<string | null>(null);
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
  const emptyMessage = reservations.length === 0
    ? 'No pending reservation requests.'
    : visibleReservations.length === 0
      ? 'No pending requests match the current search.'
      : undefined;

  function changeTab(nextTab: ReservationTab) {
    setTab(nextTab);
    if (nextTab === 'pending') {
      setQueryText('');
      setSortBy('submitted');
      setSortDirection('desc');
    }
  }

  return (
    <section className="reservation-review-section" id="reservation-review" aria-label="Reservations">
      <ManagementTabs value={tab} options={tabs} onChange={changeTab} label="Reservation views" />

      {tab === 'manual' ? (
        <ManualReservationPanel staffId={staffId} staffName={staffName} />
      ) : (
        <PendingReservationsView />
      )}
    </section>
  );

  function PendingReservationsView() {
    return (
      <>
        <ManagementToolbar
          summary={[{ label: 'pending requests', value: reservations.length }]}
          searchValue={queryText}
          searchPlaceholder="Search pending requests"
          onSearchChange={setQueryText}
          filterContent={(
            <>
              <ManagementFilterField label="Sort by">
                <ManagementSelect
                  value={sortBy}
                  options={[
                    { value: 'submitted', label: 'Submitted date' },
                    { value: 'event', label: 'Event date' },
                    { value: 'package', label: 'Package' },
                    { value: 'guests', label: 'Guest count' },
                  ]}
                  onChange={setSortBy}
                  ariaLabel="Sort reservation requests by"
                />
              </ManagementFilterField>
              <ManagementFilterField label="Direction">
                <ManagementSelect
                  value={sortDirection}
                  options={[
                    { value: 'asc', label: 'Ascending' },
                    { value: 'desc', label: 'Descending' },
                  ]}
                  onChange={setSortDirection}
                  ariaLabel="Reservation sort direction"
                />
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

        <ManagementTableFrame
          loadingMessage={isLoading ? 'Loading pending reservation requests…' : undefined}
          errorMessage={!isLoading && hasError ? 'Pending requests could not be loaded.' : undefined}
          emptyMessage={!isLoading && !hasError ? emptyMessage : undefined}
          pagination={!isLoading && !hasError && visibleReservations.length > 0 ? {
            page: page.page,
            totalItems: visibleReservations.length,
            onPageChange: page.setPage,
          } : undefined}
        >
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th scope="col">Customer</th>
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
                      <td>{renderCustomer(reservation)}</td>
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
        </ManagementTableFrame>
      </>
    );
  }

  async function handleReject(reservation: ReservationRecord) {
    const shouldReject = window.confirm(`Reject the ${reservation.package.packageName} request for ${formatEventRange(reservation.event.startDate, reservation.event.endDate)}?`);
    if (!shouldReject) return;

    setBusyReservationId(reservation.id);
    try {
      await rejectReservation(reservation.id, staffId, staffName);
      showToast({ message: 'Reservation request rejected.', tone: 'success' });
    } catch {
      showToast({ message: 'The reservation could not be rejected. Refresh the list and try again.', tone: 'error' });
    } finally {
      setBusyReservationId(null);
    }
  }
}

function renderCustomer(reservation: ReservationRecord) {
  if (reservation.source === 'manual' && reservation.manualCustomer) {
    return (
      <div className="management-table-primary">
        <strong>{reservation.manualCustomer.name}</strong>
        <span>Manual entry · {reservation.manualCustomer.contact}</span>
      </div>
    );
  }

  return (
    <div className="management-table-primary">
      <strong>Customer portal</strong>
      <span>User {shortId(reservation.customerId)}</span>
    </div>
  );
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
      reservation.manualCustomer?.name ?? '',
      reservation.manualCustomer?.contact ?? '',
      reservation.enteredBy?.displayName ?? '',
      reservation.customerId,
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

function formatEventRange(startDate: Date, endDate: Date) {
  const formatter = new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
  const start = formatter.format(startDate);
  const end = formatter.format(endDate);
  return start === end ? start : `${start} – ${end}`;
}

function formatMoney(amountInCentavos: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amountInCentavos / 100);
}

function formatSubmittedTime(date: Date) {
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function shortId(value: string) {
  return value.length <= 8 ? value : value.slice(0, 8);
}
