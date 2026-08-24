import { AuthMenu } from '../features/auth/AuthMenu';
import { useAuth } from '../features/auth/AuthProvider';
import { InventoryPanel } from '../features/inventory/InventoryPanel';
import { PackageCatalog } from '../features/packages/PackageCatalog';
import { MyPayments } from '../features/payments/MyPayments';
import { PaymentsPanel } from '../features/payments/PaymentsPanel';
import { MyReservations } from '../features/reservations/MyReservations';

export function App() {
  const { authState } = useAuth();
  const isStaffWorkspace =
    authState.status === 'active' &&
    (authState.profile?.role === 'staff' || authState.profile?.role === 'admin');

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
            <section className="hero" aria-labelledby="hero-title">
              <p className="eyebrow">Staff workspace</p>
              <h1 id="hero-title">Keep operations ready for every event.</h1>
              <p className="hero-copy">
                Review inventory, record payments, and keep the operational history clear for every reservation.
              </p>
              <a className="primary-link" href="#inventory">
                Review operations
              </a>
            </section>
            <InventoryPanel
              staffId={authState.profile.id}
              staffName={authState.profile.displayName}
            />
            <PaymentsPanel
              staffId={authState.profile.id}
              staffName={authState.profile.displayName}
            />
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
