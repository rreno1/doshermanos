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
import { AdminShell } from '@shared/ui/AdminShell';
import type { PrimaryNavigationItem } from '@shared/ui/PrimaryNavigation';

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

  const brand = {
    title: 'Dos Hermanos',
    subtitle: 'Catering',
    onClick: () => navigate(basePath),
  };

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <AdminShell
        brand={brand}
        navigationItems={primaryItems}
        navigationLabel={`${formatWorkspaceRole(role)} navigation`}
        pageHeader={{ title: pageTitle, subtitle: pageDescription }}
        account={{ user: accountUser, onLogout: handleLogout }}
        mainId="main-content"
      >
        <div className="admin-page-stage" key={pathname}>
          <div className="management-page">{children}</div>
        </div>
      </AdminShell>
    </>
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
