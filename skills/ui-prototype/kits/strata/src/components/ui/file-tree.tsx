import * as React from 'react';
import {
  File, FileArchive, FileAudio, FileCode, FileCog, FileImage, FileJson, FileSpreadsheet, FileTerminal, FileText, FileVideo,
  Folder, FolderOpen, LoaderCircle, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from './tooltip';
import { Tree, type TreeNode } from './tree';
import { formatBytes } from './upload';

/* ------------------------------------------------------------------ 文件图标 */

const EXT: Array<[RegExp, React.ComponentType<{ className?: string }>]> = [
  [/\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|rb|php|c|h|cpp|cs|swift|vue|svelte|sql|html|css|scss)$/i, FileCode],
  [/\.(json|jsonl|ya?ml|toml|xml)$/i, FileJson],
  [/\.(csv|tsv|xlsx?|parquet)$/i, FileSpreadsheet],
  [/\.(png|jpe?g|gif|webp|svg|bmp|ico|tiff?)$/i, FileImage],
  [/\.(zip|tar|gz|tgz|rar|7z)$/i, FileArchive],
  [/\.(mp4|mov|webm|avi|mkv)$/i, FileVideo],
  [/\.(mp3|wav|flac|m4a|ogg)$/i, FileAudio],
  [/\.(sh|bash|zsh|ps1|bat)$/i, FileTerminal],
  [/(^|\/)(\.env.*|\.gitignore|\.editorconfig|dockerfile|makefile|.*\.(ini|conf|cfg|lock))$/i, FileCog],
  [/\.(md|mdx|txt|rst|docx?|pdf|log)$/i, FileText],
];

/** 按文件名取图标（Lucide）：代码、配置、表格、图片、压缩包、音视频、脚本、文档，其余是普通文件。 */
export function fileIcon(name: string, className?: string): React.ReactElement {
  const Icon = EXT.find(([re]) => re.test(name))?.[1] ?? File;
  return <Icon className={className} />;
}

/* ------------------------------------------------------------------ 文件树 */

export type FileStatus = 'added' | 'modified' | 'deleted' | 'untracked';

export interface FileNode {
  /** 文件或文件夹名，不含路径。 */
  name: string;
  /** 有 children（可以是空数组）就是文件夹。 */
  children?: FileNode[];
  /** 变更状态：名称右侧显示 A / M / D / U；文件夹里有变更时，文件夹名右侧显示小圆点。 */
  status?: FileStatus;
  /** 右侧数据，如大小、行数。 */
  meta?: React.ReactNode;
  /** 悬停时代替 meta 显示的操作。 */
  actions?: React.ReactNode;
  disabled?: boolean;
}

const STATUS: Record<FileStatus, { letter: string; label: string; cls: string }> = {
  added: { letter: 'A', label: '新增', cls: 'text-success' },
  untracked: { letter: 'U', label: '未跟踪', cls: 'text-success' },
  modified: { letter: 'M', label: '已修改', cls: 'text-warning' },
  deleted: { letter: 'D', label: '已删除', cls: 'text-danger' },
};

export interface FileTreeProps {
  data: FileNode[];
  /** 选中文件的路径，如 `src/app/routes.tsx`。 */
  value?: string;
  defaultValue?: string;
  onValueChange?: (path: string, node: FileNode) => void;
  /** 展开的文件夹路径；`'all'` 全部展开。默认展开选中文件所在的文件夹。 */
  defaultExpanded?: string[] | 'all';
  expanded?: string[];
  onExpandedChange?: (paths: string[]) => void;
  /** 文件名过滤，命中的文件高亮并自动展开所在文件夹。 */
  filter?: string;
  /** 文件夹在前、同类按名称排序（数字按大小）。默认 true；传 false 保持原顺序。 */
  sort?: boolean;
  /** 行高：默认 sm（28），和编辑器、侧边面板一致。 */
  size?: 'sm' | 'md';
  className?: string;
  'aria-label'?: string;
}

const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
const isDir = (n: FileNode) => n.children !== undefined;
function sorted(ns: FileNode[]): FileNode[] {
  return [...ns].sort((a, b) => (isDir(a) === isDir(b) ? collator.compare(a.name, b.name) : isDir(a) ? -1 : 1));
}
function changed(n: FileNode): boolean { return !!n.status || (n.children ?? []).some(changed); }
function dirPaths(ns: FileNode[], base = ''): string[] {
  return ns.flatMap((n) => (isDir(n) ? [base + n.name, ...dirPaths(n.children!, base + n.name + '/')] : []));
}

/**
 * 文件树：工作区文件、知识库目录、Agent 生成的产物。基于 Tree（键盘、过滤、引导线都一样），额外做了：
 * 文件夹在前排序、按扩展名显示图标、文件夹展开时换成打开的图标、变更标记（A / M / D / U）、悬停行操作。
 * 节点的 id 是路径（`src/app/routes.tsx`），选中、展开都用路径。
 */
export function FileTree({
  data, value, defaultValue, onValueChange, defaultExpanded, expanded, onExpandedChange, filter, sort = true, size = 'sm', className, ...aria
}: FileTreeProps) {
  const [expInner, setExpInner] = React.useState<string[]>(() => {
    if (defaultExpanded === 'all') return dirPaths(data);
    if (defaultExpanded) return defaultExpanded;
    const sel = value ?? defaultValue;
    if (!sel) return [];
    const parts = sel.split('/');
    return parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join('/'));
  });
  const exp = expanded ?? expInner;
  const setExp = (ids: string[]) => { setExpInner(ids); onExpandedChange?.(ids); };
  // 始终受控地传给 Tree：点文件夹只展开 / 收起，不会被选中
  const [selInner, setSelInner] = React.useState(defaultValue);
  const sel = value ?? selInner;

  const byPath = React.useRef(new Map<string, FileNode>());
  const nodes = React.useMemo(() => {
    byPath.current.clear();
    const walk = (list: FileNode[], base: string): TreeNode[] => (sort ? sorted(list) : list).map((n) => {
      const path = base + n.name;
      byPath.current.set(path, n);
      const dir = isDir(n);
      const open = dir && (exp.includes(path) || !!filter?.trim());
      const st = n.status ? STATUS[n.status] : undefined;
      return {
        id: path,
        label: n.name,
        icon: dir ? (open ? <FolderOpen /> : <Folder />) : fileIcon(n.name),
        meta: n.meta,
        actions: n.actions,
        disabled: n.disabled,
        labelClassName: n.status === 'deleted' ? 'line-through text-fg-subtle' : undefined,
        badge: st ? (
          <Tooltip content={st.label}><span className={cn('w-3 shrink-0 text-center font-mono text-caption font-semibold', st.cls)}>{st.letter}</span></Tooltip>
        ) : dir && changed(n) ? <span aria-label="有变更" className="mx-1 size-1.5 shrink-0 rounded-full bg-warning" /> : undefined,
        children: dir ? walk(n.children!, path + '/') : undefined,
      };
    });
    return walk(data, '');
  }, [data, exp, filter, sort]);

  return (
    <Tree
      data={nodes}
      value={sel ?? ''}
      onValueChange={(id) => {
        const n = byPath.current.get(id);
        if (!n) return;
        if (isDir(n)) { setExp(exp.includes(id) ? exp.filter((x) => x !== id) : [...exp, id]); return; }
        setSelInner(id); onValueChange?.(id, n);
      }}
      expanded={exp}
      onExpandedChange={setExp}
      filter={filter}
      size={size}
      className={cn('[&_[role=treeitem][aria-expanded]>span.truncate]:font-normal', className)}
      aria-label={aria['aria-label'] ?? '文件'}
    />
  );
}

/* ------------------------------------------------------------------ 文件卡片 */

export interface FileChipProps {
  name: string;
  /** 字节数，显示成 12.4 KB。 */
  size?: number;
  /** uploading：转圈 + 百分比；error：红框 + 原因（悬停看完整原因）。 */
  status?: 'done' | 'uploading' | 'error';
  progress?: number;
  error?: string;
  /** 传了就显示 ×（输入框里待发送的附件）；不传是只读（消息里已发送的附件）。 */
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

/**
 * 附件卡片：对话输入框里待发送的文件、消息里已发送的文件、Agent 生成的产物。
 * 高 40，左侧 28 的图标块，名称一行截断，下面一行是类型 · 大小（或进度、失败原因）。
 */
export function FileChip({ name, size, status = 'done', progress, error, onRemove, onClick, className }: FileChipProps) {
  const ext = /\.([a-z0-9]+)$/i.exec(name)?.[1]?.toUpperCase();
  const sub = status === 'uploading' ? `上传中 ${Math.round(progress ?? 0)}%` : status === 'error' ? error ?? '上传失败' : [ext, size != null ? formatBytes(size) : undefined].filter(Boolean).join(' · ');
  const Root = onClick ? 'button' : 'div';
  return (
    <div className={cn('group/chip relative inline-flex max-w-60 min-w-40', className)}>
      <Root
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        title={name}
        className={cn(
          'flex h-10 min-w-0 flex-1 items-center gap-2 rounded-sm border bg-surface py-1 pr-2.5 pl-1.5 text-left font-sans outline-none',
          status === 'error' ? 'border-danger-line' : 'border-border',
          onClick && 'cursor-pointer hover:bg-surface-hover focus-visible:shadow-focus-ring',
          onRemove && 'pr-7',
        )}>
        <span className={cn('inline-flex size-7 shrink-0 items-center justify-center rounded-xs [&_svg]:size-4',
          status === 'error' ? 'bg-danger-soft text-danger' : 'bg-surface-sunken text-fg-muted')}>
          {status === 'uploading' ? <LoaderCircle className="animate-spin" /> : fileIcon(name)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body-sm font-medium text-fg">{name}</span>
          <span className={cn('truncate text-micro tabular-nums', status === 'error' ? 'text-danger' : 'text-fg-subtle')}>{sub}</span>
        </span>
      </Root>
      {onRemove && (
        <button type="button" aria-label={`移除 ${name}`} onClick={onRemove}
          className="absolute top-1/2 right-1.5 inline-flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xs text-fg-subtle outline-none hover:bg-surface-active hover:text-fg focus-visible:shadow-focus-ring [&_svg]:size-3.5">
          <X />
        </button>
      )}
    </div>
  );
}
