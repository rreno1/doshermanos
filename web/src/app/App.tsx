import { useEffect } from 'react';
import { AuditPanel } from '../features/audit/AuditPanel';
import { useAuth } from '../features/auth/AuthProvider';
import type { UserProfile } from '../features/auth/auth.types';
import { DashboardPanel } from '../features/dashboard/DashboardPanel';
import { OperationsPanel } from '../features/operations/OperationsPanel';
import { PaymentsPanel } from '../features/payments/PaymentsPanel';
import { PublicPortal } from '../features/portal/PublicPortal';
import { ReportsPanel } from '../features/reports/ReportsPanel';
import { ResourcesPanel } from '../features/resources/ResourcesPanel';
import { UsersRolesPanel } from '../features/users/UsersRolesPanel';
import { ManagementShell } from './ManagementShell';
import { navigate, usePathname } from './navigation';

type WorkspaceRole = 'staff' | 'admin';

type ManagementPage =
  | 'dashboard'
  | 'operations'
  | 'resources'
  | 'payments'
  | 'reports'
  | 'users'
  | 'audit';

export function App() {
  const { authState, loadingMessage } = useAuth();
  const pathname = usePathname();
  const workspaceRole = getWorkspaceRole(authState.profile, authState.status);
  const managementPath = isManagementPath(pathname);
  const publicPathAllowed = isAllowedPublicPath(pathname, authState.status, authState.profile);

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

      const legacyPath = getLegacyManagementRedirect(pathname, expectedBasePath);
      if (legacyPath) {
        navigate(legacyPath, { replace: true });
        return;
      }

      const page = getManagementPage(pathname, expectedBasePath, workspaceRole);
      if (!page) {
        navigate(expectedBasePath, { replace: true });
      }
      return;
    }

    if (!publicPathAllowed) {
      navigate('/', { replace: true });
    }
  }, [authState.status, managementPath, pathname, publicPathAllowed, workspaceRole]);

  if (authState.status === 'loading') {
    return <AppLoading message={loadingMessage ?? 'Loading Dos Hermanos…'} />;
  }

  if (managementPath && !workspaceRole) {
    return <AppLoading message="Opening Dos Hermanos…" />;
  }

  if (!managementPath && !publicPathAllowed) {
    return <AppLoading message="Opening Dos Hermanos…" />;
  }

  if (workspaceRole && managementPath) {
    const basePath = getWorkspaceBasePath(workspaceRole);
    const legacyPath = getLegacyManagementRedirect(pathname, basePath);
    if (legacyPath) {
      return <AppLoading message="Opening your workspace…" />;
    }

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

  return (
    <PublicPortal
      pathname={pathname}
      profile={authState.profile}
      status={authState.status}
      workspaceRole={workspaceRole}
    />
  );
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
    case 'operations':
      return <OperationsPanel staffId={profile.id} staffName={profile.displayName} />;
    case 'resources':
      return <ResourcesPanel staffId={profile.id} staffName={profile.displayName} />;
    case 'payments':
      return <PaymentsPanel staffId={profile.id} staffName={profile.displayName} />;
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

function isAllowedPublicPath(pathname: string, status: string, profile: UserProfile | null) {
  if (pathname === '/') {
    return true;
  }

  if (status !== 'active' || !profile) {
    return false;
  }

  if (pathname === '/packages') {
    return true;
  }

  return profile.role === 'customer' && (pathname === '/reservations' || pathname === '/payments');
}

function isPathWithinWorkspace(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function getLegacyManagementRedirect(pathname: string, basePath: string) {
  const routeSegment = pathname.slice(basePath.length).replace(/^\/+|\/+$/g, '');

  if (routeSegment === 'reservations' || routeSegment === 'packages') {
    return `${basePath}/operations`;
  }

  if (routeSegment === 'inventory' || routeSegment === 'equipment') {
    return `${basePath}/resources`;
  }

  return null;
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
    routeSegment === 'operations' ||
    routeSegment === 'resources' ||
    routeSegment === 'payments' ||
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
    case 'operations': return 'Operations';
    case 'resources': return 'Resources';
    case 'payments': return 'Payments';
    case 'reports': return 'Reports';
    case 'users': return 'Users & roles';
    case 'audit': return 'Audit trail';
  }
}

function getPageDescription(page: ManagementPage) {
  switch (page) {
    case 'dashboard':
      return 'Monitor current operations and open the management area that needs attention.';
    case 'operations':
      return 'Create reservation requests, review incoming bookings, and manage catering packages.';
    case 'resources':
      return 'Manage pantry inventory, equipment availability, assignments, and resource activity.';
    case 'payments':
      return 'Record cash payments and review recent payment activity.';
    case 'reports':
      return 'Review operational records and export the current report when needed.';
    case 'users':
      return 'Manage account roles and access status for registered users.';
    case 'audit':
      return 'Review recorded management activity and accountability events.';
  }
}
