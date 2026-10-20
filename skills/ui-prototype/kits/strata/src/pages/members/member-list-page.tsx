import { Plus, Users } from 'lucide-react';
import { Avatar, Badge, Button, DataTable, EmptyState, PageBody, PageHeader, toast, type Column } from '@/components/ui';
import { useMembers, type MemberRow } from '@/api/members';
import { LoadFailed } from '@/pages/errors/error-pages';

/**
 * 成员与权限：路由 `/members`，只有管理员能看（按角色控制权限的样板，规则见 src/api/members.ts）。
 * 页面不自己判断角色：没权限时 useMembers() 返回 403，由 LoadFailed 显示无权限。
 * 原型里对比 #/members?as=lixiang（管理员）和 #/members?as=zhangyiming（数据分析）。
 */
export function MemberListPage() {
  const { data = [], isPending, isError, error, refetch } = useMembers();
  const invite = () => toast({ tone: 'success', title: '已发送邀请' });
  const columns: Column<MemberRow>[] = [
    { key: 'name', title: '成员', render: (r) => <span className="flex items-center gap-2.5"><Avatar name={r.name} size={24} /><span className="font-medium">{r.name}</span></span> },
    { key: 'email', title: '邮箱', width: 240, render: (r) => <span className="text-fg-muted">{r.email}</span> },
    { key: 'role', title: '角色', width: 120, render: (r) => <Badge icon={false} tone={r.role === '管理员' ? 'primary' : 'neutral'}>{r.role}</Badge> },
    { key: 'status', title: '状态', width: 108, render: (r) => <Badge tone={r.tone}>{r.status}</Badge> },
    { key: 'lastActive', title: '最近活跃', width: 148, sortable: true, render: (r) => <span className="text-fg-subtle tabular-nums">{r.lastActive}</span> },
  ];
  if (isError) return <LoadFailed error={error} onRetry={() => refetch()} />;
  return (
    <>
      <PageHeader title="成员与权限" actions={<Button variant="default" leftIcon={<Plus />} onClick={invite}>邀请成员</Button>} />
      <PageBody>
        <DataTable columns={columns} data={data} rowKey={(r) => r.id} loading={isPending} pagination={false}
          empty={<EmptyState size="sm" icon={<Users />} title="还没有成员" action={<Button size="sm" leftIcon={<Plus />} onClick={invite}>邀请成员</Button>} />} />
      </PageBody>
    </>
  );
}
