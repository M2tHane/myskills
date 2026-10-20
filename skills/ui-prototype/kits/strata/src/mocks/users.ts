/**
 * 演示账号：PRD 里每个角色放一个。原型侧栏底部的用户菜单可以切换；地址加 ?as=<id> 直接以这个身份打开（如 #/members?as=lixiang）。
 * 需要更多字段（部门、多个角色）时直接加在 DemoUser 上；页面按这些字段判断权限，不按姓名判断。
 */
export interface DemoUser { id: string; name: string; role: string }

export const DEMO_USERS: DemoUser[] = [
  { id: 'zhangyiming', name: '张一鸣', role: '数据分析' },
  { id: 'lixiang', name: '李想', role: '管理员' },
];
