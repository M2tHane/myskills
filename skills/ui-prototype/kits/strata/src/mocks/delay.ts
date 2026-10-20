import { ApiError } from '@/api/errors';

/**
 * 原型的四种状态：网址带 ?state=loading | empty | error | forbidden 时（hash 路由写在 # 后面，如 #/queries?state=empty），
 * 所有模拟请求按这个状态返回，用来查看页面在加载中、空数据、出错、无权限时的样子。
 */
type MockState = 'loading' | 'empty' | 'error' | 'forbidden';

function mockState(): MockState | undefined {
  if (typeof window === 'undefined') return undefined;
  const s = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('state');
  return s === 'loading' || s === 'empty' || s === 'error' || s === 'forbidden' ? s : undefined;
}

// 只改地址里的 ?state= 时，hash 路由不会刷新页面，已缓存的数据也不会变；状态变了就整页重新加载。
if (typeof window !== 'undefined') {
  const initial = mockState();
  window.addEventListener('hashchange', () => {
    if (mockState() !== initial) window.location.reload();
  });
}

/** 模拟网络延迟。默认 300–600ms，让加载态在原型里真实可见。empty 只清空列表类数据（数组），单个对象照常返回。 */
export function delay<T>(value: T, ms = 300 + Math.random() * 300): Promise<T> {
  const state = mockState();
  if (state === 'loading') return new Promise(() => {});
  if (state === 'error') return fail('服务暂时不可用', ms, 500);
  if (state === 'forbidden') return fail('没有权限', ms, 403);
  const v = state === 'empty' && Array.isArray(value) ? ([] as T) : value;
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(v)), ms));
}

/** 模拟接口报错。 */
export function fail(message: string, ms = 400, status = 400): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new ApiError(message, status)), ms));
}
