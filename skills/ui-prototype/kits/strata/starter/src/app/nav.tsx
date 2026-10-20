import { House } from 'lucide-react';
import type { CommandGroup, NavSection } from '@/components/ui';
import type { UserMenuItem } from './app-layout';

/** 外框里和项目有关的文字：工作区名（一般是产品名）、两处搜索框的提示、通知数（null 不显示铃铛）。改这里，不改 app-layout.tsx。 */
export const SHELL = { workspace: '产品名', workspaceSub: undefined as string | undefined, search: '搜索', palette: '搜索页面', notifications: null as number | null };

/** 侧栏导航。key 就是路由路径；有子菜单的父项 key 不对应页面。 */
const NAV: NavSection[] = [
  {
    items: [
      { key: '/', label: '概览', icon: <House /> },
      // @new-page:nav  scripts/new-page.mjs --nav 把导航项插在这一行前面，不要删
    ],
  },
];

/** 外框用的导航。按角色显示时用 useCurrentUser()（@/api/session）过滤，没权限的入口不出现。完整样例见 Strata 套件的 src/app/nav.tsx。 */
export function useNav(): NavSection[] {
  return NAV;
}

/** 命令面板里「页面」之后的分组（业务对象、常用操作），数据从 src/api/ 取。 */
export function useCommandGroups(): CommandGroup[] {
  return [];
}

/** 侧栏底部用户菜单里「切换演示身份」之外的项：修改密码、退出登录等。 */
export function useUserMenu(): UserMenuItem[] {
  return [];
}
