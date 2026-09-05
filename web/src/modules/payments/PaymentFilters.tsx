import {
  ManagementFilterField,
  ManagementSelect,
} from '@shared/ui/ManagementControls';
import type {
  PaymentSort,
  PaymentsTab,
  SortDirection,
} from './payment-view';

const reservationStatusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending_review', label: 'Pending review' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
];

const directionOptions: { value: SortDirection; label: string }[] = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
];

type PaymentFiltersProps = {
  tab: PaymentsTab;
  filterValue: string;
  sortBy: PaymentSort;
  sortDirection: SortDirection;
  onFilterChange: (value: string) => void;
  onSortChange: (value: PaymentSort) => void;
  onDirectionChange: (value: SortDirection) => void;
  onReset: () => void;
};

export function PaymentFilters({
  tab,
  filterValue,
  sortBy,
  sortDirection,
  onFilterChange,
  onSortChange,
  onDirectionChange,
  onReset,
}: PaymentFiltersProps) {
  return (
    <>
      {tab === 'reservations' ? (
        <ManagementFilterField label="Status">
          <ManagementSelect
            value={filterValue}
            options={reservationStatusOptions}
            onChange={onFilterChange}
            ariaLabel="Filter payable reservations by status"
          />
        </ManagementFilterField>
      ) : null}
      <ManagementFilterField label="Sort by">
        <ManagementSelect
          value={sortBy}
          options={getSortOptions(tab)}
          onChange={onSortChange}
          ariaLabel="Sort payment view by"
        />
      </ManagementFilterField>
      <ManagementFilterField label="Direction">
        <ManagementSelect
          value={sortDirection}
          options={directionOptions}
          onChange={onDirectionChange}
          ariaLabel="Payment sort direction"
        />
      </ManagementFilterField>
      <button type="button" className="management-secondary-button" onClick={onReset}>
        Reset filters
      </button>
    </>
  );
}

function getSortOptions(tab: PaymentsTab): { value: PaymentSort; label: string }[] {
  if (tab === 'reservations') {
    return [
      { value: 'event', label: 'Event date' },
      { value: 'package', label: 'Package' },
      { value: 'status', label: 'Status' },
    ];
  }

  return [
    { value: 'date', label: 'Recorded date' },
    { value: 'amount', label: 'Amount' },
    { value: 'package', label: 'Package' },
    { value: 'recorder', label: 'Recorded by' },
  ];
}
