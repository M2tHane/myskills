import * as React from 'react';
import { Group, Panel, Separator, useDefaultLayout, type GroupProps, type PanelProps, type SeparatorProps } from 'react-resizable-panels';
import { cn } from '@/lib/utils';

/**
 * 可拖动分栏（可选组件，依赖 react-resizable-panels@4.14.7）。
 * 用在编辑器 + 结果、对话 + 结果、目录树 + 详情这类需要用户调宽高的区域；应用外框不用它。
 *
 * - `variant="line"`（默认）：面板在同一张卡片里，分隔条是 1px 细线，悬停 / 拖动时变成 ring 色。
 * - `variant="gap"`：两张独立的卡片之间留 8px 间隙，平时看不见分隔线，悬停 / 拖动时在间隙中间出现 ring 色细线。
 * - `storageKey`：记住用户拖出来的尺寸（存在 localStorage）。
 */
type Variant = 'line' | 'gap';
const VariantContext = React.createContext<Variant>('line');

export interface ResizableGroupProps extends Omit<GroupProps, 'orientation'> {
  orientation?: 'horizontal' | 'vertical';
  variant?: Variant;
  storageKey?: string;
}

const safeStorage = {
  getItem: (k: string) => { try { return window.localStorage.getItem(k); } catch { return null; } },
  setItem: (k: string, v: string) => { try { window.localStorage.setItem(k, v); } catch { /* 无痕模式等场景下忽略 */ } },
};

function PersistedGroup({ storageKey, ...props }: GroupProps & { storageKey: string }) {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({ id: storageKey, storage: safeStorage, onlySaveAfterUserInteractions: true });
  return <Group defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged} {...props} />;
}

export function ResizableGroup({ orientation = 'horizontal', variant = 'line', storageKey, className, ...props }: ResizableGroupProps) {
  const cls = cn('flex size-full min-h-0 min-w-0', orientation === 'vertical' && 'flex-col', className);
  return (
    <VariantContext.Provider value={variant}>
      {storageKey
        ? <PersistedGroup storageKey={storageKey} orientation={orientation} resizeTargetMinimumSize={{ fine: 8, coarse: 24 }} className={cls} {...props} />
        : <Group orientation={orientation} resizeTargetMinimumSize={{ fine: 8, coarse: 24 }} className={cls} {...props} />}
    </VariantContext.Provider>
  );
}

/** 面板。尺寸：数字 = px，字符串不带单位 = 百分比（如 "30"），也可写 "240px"。 */
export function ResizablePanel({ className, ...props }: PanelProps) {
  return <Panel className={cn('min-h-0 min-w-0', className)} {...props} />;
}

export function ResizableHandle({ className, ...props }: SeparatorProps) {
  const variant = React.useContext(VariantContext);
  const on = 'data-[separator=hover]:bg-ring data-[separator=active]:bg-ring data-[separator=focus]:bg-ring';
  return (
    <Separator
      className={cn(
        'relative shrink-0 outline-none transition-colors duration-100',
        variant === 'line'
          ? cn('bg-border aria-[orientation=vertical]:w-px aria-[orientation=horizontal]:h-px', on)
          : cn(
            'bg-transparent aria-[orientation=vertical]:w-2 aria-[orientation=horizontal]:h-2',
            'after:absolute after:bg-transparent after:transition-colors after:duration-100',
            'aria-[orientation=vertical]:after:inset-y-0 aria-[orientation=vertical]:after:left-1/2 aria-[orientation=vertical]:after:w-px',
            'aria-[orientation=horizontal]:after:inset-x-0 aria-[orientation=horizontal]:after:top-1/2 aria-[orientation=horizontal]:after:h-px',
            'data-[separator=hover]:after:bg-ring data-[separator=active]:after:bg-ring data-[separator=focus]:after:bg-ring',
          ),
        'data-[separator=disabled]:pointer-events-none',
        className,
      )}
      {...props}
    />
  );
}

export { usePanelRef, useGroupRef } from 'react-resizable-panels';
