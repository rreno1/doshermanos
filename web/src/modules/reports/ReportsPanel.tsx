import { useEffect, useMemo, useState } from 'react';
import {
  ManagementFilterField,
  ManagementSelect,
  ManagementTableFrame,
  ManagementTabs,
  ManagementToolbar,
  useManagementPage,
} from '@shared/ui/ManagementControls';
import { subscribeToEquipment } from '@modules/resources/equipment.service';
import type { EquipmentItem } from '@modules/resources/equipment.types';
import { subscribeToInventory } from '@modules/resources/inventory.service';
import type { InventoryItem } from '@modules/resources/inventory.types';
import { buildReport, type ReportKind } from './report.definition';
import { createCsv, downloadCsv } from './report.export';
import {
  subscribeToReportPayments,
  subscribeToReportReservations,
  type ReportPayment,
  type ReportReservation,
} from './report.service';
import './reports.css';

type SortDirection = 'asc' | 'desc';
type ReportSource = ReportReservation[] | ReportPayment[] | InventoryItem[] | EquipmentItem[] | null | undefined;

const reportKinds: { value: ReportKind; label: string }[] = [
  { value: 'reservations', label: 'Reservations' },
  { value: 'sales', label: 'Sales' },
  { value: 'payments', label: 'Payments' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'equipment', label: 'Equipment' },
];

const directionOptions: { value: SortDirection; label: string }[] = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
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
  const sourceState = getSourceState(reportKind, reservations, payments, inventory, equipment);
  const reportReady = Array.isArray(sourceState);
  const visibleRows = useMemo(
    () => filterRows(report.rows, queryText, sortColumn, sortDirection),
    [report.rows, queryText, sortColumn, sortDirection],
  );
  const page = useManagementPage(
    visibleRows,
    `${reportKind}|${queryText}|${sortColumn}|${sortDirection}`,
  );
  const emptyMessage = getReportEmptyMessage(report.rows.length, visibleRows.length);

  function resetSort() {
    setSortColumn(0);
    setSortDirection('asc');
  }

  function changeReport(nextKind: ReportKind) {
    setReportKind(nextKind);
    setQueryText('');
    resetSort();
  }

  function exportCurrentReport() {
    if (!reportReady) return;
    downloadCsv(report.filename, createCsv(report.headers, report.rows));
  }

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
                options={directionOptions}
                onChange={setSortDirection}
                ariaLabel="Report sort direction"
              />
            </ManagementFilterField>
            <button type="button" className="management-secondary-button" disabled={!reportReady} onClick={() => window.print()}>Print</button>
            <button type="button" className="management-secondary-button" onClick={resetSort}>Reset sort</button>
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
            <thead>
              <tr>
                {report.headers.map((header, index) => (
                  <th key={header} scope="col" className={getReportColumnClass(index, report.headers.length)}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {page.pageItems.map((row, rowIndex) => (
                <tr key={`${reportKind}-${page.page}-${rowIndex}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${rowIndex}-${cellIndex}`} className={getReportColumnClass(cellIndex, report.headers.length)}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ManagementTableFrame>
    </section>
  );
}

function getReportColumnClass(index: number, totalColumns: number) {
  if (index === 0) return 'col-primary';
  if (index === totalColumns - 1) return 'col-secondary col-hide-mobile';
  if (index >= 4) return 'col-hide-tablet';
  return 'col-secondary';
}

function getSourceState(
  kind: ReportKind,
  reservations: ReportReservation[] | null | undefined,
  payments: ReportPayment[] | null | undefined,
  inventory: InventoryItem[] | null | undefined,
  equipment: EquipmentItem[] | null | undefined,
): ReportSource {
  if (kind === 'reservations' || kind === 'sales') return reservations;
  if (kind === 'payments') return payments;
  if (kind === 'inventory') return inventory;
  return equipment;
}

function filterRows(rows: string[][], query: string, sortColumn: number, direction: SortDirection) {
  const text = query.trim().toLocaleLowerCase();
  return [...rows]
    .filter((row) => !text || row.join(' ').toLocaleLowerCase().includes(text))
    .sort((left, right) => {
      const leftValue = String(left[sortColumn] ?? '');
      const rightValue = String(right[sortColumn] ?? '');
      const result = leftValue.localeCompare(rightValue, 'en-PH', { numeric: true, sensitivity: 'base' });
      return direction === 'asc' ? result : -result;
    });
}

function getReportEmptyMessage(totalCount: number, visibleCount: number) {
  if (totalCount === 0) return 'No records.';
  if (visibleCount === 0) return 'No records match the current search.';
  return undefined;
}
