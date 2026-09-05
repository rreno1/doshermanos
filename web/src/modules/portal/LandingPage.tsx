import { useEffect, useState } from 'react';
import { loadActivePackages } from '../operations/package.service';
import type { CateringPackage } from '../operations/package.types';

export function LandingPage() {
  const [packages, setPackages] = useState<CateringPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setHasError(false);

    void loadActivePackages()
      .then((items) => {
        if (isCurrent) setPackages(items.slice(0, 3));
      })
      .catch(() => {
        if (isCurrent) setHasError(true);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <>
      <section className="landing-hero" aria-labelledby="landing-title">
        <p className="portal-eyebrow">Catering made easier</p>
        <h1 id="landing-title">Plan your event with Dos Hermanos.</h1>
        <p>
          Explore catering packages, then sign in with Google when you are ready to send your event details and track your request.
        </p>
        <a className="portal-primary-link" href="#featured-packages">Explore packages</a>
      </section>

      <section className="landing-featured" id="featured-packages" aria-labelledby="featured-title">
        <div className="portal-section-heading">
          <div>
            <p className="portal-eyebrow">Featured packages</p>
            <h2 id="featured-title">Start with a package that fits your event.</h2>
          </div>
          <p>Sign in from the header to open the customer portal and submit a reservation request.</p>
        </div>

        {isLoading ? <div className="portal-status">Loading featured packages…</div> : null}
        {hasError ? <div className="portal-status portal-status-error">Featured packages could not be loaded.</div> : null}
        {!isLoading && !hasError && packages.length === 0 ? (
          <div className="portal-status">No active catering packages are available yet.</div>
        ) : null}

        {!isLoading && !hasError && packages.length > 0 ? (
          <div className="landing-featured-grid">
            {packages.map((item) => (
              <article className="landing-package-card" key={item.id}>
                <div>
                  <span className="landing-package-label">Package</span>
                  <h3>{item.name}</h3>
                </div>
                <p>{item.description}</p>
                <strong>{formatMoney(item.priceInCentavos)} base</strong>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="landing-process" aria-labelledby="process-title">
        <div className="portal-section-heading">
          <div>
            <p className="portal-eyebrow">How it works</p>
            <h2 id="process-title">From package to event request.</h2>
          </div>
          <p>A request is reviewed before it becomes a confirmed catering event.</p>
        </div>
        <div className="landing-process-grid">
          <article><span>01</span><h3>Choose a package</h3><p>Review the current catering packages and base prices.</p></article>
          <article><span>02</span><h3>Sign in</h3><p>Continue with Google to access the customer portal.</p></article>
          <article><span>03</span><h3>Send event details</h3><p>Provide the event date, location, guest count, and requests.</p></article>
          <article><span>04</span><h3>Track the request</h3><p>Return to your portal to review reservation and payment activity.</p></article>
        </div>
      </section>

      <section className="landing-contact" aria-label="Dos Hermanos location">
        <div><p className="portal-eyebrow">Dos Hermanos Catering</p><h2>Serving events from Hilongos, Leyte.</h2></div>
        <p>Use Google login above when you are ready to start a reservation request.</p>
      </section>
    </>
  );
}

function formatMoney(amountInCentavos: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(amountInCentavos / 100);
}
