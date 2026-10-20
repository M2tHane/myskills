/**
 * 成员：按角色控制权限的样板，只有管理员能看成员列表。
 * 权限规则只写一处（canManageMembers），三个地方都用它：
 * - 接口：list 先看 getCurrentUser()，没权限返回 403，页面用 LoadFailed 显示无权限（直接打开地址时）；
 * - 导航：nav.tsx 的 useNav() 用它过滤「成员与权限」；
 * - 页面里只有部分角色能用的按钮，用 canXxx(useCurrentUser()) 决定显示与否。
 */
import { useQuery } from '@tanstack/react-query';
import { delay, fail } from '@/mocks/delay';
import { MEMBERS, type MemberRow } from '@/mocks/db';
import { getCurrentUser, type CurrentUser } from './session';

export type { MemberRow };

export const canManageMembers = (user: CurrentUser) => user.role === '管理员';

const api = {
  list: () => (canManageMembers(getCurrentUser()) ? delay(MEMBERS) : fail('成员与权限 · 需要管理员角色', 300, 403)),
};

export const memberKeys = { list: ['members'] as const };
// 切换演示身份时 session.ts 会重置全部查询，查询键里不用带用户
export const useMembers = () => useQuery({ queryKey: memberKeys.list, queryFn: api.list });
