import type { ReactNode } from 'react';

export interface PrimaryNavigationItem {
  key: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  children?: PrimaryNavigationItem[];
}

export interface PrimaryNavigationProps {
  items: PrimaryNavigationItem[];
  orientation?: 'horizontal' | 'vertical' | 'menu';
  ariaLabel?: string;
  id?: string;
  className?: string;
  showChildren?: boolean;
  onItemActivated?: () => void;
}

function NavigationEntry({
  item,
  orientation,
  nested = false,
  onItemActivated,
}: {
  item: PrimaryNavigationItem;
  orientation: NonNullable<PrimaryNavigationProps['orientation']>;
  nested?: boolean;
  onItemActivated?: () => void;
}) {
  const className = [
    'primary-nav-item',
    item.active ? 'active' : '',
    nested ? 'primary-nav-child' : '',
  ].filter(Boolean).join(' ');

  const activate = () => {
    item.onClick?.();
    onItemActivated?.();
  };

  const content = (
    <>
      {item.icon ? <span className="primary-nav-icon" aria-hidden="true">{item.icon}</span> : null}
      <span className="primary-nav-label">{item.label}</span>
    </>
  );

  if (item.href) {
    return (
      <a
        href={item.href}
        className={className}
        aria-current={item.active ? 'page' : undefined}
        onClick={onItemActivated}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      aria-current={item.active ? 'page' : undefined}
      onClick={activate}
      data-navigation-orientation={orientation}
    >
      {content}
    </button>
  );
}

export function PrimaryNavigation({
  items,
  orientation = 'horizontal',
  ariaLabel = 'Primary navigation',
  id,
  className = '',
  showChildren = false,
  onItemActivated,
}: PrimaryNavigationProps) {
  return (
    <nav
      id={id}
      className={`primary-nav primary-nav-${orientation}${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <div className="primary-nav-group" key={item.key}>
          <NavigationEntry
            item={item}
            orientation={orientation}
            onItemActivated={onItemActivated}
          />
          {showChildren && item.children?.length ? (
            <div className="primary-nav-children">
              {item.children.map((child) => (
                <NavigationEntry
                  key={child.key}
                  item={child}
                  orientation={orientation}
                  nested
                  onItemActivated={onItemActivated}
                />
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </nav>
  );
}
