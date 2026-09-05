export interface AppBrandProps {
  theme?: 'light' | 'green';
  title?: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function AppBrand({
  theme = 'light',
  title = 'Dos Hermanos',
  subtitle = 'Catering',
  href = '/',
  onClick,
  className = '',
}: AppBrandProps) {
  const classes = `app-brand app-brand-${theme}${className ? ` ${className}` : ''}`;
  const content = (
    <span className="app-brand-copy">
      <strong className="app-brand-title">{title}</strong>
      <small className="app-brand-subtitle">{subtitle}</small>
    </span>
  );

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} title={`Go to ${title}`}>
        {content}
      </button>
    );
  }

  return (
    <a className={classes} href={href} title={`Go to ${title}`}>
      {content}
    </a>
  );
}
