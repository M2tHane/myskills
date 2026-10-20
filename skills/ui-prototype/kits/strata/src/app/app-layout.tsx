import * as React from 'react';
import { Outlet, useLocation, useMatches, useNavigate, type UIMatch } from 'react-router';
import { Bell, Check } from 'lucide-react';
import {
  AppShell, Breadcrumb, CommandPalette, CountBadge, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger, IconButton, SearchTrigger, Sidebar, SidebarUser, Topbar, WorkspaceSwitch, useCommandShortcut, type CommandGroup, type Crumb,
} from '@/components/ui';
import { demoUsers, switchUser, useCurrentUser } from '@/api/session';
import { SHELL, useCommandGroups, useNav, useUserMenu } from './nav';

/** 路由的 handle：crumb 是面包屑文字，可以是函数（读取路由参数）。 */
export interface RouteHandle { crumb?: string | ((match: UIMatch) => string) }

/** 用户菜单的一项，由 nav.tsx 的 useUserMenu() 返回。 */
export interface UserMenuItem { id: string; label: string; icon?: React.ReactNode; danger?: boolean; onSelect: () => void }

/** 当前路径对应的导航项：取最长的前缀匹配（/data/tables/orders_daily → /data/tables）。 */
function activeNavKey(leafKeys: string[], pathname: string) {
  return leafKeys.filter((k) => (k === '/' ? pathname === '/' : pathname === k || pathname.startsWith(k + '/'))).sort((a, b) => b.length - a.length)[0];
}

/**
 * 应用外框（布局路由）：classic 白色侧栏 + 白色顶栏 + 灰色画布。项目不改这个文件：文字、导航、命令面板、用户菜单都在 nav.tsx。
 * 面包屑只在这里生成：工作区 › 各级路由的 handle.crumb，页面里的 PageHeader 不再放面包屑。
 */
export function AppLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const matches = useMatches() as UIMatch<unknown, RouteHandle>[];
  const [cmdk, setCmdk] = React.useState(false);
  useCommandShortcut(setCmdk);
  const nav = useNav();
  const extraCommands = useCommandGroups();
  const leafKeys = nav.flatMap((s) => s.items.flatMap((i) => (i.children ? i.children.map((c) => c.key) : [i.key])));
  const commands: CommandGroup[] = [
    { heading: '页面', items: nav.flatMap((sec) => sec.items.flatMap((it) => (it.children ?? [it]).map((leaf) => ({
      id: 'nav' + leaf.key, label: leaf.label, icon: it.icon, meta: it.children ? it.label : undefined, onSelect: () => navigate(leaf.key),
    })))) },
    ...extraCommands,
  ];
  const crumbs: Crumb[] = [
    { label: SHELL.workspace, onClick: () => navigate('/') },
    ...matches.filter((m) => m.handle?.crumb).map((m) => {
      const c = m.handle!.crumb!;
      return { label: typeof c === 'function' ? c(m) : c, onClick: () => navigate(m.pathname) };
    }),
  ];

  return (
    <AppShell
      sidebar={
        <Sidebar sections={nav} value={activeNavKey(leafKeys, pathname)} onValueChange={(key) => navigate(key)}
          header={<WorkspaceSwitch name={SHELL.workspace} sub={SHELL.workspaceSub} />}
          footer={<UserMenu />} />
      }
      topbar={
        <Topbar
          start={<Breadcrumb items={crumbs} />}
          end={<>
            <SearchTrigger placeholder={SHELL.search} width={220} onClick={() => setCmdk(true)} />
            {SHELL.notifications != null && (
              <span className="relative inline-flex">
                <IconButton icon={<Bell />} label="通知" />
                {SHELL.notifications > 0 && <CountBadge count={SHELL.notifications} tone="danger" className="absolute top-0.5 right-px h-4 min-w-4 px-1 text-badge" />}
              </span>
            )}
          </>}
        />
      }
    >
      <React.Suspense fallback={null}><Outlet /></React.Suspense>
      <CommandPalette open={cmdk} onOpenChange={setCmdk} groups={commands} placeholder={SHELL.palette} />
    </AppShell>
  );
}

/** 侧栏底部的当前用户与菜单：项目的菜单项（useUserMenu），有多个演示账号时再列出「切换演示身份」。 */
function UserMenu() {
  const user = useCurrentUser();
  const items = useUserMenu();
  const face = <SidebarUser name={user.name} role={user.role} />;
  if (!items.length && demoUsers.length < 2) return face;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{face}</DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start">
        {items.map((it) => <DropdownMenuItem key={it.id} icon={it.icon} danger={it.danger} onSelect={it.onSelect}>{it.label}</DropdownMenuItem>)}
        {demoUsers.length > 1 && (
          <>
            {items.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel>切换演示身份（原型）</DropdownMenuLabel>
            {demoUsers.map((u) => (
              <DropdownMenuItem key={u.id} icon={u.id === user.id ? <Check /> : <span />} shortcut={u.role} onSelect={() => switchUser(u.id)}>{u.name}</DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
