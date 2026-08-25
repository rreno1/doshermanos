import { useEffect } from 'react';
import { AuditPanel } from '../features/audit/AuditPanel';
import { AuthMenu } from '../features/auth/AuthMenu';
import { useAuth } from '../features/auth/AuthProvider';
import type { UserProfile } from '../features/auth/auth.types';
import { DashboardPanel } from '../features/dashboard/DashboardPanel';
import { EquipmentPanel } from '../features/equipment/EquipmentPanel';
import { InventoryPanel } from '../features/inventory/InventoryPanel';
import { PackageCatalog } from '../features/packages/PackageCatalog';
import { MyPayments } from '../features/payments/MyPayments';
import { PaymentsPanel } from '../features/payments/PaymentsPanel';
import { ReportsPanel } from '../features/reports/ReportsPanel';
import { MyReservations } from '../features/reservations/MyReservations';
import { ReservationReviewPanel } from '../features/reservations/ReservationReviewPanel';
import { ManagementShell } from './ManagementShell';
import { navigate, usePathname } from './navigation';

type WorkspaceRole = 'staff' | 'admin';

type ManagementPage =
  | 'dashboard'
  | 'reservations'
  | 'inventory'
  | 'payments'
  | 'equipment'
  | 'reports'
  | 'audit';

export function App() {
  const { authState } = useAuth();
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

  if (workspaceRole && managementPath) {
    const basePath = getWorkspaceBasePath(workspaceRole);
    const page = getManagementPage(pathname, basePath, workspaceRole);

    if (page && authState.profile) {
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
      return <DashboardPanel workspaceBasePath={basePath} />;
    case 'reservations':
      return <ReservationReviewPanel staffId={profile.id} staffName={profile.displayName} />;
    case 'inventory':
      return <InventoryPanel staffId={profile.id} staffName={profile.displayName} />;
    case 'payments':
      return <PaymentsPanel staffId={profile.id} staffName={profile.displayName} />;
    case 'equipment':
      return <EquipmentPanel staffId={profile.id} staffName={profile.displayName} />;
    case 'reports':
      return <ReportsPanel />;
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
    routeSegment === 'inventory' ||
    routeSegment === 'payments' ||
    routeSegment === 'equipment' ||
    routeSegment === 'reports'
  ) {
    return routeSegment;
  }

  if (routeSegment === 'audit' && role === 'admin') {
    return 'audit';
  }

  return null;
}

function getPageTitle(page: ManagementPage) {
  switch (page) {
    case 'dashboard':
      return 'Dashboard';
    case 'reservations':
      return 'Reservations';
    case 'inventory':
      return 'Inventory';
    case 'payments':
      return 'Payments';
    case 'equipment':
      return 'Equipment';
    case 'reports':
      return 'Reports';
    case 'audit':
      return 'Audit trail';
  }
}
