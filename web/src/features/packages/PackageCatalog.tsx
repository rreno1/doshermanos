import { useEffect, useState } from 'react';
import { PackageCard } from './PackageCard';
import { loadActivePackages } from './package.service';
import type { CateringPackage } from './package.types';

type CatalogState =
  | { status: 'loading'; packages: CateringPackage[] }
  | { status: 'ready'; packages: CateringPackage[] }
  | { status: 'error'; packages: CateringPackage[] };

export function PackageCatalog() {
  const [catalogState, setCatalogState] = useState<CatalogState>({
    status: 'loading',
    packages: [],
  });

  useEffect(() => {
    let isCurrentRequest = true;

    async function loadPackages() {
      try {
        const packages = await loadActivePackages();

        if (isCurrentRequest) {
          setCatalogState({ status: 'ready', packages });
        }
      } catch {
        if (isCurrentRequest) {
          setCatalogState({ status: 'error', packages: [] });
        }
      }
    }

    void loadPackages();

    return () => {
      isCurrentRequest = false;
    };
  }, []);

  return (
    <section className="catalog-section" id="packages" aria-labelledby="packages-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Available packages</p>
          <h2 id="packages-title">Find the right starting point.</h2>
        </div>
        <p>
          Package availability is loaded directly from the current Dos Hermanos catalog.
        </p>
      </div>

      {catalogState.status === 'loading' ? (
        <div className="catalog-status" role="status">
          <span className="loading-dot" aria-hidden="true" />
          Loading available packages…
        </div>
      ) : null}

      {catalogState.status === 'error' ? (
        <div className="catalog-status catalog-error" role="alert">
          We could not load the packages right now. Please refresh and try again.
        </div>
      ) : null}

      {catalogState.status === 'ready' && catalogState.packages.length === 0 ? (
        <div className="catalog-status">
          No catering packages are available right now. Please check again later.
        </div>
      ) : null}

      {catalogState.status === 'ready' && catalogState.packages.length > 0 ? (
        <div className="package-grid">
          {catalogState.packages.map((cateringPackage) => (
            <PackageCard
              key={cateringPackage.id}
              cateringPackage={cateringPackage}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
