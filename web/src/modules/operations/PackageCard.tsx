import type { CateringPackage } from './package.types';

type PackageCardProps = {
  cateringPackage: CateringPackage;
  onRequest?: () => void;
};

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function PackageCard({ cateringPackage, onRequest }: PackageCardProps) {
  const displayedMenuItems = cateringPackage.menuHighlights.slice(0, 4);
  const remainingItemCount = Math.max(
    cateringPackage.menuHighlights.length - displayedMenuItems.length,
    0,
  );

  return (
    <article className="package-card">
      <div className="package-card-heading">
        <div>
          <p className="package-label">Catering package</p>
          <h3>{cateringPackage.name}</h3>
        </div>
        <p className="package-price">
          <span>Starting at</span>
          {pesoFormatter.format(cateringPackage.priceInCentavos / 100)}
        </p>
      </div>

      <p className="package-description">{cateringPackage.description}</p>

      {displayedMenuItems.length > 0 ? (
        <div className="package-menu" aria-label="Package highlights">
          {displayedMenuItems.map((menuItem) => (
            <span key={menuItem}>{menuItem}</span>
          ))}
          {remainingItemCount > 0 ? <span>{remainingItemCount} more</span> : null}
        </div>
      ) : null}

      {onRequest ? (
        <button className="package-action" type="button" onClick={onRequest}>
          Request this package
        </button>
      ) : null}
    </article>
  );
}
