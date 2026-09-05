import { useEffect, useState } from 'react';
import { ResponsiveButtonContent } from '@shared/ui/ResponsiveButtonContent';
import { useAuth } from '../auth/AuthProvider';
import { ReservationRequestDialog } from './ReservationRequestDialog';
import { loadActivePackages } from './package.service';
import type { CateringPackage } from './package.types';

type PackageState =
  | { status: 'loading'; packages: CateringPackage[]; message: string | null }
  | { status: 'ready'; packages: CateringPackage[]; message: string | null }
  | { status: 'error'; packages: CateringPackage[]; message: string };

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function PackageCatalog() {
  const { authState } = useAuth();
  const [packageState, setPackageState] = useState<PackageState>({
    status: 'loading',
    packages: [],
    message: null,
  });
  const [selectedPackage, setSelectedPackage] = useState<CateringPackage | null>(null);

  useEffect(() => {
    let cancelled = false;

    void loadActivePackages()
      .then((packages) => {
        if (!cancelled) {
          setPackageState({ status: 'ready', packages, message: null });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPackageState({
            status: 'error',
            packages: [],
            message: 'We could not load catering packages right now. Please try again later.',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const canRequest = authState.status === 'active' && authState.profile?.role === 'customer';
  const managementViewer = authState.status === 'active' &&
    (authState.profile?.role === 'staff' || authState.profile?.role === 'admin');

  return (
    <section className="catalog-section" id="packages" aria-labelledby="packages-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Catering packages</p>
          <h2 id="packages-title">Simple choices, ready to customize.</h2>
        </div>
        <p>
          {canRequest
            ? 'Choose a base package, add your event details and customization requests, then send it for review.'
            : managementViewer
              ? 'Browse the customer-facing package catalog. Manual reservation requests are entered from your Workspace.'
              : 'Browse the current packages. Use Google login in the header when you are ready to request one.'}
        </p>
      </div>

      {packageState.status === 'loading' ? (
        <div className="catalog-status" role="status">
          <span className="loading-dot" aria-hidden="true" />
          Loading packages…
        </div>
      ) : null}

      {packageState.status === 'error' ? (
        <div className="catalog-status catalog-error" role="alert">
          {packageState.message}
        </div>
      ) : null}

      {packageState.status === 'ready' && packageState.packages.length === 0 ? (
        <div className="catalog-status">No active catering packages are available yet.</div>
      ) : null}

      {packageState.status === 'ready' && packageState.packages.length > 0 ? (
        <div className="package-grid">
          {packageState.packages.map((cateringPackage) => (
            <article className="package-card" key={cateringPackage.id}>
              <div className="package-card-heading">
                <div>
                  <p className="package-label">Package</p>
                  <h3>{cateringPackage.name}</h3>
                </div>
                <p className="package-price">
                  <span>Starts at</span>
                  {pesoFormatter.format(cateringPackage.priceInCentavos / 100)}
                </p>
              </div>
              <p className="package-description">{cateringPackage.description}</p>
              {cateringPackage.menuHighlights.length > 0 ? (
                <div className="package-menu">
                  {cateringPackage.menuHighlights.map((menuItem) => (
                    <span key={menuItem}>{menuItem}</span>
                  ))}
                </div>
              ) : null}
              {canRequest ? (
                <div className="package-card-action">
                  <button
                    className="primary-button responsive-action-button"
                    type="button"
                    aria-label={`Request ${cateringPackage.name}`}
                    title={`Request ${cateringPackage.name}`}
                    onClick={() => setSelectedPackage(cateringPackage)}
                  >
                    <ResponsiveButtonContent icon="add" label="Request this package" />
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      <ReservationRequestDialog
        cateringPackage={selectedPackage}
        onClose={() => setSelectedPackage(null)}
      />
    </section>
  );
}
