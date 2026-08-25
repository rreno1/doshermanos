import type { UserProfile } from '../auth/auth.types';
import { MyPayments } from '../payments/MyPayments';
import { MyReservations } from '../operations/MyReservations';
import { PackageCatalog } from '../operations/PackageCatalog';
import { LandingPage } from './LandingPage';
import { PortalHomePage } from './PortalHomePage';
import { PortalShell } from './PortalShell';

type WorkspaceRole = 'staff' | 'admin';

type PublicPortalProps = {
  pathname: string;
  profile: UserProfile | null;
  status: string;
  workspaceRole: WorkspaceRole | null;
};

export function PublicPortal({ pathname, profile, status, workspaceRole }: PublicPortalProps) {
  const activeProfile = status === 'active' ? profile : null;
  const landing = !activeProfile;

  return (
    <PortalShell
      pathname={pathname}
      profile={activeProfile}
      workspaceRole={activeProfile ? workspaceRole : null}
      landing={landing}
    >
      {landing ? <LandingPage /> : renderPortalPage(pathname, activeProfile, workspaceRole)}
    </PortalShell>
  );
}

function renderPortalPage(
  pathname: string,
  profile: UserProfile,
  workspaceRole: WorkspaceRole | null,
) {
  if (pathname === '/packages') {
    return (
      <div className="portal-page portal-packages-page">
        <PackageCatalog />
      </div>
    );
  }

  if (pathname === '/reservations' && profile.role === 'customer') {
    return (
      <div className="portal-page portal-reservations-page">
        <MyReservations />
      </div>
    );
  }

  if (pathname === '/payments' && profile.role === 'customer') {
    return (
      <div className="portal-page portal-payments-page">
        <MyPayments />
      </div>
    );
  }

  return <PortalHomePage profile={profile} workspaceRole={workspaceRole} />;
}
