import { signOut } from 'firebase/auth';
import type { ReactNode } from 'react';
import { firebaseAuth } from '../firebase/firebase';
import type { UserProfile } from '../features/auth/auth.types';
import { navigate } from './navigation';
import { AccountMenu } from './gsu-ui/AccountMenu';
import { AppBrand } from './gsu-ui/AppBrand';
import { Header } from './gsu-ui/Header';
import { PageHeader } from './gsu-ui/PageHeader';
import { PrimaryNavigation, type PrimaryNavigationItem } from './gsu-ui/PrimaryNavigation';
import '../styles/management-ui.css';
import '../styles/management-data.css';
import '../styles/management-spacing.css';
import '../styles/index.css';

type WorkspaceRole = 'staff' | 'admin';

type ManagementShellProps = {
  role: WorkspaceRole;
  profile: UserProfile;
  pathname: string;
  pageTitle: string;
  pageDescription: string;
  children: ReactNode;
};

type NavigationItem = {
  key: string;
  label: string;
  path: string;
  icon: NavIconName;
  adminOnly?: boolean;
};

type NavIconName = 'dashboard' | 'operations' | 'resources' | 'payments' | 'reports' | 'users' | 'audit';

export function ManagementShell({
  role,
  profile,
  pathname,
  pageTitle,
  pageDescription,
  children,
}: ManagementShellProps) {
  const basePath = role === 'admin' ? '/admin' : '/staff';

  const navigationItems = ([
    { key: 'dashboard', label: 'Dashboard', path: basePath, icon: 'dashboard' },
    { key: 'operations', label: 'Operations', path: `${basePath}/operations`, icon: 'operations' },
    { key: 'resources', label: 'Resources', path: `${basePath}/resources`, icon: 'resources' },
    { key: 'payments', label: 'Payments', path: `${basePath}/payments`, icon: 'payments' },
    { key: 'reports', label: 'Reports', path: `${basePath}/reports`, icon: 'reports' },
    { key: 'users', label: 'Users & roles', path: `${basePath}/users`, icon: 'users', adminOnly: true },
    { key: 'audit', label: 'Audit trail', path: `${basePath}/audit`, icon: 'audit', adminOnly: true },
  ] satisfies NavigationItem[]).filter((item) => !item.adminOnly || role === 'admin');

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
    role: formatRole(role),
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
        navigationLabel={`${formatRole(role)} navigation`}
        account={{ user: accountUser, onLogout: handleLogout }}
      />

      <div className="admin-grid">
        <aside className="sidebar" aria-label={`${formatRole(role)} navigation`}>
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
  const paths: Record<NavIconName, string> = {
    dashboard: 'M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z',
    operations: 'M4 5h16v4H4V5Zm0 6h10v4H4v-4Zm0 6h16v2H4v-2Z',
    resources: 'M5 4h14a1 1 0 0 1 1 1v14H4V5a1 1 0 0 1 1-1Zm2 3v3h3V7H7Zm0 5v3h3v-3H7Zm5-5v3h5V7h-5Zm0 5v3h5v-3h-5Z',
    payments: 'M3 6h18v12H3V6Zm2 3v6h14V9H5Zm7 1.5A1.5 1.5 0 1 1 12 13.5a1.5 1.5 0 0 1 0-3Z',
    reports: 'M5 3h14v18H5V3Zm3 4v2h8V7H8Zm0 4v2h8v-2H8Zm0 4v2h5v-2H8Z',
    users: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 19c0-3 2-5 5-5s5 2 5 5H3Zm10.5 0c0-1.8-.55-3.25-1.45-4.35A5.8 5.8 0 0 1 16 13c2.8 0 5 2 5 5v1h-7.5Z',
    audit: 'M12 3 4 6v5c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-3Zm-1 12-3-3 1.4-1.4 1.6 1.6 3.6-3.6L16 10l-5 5Z',
  };

  return (
    <svg className="side-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
      <path d={paths[name]} />
    </svg>
  );
}

function isNavigationItemActive(pathname: string, itemPath: string, basePath: string) {
  if (itemPath === basePath) {
    return pathname === basePath || pathname === `${basePath}/` || pathname === `${basePath}/dashboard`;
  }

  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

function formatRole(role: WorkspaceRole) {
  return role === 'admin' ? 'Administrator' : 'Staff';
}
