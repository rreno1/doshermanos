export type ActionIconName =
  | 'account'
  | 'add'
  | 'assign'
  | 'download'
  | 'previous'
  | 'next'
  | 'cash'
  | 'signout'
  | 'action';

export function ResponsiveButtonContent({
  icon,
  label,
}: {
  icon: ActionIconName;
  label: string;
}) {
  return (
    <>
      <span className="responsive-button-icon" aria-hidden="true">
        <ActionIcon name={icon} />
      </span>
      <span className="responsive-button-label">{label}</span>
    </>
  );
}

function ActionIcon({ name }: { name: ActionIconName }) {
  if (name === 'account') {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
        <circle cx="10" cy="7" r="3" />
        <path d="M4.5 16c.7-3 2.6-4.5 5.5-4.5S14.8 13 15.5 16" />
      </svg>
    );
  }

  if (name === 'add') {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
        <path d="M10 4v12M4 10h12" />
      </svg>
    );
  }

  if (name === 'assign') {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
        <rect x="4" y="5" width="12" height="11" rx="2" />
        <path d="M7 3.5v3M13 3.5v3M7 10h6M10 7v6" />
      </svg>
    );
  }

  if (name === 'download') {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
        <path d="M10 3.5v8M6.5 8.5 10 12l3.5-3.5M4 15.5h12" />
      </svg>
    );
  }

  if (name === 'cash') {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
        <rect x="3.5" y="5" width="13" height="10" rx="2" />
        <circle cx="10" cy="10" r="2" />
        <path d="M6 7.5h.01M14 12.5h.01" />
      </svg>
    );
  }

  if (name === 'signout') {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
        <path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8M11 6l4 4-4 4M7 10h8" />
      </svg>
    );
  }

  if (name === 'action') {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
        <path d="M4 10h11M11 6l4 4-4 4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
      <path d={name === 'previous' ? 'M12.5 4.5 7 10l5.5 5.5' : 'M7.5 4.5 13 10l-5.5 5.5'} />
    </svg>
  );
}
