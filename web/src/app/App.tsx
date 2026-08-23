import { AuthMenu } from '../features/auth/AuthMenu';
import { PackageCatalog } from '../features/packages/PackageCatalog';
import { MyReservations } from '../features/reservations/MyReservations';

export function App() {
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
      </main>

      <footer className="site-footer">
        <span>Dos Hermanos Catering</span>
        <span>Hilongos, Leyte</span>
      </footer>
    </div>
  );
}
