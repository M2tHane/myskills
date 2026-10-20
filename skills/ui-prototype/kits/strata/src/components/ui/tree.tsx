import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from './checkbox';
import { Highlight } from './select';

export interface TreeNode {
  id: string;
  label: string;
  icon?: React.ReactNode;
  /** 右侧数据：数量、类型。不写说明文字。 */
  meta?: React.ReactNode;
  children?: TreeNode[];
  disabled?: boolean;
}

export interface TreeProps {
  data: TreeNode[];
  /** 单选（点击行）。 */
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string, node: TreeNode) => void;
  /** 复选：checked 只存叶子节点的 id，父节点的勾选 / 半选由子节点推出。 */
  checkable?: boolean;
  checked?: string[];
  defaultChecked?: string[];
  onCheckedChange?: (ids: string[]) => void;
  expanded?: string[];
  defaultExpanded?: string[] | 'all';
  onExpandedChange?: (ids: string[]) => void;
  /** 过滤关键字：只显示匹配的节点及其祖先，并自动展开、高亮匹配文字。 */
  filter?: string;
  className?: string;
  'aria-label'?: string;
}

const INDENT = 16;

function leaves(n: TreeNode): string[] { return n.children?.length ? n.children.flatMap(leaves) : [n.id]; }
function allIds(ns: TreeNode[]): string[] { return ns.flatMap((n) => (n.children?.length ? [n.id, ...allIds(n.children)] : [])); }

/** 只保留匹配的节点及其祖先；返回过滤后的树和需要展开的 id。 */
function filterTree(ns: TreeNode[], q: string): { nodes: TreeNode[]; open: string[] } {
  const s = q.trim().toLowerCase();
  if (!s) return { nodes: ns, open: [] };
  const open: string[] = [];
  const walk = (list: TreeNode[]): TreeNode[] => list.flatMap((n) => {
    const kids = n.children ? walk(n.children) : [];
    const hit = n.label.toLowerCase().includes(s);
    if (kids.length) { open.push(n.id); return [{ ...n, children: kids }]; }
    return hit ? [n] : [];
  });
  return { nodes: walk(ns), open };
}

/**
 * 树：目录、组织架构、数据库 → 库 → 表。行高 32px，每级缩进 16px，子级左侧有一条细引导线。
 * 键盘：↑↓ 移动，→ 展开 / 进入子级，← 收起 / 回到父级，Enter / 空格 选中或勾选。
 */
export function Tree({
  data, value, defaultValue, onValueChange, checkable, checked, defaultChecked = [], onCheckedChange,
  expanded, defaultExpanded = [], onExpandedChange, filter = '', className, ...aria
}: TreeProps) {
  const [selInner, setSelInner] = React.useState(defaultValue);
  const [chkInner, setChkInner] = React.useState(defaultChecked);
  // 'all'：在用户第一次展开 / 收起之前，始终展开全部（数据异步到达也适用）
  const [expInner, setExpInner] = React.useState<string[] | null>(defaultExpanded === 'all' ? null : defaultExpanded);
  const sel = value ?? selInner;
  const chk = checked ?? chkInner;
  const exp = expanded ?? expInner ?? allIds(data);
  const { nodes, open: autoOpen } = React.useMemo(() => filterTree(data, filter), [data, filter]);
  const isOpen = (id: string) => (filter ? autoOpen.includes(id) || exp.includes(id) : exp.includes(id));
  const [focusId, setFocusId] = React.useState<string>();
  const ref = React.useRef<HTMLDivElement>(null);

  const setExp = (ids: string[]) => { setExpInner(ids); onExpandedChange?.(ids); };
  const toggleOpen = (id: string) => setExp(exp.includes(id) ? exp.filter((x) => x !== id) : [...exp, id]);
  const select = (n: TreeNode) => { setSelInner(n.id); onValueChange?.(n.id, n); };
  const toggleCheck = (n: TreeNode) => {
    const ls = leaves(n);
    const all = ls.every((l) => chk.includes(l));
    const next = all ? chk.filter((x) => !ls.includes(x)) : Array.from(new Set([...chk, ...ls]));
    setChkInner(next); onCheckedChange?.(next);
  };

  // 可见行（用于键盘移动）
  const visible: Array<{ n: TreeNode; parent?: string }> = [];
  const collect = (list: TreeNode[], parent?: string) => list.forEach((n) => { visible.push({ n, parent }); if (n.children?.length && isOpen(n.id)) collect(n.children, n.id); });
  collect(nodes);
  const current = focusId && visible.some((v) => v.n.id === focusId) ? focusId : (sel && visible.some((v) => v.n.id === sel) ? sel : visible[0]?.n.id);
  const focus = (id: string) => { setFocusId(id); requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>(`[data-node="${CSS.escape(id)}"]`)?.focus()); };

  const onKey = (e: React.KeyboardEvent, n: TreeNode) => {
    const i = visible.findIndex((v) => v.n.id === n.id);
    const has = !!n.children?.length;
    if (e.key === 'ArrowDown' && i < visible.length - 1) { e.preventDefault(); focus(visible[i + 1].n.id); }
    else if (e.key === 'ArrowUp' && i > 0) { e.preventDefault(); focus(visible[i - 1].n.id); }
    else if (e.key === 'ArrowRight' && has) { e.preventDefault(); if (!isOpen(n.id)) toggleOpen(n.id); else focus(n.children![0].id); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (has && isOpen(n.id)) toggleOpen(n.id); else if (visible[i].parent) focus(visible[i].parent!); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (n.disabled) return; if (checkable) toggleCheck(n); else select(n); }
  };

  const render = (list: TreeNode[], level: number): React.ReactNode => list.map((n) => {
    const has = !!n.children?.length;
    const opened = has && isOpen(n.id);
    const ls = leaves(n);
    const on = ls.every((l) => chk.includes(l));
    const some = !on && ls.some((l) => chk.includes(l));
    const selected = !checkable && sel === n.id;
    return (
      <div key={n.id} role="none">
        <div role="treeitem" aria-level={level + 1} aria-expanded={has ? opened : undefined} aria-selected={checkable ? undefined : selected}
          aria-checked={checkable ? (some ? 'mixed' : on) : undefined} aria-disabled={n.disabled || undefined}
          tabIndex={current === n.id ? 0 : -1} data-node={n.id}
          onClick={(e) => { if (n.disabled || (e.target as HTMLElement).tagName === 'INPUT') return; /* Radix 复选框在表单里会冒泡一个合成 click */ setFocusId(n.id); if (checkable) { if (has) toggleOpen(n.id); else toggleCheck(n); } else { select(n); if (has && !opened) toggleOpen(n.id); } }}
          onKeyDown={(e) => onKey(e, n)}
          style={{ paddingLeft: 4 + level * INDENT }}
          className={cn(
            'group/row flex h-8 cursor-pointer items-center gap-1.5 rounded-sm pr-2 text-body-sm outline-none select-none',
            'focus-visible:shadow-focus-ring',
            selected ? 'bg-surface-selected text-primary-hover' : 'text-fg hover:bg-surface-hover',
            n.disabled && 'cursor-not-allowed text-fg-disabled hover:bg-transparent',
          )}>
          <span onClick={(e) => { if (has) { e.stopPropagation(); toggleOpen(n.id); } }}
            className={cn('inline-flex size-5 shrink-0 items-center justify-center rounded-xs text-fg-subtle', has && 'hover:bg-surface-active hover:text-fg-muted')}>
            {has && <ChevronRight className={cn('size-3.5 transition-transform duration-150', opened && 'rotate-90')} />}
          </span>
          {checkable && (
            <Checkbox checked={on} indeterminate={some} disabled={n.disabled} tabIndex={-1} aria-label={n.label}
              onClick={(e) => e.stopPropagation()} onCheckedChange={() => toggleCheck(n)} />
          )}
          {n.icon && <span className={cn('inline-flex shrink-0 text-fg-subtle [&_svg]:size-4', selected && 'text-primary')}>{n.icon}</span>}
          <span className={cn('min-w-0 flex-1 truncate', (selected || has) && 'font-medium')}><Highlight text={n.label} q={filter.trim()} /></span>
          {n.meta != null && <span className="shrink-0 text-caption text-fg-subtle tabular-nums">{n.meta}</span>}
        </div>
        {opened && (
          <div role="group" className="relative">
            <span aria-hidden className="absolute top-0 bottom-1 w-px bg-border-subtle" style={{ left: 4 + level * INDENT + 10 }} />
            {render(n.children!, level + 1)}
          </div>
        )}
      </div>
    );
  });

  return (
    <div ref={ref} role="tree" aria-multiselectable={checkable || undefined} aria-label={aria['aria-label']} className={cn('flex flex-col gap-px font-sans', className)}>
      {nodes.length ? render(nodes, 0) : <div className="flex h-16 items-center justify-center text-body-sm text-fg-subtle">没有匹配的项</div>}
    </div>
  );
}
