import { ResponsiveButtonContent } from '@shared/ui/ResponsiveButtonContent';
import { useResourceImageUrl } from './ResourceImagePicker';
import type { EquipmentItem } from './equipment.types';

type Props = {
  items: EquipmentItem[];
  onEdit: (item: EquipmentItem) => void;
};

export function EquipmentRegistryGrid({ items, onEdit }: Props) {
  return (
    <div className="inventory-card-grid" aria-label="Equipment registry">
      {items.map((item) => (
        <EquipmentCard key={item.id} item={item} onEdit={() => onEdit(item)} />
      ))}
    </div>
  );
}

function EquipmentCard({ item, onEdit }: { item: EquipmentItem; onEdit: () => void }) {
  const imageUrl = useResourceImageUrl('equipment', item.id, item.updatedAt.getTime());
  const issueCount = item.damagedQuantity + item.missingQuantity;
  const availabilityLabel = item.availableQuantity === 0 && item.isActive ? 'Unavailable' : item.isActive ? 'Available' : 'Inactive';
  const statusClass = !item.isActive
    ? 'management-status-badge management-status-badge-muted'
    : item.availableQuantity === 0
      ? 'management-status-badge management-status-badge-warn'
      : 'management-status-badge management-status-badge-active';

  return (
    <article className="inventory-card equipment-card">
      <div className="inventory-card-image-wrap">
        {imageUrl ? (
          <img className="inventory-card-image" src={imageUrl} alt="" loading="lazy" />
        ) : (
          <div className="inventory-card-placeholder" aria-hidden="true"><EquipmentPlaceholderIcon /></div>
        )}
      </div>

      <div className="inventory-card-body">
        <div className="inventory-card-heading">
          <div>
            <span className="inventory-card-eyebrow">Equipment registry</span>
            <h3>{item.name}</h3>
          </div>
          <span className={statusClass}>{availabilityLabel}</span>
        </div>

        <div className="inventory-card-stock">
          <span className="inventory-card-stock-value">{item.availableQuantity.toLocaleString('en-PH')} {item.unit} available</span>
          <span className="inventory-card-threshold">{item.totalQuantity.toLocaleString('en-PH')} {item.unit} total</span>
        </div>

        <div className="equipment-card-stats" aria-label={`${item.name} equipment quantities`}>
          <span><strong>{item.inUseQuantity.toLocaleString('en-PH')}</strong> in use</span>
          <span><strong>{item.damagedQuantity.toLocaleString('en-PH')}</strong> damaged</span>
          <span><strong>{item.missingQuantity.toLocaleString('en-PH')}</strong> missing</span>
        </div>

        <div className="equipment-card-footer">
          <span className={issueCount > 0 ? 'equipment-card-issue' : 'equipment-card-clear'}>
            {issueCount > 0 ? `${issueCount.toLocaleString('en-PH')} issue${issueCount === 1 ? '' : 's'}` : 'No recorded issues'}
          </span>
          <button
            type="button"
            className="management-row-button responsive-action-button"
            aria-label={`Edit ${item.name}`}
            title={`Edit ${item.name}`}
            onClick={onEdit}
          >
            <ResponsiveButtonContent icon="edit" label="Edit" />
          </button>
        </div>
      </div>
    </article>
  );
}

function EquipmentPlaceholderIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="10" y="13" width="28" height="22" rx="4" />
      <path d="M16 13V9h16v4M16 35v4M32 35v4M16 23h16" />
    </svg>
  );
}
