import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge must know Strata's custom scale names, otherwise it would treat
 * `text-body-sm` as a colour and drop it next to `text-fg`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['badge', 'micro', 'caption', 'body-sm', 'body', 'code', 'title-3', 'heading', 'title-2', 'title-1', 'num-lg', 'display'],
      shadow: [
        'xs', 'control', 'primary', 'danger', 'press-primary', 'press-danger', 'ring-subtle', 'card', 'raised', 'overlay',
        'inset', 'highlight-top', 'fill-highlight', 'focus-ring', 'focus-ring-danger', 'focus-input', 'focus-input-danger', 'thumb',
      ],
      radius: ['xs', 'sm', 'md', 'lg', 'full'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Focus ring used by every interactive element (2px page gap + 2px ring). */
export const focusRing = 'outline-none focus-visible:shadow-focus-ring';
