import { useEffect, useMemo, useState } from 'react';
import {
  ManagementFilterField,
  ManagementSelect,
  ManagementTableFrame,
  ManagementTabs,
  ManagementToolbar,
  useManagementPage,
} from '@shared/ui/ManagementControls';
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
  const emptyMessage = activities.length === 0
    ? 'No audit activity yet.'
    : visibleActivities.length === 0
      ? 'No audit activity matches the current view.'
      : undefined;

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
              <ManagementSelect
                value={kindFilter}
                options={[
                  { value: 'all', label: 'All activity' },
                  { value: 'inventory', label: 'Inventory' },
                  { value: 'payment', label: 'Payments' },
                  { value: 'reservation', label: 'Reservations' },
                  { value: 'equipment', label: 'Equipment' },
                ]}
                onChange={setKindFilter}
                ariaLabel="Filter audit activity by category"
              />
            </ManagementFilterField>
            <ManagementFilterField label="Sort by">
              <ManagementSelect
                value={sortBy}
                options={[
                  { value: 'date', label: 'Recorded date' },
                  { value: 'activity', label: 'Activity' },
                  { value: 'actor', label: 'Actor' },
                ]}
                onChange={setSortBy}
                ariaLabel="Sort audit activity by"
              />
            </ManagementFilterField>
            <ManagementFilterField label="Direction">
              <ManagementSelect
                value={sortDirection}
                options={[
                  { value: 'asc', label: 'Ascending' },
                  { value: 'desc', label: 'Descending' },
                ]}
                onChange={setSortDirection}
                ariaLabel="Audit sort direction"
              />
            </ManagementFilterField>
            <button type="button" className="management-secondary-button" onClick={() => { setKindFilter('all'); setSortBy('date'); setSortDirection('desc'); }}>Reset filters</button>
          </>
        )}
      />

      <ManagementTableFrame
        loadingMessage={isLoading ? 'Loading audit activity…' : undefined}
        errorMessage={!isLoading && hasError ? 'Audit activity could not be loaded.' : undefined}
        emptyMessage={!isLoading && !hasError ? emptyMessage : undefined}
        pagination={!isLoading && !hasError && visibleActivities.length > 0 ? {
          page: page.page,
          totalItems: visibleActivities.length,
          onPageChange: page.setPage,
        } : undefined}
      >
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
      </ManagementTableFrame>
    </section>
  );
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

function formatAuditTime(date: Date) {
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
