import {
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent as ReactMouseEvent,
} from 'react';

const navigationEventName = 'dos-hermanos:navigation';

type NavigationOptions = {
  replace?: boolean;
};

export function navigate(to: string, options: NavigationOptions = {}) {
  const currentLocation = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (currentLocation === to) {
    return;
  }

  if (options.replace) {
    window.history.replaceState({}, '', to);
  } else {
    window.history.pushState({}, '', to);
  }

  window.dispatchEvent(new Event(navigationEventName));
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

export function usePathname() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const updatePathname = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', updatePathname);
    window.addEventListener(navigationEventName, updatePathname);

    return () => {
      window.removeEventListener('popstate', updatePathname);
      window.removeEventListener(navigationEventName, updatePathname);
    };
  }, []);

  return pathname;
}

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string;
};

export function AppLink({ to, onClick, target, ...props }: AppLinkProps) {
  function handleClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      target === '_blank'
    ) {
      return;
    }

    event.preventDefault();
    navigate(to);
  }

  return <a {...props} href={to} target={target} onClick={handleClick} />;
}
