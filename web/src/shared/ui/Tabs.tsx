import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface TabItem {
  key: string;
  label: string;
  mobileLabel?: string;
  disabled?: boolean;
}

export interface TabBarProps {
  tabs: TabItem[];
  active: string;
  onChange(key: string): void;
  ariaLabel?: string;
  idPrefix?: string;
}

function domKey(key: string) {
  return encodeURIComponent(key);
}

export function TabBar({
  tabs,
  active,
  onChange,
  ariaLabel = 'Sections',
  idPrefix,
}: TabBarProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedTab = tabs.find((tab) => tab.key === active && !tab.disabled);
  const focusableKey = selectedTab?.key ?? tabs.find((tab) => !tab.disabled)?.key;

  const moveFocus = (fromIndex: number, direction: 1 | -1) => {
    if (tabs.length === 0) return;

    for (let offset = 1; offset <= tabs.length; offset += 1) {
      const nextIndex = (fromIndex + direction * offset + tabs.length) % tabs.length;
      if (!tabs[nextIndex]?.disabled) {
        buttonRefs.current[nextIndex]?.focus();
        onChange(tabs[nextIndex].key);
        return;
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveFocus(index, 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveFocus(index, -1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      const firstIndex = tabs.findIndex((tab) => !tab.disabled);
      if (firstIndex >= 0) {
        buttonRefs.current[firstIndex]?.focus();
        onChange(tabs[firstIndex].key);
      }
    } else if (event.key === 'End') {
      event.preventDefault();
      for (let indexFromEnd = tabs.length - 1; indexFromEnd >= 0; indexFromEnd -= 1) {
        if (!tabs[indexFromEnd].disabled) {
          buttonRefs.current[indexFromEnd]?.focus();
          onChange(tabs[indexFromEnd].key);
          break;
        }
      }
    }
  };

  return (
    <div className="tab-bar" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab, index) => {
        const selected = selectedTab?.key === tab.key;
        const suffix = domKey(tab.key);
        return (
          <button
            key={tab.key}
            ref={(element) => {
              buttonRefs.current[index] = element;
            }}
            id={idPrefix ? `${idPrefix}-tab-${suffix}` : undefined}
            className={selected ? 'active' : ''}
            type="button"
            role="tab"
            aria-label={tab.label}
            aria-selected={selected}
            aria-controls={idPrefix ? `${idPrefix}-panel-${suffix}` : undefined}
            tabIndex={focusableKey === tab.key ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange(tab.key)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <span className="tab-label-full" aria-hidden="true">{tab.label}</span>
            <span className="tab-label-mobile" aria-hidden="true">{tab.mobileLabel || tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export interface TabbedContainerProps {
  tabs: TabItem[];
  children: Record<string, ReactNode>;
  defaultTab?: string;
  activeTab?: string;
  onChange?: (key: string) => void;
  ariaLabel?: string;
}

export function Tabs({
  tabs,
  children,
  defaultTab,
  activeTab,
  onChange,
  ariaLabel,
}: TabbedContainerProps) {
  const idPrefix = useId();
  const firstEnabledKey = tabs.find((tab) => !tab.disabled)?.key ?? '';
  const [internalActive, setInternalActive] = useState(() => {
    if (defaultTab && tabs.some((tab) => tab.key === defaultTab && !tab.disabled)) return defaultTab;
    return firstEnabledKey;
  });

  const requestedActive = activeTab !== undefined ? activeTab : internalActive;
  const active = tabs.some((tab) => tab.key === requestedActive && !tab.disabled)
    ? requestedActive
    : firstEnabledKey;

  const handleTabChange = (key: string) => {
    setInternalActive(key);
    onChange?.(key);
  };

  const suffix = domKey(active);

  return (
    <>
      <TabBar
        tabs={tabs}
        active={active}
        onChange={handleTabChange}
        ariaLabel={ariaLabel}
        idPrefix={idPrefix}
      />
      {active && (
        <div
          id={`${idPrefix}-panel-${suffix}`}
          role="tabpanel"
          aria-labelledby={`${idPrefix}-tab-${suffix}`}
        >
          {children[active]}
        </div>
      )}
    </>
  );
}
