import {
  ManagementFilterField,
  ManagementSelect,
} from '@shared/ui/ManagementControls';
import type {
  EquipmentSort,
  EquipmentView,
  SortDirection,
} from './equipment-view';

const directionOptions: { value: SortDirection; label: string }[] = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
];

type EquipmentFiltersProps = {
  view: EquipmentView;
  filterValue: string;
  sortBy: EquipmentSort;
  sortDirection: SortDirection;
  onFilterChange: (value: string) => void;
  onSortChange: (value: EquipmentSort) => void;
  onDirectionChange: (value: SortDirection) => void;
  onReset: () => void;
};

export function EquipmentFilters({
  view,
  filterValue,
  sortBy,
  sortDirection,
  onFilterChange,
  onSortChange,
  onDirectionChange,
  onReset,
}: EquipmentFiltersProps) {
  return (
    <>
      <ManagementFilterField label={view === 'activity' ? 'Activity type' : 'Status'}>
        <ManagementSelect
          value={filterValue}
          options={getFilterOptions(view)}
          onChange={onFilterChange}
          ariaLabel="Filter equipment view"
        />
      </ManagementFilterField>
      <ManagementFilterField label="Sort by">
        <ManagementSelect
          value={sortBy}
          options={getSortOptions(view)}
          onChange={onSortChange}
          ariaLabel="Sort equipment view by"
        />
      </ManagementFilterField>
      <ManagementFilterField label="Direction">
        <ManagementSelect
          value={sortDirection}
          options={directionOptions}
          onChange={onDirectionChange}
          ariaLabel="Equipment sort direction"
        />
      </ManagementFilterField>
      <button type="button" className="management-secondary-button" onClick={onReset}>
        Reset filters
      </button>
    </>
  );
}

function getFilterOptions(view: EquipmentView) {
  if (view === 'registry') {
    return [
      { value: 'all', label: 'All statuses' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ];
  }

  if (view === 'assignments') {
    return [
      { value: 'all', label: 'All statuses' },
      { value: 'assigned', label: 'Assigned' },
      { value: 'released', label: 'Released' },
      { value: 'closed', label: 'Closed' },
      { value: 'cancelled', label: 'Cancelled' },
    ];
  }

  return [
    { value: 'all', label: 'All activity' },
    { value: 'release', label: 'Released' },
    { value: 'return', label: 'Returned' },
  ];
}

function getSortOptions(view: EquipmentView): { value: EquipmentSort; label: string }[] {
  if (view === 'registry') {
    return [
      { value: 'name', label: 'Name' },
      { value: 'available', label: 'Available quantity' },
      { value: 'total', label: 'Total quantity' },
    ];
  }

  if (view === 'assignments') {
    return [
      { value: 'event', label: 'Event date' },
      { value: 'equipment', label: 'Equipment' },
      { value: 'status', label: 'Status' },
    ];
  }

  return [
    { value: 'date', label: 'Recorded date' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'type', label: 'Activity type' },
  ];
}
