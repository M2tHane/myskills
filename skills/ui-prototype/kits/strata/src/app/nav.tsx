import { useNavigate } from 'react-router';
import { ChartColumn, Database, House, Layers, ListFilter, Plus, Settings, Table, Users } from 'lucide-react';
import type { CommandGroup, NavSection } from '@/components/ui';
import { useQueryList } from '@/api/queries';

/**
 * 侧栏导航。key 就是路由路径，Sidebar 选中后直接 navigate(key)。
 * 有子菜单的父项 key 不对应页面（点击时进入第一个子项）。
 */
export const NAV: NavSection[] = [
  { items: [{ key: '/', label: '概览', icon: <House /> }, { key: '/queries', label: '查询', icon: <ListFilter />, count: 46 }] },
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
