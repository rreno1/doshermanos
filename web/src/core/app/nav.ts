export type WorkspaceRole = 'staff' | 'admin';

export type ManagementPage =
  | 'dashboard'
  | 'operations'
  | 'resources'
  | 'payments'
  | 'reports'
  | 'users'
  | 'audit';

export type NavIconName =
  | 'dashboard'
  | 'operations'
  | 'resources'
  | 'payments'
  | 'reports'
  | 'users'
  | 'audit';

type ManagementNavigationDefinition = {
  key: ManagementPage;
  label: string;
  icon: NavIconName;
  roles: WorkspaceRole[];
};

export type ManagementNavigationItem = ManagementNavigationDefinition & {
  path: string;
};

const ALL_WORKSPACE_ROLES: WorkspaceRole[] = ['staff', 'admin'];
const ADMIN_ONLY: WorkspaceRole[] = ['admin'];

export const pageMeta: Record<ManagementPage, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Monitor current operations and open the management area that needs attention.',
  },
  operations: {
    title: 'Operations',
    subtitle: 'Create reservation requests, review incoming bookings, and manage catering packages.',
  },
  resources: {
    title: 'Resources',
    subtitle: 'Manage pantry inventory, equipment availability, assignments, and resource activity.',
  },
  payments: {
    title: 'Payments',
    subtitle: 'Record cash payments and review recent payment activity.',
  },
  reports: {
    title: 'Reports',
    subtitle: 'Review operational records and export the current report when needed.',
  },
  users: {
    title: 'Users & roles',
    subtitle: 'Manage account roles and access status for registered users.',
  },
  audit: {
    title: 'Audit trail',
    subtitle: 'Review recorded management activity and accountability events.',
  },
};

export const navIcons: Record<NavIconName, string> = {
  dashboard: 'M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z',
  operations: 'M4 5h16v4H4V5Zm0 6h10v4H4v-4Zm0 6h16v2H4v-2Z',
  resources: 'M5 4h14a1 1 0 0 1 1 1v14H4V5a1 1 0 0 1 1-1Zm2 3v3h3V7H7Zm0 5v3h3v-3H7Zm5-5v3h5V7h-5Zm0 5v3h5v-3h-5Z',
  payments: 'M3 6h18v12H3V6Zm2 3v6h14V9H5Zm7 1.5A1.5 1.5 0 1 1 12 13.5a1.5 1.5 0 0 1 0-3Z',
  reports: 'M5 3h14v18H5V3Zm3 4v2h8V7H8Zm0 4v2h8v-2H8Zm0 4v2h5v-2H8Z',
  users: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 19c0-3 2-5 5-5s5 2 5 5H3Zm10.5 0c0-1.8-.55-3.25-1.45-4.35A5.8 5.8 0 0 1 16 13c2.8 0 5 2 5 5v1h-7.5Z',
  audit: 'M12 3 4 6v5c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-3Zm-1 12-3-3 1.4-1.4 1.6 1.6 3.6-3.6L16 10l-5 5Z',
};

const navigationDefinitions: ManagementNavigationDefinition[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', roles: ALL_WORKSPACE_ROLES },
  { key: 'operations', label: 'Operations', icon: 'operations', roles: ALL_WORKSPACE_ROLES },
  { key: 'resources', label: 'Resources', icon: 'resources', roles: ALL_WORKSPACE_ROLES },
  { key: 'payments', label: 'Payments', icon: 'payments', roles: ALL_WORKSPACE_ROLES },
  { key: 'reports', label: 'Reports', icon: 'reports', roles: ALL_WORKSPACE_ROLES },
  { key: 'users', label: 'Users & roles', icon: 'users', roles: ADMIN_ONLY },
  { key: 'audit', label: 'Audit trail', icon: 'audit', roles: ADMIN_ONLY },
];

export function getWorkspaceRole(role: string | undefined, status: string): WorkspaceRole | null {
  if (status !== 'active') return null;
  if (role === 'admin' || role === 'staff') return role;
  return null;
}

export function getWorkspaceBasePath(role: WorkspaceRole): '/admin' | '/staff' {
  return role === 'admin' ? '/admin' : '/staff';
}

export function getAllowedNavigation(role: WorkspaceRole): ManagementNavigationItem[] {
  const basePath = getWorkspaceBasePath(role);
  return navigationDefinitions
    .filter((item) => item.roles.includes(role))
    .map((item) => ({
      ...item,
      path: item.key === 'dashboard' ? basePath : `${basePath}/${item.key}`,
    }));
}

export function isManagementPath(pathname: string): boolean {
  return pathname === '/admin'
    || pathname.startsWith('/admin/')
    || pathname === '/staff'
    || pathname.startsWith('/staff/');
}

export function isAllowedPublicPath(pathname: string, status: string, role?: string): boolean {
  if (pathname === '/') return true;
  if (status !== 'active' || !role) return false;
  if (pathname === '/packages') return true;
  return role === 'customer' && (pathname === '/reservations' || pathname === '/payments');
}

export function isPathWithinWorkspace(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function getLegacyManagementRedirect(pathname: string, basePath: string): string | null {
  const routeSegment = getRouteSegment(pathname, basePath);

  if (routeSegment === 'reservations' || routeSegment === 'packages') {
    return `${basePath}/operations`;
  }

  if (routeSegment === 'inventory' || routeSegment === 'equipment') {
    return `${basePath}/resources`;
  }

  return null;
}

export function getManagementPage(
  pathname: string,
  basePath: string,
  role: WorkspaceRole,
): ManagementPage | null {
  const routeSegment = getRouteSegment(pathname, basePath);

  if (routeSegment === '' || routeSegment === 'dashboard') return 'dashboard';

  if (
    routeSegment === 'operations'
    || routeSegment === 'resources'
    || routeSegment === 'payments'
    || routeSegment === 'reports'
  ) {
    return routeSegment;
  }

  if (routeSegment === 'users' && role === 'admin') return 'users';
  if (routeSegment === 'audit' && role === 'admin') return 'audit';
  return null;
}

export function isNavigationItemActive(pathname: string, itemPath: string, basePath: string): boolean {
  if (itemPath === basePath) {
    return pathname === basePath
      || pathname === `${basePath}/`
      || pathname === `${basePath}/dashboard`;
  }

  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export function formatWorkspaceRole(role: WorkspaceRole): string {
  return role === 'admin' ? 'Administrator' : 'Staff';
}

function getRouteSegment(pathname: string, basePath: string): string {
  return pathname.slice(basePath.length).replace(/^\/+|\/+$/g, '');
}
