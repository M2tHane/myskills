/**
 * 当前用户。原型里是演示账号：地址里的 ?as=<id> 优先，其次是上次选的，再次是第一个演示账号。
 * 切换身份后已缓存的数据全部重新请求（权限不同，看到的数据和按钮也不同）。接真实登录时只改这个文件。
 */
import * as React from 'react';
import { DEMO_USERS, type DemoUser } from '@/mocks/users';
import { queryClient } from './query-client';

export type CurrentUser = DemoUser;
export const demoUsers = DEMO_USERS;

const KEY = 'proto.user';
const asParam = () => (typeof window === 'undefined' ? null : new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('as'));
const byId = (id: string | null) => DEMO_USERS.find((u) => u.id === id);
const remember = (id: string) => { try { localStorage.setItem(KEY, id); } catch { /* 存不了就只在这次打开里有效 */ } };
const stored = () => { try { return localStorage.getItem(KEY); } catch { return null; } };

let current: CurrentUser = byId(asParam()) ?? byId(stored()) ?? DEMO_USERS[0];
remember(current.id);
const listeners = new Set<() => void>();

export function switchUser(id: string) {
  const next = byId(id);
  if (!next || next.id === current.id) return;
  current = next;
  remember(id);
  void queryClient.resetQueries();
  listeners.forEach((l) => l());
}
// 只改地址里的 ?as= 时（hash 路由不刷新页面）也切换身份
if (typeof window !== 'undefined') window.addEventListener('hashchange', () => { const id = asParam(); if (id) switchUser(id); });

/** 在 api 文件里按当前用户过滤数据、判断权限时用。 */
export const getCurrentUser = () => current;
/** 在页面和外框里用：身份切换后会重新渲染。 */
export function useCurrentUser(): CurrentUser {
  return React.useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => current);
}
