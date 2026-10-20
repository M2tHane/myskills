/** 登录。演示规则：密码为 "strata" 时成功。 */
import { useMutation } from '@tanstack/react-query';
import { delay, fail } from '@/mocks/delay';

export interface LoginInput { account: string; password: string; remember: boolean }
const login = (v: LoginInput) => (v.password === 'strata' ? delay({ name: '张一鸣', token: 'demo' }, 700) : fail('账号或密码错误', 700));
export const useLogin = () => useMutation({ mutationFn: login });
