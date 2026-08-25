import { useEffect, useState } from 'react';
import { subscribeToEquipment } from '../equipment/equipment.service';
import { subscribeToInventory } from '../inventory/inventory.service';
import { subscribeToRecentPayments } from '../payments/payment.service';
import { subscribeToPendingReservations } from '../reservations/reservation.service';
import './dashboard.css';

export function DashboardPanel() {
  const [pendingReservations, setPendingReservations] = useState<number | null>(null);
  const [lowStockItems, setLowStockItems] = useState<number | null>(null);
  const [recentPayments, setRecentPayments] = useState<number | null>(null);
  const [equipmentIssues, setEquipmentIssues] = useState<number | null>(null);

  useEffect(() => {
    return subscribeToPendingReservations(
      (reservations) => setPendingReservations(reservations.length),
      () => setPendingReservations(null),
    );
  }, []);

  useEffect(() => {
    return subscribeToInventory(
      (items) => {
        const warningCount = items.filter(
          (item) => item.isActive && item.quantity <= item.lowStockThreshold,
        ).length;
        setLowStockItems(warningCount);
      },
      () => setLowStockItems(null),
    );
  }, []);

  useEffect(() => {
    return subscribeToRecentPayments(
      (payments) => setRecentPayments(payments.length),
      () => setRecentPayments(null),
    );
  }, []);

  useEffect(() => {
    return subscribeToEquipment(
      (items) => {
        const issueCount = items
          .filter((item) => item.isActive)
          .reduce(
            (total, item) => total + item.damagedQuantity + item.missingQuantity,
            0,
          );
        setEquipmentIssues(issueCount);
      },
      () => setEquipmentIssues(null),
    );
  }, []);

  return (
    <section className="dashboard-section" id="dashboard" aria-labelledby="dashboard-title">
      <div className="dashboard-heading">
        <div>
          <p className="dashboard-kicker">Operational summary</p>
          <h2 id="dashboard-title">Dashboard</h2>
        </div>
        <p>
          See the current bounded workspace view and move directly to the operational area that needs attention.
        </p>
      </div>

      <div className="dashboard-grid" aria-label="Operational summary">
        <DashboardMetric
          href="#reservation-review"
          label="Pending requests shown"
          value={pendingReservations}
          detail="Up to 50 most recent requests awaiting review"
        />
        <DashboardMetric
          href="#inventory"
          label="Low-stock items shown"
          value={lowStockItems}
          detail="Within the current 100-item inventory view"
          warn={lowStockItems !== null && lowStockItems > 0}
        />
        <DashboardMetric
          href="#payments"
          label="Recent payments"
          value={recentPayments}
          detail="Up to 50 latest payment records"
        />
        <DashboardMetric
          href="#equipment"
          label="Equipment issues shown"
          value={equipmentIssues}
          detail="Damaged or missing units within the current 100-item equipment view"
          warn={equipmentIssues !== null && equipmentIssues > 0}
        />
      </div>
    </section>
  );
}

function DashboardMetric({
  href,
  label,
  value,
  detail,
  warn = false,
}: {
  href: string;
  label: string;
  value: number | null;
  detail: string;
  warn?: boolean;
}) {
  return (
    <a className={`dashboard-metric${warn ? ' dashboard-metric-warn' : ''}`} href={href}>
      <span className="dashboard-metric-label">{label}</span>
      <strong>{value === null ? '—' : value.toLocaleString('en-PH')}</strong>
      <span className="dashboard-metric-detail">
        {value === null ? 'Summary unavailable' : detail}
      </span>
    </a>
  );
}
