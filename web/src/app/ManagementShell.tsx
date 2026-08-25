import { useEffect, useState, type ReactNode } from 'react';
import { AuthMenu } from '../features/auth/AuthMenu';
import type { UserProfile } from '../features/auth/auth.types';
import { AppLink } from './navigation';
import '../styles/management-shell.css';

type WorkspaceRole = 'staff' | 'admin';

type ManagementShellProps = {
  role: WorkspaceRole;
  profile: UserProfile;
  pathname: string;
  pageTitle: string;
  children: ReactNode;
};

type NavigationItem = {
  label: string;
  path: string;
  adminOnly?: boolean;
};

export function ManagementShell({
  role,
  profile,
  pathname,
  pageTitle,
  children,
}: ManagementShellProps) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const basePath = role === 'admin' ? '/admin' : '/staff';

  useEffect(() => {
    setIsNavigationOpen(false);
  }, [pathname]);

  const navigationItems: NavigationItem[] = [
    { label: 'Dashboard', path: basePath },
    { label: 'Reservations', path: `${basePath}/reservations` },
    { label: 'Packages', path: `${basePath}/packages` },
    { label: 'Inventory', path: `${basePath}/inventory` },
    { label: 'Payments', path: `${basePath}/payments` },
    { label: 'Equipment', path: `${basePath}/equipment` },
    { label: 'Reports', path: `${basePath}/reports` },
    { label: 'Users & roles', path: `${basePath}/users`, adminOnly: true },
    { label: 'Audit trail', path: `${basePath}/audit`, adminOnly: true },
  ].filter((item) => !item.adminOnly || role === 'admin');

  return (
    <div className="management-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <aside
        className={`management-sidebar${isNavigationOpen ? ' management-sidebar-open' : ''}`}
        aria-label={`${formatRole(role)} navigation`}
      >
        <div className="management-brand-block">
          <span className="management-brand-name">Dos Hermanos</span>
          <span className="management-brand-label">Catering management</span>
        </div>

        <nav className="management-navigation" aria-label="Management modules">
          {navigationItems.map((item) => {
            const isActive = isNavigationItemActive(pathname, item.path, basePath);

            return (
              <AppLink
                className={`management-navigation-link${isActive ? ' management-navigation-link-active' : ''}`}
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </AppLink>
            );
          })}
        </nav>

        <div className="management-sidebar-account">
          <span>{formatRole(role)}</span>
          <strong>{profile.displayName}</strong>
          <span className="management-sidebar-account-id">{profile.id.slice(0, 12)}…</span>
        </div>
      </aside>

      {isNavigationOpen ? (
        <button
          className="management-sidebar-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsNavigationOpen(false)}
        />
      ) : null}

      <div className="management-workspace">
        <header className="management-topbar">
          <div className="management-topbar-heading">
            <button
              className="management-menu-button"
              type="button"
              aria-label="Open management navigation"
              aria-expanded={isNavigationOpen}
              onClick={() => setIsNavigationOpen((isOpen) => !isOpen)}
            >
              <span aria-hidden="true">☰</span>
            </button>
            <div>
              <span className="management-topbar-label">{formatRole(role)} workspace</span>
              <strong>{pageTitle}</strong>
            </div>
          </div>
          <AuthMenu />
        </header>

        <main className="management-content" id="main-content" tabIndex={-1}>
          <div className="management-page">{children}</div>
        </main>
      </div>
    </div>
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
