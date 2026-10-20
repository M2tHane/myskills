import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

/**
 * Button — seven variants. `default` (blue, solid) is the single most important action of a view;
 * `outline` is the everyday button. Labels are verb-first: “新建查询”, “导出”, “删除”.
 */
const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap select-none',
    'h-(--control-md) px-3 rounded-sm border border-transparent font-sans text-body-sm font-medium',
    'transition-[background-color,border-color,color,box-shadow] duration-100 cursor-pointer outline-none',
    'disabled:cursor-not-allowed [&_svg]:size-4 [&_svg]:shrink-0 data-[loading]:pointer-events-none data-[loading]:cursor-progress',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-primary border-primary-hover text-primary-fg shadow-primary',
          'hover:bg-primary-hover active:bg-primary-active active:shadow-press-primary',
          'focus-visible:shadow-[var(--shadow-primary),var(--focus-ring)]',
          'disabled:bg-(--blue-200) disabled:border-(--blue-200) disabled:shadow-none',
        ],
        outline: [
          'bg-surface border-border-strong text-fg shadow-control [&_svg]:text-fg-muted',
          'hover:bg-surface-hover hover:border-(--gray-400) active:bg-surface-active active:shadow-inset',
          'focus-visible:shadow-[var(--shadow-control),var(--focus-ring)]',
          'disabled:bg-surface-sunken disabled:border-border disabled:text-fg-disabled disabled:shadow-none disabled:[&_svg]:text-fg-disabled',
        ],
        secondary: [
          'bg-surface-active text-fg [&_svg]:text-fg-muted',
          'hover:bg-(--gray-150) active:bg-(--gray-200) active:shadow-inset focus-visible:shadow-focus-ring',
          'disabled:bg-surface-sunken disabled:text-fg-disabled disabled:[&_svg]:text-fg-disabled',
        ],
        ghost: [
          'bg-transparent text-fg-muted',
          'hover:bg-surface-hover hover:text-fg active:bg-surface-active active:text-fg',
          'focus-visible:shadow-focus-ring focus-visible:text-fg disabled:text-fg-disabled disabled:bg-transparent',
        ],
        link: [
          'h-auto px-0 border-0 bg-transparent text-link rounded-xs',
          'hover:text-primary-hover hover:underline hover:underline-offset-3 hover:decoration-primary-line',
          'active:text-primary-active focus-visible:shadow-focus-ring disabled:text-fg-disabled disabled:no-underline',
        ],
        destructive: [
          'bg-danger border-danger-hover text-primary-fg shadow-danger',
          'hover:bg-danger-hover active:bg-danger-active active:shadow-press-danger',
          'focus-visible:shadow-[var(--shadow-danger),var(--focus-ring-danger)]',
          'disabled:bg-danger-line disabled:border-danger-line disabled:shadow-none',
        ],
        'destructive-outline': [
          'bg-surface border-border-strong text-danger shadow-control',
          'hover:bg-danger-soft hover:border-danger-line active:bg-danger-soft active:border-danger-line active:shadow-inset',
          'focus-visible:shadow-[var(--shadow-control),var(--focus-ring-danger)]',
          'disabled:bg-surface-sunken disabled:border-border disabled:text-fg-disabled disabled:shadow-none',
        ],
      },
      size: {
        sm: 'h-(--control-sm) px-2 text-caption [&_svg]:size-3.5',
        md: '',
        lg: 'h-(--control-lg) px-4 gap-2 text-body',
        'icon-sm': 'size-(--control-sm) px-0 [&_svg]:size-3.5',
        icon: 'size-(--control-md) px-0',
        'icon-lg': 'size-(--control-lg) px-0 [&_svg]:size-4.5',
      },
    },
    compoundVariants: [{ variant: 'link', className: 'h-auto px-0' }],
    defaultVariants: { variant: 'outline', size: 'md' },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Shows a spinner in place of the left icon; the label stays, dimmed. */
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, loading, leftIcon, rightIcon, asChild, children, type = 'button', ...props },
  ref,
) {
  if (asChild) {
    return <Slot ref={ref} data-variant={variant ?? 'outline'} className={cn(buttonVariants({ variant, size }), className)} {...props}>{children}</Slot>;
  }
  return (
    <button
      ref={ref}
      type={type}
      data-variant={variant ?? 'outline'}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? <Spinner /> : leftIcon}
      {children != null && <span className={cn(loading && 'opacity-70')}>{children}</span>}
      {!loading && rightIcon}
    </button>
  );
});

export { buttonVariants };
