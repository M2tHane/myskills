import { cn } from '@/lib/utils';

/** Initial-letter avatar for user menus and activity lists. Tables show names as text, without avatars. */
export function Avatar({ name, size = 28, tone = 'neutral', className }: { name: string; size?: number; tone?: 'neutral' | 'primary'; className?: string }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-sans font-semibold',
        tone === 'primary' ? 'bg-primary-soft text-primary-hover shadow-[inset_0_0_0_1px_var(--primary-line)]' : 'bg-surface-active text-fg-muted shadow-[inset_0_0_0_1px_var(--border)]',
        className,
      )}
    >
      {name.slice(0, 1)}
    </span>
  );
}
