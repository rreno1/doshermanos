import { useEffect } from 'react';
import { AuditPanel } from '../features/audit/AuditPanel';
import { AuthMenu } from '../features/auth/AuthMenu';
import { useAuth } from '../features/auth/AuthProvider';
import type { UserProfile } from '../features/auth/auth.types';
import { DashboardPanel } from '../features/dashboard/DashboardPanel';
import { EquipmentPanel } from '../features/equipment/EquipmentPanel';
import { InventoryPanel } from '../features/inventory/InventoryPanel';
import { PackageCatalog } from '../features/packages/PackageCatalog';
import { PackageManagementPanel } from '../features/packages/PackageManagementPanel';
import { MyPayments } from '../features/payments/MyPayments';
import { PaymentsPanel } from '../features/payments/PaymentsPanel';
import { ReportsPanel } from '../features/reports/ReportsPanel';
import { MyReservations } from '../features/reservations/MyReservations';
import { ReservationReviewPanel } from '../features/reservations/ReservationReviewPanel';
import { UsersRolesPanel } from '../features/users/UsersRolesPanel';
import { ManagementShell } from './ManagementShell';
import { navigate, usePathname } from './navigation';
import './app-loading.css';

type WorkspaceRole = 'staff' | 'admin';

type ManagementPage =
  | 'dashboard'
  | 'reservations'
  | 'packages'
  | 'inventory'
  | 'payments'
  | 'equipment'
  | 'reports'
  | 'users'
  | 'audit';

export function App() {
  const { authState, loadingMessage } = useAuth();
  const pathname = usePathname();
  const workspaceRole = getWorkspaceRole(authState.profile, authState.status);
  const managementPath = isManagementPath(pathname);

  useEffect(() => {
    if (authState.status === 'loading') {
      return;
    }

    if (managementPath) {
      if (!workspaceRole) {
        navigate('/', { replace: true });
        return;
      }

      const expectedBasePath = getWorkspaceBasePath(workspaceRole);
      if (!isPathWithinWorkspace(pathname, expectedBasePath)) {
        navigate(expectedBasePath, { replace: true });
        return;
      }

      const page = getManagementPage(pathname, expectedBasePath, workspaceRole);
      if (!page) {
        navigate(expectedBasePath, { replace: true });
      }
      return;
    }

    if (pathname !== '/') {
      navigate('/', { replace: true });
      return;
    }

    if (workspaceRole) {
      navigate(getWorkspaceBasePath(workspaceRole), { replace: true });
    }
  }, [authState.status, managementPath, pathname, workspaceRole]);

  if (authState.status === 'loading') {
    return <AppLoading message={loadingMessage ?? 'Loading Dos Hermanos…'} />;
  }

  if (workspaceRole && !managementPath) {
    return <AppLoading message="Opening your workspace…" />;
  }

  if (managementPath && !workspaceRole) {
    return <AppLoading message="Opening Dos Hermanos…" />;
  }

  if (!managementPath && pathname !== '/') {
    return <AppLoading message="Opening Dos Hermanos…" />;
  }

  if (workspaceRole && managementPath) {
    const basePath = getWorkspaceBasePath(workspaceRole);
    const page = getManagementPage(pathname, basePath, workspaceRole);

    if (!page) {
      return <AppLoading message="Opening your workspace…" />;
    }

    if (authState.profile) {
      return (
        <ManagementWorkspace
          page={page}
          pathname={pathname}
          profile={authState.profile}
          role={workspaceRole}
        />
      );
    }
  }

  return <PublicSite />;
}

function AppLoading({ message }: { message: string }) {
  return (
    <main className="app-loading" aria-busy="true" aria-live="polite">
      <div className="app-loading-brand" aria-label="Dos Hermanos Catering">
        <strong>Dos Hermanos</strong>
        <span>Catering</span>
      </div>
      <span className="app-loading-spinner" aria-hidden="true" />
      <p>{message}</p>
    </main>
  );
}

function PublicSite() {
  return (
    <div className="app-shell" id="top">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Dos Hermanos Catering home">
          <span className="brand-name">Dos Hermanos</span>
          <span className="brand-label">Catering</span>
        </a>
        <AuthMenu />
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="hero" aria-labelledby="hero-title">
          <p className="eyebrow">Catering made easier</p>
          <h1 id="hero-title">Choose a package that fits your event.</h1>
          <p className="hero-copy">
            Browse available packages, send your event details, and track the request in one place.
          </p>
          <a className="primary-link" href="#packages">
            View packages
          </a>
        </section>

        <PackageCatalog />
        <MyReservations />
        <MyPayments />
      </main>

      <footer className="site-footer">
        <span>Dos Hermanos Catering</span>
        <span>Hilongos, Leyte</span>
      </footer>
    </div>
  );
}

function ManagementWorkspace({
  page,
  pathname,
  profile,
  role,
}: {
  page: ManagementPage;
  pathname: string;
  profile: UserProfile;
  role: WorkspaceRole;
}) {
  const basePath = getWorkspaceBasePath(role);

  return (
    <ManagementShell
      role={role}
      profile={profile}
      pathname={pathname}
      pageTitle={getPageTitle(page)}
      pageDescription={getPageDescription(page)}
    >
      {renderManagementPage(page, profile, basePath, role)}
    </ManagementShell>
  );
}

function renderManagementPage(
  page: ManagementPage,
  profile: UserProfile,
  basePath: string,
  role: WorkspaceRole,
) {
  switch (page) {
    case 'dashboard':
      return <DashboardPanel workspaceBasePath={basePath} role={role} />;
    case 'reservations':
      return <ReservationReviewPanel staffId={profile.id} staffName={profile.displayName} />;
    case 'packages':
      return <PackageManagementPanel />;
    case 'inventory':
      return <InventoryPanel staffId={profile.id} staffName={profile.displayName} />;
    case 'payments':
      return <PaymentsPanel staffId={profile.id} staffName={profile.displayName} />;
    case 'equipment':
      return <EquipmentPanel staffId={profile.id} staffName={profile.displayName} />;
    case 'reports':
      return <ReportsPanel />;
    case 'users':
      return role === 'admin' ? <UsersRolesPanel currentUserId={profile.id} /> : null;
    case 'audit':
      return role === 'admin' ? <AuditPanel /> : null;
  }
}

function getWorkspaceRole(profile: UserProfile | null, status: string): WorkspaceRole | null {
  if (status !== 'active' || !profile) {
    return null;
  }

  if (profile.role === 'admin' || profile.role === 'staff') {
    return profile.role;
  }

  return null;
}

function getWorkspaceBasePath(role: WorkspaceRole) {
  return role === 'admin' ? '/admin' : '/staff';
}

function isManagementPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/staff' || pathname.startsWith('/staff/');
}

function isPathWithinWorkspace(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function getManagementPage(
  pathname: string,
  basePath: string,
  role: WorkspaceRole,
): ManagementPage | null {
  const routeSegment = pathname
    .slice(basePath.length)
    .replace(/^\/+|\/+$/g, '');

  if (routeSegment === '' || routeSegment === 'dashboard') {
    return 'dashboard';
  }

  if (
    routeSegment === 'reservations' ||
    routeSegment === 'packages' ||
    routeSegment === 'inventory' ||
    routeSegment === 'payments' ||
    routeSegment === 'equipment' ||
    routeSegment === 'reports'
  ) {
    return routeSegment;
  }

  if (routeSegment === 'users' && role === 'admin') {
    return 'users';
  }

  if (routeSegment === 'audit' && role === 'admin') {
    return 'audit';
  }

  return null;
}

function getPageTitle(page: ManagementPage) {
  switch (page) {
    case 'dashboard': return 'Dashboard';
    case 'reservations': return 'Reservations';
    case 'packages': return 'Packages';
    case 'inventory': return 'Inventory';
    case 'payments': return 'Payments';
    case 'equipment': return 'Equipment';
    case 'reports': return 'Reports';
    case 'users': return 'Users & roles';
    case 'audit': return 'Audit trail';
  }
}

function getPageDescription(page: ManagementPage) {
  switch (page) {
    case 'dashboard':
      return 'Monitor current operations and open the management area that needs attention.';
    case 'reservations':
      return 'Review incoming catering requests and their event details.';
    case 'packages':
      return 'Manage the catering packages and base prices shown to customers.';
    case 'inventory':
      return 'Track supplies, stock levels, and recorded stock movements.';
    case 'payments':
      return 'Record cash payments and review recent payment activity.';
    case 'equipment':
      return 'Manage equipment availability, event assignments, and release activity.';
    case 'reports':
      return 'Review operational records and export the current report when needed.';
    case 'users':
      return 'Manage account roles and access status for registered users.';
    case 'audit':
      return 'Review recorded management activity and accountability events.';
  }
}
