import { useEffect, useState } from 'react';
import { AppLink } from '@core/app/navigation';
import { subscribeToPendingReservations } from '../operations/reservation.service';
import { subscribeToRecentPayments } from '../payments/payment.service';
import { subscribeToEquipment } from '../resources/equipment.service';
import { subscribeToInventory } from '../resources/inventory.service';
import './dashboard.css';

type DashboardPanelProps = {
  workspaceBasePath: string;
  role: 'staff' | 'admin';
};

type ModuleLink = {
  label: string;
  description: string;
  path: string;
  adminOnly?: boolean;
};

export function DashboardPanel({ workspaceBasePath, role }: DashboardPanelProps) {
  const [pendingReservations, setPendingReservations] = useState<number | null>(null);
  const [lowStockItems, setLowStockItems] = useState<number | null>(null);
  const [recentPayments, setRecentPayments] = useState<number | null>(null);
  const [equipmentIssues, setEquipmentIssues] = useState<number | null>(null);

  useEffect(() => subscribeToPendingReservations(
    (reservations) => setPendingReservations(reservations.length),
    () => setPendingReservations(null),
  ), []);

  useEffect(() => subscribeToInventory(
    (items) => {
      const warningCount = items.filter((item) => item.isActive && item.quantity <= item.lowStockThreshold).length;
      setLowStockItems(warningCount);
    },
    () => setLowStockItems(null),
  ), []);

  useEffect(() => subscribeToRecentPayments(
    (payments) => setRecentPayments(payments.length),
    () => setRecentPayments(null),
  ), []);

  useEffect(() => subscribeToEquipment(
    (items) => {
      const issueCount = items
        .filter((item) => item.isActive)
        .reduce((total, item) => total + item.damagedQuantity + item.missingQuantity, 0);
      setEquipmentIssues(issueCount);
    },
    () => setEquipmentIssues(null),
  ), []);

  const moduleLinks: ModuleLink[] = [
    { label: 'Operations', description: 'Reservations and catering packages', path: `${workspaceBasePath}/operations` },
    { label: 'Resources', description: 'Inventory and event equipment', path: `${workspaceBasePath}/resources` },
    { label: 'Payments', description: 'Record and review payments', path: `${workspaceBasePath}/payments` },
    { label: 'Reports', description: 'View and export records', path: `${workspaceBasePath}/reports` },
    { label: 'Users & roles', description: 'Manage account access', path: `${workspaceBasePath}/users`, adminOnly: true },
    { label: 'Audit trail', description: 'Review system activity', path: `${workspaceBasePath}/audit`, adminOnly: true },
  ];

  const visibleModuleLinks = moduleLinks.filter((moduleLink) => !moduleLink.adminOnly || role === 'admin');

  return (
    <section className="dashboard-section" id="dashboard" aria-label="Dashboard">
      <div className="dashboard-grid" aria-label="Operational summary">
        <DashboardMetric to={`${workspaceBasePath}/operations`} label="Pending requests" value={pendingReservations} detail="Up to 50 awaiting review" />
        <DashboardMetric to={`${workspaceBasePath}/resources`} label="Low-stock items" value={lowStockItems} detail="Within the current inventory view" warn={lowStockItems !== null && lowStockItems > 0} />
        <DashboardMetric to={`${workspaceBasePath}/payments`} label="Recent payments" value={recentPayments} detail="Up to 50 latest records" />
        <DashboardMetric to={`${workspaceBasePath}/resources`} label="Equipment issues" value={equipmentIssues} detail="Damaged or missing units" warn={equipmentIssues !== null && equipmentIssues > 0} />
      </div>

      <div className="dashboard-module-section">
        <div className="dashboard-module-heading">
          <div><h3>Quick access</h3><p>Jump directly to a management area.</p></div>
        </div>
        <div className="dashboard-module-grid">
          {visibleModuleLinks.map((moduleLink) => (
            <AppLink className="dashboard-module-link" key={moduleLink.path} to={moduleLink.path}>
              <div className="dashboard-module-link-heading">
                <strong>{moduleLink.label}</strong>
                <span className="dashboard-module-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" focusable="false"><path d="M4 10h11m-4-4 4 4-4 4" /></svg>
                </span>
              </div>
              <span className="dashboard-module-description">{moduleLink.description}</span>
            </AppLink>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardMetric({ to, label, value, detail, warn = false }: { to: string; label: string; value: number | null; detail: string; warn?: boolean }) {
  return (
    <AppLink className={`dashboard-metric${warn ? ' dashboard-metric-warn' : ''}`} to={to}>
      <span className="dashboard-metric-label">{label}</span>
      <strong>{value === null ? '—' : value.toLocaleString('en-PH')}</strong>
      <span className="dashboard-metric-detail">{value === null ? 'Unavailable' : detail}</span>
    </AppLink>
  );
}
