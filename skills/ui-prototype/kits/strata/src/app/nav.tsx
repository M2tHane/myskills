import { useNavigate } from 'react-router';
import { ChartColumn, Database, House, Layers, ListFilter, LogOut, MessagesSquare, Plus, Settings, Table, Users } from 'lucide-react';
import type { CommandGroup, NavSection } from '@/components/ui';
import { useQueryList } from '@/api/queries';
import { canManageMembers } from '@/api/members';
import { useCurrentUser } from '@/api/session';
import type { UserMenuItem } from './app-layout';

/** 外框里和项目有关的文字：工作区名、两处搜索框的提示、通知数（null 不显示铃铛）。改这里，不改 app-layout.tsx。 */
export const SHELL = { workspace: '运营数据中心', workspaceSub: '团队版' as string | undefined, search: '搜索查询、数据表', palette: '搜索页面、查询、数据表', notifications: 3 as number | null };

/**
 * 侧栏导航。key 就是路由路径，Sidebar 选中后直接 navigate(key)。
 * 有子菜单的父项 key 不对应页面（点击时进入第一个子项）。
 */
const NAV: NavSection[] = [
  { items: [{ key: '/', label: '概览', icon: <House /> }, { key: '/queries', label: '查询', icon: <ListFilter />, count: 46 }, { key: '/assistant', label: '数据助手', icon: <MessagesSquare /> }] },
  {
    title: '数据',
    items: [
      { key: 'data', label: '数据资产', icon: <Database />, children: [{ key: '/data/sources', label: '数据源' }, { key: '/data/tables', label: '数据表' }, { key: '/data/views', label: '物化视图' }] },
      { key: '/reports', label: '报表', icon: <ChartColumn />, count: 48 },
      { key: '/models', label: '指标模型', icon: <Layers /> },
    ],
  },
  { title: '管理', items: [{ key: '/members', label: '成员与权限', icon: <Users /> }, { key: '/settings', label: '设置', icon: <Settings /> }] },
];

/** 外框用的导航，按当前用户过滤：没权限的入口不出现（权限规则写在 api 文件里，如 canManageMembers）。 */
export function useNav(): NavSection[] {
  const user = useCurrentUser();
  return NAV
    .map((s) => ({ ...s, items: s.items.filter((i) => i.key !== '/members' || canManageMembers(user)) }))
    .filter((s) => s.items.length > 0);
}

/** 命令面板里「页面」之后的分组：业务对象与常用操作，数据从 src/api/ 取。 */
export function useCommandGroups(): CommandGroup[] {
  const navigate = useNavigate();
  const { data: queries = [] } = useQueryList();
  return [
    { heading: '查询', items: queries.map((q) => ({ id: 'q' + q.id, label: q.name, icon: <ListFilter />, meta: q.owner, keywords: [q.source], onSelect: () => navigate('/queries') })) },
    { heading: '数据表', items: ['orders_daily', 'orders_items', 'users', 'stores', 'refunds'].map((t) => ({ id: 't' + t, label: t, icon: <Table />, meta: 'pg-prod-02', onSelect: () => navigate(`/data/tables/${t}`) })) },
    { heading: '操作', items: [{ id: 'a-new', label: '新建查询', icon: <Plus />, shortcut: ['N'], onSelect: () => navigate('/queries/new') }] },
  ];
}

/** 侧栏底部用户菜单里「切换演示身份」之外的项：修改密码、退出登录等。 */
export function useUserMenu(): UserMenuItem[] {
  const navigate = useNavigate();
  return [{ id: 'logout', label: '退出登录', icon: <LogOut />, onSelect: () => navigate('/login') }];
}
