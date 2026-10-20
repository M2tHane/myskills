import * as React from 'react';
import { ChevronRight, ChevronsUpDown, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from './avatar';
import { CountBadge } from './badge';
import { Tooltip } from './tooltip';

const SidebarContext = React.createContext<{ collapsed: boolean }>({ collapsed: false });
/** 侧栏内部组件（头部、底部）读取收起状态。 */
export const useSidebar = () => React.useContext(SidebarContext);

export interface NavItem { key: string; label: string; icon?: React.ReactNode; count?: number; children?: NavItem[] }
export interface NavSection { title?: string; items: NavItem[] }

export interface SidebarProps {
  sections: NavSection[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (key: string) => void;
  /** classic (default): white panel with a right border, selected = surface-selected + blue text.
   *  inset (alternative): sits on the gray canvas, selected = raised white chip. */
  variant?: 'classic' | 'inset';
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/** Primary navigation, 232px (collapsed 60px, icons + tooltips). Never filled with blue. */
export function Sidebar({ sections, value, defaultValue, onValueChange, variant = 'classic', collapsed, defaultCollapsed = false, onCollapsedChange, header, footer, className }: SidebarProps) {
  const [inner, setInner] = React.useState(defaultValue);
  const [c, setC] = React.useState(defaultCollapsed);
  const isC = collapsed ?? c;
  const cur = value ?? inner;
  const parentOf = (k?: string) => sections.flatMap((s) => s.items).find((i) => i.children?.some((ch) => ch.key === k))?.key;
  const [open, setOpen] = React.useState<string[]>([parentOf(cur)].filter(Boolean) as string[]);
  const pick = (k: string) => { setInner(k); onValueChange?.(k); };
  // 当前项变化（如路由跳转）时，自动展开它所在的父级
  React.useEffect(() => {
    const p = parentOf(cur);
    if (p) setOpen((o) => (o.includes(p) ? o : [...o, p]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur]);
  const inset = variant === 'inset';

  const item = (it: NavItem, depth = 0): React.ReactNode => {
    const has = !!it.children?.length;
    const isOpen = open.includes(it.key);
    const on = cur === it.key;
    const childOn = has && it.children!.some((ch) => ch.key === cur) && (isC || !isOpen);
    const marked = on || (isC && childOn);
    const btn = (
      <button
        type="button"
        aria-current={on ? 'page' : undefined}
        aria-expanded={has ? isOpen : undefined}
        onClick={() => (has && !isC ? setOpen(isOpen ? open.filter((x) => x !== it.key) : [...open, it.key]) : pick(has ? it.children![0].key : it.key))}
        className={cn(
          'group/nav relative flex w-full cursor-pointer items-center gap-2.5 rounded-sm border-0 bg-transparent px-2 text-left font-sans text-body-sm text-fg-muted outline-none',
          'transition-[background-color,color,box-shadow] duration-100 hover:text-fg focus-visible:shadow-focus-ring',
          depth ? 'h-[30px] font-normal' : 'h-8 font-medium',
          inset ? 'hover:bg-surface-active' : 'hover:bg-surface-hover',
          marked && (inset ? 'bg-surface text-fg shadow-[var(--shadow-control),var(--shadow-ring-subtle)] hover:bg-surface' : 'bg-surface-selected text-primary-hover hover:bg-surface-selected'),
          childOn && !isC && 'text-fg',
          isC && 'mx-auto w-10 justify-center px-0',
        )}
      >
        {it.icon && (
          <span className={cn('inline-flex shrink-0 text-(--gray-500) group-hover/nav:text-fg-muted [&_svg]:size-4', (marked || childOn) && 'text-primary group-hover/nav:text-primary')}>{it.icon}</span>
        )}
        {!isC && <span className="min-w-0 flex-1 truncate">{it.label}</span>}
        {!isC && it.count != null && <CountBadge count={it.count} tone={on ? 'primary' : 'neutral'} />}
        {!isC && has && <ChevronRight className={cn('size-3.5 shrink-0 text-fg-subtle transition-transform duration-150', isOpen && 'rotate-90')} />}
      </button>
    );
    return (
      <React.Fragment key={it.key}>
        {isC ? <Tooltip content={it.label} side="right">{btn}</Tooltip> : btn}
        {has && isOpen && !isC && (
          <div className="relative my-px flex flex-col gap-px pl-6.5 before:absolute before:top-1 before:bottom-1 before:left-[15px] before:w-px before:bg-border">
            {it.children!.map((ch) => item(ch, 1))}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <SidebarContext.Provider value={{ collapsed: isC }}>
    <nav aria-label="主导航"
      className={cn('flex min-h-0 shrink-0 flex-col font-sans transition-[width] duration-200',
        isC ? 'w-15' : 'w-(--sidebar-width)', inset ? 'bg-canvas' : 'border-r border-border bg-surface', className)}>
      {header != null && <div className={cn('pt-2.5 pb-1.5', isC ? 'px-2' : 'px-2.5')}>{header}</div>}
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-2.5 pt-1 pb-2">
        {sections.map((s, i) => (
          <div key={i} className="flex flex-col gap-px">
            {s.title && !isC && <div className="px-2 pt-0.5 pb-1.5 text-micro font-medium tracking-[.02em] text-fg-subtle">{s.title}</div>}
            {s.title && isC && i > 0 && <div className="mx-2 mb-2 h-px bg-border" />}
            {s.items.map((it) => item(it))}
          </div>
        ))}
      </div>
      <div className={cn('flex items-center gap-1 border-t pt-2 pb-2.5', inset ? 'border-border' : 'border-border-subtle', isC ? 'flex-col gap-1.5 px-2' : 'px-2.5')}>
        {footer}
        <Tooltip content={isC ? '展开侧边栏' : '收起侧边栏'} side="right">
          <button type="button" aria-label={isC ? '展开侧边栏' : '收起侧边栏'} onClick={() => { setC(!isC); onCollapsedChange?.(!isC); }}
            className={cn('inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-sm text-fg-subtle outline-none hover:bg-surface-active hover:text-fg focus-visible:shadow-focus-ring [&_svg]:size-4', isC ? 'mx-auto' : 'ml-auto')}>
            <PanelLeft />
          </button>
        </Tooltip>
      </div>
    </nav>
    </SidebarContext.Provider>
  );
}

/** Strata mark: three stacked layers on a primary tile. Replace with your product logo. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <span aria-hidden="true" style={{ width: size, height: size }} className="inline-flex shrink-0 items-center justify-center rounded-sm bg-primary text-primary-fg shadow-primary">
      <svg viewBox="0 0 28 28" width={size} height={size}>
        <rect x="6" y="15" width="16" height="5" rx="1.5" fill="currentColor" opacity=".45" />
        <rect x="6" y="11.5" width="16" height="5" rx="1.5" fill="currentColor" opacity=".7" />
        <rect x="6" y="8" width="16" height="5" rx="1.5" fill="currentColor" />
      </svg>
    </span>
  );
}

/** Workspace switcher at the top of the sidebar. */
export function WorkspaceSwitch({ name, sub, logo, collapsed: forced, onClick }: { name: string; sub?: string; logo?: React.ReactNode; collapsed?: boolean; onClick?: () => void }) {
  const ctx = useSidebar();
  const collapsed = forced ?? ctx.collapsed;
  const btn = (
    <button type="button" onClick={onClick}
      aria-label={collapsed ? name : undefined}
      className={cn('flex h-11 w-full cursor-pointer items-center gap-2.5 overflow-hidden rounded-md border-0 bg-transparent px-2 text-left font-sans text-fg outline-none hover:bg-surface-hover focus-visible:shadow-focus-ring', collapsed && 'justify-center px-0')}>
      {logo ?? <Mark />}
      {!collapsed && (
        <>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-body-sm leading-[18px] font-semibold">{name}</span>
            {sub && <span className="text-micro whitespace-nowrap text-fg-subtle">{sub}</span>}
          </span>
          <ChevronsUpDown className="size-3.5 text-fg-subtle" />
        </>
      )}
    </button>
  );
  return collapsed ? <Tooltip content={sub ? `${name} · ${sub}` : name} side="right">{btn}</Tooltip> : btn;
}

/** 侧栏底部的当前用户。收起时只剩头像，名字和角色进 Tooltip。 */
export function SidebarUser({ name, role, avatar, onClick }: { name: string; role?: string; avatar?: React.ReactNode; onClick?: () => void }) {
  const { collapsed } = useSidebar();
  const face = avatar ?? <Avatar name={name} tone="primary" />;
  const btn = (
    <button type="button" onClick={onClick} aria-label={collapsed ? name : undefined}
      className={cn('flex h-10 min-w-0 cursor-pointer items-center gap-2.5 overflow-hidden rounded-sm border-0 bg-transparent text-left font-sans outline-none hover:bg-surface-hover focus-visible:shadow-focus-ring',
        collapsed ? 'size-10 justify-center px-0' : 'flex-1 px-1')}>
      {face}
      {!collapsed && (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body-sm leading-[18px] font-medium text-fg">{name}</span>
          {role && <span className="truncate text-caption text-fg-subtle">{role}</span>}
        </span>
      )}
    </button>
  );
  return collapsed ? <Tooltip content={role ? `${name} · ${role}` : name} side="right">{btn}</Tooltip> : btn;
}
