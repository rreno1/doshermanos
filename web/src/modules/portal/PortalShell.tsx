import type { ReactNode } from 'react';
import { AppLink, navigate } from '@core/app/navigation';
import { AuthMenu } from '@modules/auth/AuthMenu';
import type { UserProfile } from '@modules/auth/auth.types';
import { Header } from '@shared/ui/Header';
import type { PrimaryNavigationItem } from '@shared/ui/PrimaryNavigation';
import './portal.css';
import './public-portal-contract.css';

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
  const isCustomer = profile?.role === 'customer';
  const workspacePath = workspaceRole === 'admin' ? '/admin' : '/staff';

  const navigation: Array<{ key: string; label: string; path: string }> = landing
    ? []
    : [
        { key: 'home', label: 'Home', path: '/' },
        { key: 'packages', label: 'Packages', path: '/packages' },
        ...(isCustomer
          ? [
              { key: 'reservations', label: 'My Reservations', path: '/reservations' },
              { key: 'payments', label: 'Payments', path: '/payments' },
            ]
          : []),
      ];

  const navigationItems: PrimaryNavigationItem[] = navigation.map((item) => ({
    key: item.key,
    label: item.label,
    active: isActivePath(pathname, item.path),
    onClick: () => navigate(item.path),
  }));

  const desktopActions = (
    <>
      {workspaceRole ? (
        <AppLink className="portal-workspace-link" to={workspacePath}>
          Workspace
        </AppLink>
      ) : null}
      <AuthMenu />
    </>
  );

  const mobileMenuFooter = (
    <div className="portal-mobile-account">
      {workspaceRole ? (
        <AppLink className="portal-mobile-workspace" to={workspacePath}>
          Workspace
        </AppLink>
      ) : null}
      <AuthMenu />
    </div>
  );

  return (
    <div className={landing ? 'public-view portal-shell portal-shell-landing' : 'public-view portal-shell'} id="top">
      <a className="skip-link" href="#main-content">Skip to main content</a>

      <Header
        className="public-portal-header"
        theme="light"
        title="Dos Hermanos"
        subtitle="Catering · Hilongos, Leyte"
        onBrandClick={() => navigate('/')}
        items={navigationItems}
        navigationLabel="Dos Hermanos public navigation"
        desktopActions={desktopActions}
        mobileMenuFooter={mobileMenuFooter}
      />

      <main id="main-content" tabIndex={-1} className="portal-main">
        {children}
      </main>

      <footer className="public-footer portal-footer">
        <div className="shell portal-footer-row">
          <div>
            <strong>Dos Hermanos Catering</strong>
            <small>Hilongos, Leyte</small>
          </div>
          <nav aria-label="Footer navigation">
            <AppLink to="/packages">Packages</AppLink>
            {isCustomer ? <AppLink to="/reservations">Reservations</AppLink> : null}
            {workspaceRole ? <AppLink to={workspacePath}>Workspace</AppLink> : null}
          </nav>
        </div>
      </footer>
    </div>
  );
}

function isActivePath(pathname: string, path: string) {
  return path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`);
}
