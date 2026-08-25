import { useEffect, useMemo, useState } from 'react';
import {
  ManagementFilterField,
  ManagementPagination,
  ManagementTabs,
  ManagementToolbar,
  useManagementPage,
} from '../../app/ManagementControls';
import { StaffPaymentLinkCard } from './PaymentLinkCards';
import { PaymentRecordDialog } from './PaymentRecordDialog';
import {
  subscribeToPayableReservations,
  subscribeToRecentPayments,
} from './payment.service';
import type { PaymentRecord, PaymentReservation } from './payment.types';
import './payments.css';

type PaymentsTab = 'reservations' | 'records';
type SortDirection = 'asc' | 'desc';
type PaymentSort = 'event' | 'package' | 'status' | 'date' | 'amount' | 'recorder';

const tabs = [
  { value: 'reservations', label: 'Reservations' },
  { value: 'records', label: 'Payment records' },
] satisfies { value: PaymentsTab; label: string }[];

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
  const [tab, setTab] = useState<PaymentsTab>('reservations');
  const [queryText, setQueryText] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [sortBy, setSortBy] = useState<PaymentSort>('event');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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

  const visibleReservations = useMemo(
    () => filterReservations(reservations, queryText, filterValue, sortBy, sortDirection),
    [reservations, queryText, filterValue, sortBy, sortDirection],
  );
  const visiblePayments = useMemo(
    () => filterPayments(payments, queryText, sortBy, sortDirection),
    [payments, queryText, sortBy, sortDirection],
  );
  const resetKey = `${queryText}|${filterValue}|${sortBy}|${sortDirection}`;
  const reservationPage = useManagementPage(visibleReservations, `reservations|${resetKey}`);
  const paymentPage = useManagementPage(visiblePayments, `records|${resetKey}`);

  function changeTab(nextTab: PaymentsTab) {
    setTab(nextTab);
    setQueryText('');
    setFilterValue('all');
    setSortBy(nextTab === 'reservations' ? 'event' : 'date');
    setSortDirection(nextTab === 'reservations' ? 'asc' : 'desc');
  }

  return (
    <section className="payments-section" id="payments" aria-label="Payments">
      <ManagementTabs value={tab} options={tabs} onChange={changeTab} label="Payment views" />

      <ManagementToolbar
        summary={[
          { label: 'payable reservations', value: reservations.length },
          { label: 'payment records', value: payments.length },
        ]}
        searchValue={queryText}
        searchPlaceholder={tab === 'reservations' ? 'Search payable reservations' : 'Search payment records'}
        onSearchChange={setQueryText}
        filterContent={(
          <PaymentFilters
            tab={tab}
            filterValue={filterValue}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onFilterChange={setFilterValue}
            onSortChange={setSortBy}
            onDirectionChange={setSortDirection}
            onReset={() => {
              setFilterValue('all');
              setSortBy(tab === 'reservations' ? 'event' : 'date');
              setSortDirection(tab === 'reservations' ? 'asc' : 'desc');
            }}
          />
        )}
      />

      <StaffPaymentLinkCard />
      {tab === 'reservations' ? renderReservations() : renderPaymentRecords()}

      <PaymentRecordDialog
        reservation={selectedReservation}
        recordedBy={staffId}
        recordedByName={staffName}
        onClose={() => setSelectedReservation(null)}
      />
    </section>
  );

  function renderReservations() {
    if (isLoadingReservations) return <PaymentStatusBox message="Loading reservations…" />;
    if (reservationError) return <PaymentStatusBox message="Reservations could not be loaded." error />;
    if (visibleReservations.length === 0) {
      return <PaymentStatusBox message={reservations.length === 0 ? 'No reservations are ready for payment recording.' : 'No reservations match the current view.'} />;
    }

    return (
      <>
        <div className="management-table-wrap">
          <table className="management-table">
            <thead><tr><th>Package</th><th>Event date</th><th>Status</th><th>Base package</th><th>Actions</th></tr></thead>
            <tbody>
              {reservationPage.pageItems.map((reservation) => (
                <tr key={reservation.id}>
                  <td><div className="management-table-primary"><strong>{reservation.packageName}</strong><span>Reservation {shortId(reservation.id)}</span></div></td>
                  <td>{formatEventDate(reservation.eventStartDate)}</td>
                  <td><ReservationStatus status={reservation.status} /></td>
                  <td>{formatMoney(reservation.packageBasePriceInCentavos)}</td>
                  <td><div className="management-table-actions"><button type="button" className="management-primary-button" onClick={() => setSelectedReservation(reservation)}>Record cash</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ManagementPagination page={reservationPage.page} totalItems={visibleReservations.length} onPageChange={reservationPage.setPage} />
      </>
    );
  }

  function renderPaymentRecords() {
    if (isLoadingPayments) return <PaymentStatusBox message="Loading payment records…" />;
    if (paymentError) return <PaymentStatusBox message="Payment records could not be loaded." error />;
    if (visiblePayments.length === 0) {
      return <PaymentStatusBox message={payments.length === 0 ? 'No payments recorded yet.' : 'No payment records match the current view.'} />;
    }

    return (
      <>
        <div className="management-table-wrap">
          <table className="management-table">
            <thead><tr><th>Amount</th><th>Package</th><th>Event date</th><th>Reference</th><th>Recorded by</th><th>Recorded at</th></tr></thead>
            <tbody>
              {paymentPage.pageItems.map((payment) => (
                <tr key={payment.id}>
                  <td><strong>{formatMoney(payment.amountInCentavos)}</strong></td>
                  <td><div className="management-table-primary"><strong>{payment.packageName}</strong><span>{payment.note || 'Cash payment'}</span></div></td>
                  <td>{formatEventDate(payment.eventStartDate)}</td>
                  <td>{payment.reference || '—'}</td>
                  <td>{payment.recordedByName}</td>
                  <td>{formatPaymentTime(payment.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ManagementPagination page={paymentPage.page} totalItems={visiblePayments.length} onPageChange={paymentPage.setPage} />
      </>
    );
  }
}

function PaymentFilters({ tab, filterValue, sortBy, sortDirection, onFilterChange, onSortChange, onDirectionChange, onReset }: {
  tab: PaymentsTab;
  filterValue: string;
  sortBy: PaymentSort;
  sortDirection: SortDirection;
  onFilterChange: (value: string) => void;
  onSortChange: (value: PaymentSort) => void;
  onDirectionChange: (value: SortDirection) => void;
  onReset: () => void;
}) {
  return (
    <>
      {tab === 'reservations' ? (
        <ManagementFilterField label="Status">
          <select value={filterValue} onChange={(event) => onFilterChange(event.target.value)}>
            <option value="all">All statuses</option><option value="pending_review">Pending review</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option>
          </select>
        </ManagementFilterField>
      ) : null}
      <ManagementFilterField label="Sort by">
        <select value={sortBy} onChange={(event) => onSortChange(event.target.value as PaymentSort)}>
          {tab === 'reservations' ? (
            <><option value="event">Event date</option><option value="package">Package</option><option value="status">Status</option></>
          ) : (
            <><option value="date">Recorded date</option><option value="amount">Amount</option><option value="package">Package</option><option value="recorder">Recorded by</option></>
          )}
        </select>
      </ManagementFilterField>
      <ManagementFilterField label="Direction"><select value={sortDirection} onChange={(event) => onDirectionChange(event.target.value as SortDirection)}><option value="asc">Ascending</option><option value="desc">Descending</option></select></ManagementFilterField>
      <button type="button" className="management-secondary-button" onClick={onReset}>Reset filters</button>
    </>
  );
}

function ReservationStatus({ status }: { status: PaymentReservation['status'] }) {
  const label = status === 'pending_review' ? 'Pending review' : status === 'confirmed' ? 'Confirmed' : 'Completed';
  const className = status === 'pending_review' ? 'management-status-badge management-status-badge-warn' : 'management-status-badge management-status-badge-active';
  return <span className={className}>{label}</span>;
}

function filterReservations(reservations: PaymentReservation[], query: string, status: string, sortBy: PaymentSort, direction: SortDirection) {
  const text = query.trim().toLocaleLowerCase();
  return [...reservations]
    .filter((reservation) => status === 'all' || reservation.status === status)
    .filter((reservation) => !text || `${reservation.packageName} ${reservation.status} ${reservation.id}`.toLocaleLowerCase().includes(text))
    .sort((left, right) => compare(sortBy === 'package' ? left.packageName : sortBy === 'status' ? left.status : left.eventStartDate.getTime(), sortBy === 'package' ? right.packageName : sortBy === 'status' ? right.status : right.eventStartDate.getTime(), direction));
}

function filterPayments(payments: PaymentRecord[], query: string, sortBy: PaymentSort, direction: SortDirection) {
  const text = query.trim().toLocaleLowerCase();
  return [...payments]
    .filter((payment) => !text || `${payment.packageName} ${payment.reference} ${payment.note} ${payment.recordedByName}`.toLocaleLowerCase().includes(text))
    .sort((left, right) => compare(sortBy === 'amount' ? left.amountInCentavos : sortBy === 'package' ? left.packageName : sortBy === 'recorder' ? left.recordedByName : left.createdAt.getTime(), sortBy === 'amount' ? right.amountInCentavos : sortBy === 'package' ? right.packageName : sortBy === 'recorder' ? right.recordedByName : right.createdAt.getTime(), direction));
}

function compare(left: string | number, right: string | number, direction: SortDirection) {
  const result = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), 'en-PH', { sensitivity: 'base' });
  return direction === 'asc' ? result : -result;
}

function PaymentStatusBox({ message, error = false }: { message: string; error?: boolean }) {
  return <div className={error ? 'management-empty-state management-empty-state-error' : 'management-empty-state'} role={error ? 'alert' : 'status'}>{message}</div>;
}

function formatMoney(amountInCentavos: number) { return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amountInCentavos / 100); }
function formatEventDate(date: Date) { return new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date); }
function formatPaymentTime(date: Date) { return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(date); }
function shortId(value: string) { return value.length <= 8 ? value : value.slice(0, 8); }
