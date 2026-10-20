import * as React from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, Database, Download, FileSpreadsheet } from 'lucide-react';
import { Badge, BarChart, Button, Card, IconButton, List, ListItem, PageBody, PageHeader, Progress, SegmentedControl, Skeleton, StatCard } from '@/components/ui';
import { useOverview, type Range } from '@/api/overview';

/** 概览页：指标行、单系列趋势、数据源状态、最近运行、用量。路由 `/`。 */
export function OverviewPage() {
  const navigate = useNavigate();
  const [range, setRange] = React.useState<Range>('30d');
  const { data, isPending } = useOverview(range);
  if (isPending || !data) return <OverviewSkeleton />;
  const { stats: st, weeks } = data;
  return (
    <>
      <PageHeader title="概览"
        actions={<><SegmentedControl value={range} onValueChange={(v) => setRange(v as Range)} options={[{ value: '7d', label: '近 7 天' }, { value: '30d', label: '近 30 天' }, { value: '90d', label: '近 90 天' }]} /><Button leftIcon={<Download />}>导出报告</Button></>} />
      <PageBody>
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="今日查询" value={st.queries.value.toLocaleString('zh-CN')} delta={st.queries.delta} deltaGood compare="较昨日" trend={st.queries.trend} trendLabels={weeks} />
          <StatCard label="平均耗时" value={st.latency.value.toFixed(1)} unit="s" delta={st.latency.delta} deltaGood compare="较上周" trend={st.latency.trend} trendLabels={weeks} trendFormat={(v) => `${v.toFixed(1)} s`} />
          <StatCard label="成功率" value={st.success.value.toFixed(1)} unit="%" delta={st.success.delta} deltaGood={false} compare="较上周" trend={st.success.trend} trendLabels={weeks} trendFormat={(v) => `${v.toFixed(1)}%`} />
          <StatCard label="活跃用户" value={String(st.users.value)} delta={st.users.delta} deltaGood compare="较上周" trend={st.users.trend} trendLabels={weeks} />
        </div>
        <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] items-start gap-4">
          <Card title="每日查询量" extra={<span className="text-caption text-fg-subtle tabular-nums">共 {data.dailyTotal.toLocaleString('zh-CN')} 次</span>}>
            <BarChart data={data.daily} height={232} labelEvery={range === '7d' ? 1 : 5} />
          </Card>
          <Card title="数据源" padding="none" footer={<><span>{data.sources.length} 个数据源</span><Button variant="link" rightIcon={<ArrowRight />} onClick={() => navigate('/data/sources')}>管理</Button></>}>
            <List>
              {data.sources.map((s) => (
                <ListItem key={s.name} icon={s.kind === 'file' ? <FileSpreadsheet /> : <Database />} title={s.name} meta={s.meta} trailing={<Badge tone={s.tone}>{s.status}</Badge>} />
              ))}
            </List>
          </Card>
        </div>
        <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] items-start gap-4">
          <Card title="最近运行" padding="none" extra={<IconButton size="sm" icon={<ArrowRight />} label="查看全部" onClick={() => navigate('/queries')} />}>
            <div>
              {data.recent.map((r) => (
                <div key={r.id} className="grid h-10 grid-cols-[minmax(0,1fr)_96px_110px_64px_56px] items-center px-4 text-body-sm [&+&]:border-t [&+&]:border-border-subtle">
                  <span className="truncate font-medium">{r.name}</span>
                  <span><Badge tone={r.tone}>{r.status}</Badge></span>
                  <span className="text-right tabular-nums">{r.rows.toLocaleString('zh-CN')} 行</span>
                  <span className="text-right tabular-nums">{r.ms.toFixed(1)} s</span>
                  <span className="text-right text-fg-subtle tabular-nums">{r.updated.slice(11)}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card title="本月用量">
            <div className="flex flex-col gap-3.5">
              {data.usage.map((u) => <Progress key={u.label} label={u.label} value={u.value} tone={u.value >= 90 ? 'danger' : 'primary'} />)}
            </div>
          </Card>
        </div>
      </PageBody>
    </>
  );
}

/** 首次加载：与真实布局同尺寸的骨架，不用整页转圈。 */
function OverviewSkeleton() {
  return (
    <>
      <PageHeader title="概览" />
      <PageBody>
        <div className="grid grid-cols-4 gap-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-md" />)}</div>
        <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-4"><Skeleton className="h-80 rounded-md" /><Skeleton className="h-80 rounded-md" /></div>
      </PageBody>
    </>
  );
}
