import { House } from 'lucide-react';
import type { CommandGroup, NavSection } from '@/components/ui';

/** 侧栏导航。key 就是路由路径。完整样例见 Strata 套件的 src/app/nav.tsx。 */
export const NAV: NavSection[] = [
  { items: [{ key: '/', label: '概览', icon: <House /> }] },
];

/** 命令面板里「页面」之后的分组（业务对象、常用操作），数据从 src/api/ 取。 */
export function useCommandGroups(): CommandGroup[] {
  return [];
}
