/**
 * Button — a polymorphic link/button styled in three variants.
 * Renders as <a> (give it `href`) or <button>. Used for CTAs and card links.
 */
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

// No focus-visible:outline-none here: the global :focus-visible ring must show.
const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-[var(--m-dur)] ease-[var(--m-ease)] active:scale-[var(--m-press)] disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-white shadow-lg shadow-accent/25 hover:bg-accent-strong hover:shadow-accent/40 hover:translate-y-[var(--m-lift)]',
  secondary:
    'border border-border bg-surface text-text hover:border-accent/60 hover:bg-surface-2 hover:translate-y-[var(--m-lift)]',
  ghost: 'text-muted hover:text-text hover:bg-surface-2',
};

const sizes: Record<Size, string> = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  href,
  ...rest
}: CommonProps &
  (
    | ({ href: string } & AnchorHTMLAttributes<HTMLAnchorElement>)
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
  )) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href !== undefined) {
    return (
      <a href={href} className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }
  return (
    <button className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
