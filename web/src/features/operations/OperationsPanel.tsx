import { useState } from 'react';
import { ManagementTabs } from '../../app/ManagementControls';
import { ManualReservationPanel } from './ManualReservationPanel';
import { PackageManagementPanel } from './PackageManagementPanel';
import { ReservationReviewPanel } from './ReservationReviewPanel';
import './operations-layout.css';

type OperationsTab = 'manual' | 'pending' | 'packages';

const tabs = [
  { value: 'manual', label: 'Manual reservation' },
  { value: 'pending', label: 'Pending requests' },
  { value: 'packages', label: 'Manage Packages' },
] satisfies { value: OperationsTab; label: string }[];

export function OperationsPanel({ staffId, staffName }: { staffId: string; staffName: string }) {
  const [tab, setTab] = useState<OperationsTab>('manual');

  return (
    <section className="operations-section" id="operations" aria-label="Operations">
      <ManagementTabs value={tab} options={tabs} onChange={setTab} label="Operations views" />

      {tab === 'manual' ? <ManualReservationPanel staffId={staffId} staffName={staffName} /> : null}
      {tab === 'pending' ? <ReservationReviewPanel staffId={staffId} staffName={staffName} /> : null}
      {tab === 'packages' ? <PackageManagementPanel /> : null}
    </section>
  );
}
