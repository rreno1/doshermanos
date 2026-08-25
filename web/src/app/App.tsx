import { AuditPanel } from '../features/audit/AuditPanel';
import { AuthMenu } from '../features/auth/AuthMenu';
import { useAuth } from '../features/auth/AuthProvider';
import { DashboardPanel } from '../features/dashboard/DashboardPanel';
import { EquipmentPanel } from '../features/equipment/EquipmentPanel';
import { InventoryPanel } from '../features/inventory/InventoryPanel';
import { PackageCatalog } from '../features/packages/PackageCatalog';
import { MyPayments } from '../features/payments/MyPayments';
import { PaymentsPanel } from '../features/payments/PaymentsPanel';
import { ReportsPanel } from '../features/reports/ReportsPanel';
import { MyReservations } from '../features/reservations/MyReservations';
import { ReservationReviewPanel } from '../features/reservations/ReservationReviewPanel';
import '../styles/staff-workspace.css';

export function App() {
  const { authState } = useAuth();
  const isStaffWorkspace =
    authState.status === 'active' &&
    (authState.profile?.role === 'staff' || authState.profile?.role === 'admin');
  const isAdminWorkspace =
    authState.status === 'active' && authState.profile?.role === 'admin';

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Dos Hermanos Catering home">
          <span className="brand-name">Dos Hermanos</span>
          <span className="brand-label">Catering</span>
        </a>
        <AuthMenu />
      </header>

      <main id="top">
        {isStaffWorkspace && authState.profile ? (
          <>
            <section className="hero staff-hero" aria-labelledby="hero-title">
              <p className="eyebrow">Staff workspace</p>
              <h1 id="hero-title">Keep operations ready for every event.</h1>
              <p className="hero-copy">
                Check the operational summary, then move directly to the area that needs attention.
              </p>
              <a className="primary-link" href="#dashboard">
                View dashboard
              </a>
            </section>

            <DashboardPanel />

            <section
              className="staff-navigation"
              id="staff-navigation"
              aria-labelledby="staff-navigation-title"
            >
              <div className="staff-navigation-heading">
                <div>
                  <p className="eyebrow">Operations</p>
                  <h2 id="staff-navigation-title">Workspace navigation</h2>
                </div>
                <p>Choose the area you need. Each link moves to an existing protected workspace.</p>
              </div>
              <nav className="staff-navigation-links" aria-label="Staff workspace">
                <a href="#dashboard">Dashboard</a>
                <a href="#reports">Reports</a>
                <a href="#reservation-review">Reservations</a>
                <a href="#inventory">Inventory</a>
                <a href="#payments">Payments</a>
                <a href="#equipment">Equipment</a>
                {isAdminWorkspace ? <a href="#audit">Audit trail</a> : null}
              </nav>
            </section>

            <ReportsPanel />
            <ReservationReviewPanel
              staffId={authState.profile.id}
              staffName={authState.profile.displayName}
            />
            <InventoryPanel
              staffId={authState.profile.id}
              staffName={authState.profile.displayName}
            />
            <PaymentsPanel
              staffId={authState.profile.id}
              staffName={authState.profile.displayName}
            />
            <EquipmentPanel
              staffId={authState.profile.id}
              staffName={authState.profile.displayName}
            />
            {isAdminWorkspace ? <AuditPanel /> : null}
          </>
        ) : (
          <>
            <section className="hero" aria-labelledby="hero-title">
              <p className="eyebrow">Catering made easier</p>
              <h1 id="hero-title">Choose a package that fits your event.</h1>
              <p className="hero-copy">
                Browse available packages, send your event details, and track the request in one place.
              </p>
              <a className="primary-link" href="#packages">
                View packages
              </a>
            </section>

            <PackageCatalog />
            <MyReservations />
            <MyPayments />
          </>
        )}
      </main>

      <footer className="site-footer">
        <span>Dos Hermanos Catering</span>
        <span>Hilongos, Leyte</span>
      </footer>
    </div>
  );
}
