import { useState } from 'react';
import { ManagementTabs } from '@shared/ui/ManagementControls';
import { BackToTopButton } from './BackToTopButton';
import { EquipmentPanel, type EquipmentView } from './EquipmentPanel';
import { InventoryPanel, type InventoryView } from './InventoryPanel';
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
      {renderResourceView(tab, staffId, staffName)}
      <BackToTopButton />
    </section>
  );
}

function renderResourceView(tab: ResourcesTab, staffId: string, staffName: string) {
  const inventoryView = getInventoryView(tab);
  if (inventoryView) {
    return <InventoryPanel staffId={staffId} staffName={staffName} view={inventoryView} />;
  }

  return <EquipmentPanel staffId={staffId} staffName={staffName} view={getEquipmentView(tab)} />;
}

function getInventoryView(tab: ResourcesTab): InventoryView | null {
  if (tab === 'inventory-items') return 'items';
  if (tab === 'inventory-activity') return 'activity';
  return null;
}

function getEquipmentView(tab: ResourcesTab): EquipmentView {
  if (tab === 'equipment-registry') return 'registry';
  if (tab === 'assignments') return 'assignments';
  return 'activity';
}
