import * as React from 'react';
import { Button, type ButtonProps } from './button';
import { Tooltip } from './tooltip';

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children' | 'size'> {
  icon: React.ReactNode;
  /** Required: accessible name and tooltip text. */
  label: string;
  size?: 'sm' | 'md' | 'lg';
  tooltip?: boolean;
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
  shortcut?: string[];
}

/** Icon-only button. Defaults to `ghost`; always carries a tooltip with its label. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, size = 'md', tooltip = true, tooltipSide = 'top', shortcut, variant = 'ghost', loading, ...props },
  ref,
) {
  const s = size === 'sm' ? 'icon-sm' : size === 'lg' ? 'icon-lg' : 'icon';
  const btn = <Button ref={ref} aria-label={label} variant={variant} size={s} loading={loading} leftIcon={loading ? undefined : icon} {...props} />;
  return tooltip ? <Tooltip content={label} side={tooltipSide} shortcut={shortcut}>{btn}</Tooltip> : btn;
});
