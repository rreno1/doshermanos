import { useEffect, useState, type ReactNode } from 'react';

export const MANAGEMENT_PAGE_SIZE = 7;

type TabOption<T extends string> = {
  value: T;
  label: string;
};

type SummaryItem = {
  label: string;
  value: string | number;
  warn?: boolean;
};

export function ManagementTabs<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: TabOption<T>[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="management-tabs" role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          className={value === option.value ? 'management-tab management-tab-active' : 'management-tab'}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ManagementToolbar({
  summary,
  searchValue,
  searchPlaceholder,
  onSearchChange,
  filterContent,
  primaryAction,
}: {
  summary: SummaryItem[];
  searchValue: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  filterContent?: ReactNode;
  primaryAction?: ReactNode;
}) {
  return (
    <div className="management-data-toolbar">
      <div className="management-summary" aria-label="Summary">
        {summary.map((item) => (
          <span key={item.label} className={item.warn ? 'management-summary-item management-summary-warn' : 'management-summary-item'}>
            <strong>{item.value}</strong> {item.label}
          </span>
        ))}
      </div>

      <div className="management-data-controls">
        <label className="management-search">
          <span className="sr-only">Search</span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.25" />
            <path d="m12.4 12.4 4.1 4.1" />
          </svg>
          <input
            type="search"
            value={searchValue}
            placeholder={searchPlaceholder}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>

        {filterContent ? (
          <details className="management-filter-menu">
            <summary aria-label="Open filters and sorting" title="Filters and sorting">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M3 5h14M3 10h14M3 15h14" />
              </svg>
            </summary>
            <div className="management-filter-panel">{filterContent}</div>
          </details>
        ) : null}

        {primaryAction}
      </div>
    </div>
  );
}

export function ManagementFilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="management-filter-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function ManagementPagination({
  page,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / MANAGEMENT_PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * MANAGEMENT_PAGE_SIZE + 1;
  const end = Math.min(safePage * MANAGEMENT_PAGE_SIZE, totalItems);

  return (
    <div className="management-pagination" aria-label="Table pagination">
      <span>Showing {start}–{end} of {totalItems}</span>
      <div className="management-pagination-actions">
        <button type="button" disabled={safePage === 1} onClick={() => onPageChange(safePage - 1)}>
          Previous
        </button>
        <span>Page {safePage} of {totalPages}</span>
        <button type="button" disabled={safePage === totalPages} onClick={() => onPageChange(safePage + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

export function useManagementPage<T>(items: T[], resetKey: string) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / MANAGEMENT_PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const startIndex = (page - 1) * MANAGEMENT_PAGE_SIZE;

  return {
    page,
    setPage,
    pageItems: items.slice(startIndex, startIndex + MANAGEMENT_PAGE_SIZE),
  };
}
