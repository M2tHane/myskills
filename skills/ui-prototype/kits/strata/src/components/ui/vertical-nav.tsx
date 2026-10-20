import * as React from 'react';
import { cn } from '@/lib/utils';

export interface VerticalNavProps {
  sections: { title?: string; items: { value: string; label: string; icon?: React.ReactNode }[] }[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

/** Secondary navigation for a module with many sub-modules. Each sub-module owns the content area. */
export function VerticalNav({ sections, value, defaultValue, onValueChange, className }: VerticalNavProps) {
  const [inner, setInner] = React.useState(defaultValue ?? sections[0]?.items[0]?.value);
  const cur = value ?? inner;
  return (
    <nav className={cn('flex w-50 shrink-0 flex-col gap-3.5 font-sans', className)}>
      {sections.map((s, i) => (
        <div key={i} className="flex flex-col gap-px">
          {s.title && <div className="px-2 pt-0.5 pb-1.5 text-micro font-medium tracking-[.02em] text-fg-subtle">{s.title}</div>}
          {s.items.map((it) => {
            const on = cur === it.value;
            return (
              <button key={it.value} type="button" aria-current={on ? 'page' : undefined} onClick={() => { setInner(it.value); onValueChange?.(it.value); }}
                className={cn('flex h-8 cursor-pointer items-center gap-2.5 rounded-sm px-2.5 text-left text-body-sm font-medium outline-none focus-visible:shadow-focus-ring [&_svg]:size-4 [&_svg]:shrink-0',
                  on ? 'bg-surface-selected text-primary-hover [&_svg]:text-primary' : 'text-fg-muted hover:bg-surface-hover hover:text-fg [&_svg]:text-(--gray-500)')}>
                {it.icon}<span>{it.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
