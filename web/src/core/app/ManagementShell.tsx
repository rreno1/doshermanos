import { signOut } from 'firebase/auth';
import type { ReactNode } from 'react';
import {
  formatWorkspaceRole,
  getAllowedNavigation,
  getWorkspaceBasePath,
  isNavigationItemActive,
  navIcons,
  type NavIconName,
  type WorkspaceRole,
} from '@core/app/nav';
import { navigate } from '@core/app/navigation';
import { firebaseAuth } from '@core/firebase/firebase';
import type { UserProfile } from '@modules/auth/auth.types';
import { AccountMenu } from '@shared/ui/AccountMenu';
import { AppBrand } from '@shared/ui/AppBrand';
import { Header } from '@shared/ui/Header';
import { PageHeader } from '@shared/ui/PageHeader';
import { PrimaryNavigation, type PrimaryNavigationItem } from '@shared/ui/PrimaryNavigation';

type ManagementShellProps = {
  role: WorkspaceRole;
  profile: UserProfile;
  pathname: string;
  pageTitle: string;
  pageDescription: string;
  children: ReactNode;
};

export function ManagementShell({
  role,
  profile,
  pathname,
  pageTitle,
  pageDescription,
  children,
}: ManagementShellProps) {
  const basePath = getWorkspaceBasePath(role);
  const navigationItems = getAllowedNavigation(role);

  const primaryItems: PrimaryNavigationItem[] = navigationItems.map((item) => ({
    key: item.key,
    label: item.label,
    active: isNavigationItemActive(pathname, item.path, basePath),
    onClick: () => navigate(item.path),
    icon: <NavIcon name={item.icon} />,
  }));

  const accountUser = {
    displayName: profile.displayName,
    email: firebaseAuth.currentUser?.email ?? 'Authenticated account',
    role: formatWorkspaceRole(role),
  };

  async function handleLogout() {
    await signOut(firebaseAuth);
    navigate('/', { replace: true });
  }

  return (
    <div className="admin-view">
      <a className="skip-link" href="#main-content">Skip to main content</a>

      <Header
        theme="green"
        className="admin-mobile-header"
        title="Dos Hermanos"
        subtitle="Catering"
        onBrandClick={() => navigate(basePath)}
        items={primaryItems}
        navigationLabel={`${formatWorkspaceRole(role)} navigation`}
        account={{ user: accountUser, onLogout: handleLogout }}
      />

      <div className="admin-grid">
        <aside className="sidebar" aria-label={`${formatWorkspaceRole(role)} navigation`}>
          <AppBrand
            theme="green"
            title="Dos Hermanos"
            subtitle="Catering"
            className="app-brand-sidebar"
            onClick={() => navigate(basePath)}
          />

          <PrimaryNavigation
            items={primaryItems}
            orientation="vertical"
            ariaLabel="Management modules"
            className="sidebar-primary-navigation"
          />

          <AccountMenu
            variant="sidebar"
            className="sidebar-account-menu"
            user={accountUser}
            onLogout={handleLogout}
          />
        </aside>

        <main className="admin-main" id="main-content" tabIndex={-1}>
          <PageHeader className="admin-top" title={pageTitle} subtitle={pageDescription} />
          <div className="admin-page-stage" key={pathname}>
            <div className="management-page">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavIcon({ name }: { name: NavIconName }) {
  return (
    <svg
      className="side-icon"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      width="18"
      height="18"
    >
      <path d={navIcons[name]} />
    </svg>
  );
}
