import { useEffect, useMemo, useState } from 'react';
import {
  ManagementTableFrame,
  ManagementTabs,
  ManagementToolbar,
  useManagementPage,
} from '@shared/ui/ManagementControls';
import { PaymentFilters } from './PaymentFilters';
import { StaffPaymentLinkCard } from './PaymentLinkCards';
import { PaymentRecordDialog } from './PaymentRecordDialog';
import {
  subscribeToPayableReservations,
  subscribeToRecentPayments,
} from './payment.service';
import type { PaymentRecord, PaymentReservation } from './payment.types';
import {
  filterPayments,
  filterReservations,
  getPaymentEmptyMessage,
  getPaymentViewDefaults,
  getReservationStatusPresentation,
  type PaymentSort,
  type PaymentsTab,
  type SortDirection,
} from './payment-view';
import './payments.css';

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

  function resetViewControls(nextTab = tab) {
    const defaults = getPaymentViewDefaults(nextTab);
    setFilterValue('all');
    setSortBy(defaults.sortBy);
    setSortDirection(defaults.direction);
  }

  function changeTab(nextTab: PaymentsTab) {
    setTab(nextTab);
    setQueryText('');
    resetViewControls(nextTab);
  }

  function renderReservations() {
    const emptyMessage = getPaymentEmptyMessage(reservations.length, visibleReservations.length, 'reservations');
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
    const emptyMessage = getPaymentEmptyMessage(payments.length, visiblePayments.length, 'records');
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
            onReset={() => resetViewControls()}
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
}

function ReservationStatus({ status }: { status: PaymentReservation['status'] }) {
  const presentation = getReservationStatusPresentation(status);
  return <span className={presentation.className}>{presentation.label}</span>;
}

function formatMoney(amountInCentavos: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amountInCentavos / 100);
}

function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatPaymentTime(date: Date) {
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function shortId(value: string) {
  return value.length <= 8 ? value : value.slice(0, 8);
}
