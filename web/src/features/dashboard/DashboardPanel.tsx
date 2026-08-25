import { useEffect, useState } from 'react';
import { AppLink } from '../../app/navigation';
import { subscribeToEquipment } from '../equipment/equipment.service';
import { subscribeToInventory } from '../inventory/inventory.service';
import { subscribeToRecentPayments } from '../payments/payment.service';
import { subscribeToPendingReservations } from '../reservations/reservation.service';
import './dashboard.css';

type DashboardPanelProps = {
  workspaceBasePath: string;
  role: 'staff' | 'admin';
};

type ModuleLink = {
  label: string;
  path: string;
  adminOnly?: boolean;
};

export function DashboardPanel({ workspaceBasePath, role }: DashboardPanelProps) {
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

  const moduleLinks: ModuleLink[] = [
    { label: 'Reservations', path: `${workspaceBasePath}/reservations` },
    { label: 'Packages', path: `${workspaceBasePath}/packages` },
    { label: 'Inventory', path: `${workspaceBasePath}/inventory` },
    { label: 'Payments', path: `${workspaceBasePath}/payments` },
    { label: 'Equipment', path: `${workspaceBasePath}/equipment` },
    { label: 'Reports', path: `${workspaceBasePath}/reports` },
    { label: 'Users & roles', path: `${workspaceBasePath}/users`, adminOnly: true },
    { label: 'Audit trail', path: `${workspaceBasePath}/audit`, adminOnly: true },
  ];

  const visibleModuleLinks = moduleLinks.filter(
    (moduleLink) => !moduleLink.adminOnly || role === 'admin',
  );

  return (
    <section className="dashboard-section" id="dashboard" aria-label="Dashboard">
      <div className="dashboard-grid" aria-label="Operational summary">
        <DashboardMetric
          to={`${workspaceBasePath}/reservations`}
          label="Pending requests"
          value={pendingReservations}
          detail="Up to 50 awaiting review"
        />
        <DashboardMetric
          to={`${workspaceBasePath}/inventory`}
          label="Low-stock items"
          value={lowStockItems}
          detail="Within the current inventory view"
          warn={lowStockItems !== null && lowStockItems > 0}
        />
        <DashboardMetric
          to={`${workspaceBasePath}/payments`}
          label="Recent payments"
          value={recentPayments}
          detail="Up to 50 latest records"
        />
        <DashboardMetric
          to={`${workspaceBasePath}/equipment`}
          label="Equipment issues"
          value={equipmentIssues}
          detail="Damaged or missing units"
          warn={equipmentIssues !== null && equipmentIssues > 0}
        />
      </div>

      <div className="dashboard-module-section">
        <div className="dashboard-module-heading">
          <h3>Quick access</h3>
        </div>

        <div className="dashboard-module-grid">
          {visibleModuleLinks.map((moduleLink) => (
            <AppLink className="dashboard-module-link" key={moduleLink.path} to={moduleLink.path}>
              <strong>{moduleLink.label}</strong>
              <span className="dashboard-module-open">Open →</span>
            </AppLink>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardMetric({
  to,
  label,
  value,
  detail,
  warn = false,
}: {
  to: string;
  label: string;
  value: number | null;
  detail: string;
  warn?: boolean;
}) {
  return (
    <AppLink className={`dashboard-metric${warn ? ' dashboard-metric-warn' : ''}`} to={to}>
      <span className="dashboard-metric-label">{label}</span>
      <strong>{value === null ? '—' : value.toLocaleString('en-PH')}</strong>
      <span className="dashboard-metric-detail">
        {value === null ? 'Unavailable' : detail}
      </span>
    </AppLink>
  );
}
