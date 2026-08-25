import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

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

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

type PaginationProps = {
  page: number;
  totalItems: number;
  onPageChange: (page: number) => void;
};

type SelectMenuPosition = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
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
          <span
            key={item.label}
            className={item.warn ? 'management-summary-item management-summary-warn' : 'management-summary-item'}
          >
            <strong>{item.value}</strong> {item.label}
          </span>
        ))}
      </div>

      <div className="management-data-controls">
        <label className="management-search">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.25" />
            <path d="m12.4 12.4 4.1 4.1" />
          </svg>
          <input
            type="search"
            aria-label="Search"
            value={searchValue}
            placeholder={searchPlaceholder}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>

        {filterContent ? <ManagementFilterMenu>{filterContent}</ManagementFilterMenu> : null}
        {primaryAction}
      </div>
    </div>
  );
}

function ManagementFilterMenu({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useDismissibleLayer(isOpen, menuRef, () => setIsOpen(false));

  return (
    <div className="management-filter-menu" ref={menuRef}>
      <button
        type="button"
        className="management-filter-trigger"
        aria-label="Filters and sorting"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Filters and sorting"
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 7h12M4 13h12" />
        </svg>
      </button>
      {isOpen ? <div className="management-filter-panel">{children}</div> : null}
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
    <div className="management-filter-field">
      <span>{label}</span>
      {children}
    </div>
  );
}

export function ManagementSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  disabled = false,
  placeholder,
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<SelectMenuPosition | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    function updatePosition() {
      if (selectRef.current) {
        setMenuPosition(getSelectMenuPosition(selectRef.current));
      }
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!selectRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`management-select${disabled ? ' management-select-disabled' : ''}`} ref={selectRef}>
      <button
        type="button"
        className="management-select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{selectedOption?.label ?? placeholder ?? 'Select'}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="m6 8 4 4 4-4" />
        </svg>
      </button>

      {isOpen && menuPosition ? createPortal(
        <div
          ref={menuRef}
          className="management-select-menu management-select-menu-portal"
          role="listbox"
          aria-label={ariaLabel}
          style={menuPosition}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={option.value === value ? 'management-select-option management-select-option-active' : 'management-select-option'}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value ? <span aria-hidden="true">✓</span> : null}
            </button>
          ))}
        </div>,
        document.body,
      ) : null}
    </div>
  );
}

export function ManagementTableFrame({
  children,
  loadingMessage,
  errorMessage,
  emptyMessage,
  pagination,
}: {
  children?: ReactNode;
  loadingMessage?: string;
  errorMessage?: string;
  emptyMessage?: string;
  pagination?: PaginationProps;
}) {
  const hasState = Boolean(loadingMessage || errorMessage || emptyMessage);

  return (
    <div className="management-table-frame">
      {loadingMessage ? (
        <ManagementLoadingState message={loadingMessage} />
      ) : errorMessage ? (
        <div className="management-table-state management-table-state-error" role="alert">
          {errorMessage}
        </div>
      ) : emptyMessage ? (
        <div className="management-table-state" role="status">
          {emptyMessage}
        </div>
      ) : (
        <div className="management-table-frame-content">{children}</div>
      )}

      {!hasState && pagination ? <ManagementPagination {...pagination} /> : null}
    </div>
  );
}

export function ManagementLoadingState({ message }: { message: string }) {
  return (
    <div className="management-loading-state" role="status" aria-live="polite">
      <span className="management-spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function ManagementPagination({
  page,
  totalItems,
  onPageChange,
}: PaginationProps) {
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

function getSelectMenuPosition(element: HTMLElement): SelectMenuPosition {
  const rect = element.getBoundingClientRect();
  const viewportPadding = 12;
  const menuGap = 6;
  const preferredMaxHeight = 260;
  const minimumUsefulHeight = 120;
  const spaceBelow = window.innerHeight - rect.bottom - menuGap - viewportPadding;
  const spaceAbove = rect.top - menuGap - viewportPadding;
  const openAbove = spaceBelow < minimumUsefulHeight && spaceAbove > spaceBelow;
  const availableHeight = openAbove ? spaceAbove : spaceBelow;
  const maxHeight = Math.max(
    80,
    Math.min(preferredMaxHeight, availableHeight),
  );
  const maximumWidth = Math.max(120, window.innerWidth - viewportPadding * 2);
  const width = Math.min(Math.max(rect.width, 150), maximumWidth);
  const left = Math.min(
    Math.max(rect.left, viewportPadding),
    Math.max(viewportPadding, window.innerWidth - viewportPadding - width),
  );

  if (openAbove) {
    return {
      bottom: window.innerHeight - rect.top + menuGap,
      left,
      width,
      maxHeight,
    };
  }

  return {
    top: rect.bottom + menuGap,
    left,
    width,
    maxHeight,
  };
}

function useDismissibleLayer(
  isOpen: boolean,
  ref: RefObject<HTMLElement | null>,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        onDismiss();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onDismiss();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onDismiss, ref]);
}
