import * as React from 'react';
import { Outlet, useLocation, useMatches, useNavigate, type UIMatch } from 'react-router';
import { Bell, CircleHelp } from 'lucide-react';
import {
  AppShell, Breadcrumb, CommandPalette, CountBadge, IconButton, SearchTrigger, Sidebar, SidebarUser, Topbar, WorkspaceSwitch,
  useCommandShortcut, type CommandGroup, type Crumb,
} from '@/components/ui';
import { NAV, useCommandGroups } from './nav';

/** 路由的 handle：crumb 是面包屑文字，可以是函数（读取路由参数）。 */
export interface RouteHandle { crumb?: string | ((match: UIMatch) => string) }

const WORKSPACE = '运营数据中心';

const leafKeys = NAV.flatMap((s) => s.items.flatMap((i) => (i.children ? i.children.map((c) => c.key) : [i.key])));

/** 当前路径对应的导航项：取最长的前缀匹配（/data/tables/orders_daily → /data/tables）。 */
function activeNavKey(pathname: string) {
  return leafKeys.filter((k) => (k === '/' ? pathname === '/' : pathname === k || pathname.startsWith(k + '/'))).sort((a, b) => b.length - a.length)[0];
}

/**
 * 应用外框（布局路由）：classic 白色侧栏 + 白色顶栏 + 灰色画布。
 * 面包屑只在这里生成：工作区 › 各级路由的 handle.crumb，页面里的 PageHeader 不再放面包屑。
 */
export function AppLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const matches = useMatches() as UIMatch<unknown, RouteHandle>[];
  const [cmdk, setCmdk] = React.useState(false);
  useCommandShortcut(setCmdk);
  const extraCommands = useCommandGroups();
  const commands: CommandGroup[] = [
    { heading: '页面', items: NAV.flatMap((sec) => sec.items.flatMap((it) => (it.children ?? [it]).map((leaf) => ({
      id: 'nav' + leaf.key, label: leaf.label, icon: it.icon, meta: it.children ? it.label : undefined, onSelect: () => navigate(leaf.key),
    })))) },
    ...extraCommands,
  ];
  const crumbs: Crumb[] = [
    { label: WORKSPACE, onClick: () => navigate('/') },
    ...matches.filter((m) => m.handle?.crumb).map((m) => {
      const c = m.handle!.crumb!;
      return { label: typeof c === 'function' ? c(m) : c, onClick: () => navigate(m.pathname) };
    }),
  ];

  return (
    <AppShell
      sidebar={
        <Sidebar sections={NAV} value={activeNavKey(pathname)} onValueChange={(key) => navigate(key)}
          header={<WorkspaceSwitch name={WORKSPACE} sub="团队版" />}
          footer={<SidebarUser name="张一鸣" role="数据分析" />} />
      }
      topbar={
        <Topbar
          start={<Breadcrumb items={crumbs} />}
          end={<>
            <SearchTrigger placeholder="搜索查询、数据表" width={220} onClick={() => setCmdk(true)} />
            <span className="relative inline-flex">
              <IconButton icon={<Bell />} label="通知" />
              <CountBadge count={3} tone="danger" className="absolute top-0.5 right-px h-4 min-w-4 px-1 text-badge" />
            </span>
            <IconButton icon={<CircleHelp />} label="帮助" />
          </>}
        />
      }
    >
      <React.Suspense fallback={null}><Outlet /></React.Suspense>
      <CommandPalette open={cmdk} onOpenChange={setCmdk} groups={commands} placeholder="搜索页面、查询、数据表" />
    </AppShell>
  );
}
