import { useEffect } from 'react';
import {
  getLegacyManagementRedirect,
  getManagementPage,
  getWorkspaceBasePath,
  getWorkspaceRole,
  isAllowedPublicPath,
  isManagementPath,
  isPathWithinWorkspace,
  pageMeta,
  type ManagementPage,
  type WorkspaceRole,
} from '@core/app/nav';
import { navigate, usePathname } from '@core/app/navigation';
import { ManagementShell } from '@core/app/ManagementShell';
import { AuditPanel } from '@modules/audit/AuditPanel';
import { useAuth } from '@modules/auth/AuthProvider';
import type { UserProfile } from '@modules/auth/auth.types';
import { DashboardPanel } from '@modules/dashboard/DashboardPanel';
import { OperationsPanel } from '@modules/operations/OperationsPanel';
import { PaymentsPanel } from '@modules/payments/PaymentsPanel';
import { PublicPortal } from '@modules/portal/PublicPortal';
import { ReportsPanel } from '@modules/reports/ReportsPanel';
import { ResourcesPanel } from '@modules/resources/ResourcesPanel';
import { UsersRolesPanel } from '@modules/users/UsersRolesPanel';

export function App() {
  const { authState, loadingMessage } = useAuth();
  const pathname = usePathname();
  const workspaceRole = getWorkspaceRole(authState.profile?.role, authState.status);
  const managementPath = isManagementPath(pathname);
  const publicPathAllowed = isAllowedPublicPath(pathname, authState.status, authState.profile?.role);

  useEffect(() => {
    if (authState.status === 'loading') return;

    if (!managementPath) {
      if (!publicPathAllowed) navigate('/', { replace: true });
      return;
    }

    if (!workspaceRole) {
      navigate('/', { replace: true });
      return;
    }

    const basePath = getWorkspaceBasePath(workspaceRole);
    if (!isPathWithinWorkspace(pathname, basePath)) {
      navigate(basePath, { replace: true });
      return;
    }

    const legacyPath = getLegacyManagementRedirect(pathname, basePath);
    if (legacyPath) {
      navigate(legacyPath, { replace: true });
      return;
    }

    if (!getManagementPage(pathname, basePath, workspaceRole)) {
      navigate(basePath, { replace: true });
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

  if (workspaceRole && managementPath && authState.profile) {
    const basePath = getWorkspaceBasePath(workspaceRole);
    const legacyPath = getLegacyManagementRedirect(pathname, basePath);
    const page = getManagementPage(pathname, basePath, workspaceRole);

    if (legacyPath || !page) {
      return <AppLoading message="Opening your workspace…" />;
    }

    return (
      <ManagementWorkspace
        page={page}
        pathname={pathname}
        profile={authState.profile}
        role={workspaceRole}
      />
    );
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
  const meta = pageMeta[page];

  return (
    <ManagementShell
      role={role}
      profile={profile}
      pathname={pathname}
      pageTitle={meta.title}
      pageDescription={meta.subtitle}
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
