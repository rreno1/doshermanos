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
  description: string;
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
    {
      label: 'Reservations',
      description: 'Review pending customer requests and reservation details.',
      path: `${workspaceBasePath}/reservations`,
    },
    {
      label: 'Packages',
      description: 'Create, edit, publish, or hide catering packages.',
      path: `${workspaceBasePath}/packages`,
    },
    {
      label: 'Inventory',
      description: 'Maintain stock records and record inventory movements.',
      path: `${workspaceBasePath}/inventory`,
    },
    {
      label: 'Payments',
      description: 'Review payable reservations and record cash payments.',
      path: `${workspaceBasePath}/payments`,
    },
    {
      label: 'Equipment',
      description: 'Manage equipment availability, assignment, release, and return.',
      path: `${workspaceBasePath}/equipment`,
    },
    {
      label: 'Reports',
      description: 'Open operational reports and export supported records.',
      path: `${workspaceBasePath}/reports`,
    },
    {
      label: 'Users & roles',
      description: 'Manage application roles and account status.',
      path: `${workspaceBasePath}/users`,
      adminOnly: true,
    },
    {
      label: 'Audit trail',
      description: 'Review append-only operational activity records.',
      path: `${workspaceBasePath}/audit`,
      adminOnly: true,
    },
  ];

  const visibleModuleLinks = moduleLinks.filter(
    (moduleLink) => !moduleLink.adminOnly || role === 'admin',
  );

  return (
    <section className="dashboard-section" id="dashboard" aria-labelledby="dashboard-title">
      <div className="dashboard-heading">
        <div>
          <p className="dashboard-kicker">Operational control center</p>
          <h2 id="dashboard-title">Dashboard</h2>
        </div>
        <p>
          Review the current queues and warnings first, then open the management module that needs attention.
        </p>
      </div>

      <div className="dashboard-grid" aria-label="Operational summary">
        <DashboardMetric
          to={`${workspaceBasePath}/reservations`}
          label="Pending requests shown"
          value={pendingReservations}
          detail="Up to 50 most recent requests awaiting review"
        />
        <DashboardMetric
          to={`${workspaceBasePath}/inventory`}
          label="Low-stock items shown"
          value={lowStockItems}
          detail="Within the current 100-item inventory view"
          warn={lowStockItems !== null && lowStockItems > 0}
        />
        <DashboardMetric
          to={`${workspaceBasePath}/payments`}
          label="Recent payments"
          value={recentPayments}
          detail="Up to 50 latest payment records"
        />
        <DashboardMetric
          to={`${workspaceBasePath}/equipment`}
          label="Equipment issues shown"
          value={equipmentIssues}
          detail="Damaged or missing units within the current 100-item equipment view"
          warn={equipmentIssues !== null && equipmentIssues > 0}
        />
      </div>

      <div className="dashboard-module-section">
        <div className="dashboard-module-heading">
          <div>
            <p className="dashboard-kicker">Management modules</p>
            <h3>Open a workspace</h3>
          </div>
          <p>
            Each module now has its own route and workspace instead of appearing in one continuous page.
          </p>
        </div>

        <div className="dashboard-module-grid">
          {visibleModuleLinks.map((moduleLink) => (
            <AppLink className="dashboard-module-link" key={moduleLink.path} to={moduleLink.path}>
              <strong>{moduleLink.label}</strong>
              <span>{moduleLink.description}</span>
              <span className="dashboard-module-open">Open module →</span>
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
        {value === null ? 'Summary unavailable' : detail}
      </span>
    </AppLink>
  );
}
