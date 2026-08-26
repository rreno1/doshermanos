import { useEffect, useState, type ReactNode } from 'react';
import { AppLink } from '../../app/navigation';
import { TwoLineMenuIcon } from '../../app/TwoLineMenuIcon';
import { AuthMenu } from '../auth/AuthMenu';
import type { UserProfile } from '../auth/auth.types';
import './portal.css';

type WorkspaceRole = 'staff' | 'admin';

type PortalShellProps = {
  children: ReactNode;
  pathname: string;
  profile: UserProfile | null;
  workspaceRole: WorkspaceRole | null;
  landing: boolean;
};

export function PortalShell({
  children,
  pathname,
  profile,
  workspaceRole,
  landing,
}: PortalShellProps) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const isCustomer = profile?.role === 'customer';

  useEffect(() => {
    setIsNavigationOpen(false);
  }, [pathname]);

  const navigation = landing
    ? []
    : [
        { label: 'Home', path: '/' },
        { label: 'Packages', path: '/packages' },
        ...(isCustomer
          ? [
              { label: 'My Reservations', path: '/reservations' },
              { label: 'Payments', path: '/payments' },
            ]
          : []),
      ];

  return (
    <div className={landing ? 'portal-shell portal-shell-landing' : 'portal-shell'} id="top">
      <a className="skip-link" href="#main-content">Skip to main content</a>

      <header className="portal-header">
        <AppLink className="portal-brand" to="/" aria-label="Dos Hermanos Catering home">
          <span className="portal-brand-name">Dos Hermanos</span>
          <span className="portal-brand-label">Catering</span>
        </AppLink>

        {!landing ? (
          <nav className="portal-navigation" aria-label="Customer portal">
            {navigation.map((item) => (
              <AppLink
                className={isActivePath(pathname, item.path) ? 'portal-nav-link portal-nav-link-active' : 'portal-nav-link'}
                key={item.path}
                to={item.path}
                aria-current={isActivePath(pathname, item.path) ? 'page' : undefined}
              >
                {item.label}
              </AppLink>
            ))}
          </nav>
        ) : null}

        <button
          type="button"
          className="portal-menu-button"
          aria-label="Open portal menu"
          aria-expanded={isNavigationOpen}
          onClick={() => setIsNavigationOpen((open) => !open)}
        >
          <TwoLineMenuIcon />
        </button>

        <div className="portal-header-actions">
          {workspaceRole ? (
            <AppLink
              className="portal-workspace-link"
              to={workspaceRole === 'admin' ? '/admin' : '/staff'}
            >
              Workspace
            </AppLink>
          ) : null}
          <AuthMenu />
        </div>
      </header>

      {isNavigationOpen ? (
        <nav className="portal-mobile-navigation" aria-label="Portal mobile navigation">
          {!landing ? navigation.map((item) => (
            <AppLink
              className={isActivePath(pathname, item.path) ? 'portal-mobile-link portal-mobile-link-active' : 'portal-mobile-link'}
              key={item.path}
              to={item.path}
            >
              {item.label}
            </AppLink>
          )) : null}
          {workspaceRole ? (
            <AppLink className="portal-mobile-workspace" to={workspaceRole === 'admin' ? '/admin' : '/staff'}>
              Workspace
            </AppLink>
          ) : null}
          <div className="portal-mobile-account">
            <AuthMenu />
          </div>
        </nav>
      ) : null}

      <main id="main-content" tabIndex={-1} className="portal-main">
        {children}
      </main>

      <footer className="portal-footer">
        <span>Dos Hermanos Catering</span>
        <span>Hilongos, Leyte</span>
      </footer>
    </div>
  );
}

function isActivePath(pathname: string, path: string) {
  return path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`);
}
