import { useEffect, useMemo, useState } from 'react';
import {
  ManagementFilterField,
  ManagementSelect,
  ManagementTableFrame,
  ManagementTabs,
  ManagementToolbar,
  useManagementPage,
} from '../../app/ManagementControls';
import { subscribeToEquipment } from '../equipment/equipment.service';
import type { EquipmentItem } from '../equipment/equipment.types';
import { subscribeToInventory } from '../inventory/inventory.service';
import type { InventoryItem } from '../inventory/inventory.types';
import { createCsv, downloadCsv } from './report.export';
import {
  subscribeToReportPayments,
  subscribeToReportReservations,
  type ReportPayment,
  type ReportReservation,
} from './report.service';
import './reports.css';

type ReportKind = 'reservations' | 'sales' | 'payments' | 'inventory' | 'equipment';
type SortDirection = 'asc' | 'desc';

type ReportDefinition = {
  title: string;
  note: string;
  filename: string;
  headers: string[];
  rows: string[][];
};

const reportKinds: { value: ReportKind; label: string }[] = [
  { value: 'reservations', label: 'Reservations' },
  { value: 'sales', label: 'Sales' },
  { value: 'payments', label: 'Payments' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'equipment', label: 'Equipment' },
];

export function ReportsPanel() {
  const [reportKind, setReportKind] = useState<ReportKind>('reservations');
  const [reservations, setReservations] = useState<ReportReservation[] | null>();
  const [payments, setPayments] = useState<ReportPayment[] | null>();
  const [inventory, setInventory] = useState<InventoryItem[] | null>();
  const [equipment, setEquipment] = useState<EquipmentItem[] | null>();
  const [queryText, setQueryText] = useState('');
  const [sortColumn, setSortColumn] = useState(0);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const sourceKind = reportKind === 'sales' ? 'reservations' : reportKind;

  useEffect(() => {
    if (sourceKind === 'reservations') {
      setReservations(undefined);
      return subscribeToReportReservations(setReservations, () => setReservations(null));
    }
    if (sourceKind === 'payments') {
      setPayments(undefined);
      return subscribeToReportPayments(setPayments, () => setPayments(null));
    }
    if (sourceKind === 'inventory') {
      setInventory(undefined);
      return subscribeToInventory(setInventory, () => setInventory(null));
    }
    setEquipment(undefined);
    return subscribeToEquipment(setEquipment, () => setEquipment(null));
  }, [sourceKind]);

  const report = useMemo(
    () => buildReport(reportKind, reservations, payments, inventory, equipment),
    [reportKind, reservations, payments, inventory, equipment],
  );
  const sourceState = reportKind === 'reservations' || reportKind === 'sales'
    ? reservations
    : reportKind === 'payments'
      ? payments
      : reportKind === 'inventory'
        ? inventory
        : equipment;
  const reportReady = Array.isArray(sourceState);
  const visibleRows = useMemo(
    () => filterRows(report.rows, queryText, sortColumn, sortDirection),
    [report.rows, queryText, sortColumn, sortDirection],
  );
  const page = useManagementPage(
    visibleRows,
    `${reportKind}|${queryText}|${sortColumn}|${sortDirection}`,
  );

  function changeReport(nextKind: ReportKind) {
    setReportKind(nextKind);
    setQueryText('');
    setSortColumn(0);
    setSortDirection('asc');
  }

  function exportCurrentReport() {
    if (reportReady) downloadCsv(report.filename, createCsv(report.headers, report.rows));
  }

  const emptyMessage = report.rows.length === 0
    ? 'No records.'
    : visibleRows.length === 0
      ? 'No records match the current search.'
      : undefined;

  return (
    <section className="reports-section" id="reports" aria-label="Reports">
      <ManagementTabs value={reportKind} options={reportKinds} onChange={changeReport} label="Report types" />

      <ManagementToolbar
        summary={[{ label: 'records', value: reportReady ? report.rows.length : '—' }]}
        searchValue={queryText}
        searchPlaceholder={`Search ${report.title.toLocaleLowerCase()}`}
        onSearchChange={setQueryText}
        filterContent={(
          <>
            <ManagementFilterField label="Sort by">
              <ManagementSelect
                value={String(sortColumn)}
                options={report.headers.map((header, index) => ({ value: String(index), label: header }))}
                onChange={(value) => setSortColumn(Number(value))}
                ariaLabel={`Sort ${report.title.toLocaleLowerCase()} report by`}
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
                ariaLabel="Report sort direction"
              />
            </ManagementFilterField>
            <button type="button" className="management-secondary-button" disabled={!reportReady} onClick={() => window.print()}>Print</button>
            <button type="button" className="management-secondary-button" onClick={() => { setSortColumn(0); setSortDirection('asc'); }}>Reset sort</button>
          </>
        )}
        primaryAction={(
          <button type="button" className="management-primary-button" disabled={!reportReady} onClick={exportCurrentReport}>
            Export CSV
          </button>
        )}
      />

      {report.note ? <p className="management-info-note">{report.note}</p> : null}

      <ManagementTableFrame
        loadingMessage={sourceState === undefined ? `Loading ${report.title.toLocaleLowerCase()} report…` : undefined}
        errorMessage={sourceState === null ? `${report.title} report could not be loaded.` : undefined}
        emptyMessage={reportReady ? emptyMessage : undefined}
        pagination={reportReady && visibleRows.length > 0 ? {
          page: page.page,
          totalItems: visibleRows.length,
          onPageChange: page.setPage,
        } : undefined}
      >
        <div className="management-table-wrap">
          <table className="management-table">
            <thead><tr>{report.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
            <tbody>
              {page.pageItems.map((row, rowIndex) => (
                <tr key={`${reportKind}-${page.page}-${rowIndex}`}>
                  {row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ManagementTableFrame>
    </section>
  );
}

function filterRows(rows: string[][], query: string, sortColumn: number, direction: SortDirection) {
  const text = query.trim().toLocaleLowerCase();
  return [...rows]
    .filter((row) => !text || row.join(' ').toLocaleLowerCase().includes(text))
    .sort((left, right) => {
      const result = String(left[sortColumn] ?? '').localeCompare(String(right[sortColumn] ?? ''), 'en-PH', { numeric: true, sensitivity: 'base' });
      return direction === 'asc' ? result : -result;
    });
}

function buildReport(
  kind: ReportKind,
  reservations: ReportReservation[] | null | undefined,
  payments: ReportPayment[] | null | undefined,
  inventory: InventoryItem[] | null | undefined,
  equipment: EquipmentItem[] | null | undefined,
): ReportDefinition {
  if (kind === 'reservations') {
    return {
      title: 'Reservations',
      note: 'Up to 250 most recent records.',
      filename: 'dos-hermanos-reservations.csv',
      headers: ['Reservation ID', 'Status', 'Event start', 'Event end', 'Location', 'Guests', 'Package', 'Submitted'],
      rows: (reservations ?? []).map((reservation) => [
        reservation.id,
        formatStatus(reservation.status),
        formatDate(reservation.eventStartDate),
        formatDate(reservation.eventEndDate),
        reservation.location,
        String(reservation.guestCount),
        reservation.packageName,
        formatDateTime(reservation.createdAt),
      ]),
    };
  }

  if (kind === 'sales') {
    const saleReservations = (reservations ?? []).filter((reservation) => reservation.status === 'confirmed' || reservation.status === 'completed');
    return {
      title: 'Sales',
      note: 'Base-package snapshots only; not final customized revenue.',
      filename: 'dos-hermanos-sales.csv',
      headers: ['Reservation ID', 'Status', 'Package', 'Event date', 'Guests', 'Base package amount'],
      rows: saleReservations.map((reservation) => [
        reservation.id,
        formatStatus(reservation.status),
        reservation.packageName,
        formatDate(reservation.eventStartDate),
        String(reservation.guestCount),
        formatMoney(reservation.packageBasePriceInCentavos),
      ]),
    };
  }

  if (kind === 'payments') {
    return {
      title: 'Payments',
      note: 'Up to 250 most recent records.',
      filename: 'dos-hermanos-payments.csv',
      headers: ['Payment ID', 'Reservation ID', 'Package', 'Event date', 'Amount', 'Method', 'Reference', 'Recorded by', 'Recorded at'],
      rows: (payments ?? []).map((payment) => [
        payment.id,
        payment.reservationId,
        payment.packageName,
        formatDate(payment.eventStartDate),
        formatMoney(payment.amountInCentavos),
        payment.method,
        payment.reference,
        payment.recordedByName,
        formatDateTime(payment.createdAt),
      ]),
    };
  }

  if (kind === 'inventory') {
    return {
      title: 'Inventory',
      note: 'Up to 100 registry items.',
      filename: 'dos-hermanos-inventory.csv',
      headers: ['Item', 'Unit', 'Quantity', 'Low-stock threshold', 'Status', 'Stock warning'],
      rows: (inventory ?? []).map((item) => [
        item.name,
        item.unit,
        String(item.quantity),
        String(item.lowStockThreshold),
        item.isActive ? 'Active' : 'Inactive',
        item.isActive && item.quantity <= item.lowStockThreshold ? 'Low stock' : 'OK',
      ]),
    };
  }

  return {
    title: 'Equipment',
    note: 'Up to 100 registry items.',
    filename: 'dos-hermanos-equipment.csv',
    headers: ['Equipment', 'Unit', 'Total', 'Available', 'In use', 'Damaged', 'Missing', 'Status'],
    rows: (equipment ?? []).map((item) => [
      item.name,
      item.unit,
      String(item.totalQuantity),
      String(item.availableQuantity),
      String(item.inUseQuantity),
      String(item.damagedQuantity),
      String(item.missingQuantity),
      item.isActive ? 'Active' : 'Inactive',
    ]),
  };
}

function formatStatus(value: string) { return value.split('_').map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(' '); }
function formatDate(value: Date) { return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(value); }
function formatDateTime(value: Date) { return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(value); }
function formatMoney(valueInCentavos: number) { return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(valueInCentavos / 100); }
