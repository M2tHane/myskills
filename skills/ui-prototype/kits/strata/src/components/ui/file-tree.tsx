import * as React from 'react';
import {
  Download, File, FileArchive, FileAudio, FileCode, FileCog, FileImage, FileJson, FilePlus, FileSpreadsheet, FileTerminal, FileText, FileVideo,
  Folder, FolderOpen, FolderPlus, LoaderCircle, Pencil, Trash2, Upload, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './dropdown-menu';
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

export interface FileNode {
  /** 文件或文件夹名，不含路径。 */
  name: string;
  /** 有 children（可以是空数组）就是文件夹。 */
  children?: FileNode[];
  disabled?: boolean;
}

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
  /*
   * 右键菜单：传了哪个回调就出现哪一项。
   * 文件、文件夹上右键：重命名（行内输入框，F2 也可以）、下载、删除（先确认，Delete 键也可以）；空白处右键：新建文件、新建文件夹、上传。
   */
  onRename?: (path: string, name: string, node: FileNode) => void;
  onDownload?: (path: string, node: FileNode) => void;
  onDelete?: (path: string, node: FileNode) => void;
  /** 新建：在列表顶部出现一行输入框，回车确认。parent 是所在文件夹路径，根目录为 ''。 */
  onCreate?: (parent: string, name: string, kind: 'file' | 'folder') => void;
  onUpload?: (parent: string, files: File[]) => void;
  /** 上传时可选的文件类型，同 input 的 accept。 */
  accept?: string;
  className?: string;
  'aria-label'?: string;
}

const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });
const isDir = (n: FileNode) => n.children !== undefined;
function sorted(ns: FileNode[]): FileNode[] {
  return [...ns].sort((a, b) => (isDir(a) === isDir(b) ? collator.compare(a.name, b.name) : isDir(a) ? -1 : 1));
}
function dirPaths(ns: FileNode[], base = ''): string[] {
  return ns.flatMap((n) => (isDir(n) ? [base + n.name, ...dirPaths(n.children!, base + n.name + '/')] : []));
}

/** 行内输入框：重命名、新建。回车确认，Esc 取消，失去焦点时有内容就确认。 */
function NameInput({ initial, onDone }: { initial: string; onDone: (name: string | null) => void }) {
  const ref = React.useRef<HTMLInputElement>(null);
  const done = React.useRef(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const dot = initial.lastIndexOf('.');
    el.setSelectionRange(0, dot > 0 ? dot : initial.length); // 只选中文件名，不选扩展名
  }, [initial]);
  const finish = (v: string | null) => { if (done.current) return; done.current = true; onDone(v); };
  return (
    <input ref={ref} defaultValue={initial} aria-label="名称" spellCheck={false}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); const v = e.currentTarget.value.trim(); finish(v || null); }
        else if (e.key === 'Escape') { e.preventDefault(); finish(null); }
      }}
      onBlur={(e) => { const v = e.currentTarget.value.trim(); finish(v || null); }}
      className="h-6 min-w-0 flex-1 rounded-xs border border-ring bg-surface px-1.5 text-body-sm text-fg shadow-focus-input outline-none" />
  );
}

type Menu = { x: number; y: number; path: string | null };

/**
 * 文件树：工作区文件、知识库目录、Agent 生成的产物。基于 Tree（键盘、过滤、引导线都一样），额外做了：
 * 文件夹在前排序、按扩展名显示图标、文件夹展开时换成打开的图标、右键菜单（重命名、下载、删除；空白处新建、上传）。
 * 只显示名称，不显示大小和变更状态。节点的 id 是路径（`src/app/routes.tsx`），选中、展开都用路径。
 */
export function FileTree({
  data, value, defaultValue, onValueChange, defaultExpanded, expanded, onExpandedChange, filter, sort = true, size = 'sm',
  onRename, onDownload, onDelete, onCreate, onUpload, accept, className, ...aria
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
  const [menu, setMenu] = React.useState<Menu | null>(null);
  const [renaming, setRenaming] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState<'file' | 'folder' | null>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const wrap = React.useRef<HTMLDivElement>(null);
  const upload = React.useRef<HTMLInputElement>(null);

  const byPath = React.useRef(new Map<string, FileNode>());
  const nodes = React.useMemo(() => {
    byPath.current.clear();
    const walk = (list: FileNode[], base: string): TreeNode[] => (sort ? sorted(list) : list).map((n) => {
      const path = base + n.name;
      byPath.current.set(path, n);
      const dir = isDir(n);
      const open = dir && (exp.includes(path) || !!filter?.trim());
      return {
        id: path,
        label: n.name,
        icon: dir ? (open ? <FolderOpen /> : <Folder />) : fileIcon(n.name),
        disabled: n.disabled,
        content: renaming === path
          ? <NameInput initial={n.name} onDone={(v) => { setRenaming(null); if (v && v !== n.name) onRename?.(path, v, n); }} />
          : undefined,
        children: dir ? walk(n.children!, path + '/') : undefined,
      };
    });
    return walk(data, '');
  }, [data, exp, filter, sort, renaming, onRename]);

  /** 菜单的锚点放在鼠标位置。按外层实际缩放换算，放在 transform 缩放的容器里也对得上。 */
  const openMenu = (e: React.MouseEvent, path: string | null) => {
    const el = wrap.current;
    if (!el) return;
    const items = path ? [onRename, onDownload, onDelete] : [onCreate, onUpload];
    if (!items.some(Boolean)) return;
    e.preventDefault();
    e.stopPropagation();
    const r = el.getBoundingClientRect();
    const k = el.offsetWidth ? r.width / el.offsetWidth : 1;
    setMenu({ x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k, path });
  };
  const target = menu?.path ? byPath.current.get(menu.path) : undefined;
  const delNode = deleting ? byPath.current.get(deleting) : undefined;

  return (
    <div ref={wrap} className={cn('relative flex min-h-full flex-col', className)} onContextMenu={(e) => openMenu(e, null)}>
      {creating && (
        <div className="flex h-7 items-center gap-1.5 pr-2 pl-[29px] text-fg-subtle [&_svg]:size-4 [&_svg]:shrink-0">
          {creating === 'folder' ? <Folder /> : <File />}
          <NameInput initial="" onDone={(v) => { const kind = creating; setCreating(null); if (v) onCreate?.('', v, kind); }} />
        </div>
      )}
      <Tree
        data={nodes}
        value={sel ?? ''}
        onValueChange={(id) => {
          const n = byPath.current.get(id);
          if (!n || renaming === id) return;
          if (isDir(n)) { setExp(exp.includes(id) ? exp.filter((x) => x !== id) : [...exp, id]); return; }
          setSelInner(id); onValueChange?.(id, n);
        }}
        onNodeContextMenu={(e, n) => openMenu(e, n.id)}
        onNodeKeyDown={(e, n) => {
          const node = byPath.current.get(n.id);
          if (!node) return;
          if (e.key === 'F2' && onRename) { e.preventDefault(); setRenaming(n.id); }
          else if ((e.key === 'Delete' || e.key === 'Backspace') && onDelete) { e.preventDefault(); setDeleting(n.id); }
        }}
        expanded={exp}
        onExpandedChange={setExp}
        filter={filter}
        size={size}
        className="[&_[role=treeitem][aria-expanded]>span.truncate]:font-normal"
        aria-label={aria['aria-label'] ?? '文件'}
      />
      <div className="min-h-6 flex-1" aria-hidden />

      <DropdownMenu open={!!menu} onOpenChange={(o) => { if (!o) setMenu(null); }} modal={false}>
        <DropdownMenuTrigger asChild>
          <span aria-hidden className="pointer-events-none absolute size-0" style={{ left: menu?.x ?? 0, top: menu?.y ?? 0 }} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={2} className="min-w-40"
          onCloseAutoFocus={(e) => e.preventDefault()}>
          {menu?.path && target ? (
            <>
              {onRename && <DropdownMenuItem icon={<Pencil />} shortcut="F2" onSelect={() => setRenaming(menu.path)}>重命名</DropdownMenuItem>}
              {onDownload && <DropdownMenuItem icon={<Download />} onSelect={() => onDownload(menu.path!, target)}>下载</DropdownMenuItem>}
              {onDelete && <>{(onRename || onDownload) && <DropdownMenuSeparator />}<DropdownMenuItem icon={<Trash2 />} danger onSelect={() => setDeleting(menu.path)}>删除</DropdownMenuItem></>}
            </>
          ) : (
            <>
              {onCreate && <DropdownMenuItem icon={<FilePlus />} onSelect={() => setCreating('file')}>新建文件</DropdownMenuItem>}
              {onCreate && <DropdownMenuItem icon={<FolderPlus />} onSelect={() => setCreating('folder')}>新建文件夹</DropdownMenuItem>}
              {onUpload && <>{onCreate && <DropdownMenuSeparator />}<DropdownMenuItem icon={<Upload />} onSelect={() => upload.current?.click()}>上传文件</DropdownMenuItem></>}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {onUpload && <input ref={upload} type="file" multiple accept={accept} hidden onChange={(e) => { const fs = Array.from(e.target.files ?? []); if (fs.length) onUpload('', fs); e.target.value = ''; }} />}

      <Dialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null); }}>
        <DialogContent size="sm">
          <DialogHeader tone="danger"><DialogTitle>{delNode && isDir(delNode) ? '删除这个文件夹？' : '删除这个文件？'}</DialogTitle></DialogHeader>
          <DialogBody indent>「{delNode?.name}」{delNode && isDir(delNode) ? '及其中的全部文件' : ''}将被删除。</DialogBody>
          <DialogFooter>
            <Button onClick={() => setDeleting(null)}>取消</Button>
            <Button variant="destructive" onClick={() => { if (deleting && delNode) onDelete?.(deleting, delNode); setDeleting(null); }}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
