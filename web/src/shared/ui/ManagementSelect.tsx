import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

type SelectMenuPosition = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
};

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
    if (disabled) setIsOpen(false);
  }, [disabled]);

  useLayoutEffect(() => {
    if (!isOpen) return;

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
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!selectRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
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
        <svg className="management-select-arrow" viewBox="0 0 10 6" fill="currentColor" aria-hidden="true">
          <path d="M0 0l5 6 5-6z" />
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
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={selected ? 'management-select-option management-select-option-active' : 'management-select-option'}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span>{option.label}</span>
                <span className="management-select-option-check" aria-hidden="true">
                  {selected ? <CheckIcon /> : null}
                </span>
              </button>
            );
          })}
        </div>,
        document.body,
      ) : null}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
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
  const maxHeight = Math.max(80, Math.min(preferredMaxHeight, availableHeight));
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
