import type { EquipmentItem } from './equipment.types';

type Props = {
  items: EquipmentItem[];
  onEdit: (item: EquipmentItem) => void;
};

export function EquipmentRegistryGrid({ items, onEdit }: Props) {
  return (
    <div className="equipment-card-grid" aria-label="Equipment registry">
      {items.map((item) => {
        const issueCount = item.damagedQuantity + item.missingQuantity;
        const availabilityLabel = item.availableQuantity === 0 && item.isActive
          ? 'Unavailable'
          : item.isActive
            ? 'Available'
            : 'Inactive';
        const statusClass = !item.isActive
          ? 'management-status-badge management-status-badge-muted'
          : item.availableQuantity === 0
            ? 'management-status-badge management-status-badge-warn'
            : 'management-status-badge management-status-badge-active';

        return (
          <article className="equipment-card" key={item.id}>
            <div className="equipment-card-visual" aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <rect x="10" y="13" width="28" height="22" rx="4" />
                <path d="M16 13V9h16v4M16 35v4M32 35v4M16 23h16" />
              </svg>
            </div>

            <div className="equipment-card-body">
              <div className="equipment-card-heading">
                <div>
                  <span className="equipment-card-eyebrow">Equipment registry</span>
                  <h3>{item.name}</h3>
                </div>
                <span className={statusClass}>{availabilityLabel}</span>
              </div>

              <div className="equipment-card-quantity">
                <span className="equipment-card-quantity-value">
                  {item.availableQuantity.toLocaleString('en-PH')} {item.unit} available
                </span>
                <span>{item.totalQuantity.toLocaleString('en-PH')} total</span>
              </div>

              <div className="equipment-card-stats" aria-label={`${item.name} equipment quantities`}>
                <span><strong>{item.inUseQuantity.toLocaleString('en-PH')}</strong> in use</span>
                <span><strong>{item.damagedQuantity.toLocaleString('en-PH')}</strong> damaged</span>
                <span><strong>{item.missingQuantity.toLocaleString('en-PH')}</strong> missing</span>
              </div>

              <div className="equipment-card-footer">
                {issueCount > 0 ? (
                  <span className="equipment-card-issue">{issueCount.toLocaleString('en-PH')} issue{issueCount === 1 ? '' : 's'}</span>
                ) : (
                  <span className="equipment-card-clear">No recorded issues</span>
                )}
                <button type="button" className="management-row-button" onClick={() => onEdit(item)}>
                  Edit
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
