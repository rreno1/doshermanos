import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { AccountMenu, type AccountMenuUser } from './AccountMenu';
import { PrimaryNavigation, type PrimaryNavigationItem } from './PrimaryNavigation';

export interface NavigationOverlayAccount {
  user: AccountMenuUser;
  onLogout: () => void | Promise<void>;
}

export interface NavigationOverlayProps {
  id: string;
  open: boolean;
  theme: 'light' | 'green';
  anchorRef: RefObject<HTMLElement | null>;
  items: PrimaryNavigationItem[];
  account?: NavigationOverlayAccount;
  navigationLabel: string;
  onClose(): void;
}

const focusableSelector = [
  'button:not([disabled]):not([tabindex="-1"])',
  '[href]:not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusablesWithin(element: HTMLElement) {
  return Array.from(element.querySelectorAll<HTMLElement>(focusableSelector))
    .filter((candidate) => candidate.getClientRects().length > 0 && candidate.getAttribute('aria-hidden') !== 'true');
}

export function NavigationOverlay({
  id,
  open,
  theme,
  anchorRef,
  items,
  account,
  navigationLabel,
  onClose,
}: NavigationOverlayProps) {
  const [top, setTop] = useState(0);
  const panelRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    if (!open) return;

    const updateTop = () => {
      const anchorBottom = anchorRef.current?.getBoundingClientRect().bottom ?? 0;
      setTop(Math.max(0, Math.round(anchorBottom)));
    };

    updateTop();
    window.addEventListener('resize', updateTop);
    window.visualViewport?.addEventListener('resize', updateTop);

    const observer = typeof ResizeObserver !== 'undefined' && anchorRef.current
      ? new ResizeObserver(updateTop)
      : null;
    if (observer && anchorRef.current) observer.observe(anchorRef.current);

    return () => {
      window.removeEventListener('resize', updateTop);
      window.visualViewport?.removeEventListener('resize', updateTop);
      observer?.disconnect();
    };
  }, [anchorRef, open]);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousRootOverscroll = root.style.overscrollBehavior;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const scrollbarGap = Math.max(0, window.innerWidth - root.clientWidth);

    root.style.overflow = 'hidden';
    root.style.overscrollBehavior = 'none';
    body.style.overflow = 'hidden';

    if (scrollbarGap > 0) {
      const bodyPadding = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${bodyPadding + scrollbarGap}px`;
    }

    const focusFrame = window.requestAnimationFrame(() => {
      const focusable = panelRef.current ? focusablesWithin(panelRef.current) : [];
      (focusable[0] ?? panelRef.current)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = focusablesWithin(panelRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const active = document.activeElement as HTMLElement | null;
      const activeIndex = active ? focusable.indexOf(active) : -1;
      const nextIndex = event.shiftKey
        ? (activeIndex <= 0 ? focusable.length - 1 : activeIndex - 1)
        : (activeIndex < 0 || activeIndex === focusable.length - 1 ? 0 : activeIndex + 1);

      event.preventDefault();
      focusable[nextIndex]?.focus();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      root.style.overflow = previousRootOverflow;
      root.style.overscrollBehavior = previousRootOverscroll;
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
      const previousFocus = previousFocusRef.current;
      if (previousFocus?.isConnected && previousFocus.getClientRects().length > 0) previousFocus.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const desktopQuery = window.matchMedia('(min-width: 901px)');
    const handleDesktopTransition = (event: MediaQueryListEvent) => {
      if (event.matches) onCloseRef.current();
    };
    desktopQuery.addEventListener('change', handleDesktopTransition);
    return () => desktopQuery.removeEventListener('change', handleDesktopTransition);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className={`navigation-overlay theme-${theme}`} style={{ top }} role="presentation">
      <div
        className="navigation-overlay-backdrop"
        aria-hidden="true"
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }}
      />
      <section
        id={id}
        ref={panelRef}
        className="navigation-overlay-panel"
        role="dialog"
        aria-modal="true"
        aria-label={navigationLabel}
        tabIndex={-1}
      >
        <div className="navigation-overlay-inner">
          <PrimaryNavigation
            items={items}
            orientation="menu"
            ariaLabel={navigationLabel}
            onItemActivated={onClose}
          />
          {account ? (
            <AccountMenu
              variant="menu"
              user={account.user}
              onLogout={() => {
                onClose();
                return account.onLogout();
              }}
            />
          ) : null}
        </div>
      </section>
    </div>,
    document.body,
  );
}
