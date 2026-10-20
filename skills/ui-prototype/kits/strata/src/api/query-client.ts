import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './errors';

/** 全局唯一的 QueryClient。页面不直接用它，只在 mutation 成功后让相关查询失效。 */
export const queryClient = new QueryClient({
  defaultOptions: {
    // 4xx（无权限、不存在、参数错）重试也不会变，只对其他错误重试一次
    queries: { staleTime: 30_000, retry: (n, e) => !(e instanceof ApiError && e.status < 500) && n < 1, refetchOnWindowFocus: false },
  },
});
