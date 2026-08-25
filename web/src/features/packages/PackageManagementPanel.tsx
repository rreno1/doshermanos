import { useEffect, useMemo, useState } from 'react';
import {
  ManagementFilterField,
  ManagementPagination,
  ManagementTabs,
  ManagementToolbar,
  useManagementPage,
} from '../../app/ManagementControls';
import { PackageEditorDialog } from './PackageEditorDialog';
import { loadManagedPackages, setManagedPackageActive } from './package.service';
import type { ManagedCateringPackage } from './package.types';
import './package-management.css';

type PackageSort = 'name' | 'price' | 'order';
type SortDirection = 'asc' | 'desc';

const tabs = [{ value: 'packages', label: 'Packages' }] as const;

export function PackageManagementPanel() {
  const [packages, setPackages] = useState<ManagedCateringPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ManagedCateringPackage | null>(null);
  const [busyPackageId, setBusyPackageId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [queryText, setQueryText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<PackageSort>('order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    void refreshPackages();
  }, []);

  const activeCount = useMemo(
    () => packages.filter((cateringPackage) => cateringPackage.isActive).length,
    [packages],
  );
  const visiblePackages = useMemo(
    () => filterPackages(packages, queryText, statusFilter, sortBy, sortDirection),
    [packages, queryText, statusFilter, sortBy, sortDirection],
  );
  const page = useManagementPage(
    visiblePackages,
    `${queryText}|${statusFilter}|${sortBy}|${sortDirection}`,
  );

  async function refreshPackages() {
    setIsLoading(true);
    setHasError(false);
    try {
      setPackages(await loadManagedPackages());
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateEditor() {
    setEditingPackage(null);
    setMessage(null);
    setIsEditorOpen(true);
  }

  function openEditEditor(cateringPackage: ManagedCateringPackage) {
    setEditingPackage(cateringPackage);
    setMessage(null);
    setIsEditorOpen(true);
  }

  async function handleStatusChange(cateringPackage: ManagedCateringPackage) {
    setBusyPackageId(cateringPackage.id);
    setMessage(null);
    try {
      await setManagedPackageActive(cateringPackage.id, !cateringPackage.isActive);
      setMessage(cateringPackage.isActive ? 'Package hidden.' : 'Package published.');
      await refreshPackages();
    } catch {
      setMessage('Package status could not be changed.');
    } finally {
      setBusyPackageId(null);
    }
  }

  return (
    <section className="package-management-section" aria-label="Packages">
      <ManagementTabs value="packages" options={[...tabs]} onChange={() => undefined} label="Package views" />

      <ManagementToolbar
        summary={[
          { label: 'packages', value: packages.length },
          { label: 'active', value: activeCount },
          { label: 'inactive', value: packages.length - activeCount },
        ]}
        searchValue={queryText}
        searchPlaceholder="Search packages"
        onSearchChange={setQueryText}
        filterContent={(
          <>
            <ManagementFilterField label="Status">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </ManagementFilterField>
            <ManagementFilterField label="Sort by">
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as PackageSort)}>
                <option value="order">Catalog order</option>
                <option value="name">Name</option>
                <option value="price">Base price</option>
              </select>
            </ManagementFilterField>
            <ManagementFilterField label="Direction">
              <select value={sortDirection} onChange={(event) => setSortDirection(event.target.value as SortDirection)}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </ManagementFilterField>
            <button
              type="button"
              className="management-secondary-button"
              onClick={() => {
                setStatusFilter('all');
                setSortBy('order');
                setSortDirection('asc');
              }}
            >
              Reset filters
            </button>
          </>
        )}
        primaryAction={(
          <button type="button" className="management-primary-button" onClick={openCreateEditor}>
            Add package
          </button>
        )}
      />

      {message ? <div className="package-management-message" role="status">{message}</div> : null}
      {renderContent()}

      <PackageEditorDialog
        isOpen={isEditorOpen}
        cateringPackage={editingPackage}
        onClose={() => setIsEditorOpen(false)}
        onSaved={(nextMessage) => {
          setMessage(nextMessage);
          void refreshPackages();
        }}
      />
    </section>
  );

  function renderContent() {
    if (isLoading) return <ManagementStatus message="Loading packages…" />;
    if (hasError) return <ManagementStatus message="Packages could not be loaded." error />;
    if (visiblePackages.length === 0) {
      return <ManagementStatus message={packages.length === 0 ? 'No packages yet.' : 'No packages match the current view.'} />;
    }

    return (
      <>
        <div className="management-table-wrap">
          <table className="management-table">
            <thead>
              <tr>
                <th scope="col">Package</th>
                <th scope="col">Base price</th>
                <th scope="col">Catalog order</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {page.pageItems.map((cateringPackage) => (
                <tr key={cateringPackage.id}>
                  <td>
                    <div className="management-table-primary">
                      <strong>{cateringPackage.name}</strong>
                      <span>{cateringPackage.menuHighlights.length} menu items</span>
                    </div>
                  </td>
                  <td>{formatCurrency(cateringPackage.priceInCentavos)}</td>
                  <td>{cateringPackage.sortOrder.toLocaleString('en-PH')}</td>
                  <td>
                    <span className={cateringPackage.isActive ? 'management-status-badge management-status-badge-active' : 'management-status-badge management-status-badge-muted'}>
                      {cateringPackage.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="management-table-actions">
                      <button type="button" className="management-row-button" onClick={() => openEditEditor(cateringPackage)}>Edit</button>
                      <button
                        type="button"
                        className="management-row-button"
                        disabled={busyPackageId === cateringPackage.id}
                        onClick={() => void handleStatusChange(cateringPackage)}
                      >
                        {busyPackageId === cateringPackage.id ? 'Saving…' : cateringPackage.isActive ? 'Hide' : 'Publish'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ManagementPagination page={page.page} totalItems={visiblePackages.length} onPageChange={page.setPage} />
      </>
    );
  }
}

function filterPackages(packages: ManagedCateringPackage[], query: string, status: string, sortBy: PackageSort, direction: SortDirection) {
  const text = query.trim().toLocaleLowerCase();
  return [...packages]
    .filter((cateringPackage) => status === 'all' || (status === 'active' ? cateringPackage.isActive : !cateringPackage.isActive))
    .filter((cateringPackage) => !text || `${cateringPackage.name} ${cateringPackage.description} ${cateringPackage.menuHighlights.join(' ')}`.toLocaleLowerCase().includes(text))
    .sort((left, right) => {
      const leftValue = sortBy === 'price' ? left.priceInCentavos : sortBy === 'name' ? left.name : left.sortOrder;
      const rightValue = sortBy === 'price' ? right.priceInCentavos : sortBy === 'name' ? right.name : right.sortOrder;
      const result = typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue), 'en-PH', { sensitivity: 'base' });
      return direction === 'asc' ? result : -result;
    });
}

function ManagementStatus({ message, error = false }: { message: string; error?: boolean }) {
  return <div className={error ? 'management-empty-state management-empty-state-error' : 'management-empty-state'} role={error ? 'alert' : 'status'}>{message}</div>;
}

function formatCurrency(valueInCentavos: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(valueInCentavos / 100);
}
