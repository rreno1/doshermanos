import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@core/app/ToastProvider';
import {
  ManagementFilterField,
  ManagementSelect,
  ManagementTableFrame,
  ManagementToolbar,
  useManagementPage,
} from '@shared/ui/ManagementControls';
import { PackageEditorDialog } from './PackageEditorDialog';
import { loadManagedPackages, setManagedPackageActive } from './package.service';
import type { ManagedCateringPackage } from './package.types';
import './package-management.css';

type PackageSort = 'name' | 'price' | 'order';
type SortDirection = 'asc' | 'desc';
type PackageSortValue = string | number;

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
  const emptyMessage = getPackageEmptyMessage(packages.length, visiblePackages.length);

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

  function resetFilters() {
    setStatusFilter('all');
    setSortBy('order');
    setSortDirection('asc');
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

  return (
    <div className="package-management-section" aria-label="Manage packages">
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
            <button type="button" className="management-secondary-button" onClick={resetFilters}>
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
                <th scope="col" className="col-primary">Package</th>
                <th scope="col" className="col-secondary">Base price</th>
                <th scope="col" className="col-secondary col-hide-mobile">Catalog order</th>
                <th scope="col" className="col-status">Status</th>
                <th scope="col" className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {page.pageItems.map((cateringPackage) => (
                <tr key={cateringPackage.id}>
                  <td className="col-primary">
                    <div className="management-table-primary">
                      <strong>{cateringPackage.name}</strong>
                      <span>{cateringPackage.menuHighlights.length} menu items</span>
                    </div>
                  </td>
                  <td className="col-secondary">{formatCurrency(cateringPackage.priceInCentavos)}</td>
                  <td className="col-secondary col-hide-mobile">{cateringPackage.sortOrder.toLocaleString('en-PH')}</td>
                  <td className="col-status">
                    <span className={getPackageStatusClass(cateringPackage.isActive)}>
                      {cateringPackage.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="management-table-actions">
                      <button type="button" className="management-row-button" onClick={() => openEditEditor(cateringPackage)}>Edit</button>
                      <button
                        type="button"
                        className="management-row-button"
                        disabled={busyPackageId === cateringPackage.id}
                        onClick={() => void handleStatusChange(cateringPackage)}
                      >
                        {getPackageStatusActionLabel(cateringPackage, busyPackageId)}
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
    </div>
  );
}

function getPackageEmptyMessage(totalCount: number, visibleCount: number) {
  if (totalCount === 0) return 'No packages yet.';
  if (visibleCount === 0) return 'No packages match the current view.';
  return undefined;
}

function getPackageStatusClass(isActive: boolean) {
  return isActive
    ? 'management-status-badge management-status-badge-active'
    : 'management-status-badge management-status-badge-muted';
}

function getPackageStatusActionLabel(cateringPackage: ManagedCateringPackage, busyPackageId: string | null) {
  if (busyPackageId === cateringPackage.id) return 'Saving…';
  return cateringPackage.isActive ? 'Hide' : 'Publish';
}

function filterPackages(
  packages: ManagedCateringPackage[],
  query: string,
  status: string,
  sortBy: PackageSort,
  direction: SortDirection,
) {
  const text = query.trim().toLocaleLowerCase();
  return [...packages]
    .filter((cateringPackage) => status === 'all' || matchesPackageStatus(cateringPackage, status))
    .filter((cateringPackage) => matchesPackageQuery(cateringPackage, text))
    .sort((left, right) => comparePackageValues(
      getPackageSortValue(left, sortBy),
      getPackageSortValue(right, sortBy),
      direction,
    ));
}

function matchesPackageStatus(cateringPackage: ManagedCateringPackage, status: string) {
  if (status === 'active') return cateringPackage.isActive;
  if (status === 'inactive') return !cateringPackage.isActive;
  return true;
}

function matchesPackageQuery(cateringPackage: ManagedCateringPackage, text: string) {
  if (!text) return true;
  const searchable = [
    cateringPackage.name,
    cateringPackage.description,
    ...cateringPackage.menuHighlights,
  ].join(' ').toLocaleLowerCase();
  return searchable.includes(text);
}

function getPackageSortValue(cateringPackage: ManagedCateringPackage, sortBy: PackageSort): PackageSortValue {
  if (sortBy === 'price') return cateringPackage.priceInCentavos;
  if (sortBy === 'name') return cateringPackage.name;
  return cateringPackage.sortOrder;
}

function comparePackageValues(left: PackageSortValue, right: PackageSortValue, direction: SortDirection) {
  const result = typeof left === 'number' && typeof right === 'number'
    ? left - right
    : String(left).localeCompare(String(right), 'en-PH', { sensitivity: 'base' });
  return direction === 'asc' ? result : -result;
}

function formatCurrency(valueInCentavos: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(valueInCentavos / 100);
}
