import type { UserProfile } from '../auth/auth.types';
import { MyPayments } from '../payments/MyPayments';
import { MyReservations } from '../operations/MyReservations';
import { PackageCatalog } from '../operations/PackageCatalog';
import { LandingPage } from './LandingPage';
import { PortalHomePage } from './PortalHomePage';
import { PortalShell } from './PortalShell';
import './portal-access.css';

type WorkspaceRole = 'staff' | 'admin';

type PublicPortalProps = {
  pathname: string;
  profile: UserProfile | null;
  status: string;
  workspaceRole: WorkspaceRole | null;
};

export function PublicPortal({ pathname, profile, status, workspaceRole }: PublicPortalProps) {
  if (status === 'signed_out') {
    return (
      <PortalShell pathname={pathname} profile={null} workspaceRole={null} landing>
        <LandingPage />
      </PortalShell>
    );
  }

  const activeProfile = status === 'active' ? profile : null;

  if (!activeProfile) {
    return (
      <PortalShell pathname={pathname} profile={null} workspaceRole={null} landing>
        <section className="portal-access-state" aria-labelledby="portal-access-title">
          <p className="portal-eyebrow">Dos Hermanos account</p>
          <h1 id="portal-access-title">Portal access is unavailable.</h1>
          <p>Open your account menu for the current account status or sign out to return to the public landing page.</p>
        </section>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      pathname={pathname}
      profile={activeProfile}
      workspaceRole={workspaceRole}
      landing={false}
    >
      {renderPortalPage(pathname, activeProfile, workspaceRole)}
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
