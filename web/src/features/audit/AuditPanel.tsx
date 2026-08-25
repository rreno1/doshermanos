import { useEffect, useMemo, useState } from 'react';
import {
  ManagementFilterField,
  ManagementPagination,
  ManagementTabs,
  ManagementToolbar,
  useManagementPage,
} from '../../app/ManagementControls';
import { subscribeToAuditActivity } from './audit.service';
import type { AuditActivity } from './audit.types';
import './audit.css';

type AuditSort = 'date' | 'activity' | 'actor';
type SortDirection = 'asc' | 'desc';

const tabs = [{ value: 'activity', label: 'Activity' }] as const;

export function AuditPanel() {
  const [activities, setActivities] = useState<AuditActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [kindFilter, setKindFilter] = useState('all');
  const [sortBy, setSortBy] = useState<AuditSort>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    return subscribeToAuditActivity(
      (nextActivities) => {
        setActivities(nextActivities);
        setIsLoading(false);
      },
      () => {
        setHasError(true);
        setIsLoading(false);
      },
    );
  }, []);

  const visibleActivities = useMemo(
    () => filterActivities(activities, queryText, kindFilter, sortBy, sortDirection),
    [activities, queryText, kindFilter, sortBy, sortDirection],
  );
  const page = useManagementPage(
    visibleActivities,
    `${queryText}|${kindFilter}|${sortBy}|${sortDirection}`,
  );

  return (
    <section className="audit-section" id="audit" aria-label="Audit trail">
      <ManagementTabs value="activity" options={[...tabs]} onChange={() => undefined} label="Audit views" />

      <ManagementToolbar
        summary={[{ label: 'activity records', value: activities.length }]}
        searchValue={queryText}
        searchPlaceholder="Search audit activity"
        onSearchChange={setQueryText}
        filterContent={(
          <>
            <ManagementFilterField label="Activity type">
              <select value={kindFilter} onChange={(event) => setKindFilter(event.target.value)}>
                <option value="all">All activity</option>
                <option value="inventory">Inventory</option>
                <option value="payment">Payments</option>
                <option value="reservation">Reservations</option>
                <option value="equipment">Equipment</option>
              </select>
            </ManagementFilterField>
            <ManagementFilterField label="Sort by">
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as AuditSort)}>
                <option value="date">Recorded date</option>
                <option value="activity">Activity</option>
                <option value="actor">Actor</option>
              </select>
            </ManagementFilterField>
            <ManagementFilterField label="Direction">
              <select value={sortDirection} onChange={(event) => setSortDirection(event.target.value as SortDirection)}>
                <option value="asc">Ascending</option><option value="desc">Descending</option>
              </select>
            </ManagementFilterField>
            <button type="button" className="management-secondary-button" onClick={() => { setKindFilter('all'); setSortBy('date'); setSortDirection('desc'); }}>Reset filters</button>
          </>
        )}
      />

      {renderContent()}
    </section>
  );

  function renderContent() {
    if (isLoading) return <AuditStatus message="Loading audit activity…" />;
    if (hasError) return <AuditStatus message="Audit activity could not be loaded." error />;
    if (visibleActivities.length === 0) return <AuditStatus message={activities.length === 0 ? 'No audit activity yet.' : 'No audit activity matches the current view.'} />;

    return (
      <>
        <div className="management-table-wrap">
          <table className="management-table">
            <thead><tr><th>Activity</th><th>Category</th><th>Actor</th><th>Recorded at</th></tr></thead>
            <tbody>
              {page.pageItems.map((activity) => (
                <tr key={activity.id}>
                  <td><div className="management-table-primary"><strong>{activity.title}</strong><span>{activity.detail}</span></div></td>
                  <td><span className="management-status-badge">{formatCategory(activity.kind)}</span></td>
                  <td>{activity.actorName}</td>
                  <td>{formatAuditTime(activity.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ManagementPagination page={page.page} totalItems={visibleActivities.length} onPageChange={page.setPage} />
      </>
    );
  }
}

function filterActivities(activities: AuditActivity[], query: string, category: string, sortBy: AuditSort, direction: SortDirection) {
  const text = query.trim().toLocaleLowerCase();
  return [...activities]
    .filter((activity) => category === 'all' || activity.kind.startsWith(`${category}_`))
    .filter((activity) => !text || `${activity.title} ${activity.detail} ${activity.actorName} ${activity.kind}`.toLocaleLowerCase().includes(text))
    .sort((left, right) => {
      const leftValue = sortBy === 'activity' ? left.title : sortBy === 'actor' ? left.actorName : left.createdAt.getTime();
      const rightValue = sortBy === 'activity' ? right.title : sortBy === 'actor' ? right.actorName : right.createdAt.getTime();
      const result = typeof leftValue === 'number' && typeof rightValue === 'number' ? leftValue - rightValue : String(leftValue).localeCompare(String(rightValue), 'en-PH', { sensitivity: 'base' });
      return direction === 'asc' ? result : -result;
    });
}

function formatCategory(kind: AuditActivity['kind']) {
  if (kind.startsWith('inventory_')) return 'Inventory';
  if (kind.startsWith('payment_')) return 'Payments';
  if (kind.startsWith('reservation_')) return 'Reservations';
  return 'Equipment';
}

function AuditStatus({ message, error = false }: { message: string; error?: boolean }) {
  return <div className={error ? 'management-empty-state management-empty-state-error' : 'management-empty-state'} role={error ? 'alert' : 'status'}>{message}</div>;
}

function formatAuditTime(date: Date) { return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(date); }
