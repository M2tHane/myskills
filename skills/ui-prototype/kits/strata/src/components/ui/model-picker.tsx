import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from './dropdown-menu';

export interface ModelOption {
  value: string;
  label: string;
  /** 一句话说明，菜单里显示在名称下面。 */
  description?: string;
}

export interface ModelPickerProps {
  /** 常用模型，直接列在菜单第一层。 */
  models: ModelOption[];
  /** 其余模型，收进「更多模型」二级菜单。 */
  moreModels?: ModelOption[];
  value: string;
  onValueChange?: (value: string) => void;
  /** 推理强度（低 / 中 / 高）；不传就没有这一项，按钮上也不显示强度。 */
  efforts?: ModelOption[];
  effort?: string;
  onEffortChange?: (value: string) => void;
  disabled?: boolean;
  /** 一开始就展开（预览用）。 */
  defaultOpen?: boolean;
  className?: string;
}

function OptionItem({ o, on, onSelect }: { o: ModelOption; on: boolean; onSelect: () => void }) {
  return (
    <DropdownMenuItem onSelect={onSelect} className="h-auto items-start py-2">
      <span className="flex items-start gap-3">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 whitespace-normal">
          <span className={cn('text-body-sm text-fg', on && 'font-medium')}>{o.label}</span>
          {o.description && <span className="text-caption text-fg-muted">{o.description}</span>}
        </span>
        <span className="inline-flex h-5 w-4 shrink-0 items-center justify-center text-primary">{on && <Check className="size-4" strokeWidth={2.5} />}</span>
      </span>
    </DropdownMenuItem>
  );
}

/**
 * 模型选择器：放在对话输入框下方右侧。按钮是「模型名 强度」（强度灰色），点开向上弹出菜单：
 * 常用模型（名称 + 一句说明，当前的打勾）→ 推理强度（二级菜单）→ 更多模型（二级菜单）。
 */
export function ModelPicker({ models, moreModels = [], value, onValueChange, efforts, effort, onEffortChange, disabled, defaultOpen, className }: ModelPickerProps) {
  const all = [...models, ...moreModels];
  const cur = all.find((m) => m.value === value);
  const curEffort = efforts?.find((e) => e.value === effort);
  return (
    <DropdownMenu defaultOpen={defaultOpen} modal={defaultOpen ? false : undefined}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" disabled={disabled} aria-label="选择模型" className={cn('gap-1.5 px-2 text-fg data-[state=open]:bg-surface-hover', className)}>
          <span className="text-body-sm">{cur?.label ?? '选择模型'}</span>
          {curEffort && <span className="ml-1.5 text-body-sm text-fg-subtle">{curEffort.label}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" sideOffset={6} className="w-72">
        {models.map((m) => <OptionItem key={m.value} o={m} on={m.value === value} onSelect={() => onValueChange?.(m.value)} />)}
        {efforts?.length ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger value={curEffort?.label}>推理强度</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64">
                {efforts.map((e) => <OptionItem key={e.value} o={e} on={e.value === effort} onSelect={() => onEffortChange?.(e.value)} />)}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        ) : null}
        {moreModels.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger value={moreModels.some((m) => m.value === value) ? cur?.label : undefined}>更多模型</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-72">
                {moreModels.map((m) => <OptionItem key={m.value} o={m} on={m.value === value} onSelect={() => onValueChange?.(m.value)} />)}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
