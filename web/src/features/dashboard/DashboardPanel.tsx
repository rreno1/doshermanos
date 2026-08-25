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
      description: 'Review customer requests',
      path: `${workspaceBasePath}/reservations`,
    },
    {
      label: 'Packages',
      description: 'Manage catering packages',
      path: `${workspaceBasePath}/packages`,
    },
    {
      label: 'Inventory',
      description: 'Track stock and movements',
      path: `${workspaceBasePath}/inventory`,
    },
    {
      label: 'Payments',
      description: 'Record and review payments',
      path: `${workspaceBasePath}/payments`,
    },
    {
      label: 'Equipment',
      description: 'Manage event equipment',
      path: `${workspaceBasePath}/equipment`,
    },
    {
      label: 'Reports',
      description: 'View and export records',
      path: `${workspaceBasePath}/reports`,
    },
    {
      label: 'Users & roles',
      description: 'Manage account access',
      path: `${workspaceBasePath}/users`,
      adminOnly: true,
    },
    {
      label: 'Audit trail',
      description: 'Review system activity',
      path: `${workspaceBasePath}/audit`,
      adminOnly: true,
    },
  ];

  const visibleModuleLinks = moduleLinks.filter(
    (moduleLink) => !moduleLink.adminOnly || role === 'admin',
  );

  return (
    <section className="dashboard-section" id="dashboard" aria-label="Dashboard">
      <p className="dashboard-intro">
        See the operational items that need attention, then open a module to manage the details.
      </p>

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
          <div>
            <h3>Quick access</h3>
            <p>Jump directly to a management area.</p>
          </div>
        </div>

        <div className="dashboard-module-grid">
          {visibleModuleLinks.map((moduleLink) => (
            <AppLink className="dashboard-module-link" key={moduleLink.path} to={moduleLink.path}>
              <div className="dashboard-module-link-heading">
                <strong>{moduleLink.label}</strong>
                <span className="dashboard-module-icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20" focusable="false">
                    <path d="M4 10h11m-4-4 4 4-4 4" />
                  </svg>
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
