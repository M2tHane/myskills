import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CornerDownLeft, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Kbd, KbdCombo } from './kbd';
import { Highlight } from './select';

export interface CommandItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  /** 右侧：类型、所属模块（「数据表」「查询」）。 */
  meta?: React.ReactNode;
  /** 额外的搜索词：英文名、拼音缩写、表名。 */
  keywords?: string[];
  shortcut?: string[];
  onSelect: () => void;
}
export interface CommandGroup { heading: string; items: CommandItem[] }

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CommandGroup[];
  placeholder?: string;
  /** 每组最多显示几项（搜索时）。默认 6。 */
  limit?: number;
}

/** 全局快捷键 ⌘K / Ctrl+K 打开命令面板。放在外框里调用一次。 */
export function useCommandShortcut(setOpen: React.Dispatch<React.SetStateAction<boolean>>, key = 'k') {
  React.useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === key) { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [setOpen, key]);
}

/**
 * 命令面板：顶栏搜索框和 ⌘K 打开。上方是搜索框，下方按组列出页面、最近访问、数据对象和操作。
 * ↑↓ 移动，Enter 打开，Esc 关闭。靠近顶部弹出（距顶 15%），轻遮罩不模糊，宽 560。
 */
export function CommandPalette({ open, onOpenChange, groups, placeholder = '搜索', limit = 6 }: CommandPaletteProps) {
  const [q, setQ] = React.useState('');
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { if (!open) { setQ(''); setActive(0); } }, [open]);

  const s = q.trim().toLowerCase();
  const shown = groups.map((g) => ({
    heading: g.heading,
    items: (s ? g.items.filter((it) => [it.label, ...(it.keywords ?? [])].some((t) => t.toLowerCase().includes(s))) : g.items).slice(0, s ? limit : undefined),
  })).filter((g) => g.items.length);
  const flat = shown.flatMap((g) => g.items);
  const idx = Math.min(active, Math.max(0, flat.length - 1));

  const run = (it?: CommandItem) => { if (!it) return; onOpenChange(false); setTimeout(it.onSelect, 0); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((idx + 1) % Math.max(1, flat.length)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((idx - 1 + flat.length) % Math.max(1, flat.length)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(flat[idx]); }
  };
  React.useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${idx}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [idx]);

  let n = -1;
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[900] bg-scrim-soft data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content aria-describedby={undefined} onKeyDown={onKey}
          className="fixed top-[15vh] left-1/2 z-[901] flex max-h-[min(480px,70vh)] w-[560px] max-w-[calc(100vw-32px)] -translate-x-1/2 flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface-raised font-sans shadow-overlay outline-none data-[state=open]:animate-pop-in">
          <DialogPrimitive.Title className="sr-only">命令面板</DialogPrimitive.Title>
          <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-border-subtle px-4">
            <Search className="size-4 shrink-0 text-fg-subtle" />
            <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} placeholder={placeholder}
              role="combobox" aria-expanded aria-controls="cmdk-list" aria-activedescendant={flat[idx] ? `cmdk-${flat[idx].id}` : undefined}
              className="h-full min-w-0 flex-1 border-0 bg-transparent text-body text-fg outline-none placeholder:text-fg-subtle" />
            <Kbd>Esc</Kbd>
          </div>
          <div ref={listRef} id="cmdk-list" role="listbox" className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {shown.length === 0 && <div className="flex h-24 items-center justify-center text-body-sm text-fg-subtle">没有找到「{q.trim()}」</div>}
            {shown.map((g) => (
              <div key={g.heading} role="group" aria-label={g.heading} className="[&+&]:mt-1.5">
                <div className="px-2.5 pt-1.5 pb-1 text-micro font-medium text-fg-subtle">{g.heading}</div>
                {g.items.map((it) => {
                  n += 1;
                  const on = n === idx;
                  const i = n;
                  return (
                    <div key={it.id} id={`cmdk-${it.id}`} role="option" aria-selected={on} data-index={i}
                      onMouseMove={() => active !== i && setActive(i)} onClick={() => run(it)}
                      className={cn('flex h-9 cursor-pointer items-center gap-2.5 rounded-sm px-2.5 text-body-sm text-fg [&_svg]:size-4 [&_svg]:shrink-0',
                        on && 'bg-surface-active')}>
                      {it.icon && <span className={cn('inline-flex text-fg-subtle', on && 'text-fg-muted')}>{it.icon}</span>}
                      <span className="min-w-0 flex-1 truncate"><Highlight text={it.label} q={q.trim()} /></span>
                      {it.meta != null && <span className="shrink-0 text-caption text-fg-subtle">{it.meta}</span>}
                      {it.shortcut && <KbdCombo keys={it.shortcut} />}
                      {on && !it.shortcut && <CornerDownLeft className="text-fg-subtle" />}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
