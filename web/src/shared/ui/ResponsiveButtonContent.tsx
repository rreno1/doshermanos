import type { ReactNode } from 'react';

export type ActionIconName =
  | 'account'
  | 'add'
  | 'assign'
  | 'download'
  | 'previous'
  | 'next'
  | 'cash'
  | 'signout'
  | 'edit'
  | 'stock'
  | 'save'
  | 'visibility'
  | 'reject'
  | 'release'
  | 'return'
  | 'cancel'
  | 'action';

export function ResponsiveButtonContent({ icon, label }: { icon: ActionIconName; label: string }) {
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
  if (name === 'account') return <Icon><circle cx="10" cy="7" r="3" /><path d="M4.5 16c.7-3 2.6-4.5 5.5-4.5S14.8 13 15.5 16" /></Icon>;
  if (name === 'add') return <Icon><path d="M10 4v12M4 10h12" /></Icon>;
  if (name === 'assign') return <Icon><rect x="4" y="5" width="12" height="11" rx="2" /><path d="M7 3.5v3M13 3.5v3M7 10h6M10 7v6" /></Icon>;
  if (name === 'download') return <Icon><path d="M10 3.5v8M6.5 8.5 10 12l3.5-3.5M4 15.5h12" /></Icon>;
  if (name === 'cash') return <Icon><rect x="3.5" y="5" width="13" height="10" rx="2" /><circle cx="10" cy="10" r="2" /><path d="M6 7.5h.01M14 12.5h.01" /></Icon>;
  if (name === 'signout') return <Icon><path d="M8 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8M11 6l4 4-4 4M7 10h8" /></Icon>;
  if (name === 'edit') return <Icon><path d="m5 14.5.7-3.2 6.8-6.8 3 3-6.8 6.8-3.2.7Z" /><path d="m11.5 5.5 3 3" /></Icon>;
  if (name === 'stock') return <Icon><path d="M4 5.5h12v9H4zM7 8.5h6M7 11.5h6" /></Icon>;
  if (name === 'save') return <Icon><path d="M4 4h10l2 2v10H4zM7 4v5h6V4M7 13h6" /></Icon>;
  if (name === 'visibility') return <Icon><path d="M2.8 10s2.7-4 7.2-4 7.2 4 7.2 4-2.7 4-7.2 4-7.2-4-7.2-4Z" /><circle cx="10" cy="10" r="2" /></Icon>;
  if (name === 'reject' || name === 'cancel') return <Icon><circle cx="10" cy="10" r="6" /><path d="m7.5 7.5 5 5M12.5 7.5l-5 5" /></Icon>;
  if (name === 'release') return <Icon><path d="M4 6h8v8H4zM9 10h7M13 7l3 3-3 3" /></Icon>;
  if (name === 'return') return <Icon><path d="M16 6H8v8h8zM11 10H4M7 7l-3 3 3 3" /></Icon>;
  if (name === 'action') return <Icon><path d="M4 10h11M11 6l4 4-4 4" /></Icon>;

  return <Icon><path d={name === 'previous' ? 'M12.5 4.5 7 10l5.5 5.5' : 'M7.5 4.5 13 10l-5.5 5.5'} /></Icon>;
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}
