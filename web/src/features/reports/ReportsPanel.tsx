import { useEffect, useMemo, useState } from 'react';
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

type ReportDefinition = {
  title: string;
  note: string;
  filename: string;
  headers: string[];
  rows: string[][];
};

const reportKinds: { kind: ReportKind; label: string }[] = [
  { kind: 'reservations', label: 'Reservations' },
  { kind: 'sales', label: 'Sales' },
  { kind: 'payments', label: 'Payments' },
  { kind: 'inventory', label: 'Inventory' },
  { kind: 'equipment', label: 'Equipment' },
];

export function ReportsPanel() {
  const [reportKind, setReportKind] = useState<ReportKind>('reservations');
  const [reservations, setReservations] = useState<ReportReservation[] | null>();
  const [payments, setPayments] = useState<ReportPayment[] | null>();
  const [inventory, setInventory] = useState<InventoryItem[] | null>();
  const [equipment, setEquipment] = useState<EquipmentItem[] | null>();
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

  const sourceState =
    reportKind === 'reservations' || reportKind === 'sales'
      ? reservations
      : reportKind === 'payments'
        ? payments
        : reportKind === 'inventory'
          ? inventory
          : equipment;

  const reportReady = Array.isArray(sourceState);

  function exportCurrentReport() {
    if (!reportReady) {
      return;
    }

    downloadCsv(report.filename, createCsv(report.headers, report.rows));
  }

  return (
    <section className="reports-section" id="reports" aria-labelledby="reports-title">
      <div className="reports-heading">
        <div>
          <p className="reports-kicker">Business records</p>
          <h2 id="reports-title">Reports and exports</h2>
        </div>
        <p>
          Review authorized operational records, export an Excel-compatible CSV, or print the selected report.
        </p>
      </div>

      <div className="reports-controls" aria-label="Choose a report">
        {reportKinds.map((option) => (
          <button
            key={option.kind}
            type="button"
            aria-pressed={reportKind === option.kind}
            className={reportKind === option.kind ? 'report-selector-active' : ''}
            onClick={() => setReportKind(option.kind)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="report-toolbar">
        <div>
          <h3>{report.title}</h3>
          <p>{report.note}</p>
        </div>
        <div className="report-actions">
          <button type="button" disabled={!reportReady} onClick={exportCurrentReport}>
            Export CSV
          </button>
          <button type="button" disabled={!reportReady} onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>

      {sourceState === undefined ? (
        <div className="report-status" role="status">Loading report records…</div>
      ) : sourceState === null ? (
        <div className="report-status report-status-error" role="alert">
          This report could not be loaded. Refresh and try again.
        </div>
      ) : (
        <>
          <p className="report-count">{report.rows.length.toLocaleString('en-PH')} records shown</p>
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  {report.headers.map((header) => <th key={header}>{header}</th>)}
                </tr>
              </thead>
              <tbody>
                {report.rows.length === 0 ? (
                  <tr>
                    <td colSpan={report.headers.length}>No records are available for this report.</td>
                  </tr>
                ) : report.rows.map((row, rowIndex) => (
                  <tr key={`${reportKind}-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
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
      title: 'Reservation report',
      note: 'Shows up to the 250 most recent reservation records across all reservation statuses.',
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
    const saleReservations = (reservations ?? []).filter(
      (reservation) => reservation.status === 'confirmed' || reservation.status === 'completed',
    );

    return {
      title: 'Sales report',
      note: 'Confirmed and completed reservations are shown as sales activity. Stored amounts are base-package snapshots only and are not treated as final revenue until authoritative customization pricing is approved.',
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
      title: 'Payment report',
      note: 'Shows up to the 250 most recent payment records created by authorized staff.',
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
      title: 'Inventory report',
      note: 'Shows up to 100 inventory registry items, including current stock levels and low-stock warning thresholds.',
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
    title: 'Equipment accountability report',
    note: 'Shows up to 100 equipment registry items with current available, in-use, damaged, and missing quantities.',
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

function formatStatus(value: string): string {
  return value
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' }).format(value);
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

function formatMoney(valueInCentavos: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(valueInCentavos / 100);
}
