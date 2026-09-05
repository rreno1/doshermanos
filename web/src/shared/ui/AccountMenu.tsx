export interface AccountMenuUser {
  displayName: string;
  email: string;
  role: string;
}

export interface AccountMenuProps {
  user: AccountMenuUser;
  onLogout: () => void | Promise<void>;
  variant?: 'sidebar' | 'menu';
  className?: string;
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function DisclosureIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function roleLabel(role: string) {
  return role.replaceAll('_', ' ');
}

export function AccountMenu({ user, onLogout, variant = 'sidebar', className = '' }: AccountMenuProps) {
  if (variant === 'menu') {
    return (
      <div className={`account-menu account-menu-mobile${className ? ` ${className}` : ''}`}>
        <div className="account-menu-info">
          <div className="account-menu-avatar" aria-hidden="true">{user.displayName.slice(0, 1).toUpperCase()}</div>
          <div className="account-menu-copy">
            <strong>{user.displayName}</strong>
            <small>{roleLabel(user.role)}</small>
          </div>
        </div>
        <button type="button" className="account-menu-logout" onClick={() => void onLogout()}>
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </div>
    );
  }

  return (
    <details
      className={`account-menu account-menu-sidebar${className ? ` ${className}` : ''}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          event.currentTarget.removeAttribute('open');
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && event.currentTarget.open) {
          event.preventDefault();
          event.currentTarget.removeAttribute('open');
          event.currentTarget.querySelector<HTMLElement>('summary')?.focus();
        }
      }}
    >
      <summary className="account-menu-trigger" aria-label="User profile and logout menu">
        <div className="account-menu-avatar" aria-hidden="true">{user.displayName.slice(0, 1).toUpperCase()}</div>
        <div className="account-menu-copy">
          <strong>{user.displayName}</strong>
          <small>{roleLabel(user.role)}</small>
        </div>
        <span className="account-menu-disclosure" aria-hidden="true"><DisclosureIcon /></span>
      </summary>
      <div className="account-menu-popover" role="dialog" aria-label="Account details">
        <div className="account-menu-popover-info">
          <strong>{user.displayName}</strong>
          <small>{user.email}</small>
          <div className="meta account-menu-role">{roleLabel(user.role)}</div>
        </div>
        <button type="button" className="account-menu-logout" onClick={() => void onLogout()}>
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </div>
    </details>
  );
}
