import { useId, useRef, useState, type ReactNode } from 'react';
import { TwoLineMenuIcon } from '../TwoLineMenuIcon';
import { AppBrand } from './AppBrand';
import { type AccountMenuUser } from './AccountMenu';
import { NavigationOverlay } from './NavigationOverlay';
import { PrimaryNavigation, type PrimaryNavigationItem } from './PrimaryNavigation';

export type HeaderNavItem = PrimaryNavigationItem;

export interface HeaderAccount {
  user: AccountMenuUser;
  onLogout: () => void | Promise<void>;
}

export interface AppHeaderProps {
  theme?: 'light' | 'green';
  title?: string;
  subtitle?: string;
  onBrandClick?: () => void;
  items: HeaderNavItem[];
  account?: HeaderAccount;
  desktopActions?: ReactNode;
  mobileMenuFooter?: ReactNode;
  navigationLabel?: string;
  className?: string;
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function Header({
  theme = 'light',
  title = 'Dos Hermanos',
  subtitle = 'Catering',
  onBrandClick,
  items = [],
  account,
  desktopActions,
  mobileMenuFooter,
  navigationLabel = 'Primary navigation',
  className = '',
}: AppHeaderProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const headerRef = useRef<HTMLElement | null>(null);
  const toggleLabel = open ? 'Close navigation menu' : 'Open navigation menu';

  const closeNavigation = () => setOpen(false);

  const handleBrandClick = () => {
    closeNavigation();
    onBrandClick?.();
  };

  return (
    <>
      <header
        ref={headerRef}
        className={`app-header-wrap theme-${theme} ${open ? 'nav-open' : ''} ${className}`.trim()}
      >
        <div className="app-header-bar shell">
          <AppBrand
            theme={theme}
            title={title}
            subtitle={subtitle}
            onClick={onBrandClick ? handleBrandClick : undefined}
          />

          <div className="desktop-header-nav">
            <PrimaryNavigation
              items={items}
              orientation="horizontal"
              ariaLabel={navigationLabel}
            />
          </div>

          {desktopActions ? <div className="app-header-actions-slot">{desktopActions}</div> : null}

          <button
            type="button"
            className={`header-menu-toggle ${open ? 'active' : ''}`}
            onClick={() => setOpen((previous) => !previous)}
            title={toggleLabel}
            aria-label={toggleLabel}
            aria-expanded={open}
            aria-controls={menuId}
          >
            {open ? <CloseIcon /> : <TwoLineMenuIcon />}
          </button>
        </div>
      </header>

      <NavigationOverlay
        id={menuId}
        open={open}
        theme={theme}
        anchorRef={headerRef}
        items={items}
        account={account}
        footer={mobileMenuFooter}
        navigationLabel={navigationLabel}
        onClose={closeNavigation}
      />
    </>
  );
}
