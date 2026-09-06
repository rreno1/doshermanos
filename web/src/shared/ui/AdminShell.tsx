import type { ReactNode } from 'react';
import { AccountMenu, type AccountMenuUser } from './AccountMenu';
import { AppBrand } from './AppBrand';
import { Header } from './Header';
import { PageHeader } from './PageHeader';
import { PrimaryNavigation, type PrimaryNavigationItem } from './PrimaryNavigation';

export interface AdminShellBrand {
  title: string;
  subtitle?: string;
  onClick?: () => void;
}

export interface AdminShellAccount {
  user: AccountMenuUser;
  onLogout: () => void | Promise<void>;
}

export interface AdminShellPageHeader {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export interface AdminShellProps {
  brand: AdminShellBrand;
  navigationItems: PrimaryNavigationItem[];
  pageHeader: AdminShellPageHeader;
  account?: AdminShellAccount;
  navigationLabel?: string;
  beforeContent?: ReactNode;
  children: ReactNode;
  className?: string;
  mainId?: string;
}

/** Canonical GSU management shell shared by every Dos Hermanos staff workspace. */
export function AdminShell({
  brand,
  navigationItems,
  pageHeader,
  account,
  navigationLabel = 'Primary navigation',
  beforeContent,
  children,
  className = '',
  mainId,
}: AdminShellProps) {
  return (
    <div className={`admin-view${className ? ` ${className}` : ''}`}>
      <Header
        theme="green"
        className="admin-mobile-header"
        title={brand.title}
        subtitle={brand.subtitle}
        onBrandClick={brand.onClick}
        items={navigationItems}
        navigationLabel={navigationLabel}
        account={account}
      />

      <div className="admin-grid">
        <aside className="sidebar" aria-label={navigationLabel}>
          <AppBrand
            theme="green"
            className="app-brand-sidebar"
            title={brand.title}
            subtitle={brand.subtitle}
            onClick={brand.onClick}
          />

          <PrimaryNavigation
            items={navigationItems}
            orientation="vertical"
            ariaLabel={navigationLabel}
            className="sidebar-primary-navigation"
          />

          {account ? (
            <AccountMenu
              variant="sidebar"
              className="sidebar-account-menu"
              user={account.user}
              onLogout={account.onLogout}
            />
          ) : null}
        </aside>

        <main className="admin-main" id={mainId} tabIndex={mainId ? -1 : undefined}>
          <PageHeader
            className="admin-top"
            title={pageHeader.title}
            subtitle={pageHeader.subtitle}
            actions={pageHeader.actions}
          />
          {beforeContent}
          {children}
        </main>
      </div>
    </div>
  );
}
