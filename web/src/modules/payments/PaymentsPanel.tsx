import { useEffect, useMemo, useState } from 'react';
import {
  ManagementFilterField,
  ManagementSelect,
  ManagementTableFrame,
  ManagementTabs,
  ManagementToolbar,
  useManagementPage,
} from '@shared/ui/ManagementControls';
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
    const emptyMessage = reservations.length === 0
      ? 'No reservations are ready for payment recording.'
      : visibleReservations.length === 0
        ? 'No reservations match the current view.'
        : undefined;

    return (
      <ManagementTableFrame
        loadingMessage={isLoadingReservations ? 'Loading payable reservations…' : undefined}
        errorMessage={!isLoadingReservations && reservationError ? 'Payable reservations could not be loaded.' : undefined}
        emptyMessage={!isLoadingReservations && !reservationError ? emptyMessage : undefined}
        pagination={!isLoadingReservations && !reservationError && visibleReservations.length > 0 ? {
          page: reservationPage.page,
          totalItems: visibleReservations.length,
          onPageChange: reservationPage.setPage,
        } : undefined}
      >
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
      </ManagementTableFrame>
    );
  }

  function renderPaymentRecords() {
    const emptyMessage = payments.length === 0
      ? 'No payments recorded yet.'
      : visiblePayments.length === 0
        ? 'No payment records match the current view.'
        : undefined;

    return (
      <ManagementTableFrame
        loadingMessage={isLoadingPayments ? 'Loading payment records…' : undefined}
        errorMessage={!isLoadingPayments && paymentError ? 'Payment records could not be loaded.' : undefined}
        emptyMessage={!isLoadingPayments && !paymentError ? emptyMessage : undefined}
        pagination={!isLoadingPayments && !paymentError && visiblePayments.length > 0 ? {
          page: paymentPage.page,
          totalItems: visiblePayments.length,
          onPageChange: paymentPage.setPage,
        } : undefined}
      >
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
      </ManagementTableFrame>
    );
  }
}

function PaymentFilters({
  tab,
  filterValue,
  sortBy,
  sortDirection,
  onFilterChange,
  onSortChange,
  onDirectionChange,
  onReset,
}: {
  tab: PaymentsTab;
  filterValue: string;
  sortBy: PaymentSort;
  sortDirection: SortDirection;
  onFilterChange: (value: string) => void;
  onSortChange: (value: PaymentSort) => void;
  onDirectionChange: (value: SortDirection) => void;
  onReset: () => void;
}) {
  const sortOptions = tab === 'reservations'
    ? [
      { value: 'event', label: 'Event date' },
      { value: 'package', label: 'Package' },
      { value: 'status', label: 'Status' },
    ]
    : [
      { value: 'date', label: 'Recorded date' },
      { value: 'amount', label: 'Amount' },
      { value: 'package', label: 'Package' },
      { value: 'recorder', label: 'Recorded by' },
    ];

  return (
    <>
      {tab === 'reservations' ? (
        <ManagementFilterField label="Status">
          <ManagementSelect
            value={filterValue}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'pending_review', label: 'Pending review' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'completed', label: 'Completed' },
            ]}
            onChange={onFilterChange}
            ariaLabel="Filter payable reservations by status"
          />
        </ManagementFilterField>
      ) : null}
      <ManagementFilterField label="Sort by">
        <ManagementSelect
          value={sortBy}
          options={sortOptions as { value: PaymentSort; label: string }[]}
          onChange={onSortChange}
          ariaLabel="Sort payment view by"
        />
      </ManagementFilterField>
      <ManagementFilterField label="Direction">
        <ManagementSelect
          value={sortDirection}
          options={[
            { value: 'asc', label: 'Ascending' },
            { value: 'desc', label: 'Descending' },
          ]}
          onChange={onDirectionChange}
          ariaLabel="Payment sort direction"
        />
      </ManagementFilterField>
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

function formatMoney(amountInCentavos: number) { return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amountInCentavos / 100); }
function formatEventDate(date: Date) { return new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date); }
function formatPaymentTime(date: Date) { return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(date); }
function shortId(value: string) { return value.length <= 8 ? value : value.slice(0, 8); }
