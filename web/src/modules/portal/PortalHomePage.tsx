import type { UserProfile } from '../auth/auth.types';
import { AppLink } from '../../app/navigation';

type WorkspaceRole = 'staff' | 'admin';

export function PortalHomePage({
  profile,
  workspaceRole,
}: {
  profile: UserProfile;
  workspaceRole: WorkspaceRole | null;
}) {
  const isCustomer = profile.role === 'customer';

  return (
    <section className="portal-home" aria-labelledby="portal-home-title">
      <div className="portal-home-hero">
        <div>
          <p className="portal-eyebrow">Welcome back</p>
          <h1 id="portal-home-title">{profile.displayName}</h1>
          <p>
            {isCustomer
              ? 'Choose a package, send a reservation request, and keep track of your catering activity from one place.'
              : 'You are viewing the customer-facing Dos Hermanos portal.'}
          </p>
        </div>
        {workspaceRole ? (
          <AppLink className="portal-primary-link" to={workspaceRole === 'admin' ? '/admin' : '/staff'}>
            Open Workspace
          </AppLink>
        ) : null}
      </div>

      <div className="portal-home-actions">
        <AppLink className="portal-action-card" to="/packages">
          <span>Packages</span>
          <h2>Browse catering packages</h2>
          <p>Review current package options, base prices, and menu highlights.</p>
          <strong>View packages →</strong>
        </AppLink>

        {isCustomer ? (
          <>
            <AppLink className="portal-action-card" to="/reservations">
              <span>Reservations</span>
              <h2>Track your requests</h2>
              <p>Check the latest status and event details for your submitted requests.</p>
              <strong>My reservations →</strong>
            </AppLink>
            <AppLink className="portal-action-card" to="/payments">
              <span>Payments</span>
              <h2>Review payment activity</h2>
              <p>See cash receipts that have been recorded for your reservations.</p>
              <strong>View payments →</strong>
            </AppLink>
          </>
        ) : null}
      </div>

      <section className="portal-home-guide" aria-labelledby="portal-guide-title">
        <div>
          <p className="portal-eyebrow">Reservation flow</p>
          <h2 id="portal-guide-title">What happens after you choose a package?</h2>
        </div>
        <ol>
          <li><span>1</span><div><strong>Choose a package</strong><p>Start from the current package catalog.</p></div></li>
          <li><span>2</span><div><strong>Enter event details</strong><p>Add the date, location, guest count, and customization requests.</p></div></li>
          <li><span>3</span><div><strong>Submit for review</strong><p>Dos Hermanos reviews the request before confirmation.</p></div></li>
          <li><span>4</span><div><strong>Track updates</strong><p>Return to the portal to review reservation and payment activity.</p></div></li>
        </ol>
      </section>
    </section>
  );
}
