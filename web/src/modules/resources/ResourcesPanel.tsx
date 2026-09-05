import { useState } from 'react';
import { ManagementTabs } from '@shared/ui/ManagementControls';
import { BackToTopButton } from './BackToTopButton';
import { EquipmentPanel } from './EquipmentPanel';
import { InventoryPanel } from './InventoryPanel';
import './resources.css';
import './resources-scroll.css';

type ResourcesTab =
  | 'inventory-items'
  | 'inventory-activity'
  | 'equipment-registry'
  | 'assignments'
  | 'equipment-activity';

const tabs = [
  { value: 'inventory-items', label: 'Inventory Items' },
  { value: 'inventory-activity', label: 'Inventory Activity' },
  { value: 'equipment-registry', label: 'Equipment Registry' },
  { value: 'assignments', label: 'Assignments' },
  { value: 'equipment-activity', label: 'Equipment Activity' },
] satisfies { value: ResourcesTab; label: string }[];

export function ResourcesPanel({ staffId, staffName }: { staffId: string; staffName: string }) {
  const [tab, setTab] = useState<ResourcesTab>('inventory-items');

  return (
    <section className="resources-section" id="resources" aria-label="Resources">
      <ManagementTabs value={tab} options={tabs} onChange={setTab} label="Resource views" />

      {tab === 'inventory-items' || tab === 'inventory-activity' ? (
        <InventoryPanel
          staffId={staffId}
          staffName={staffName}
          view={tab === 'inventory-items' ? 'items' : 'activity'}
        />
      ) : (
        <EquipmentPanel
          staffId={staffId}
          staffName={staffName}
          view={tab === 'equipment-registry' ? 'registry' : tab === 'assignments' ? 'assignments' : 'activity'}
        />
      )}

      <BackToTopButton />
    </section>
  );
}
