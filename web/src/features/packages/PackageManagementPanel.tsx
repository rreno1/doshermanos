import { useEffect, useMemo, useState } from 'react';
import {
  ManagementFilterField,
  ManagementSelect,
  ManagementTableFrame,
  ManagementTabs,
  ManagementToolbar,
  useManagementPage,
} from '../../app/ManagementControls';
import { useToast } from '../../app/ToastProvider';
import { PackageEditorDialog } from './PackageEditorDialog';
import { loadManagedPackages, setManagedPackageActive } from './package.service';
import type { ManagedCateringPackage } from './package.types';
import './package-management.css';

type PackageSort = 'name' | 'price' | 'order';
type SortDirection = 'asc' | 'desc';

const tabs = [{ value: 'packages', label: 'Packages' }] as const;

export function PackageManagementPanel() {
  const { showToast } = useToast();
  const [packages, setPackages] = useState<ManagedCateringPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ManagedCateringPackage | null>(null);
  const [busyPackageId, setBusyPackageId] = useState<string | null>(null);
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
    setIsEditorOpen(true);
  }

  function openEditEditor(cateringPackage: ManagedCateringPackage) {
    setEditingPackage(cateringPackage);
    setIsEditorOpen(true);
  }

  async function handleStatusChange(cateringPackage: ManagedCateringPackage) {
    setBusyPackageId(cateringPackage.id);
    try {
      await setManagedPackageActive(cateringPackage.id, !cateringPackage.isActive);
      showToast({
        message: cateringPackage.isActive ? 'Package hidden.' : 'Package published.',
        tone: 'success',
      });
      await refreshPackages();
    } catch {
      showToast({ message: 'Package status could not be changed.', tone: 'error' });
    } finally {
      setBusyPackageId(null);
    }
  }

  const emptyMessage = packages.length === 0
    ? 'No packages yet.'
    : visiblePackages.length === 0
      ? 'No packages match the current view.'
      : undefined;

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
              <ManagementSelect
                value={statusFilter}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                onChange={setStatusFilter}
                ariaLabel="Filter packages by status"
              />
            </ManagementFilterField>
            <ManagementFilterField label="Sort by">
              <ManagementSelect
                value={sortBy}
                options={[
                  { value: 'order', label: 'Catalog order' },
                  { value: 'name', label: 'Name' },
                  { value: 'price', label: 'Base price' },
                ]}
                onChange={setSortBy}
                ariaLabel="Sort packages by"
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
                ariaLabel="Package sort direction"
              />
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

      <ManagementTableFrame
        loadingMessage={isLoading ? 'Loading catering packages…' : undefined}
        errorMessage={!isLoading && hasError ? 'Packages could not be loaded.' : undefined}
        emptyMessage={!isLoading && !hasError ? emptyMessage : undefined}
        pagination={!isLoading && !hasError && visiblePackages.length > 0 ? {
          page: page.page,
          totalItems: visiblePackages.length,
          onPageChange: page.setPage,
        } : undefined}
      >
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
      </ManagementTableFrame>

      <PackageEditorDialog
        isOpen={isEditorOpen}
        cateringPackage={editingPackage}
        onClose={() => setIsEditorOpen(false)}
        onSaved={(message) => {
          showToast({ message, tone: 'success' });
          void refreshPackages();
        }}
      />
    </section>
  );
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

function formatCurrency(valueInCentavos: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(valueInCentavos / 100);
}
