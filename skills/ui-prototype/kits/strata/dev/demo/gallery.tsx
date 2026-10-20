import * as React from 'react';
import { Bell, Copy, Database, Download, Ellipsis, Filter, ListFilter, Pencil, Play, Plus, RefreshCw, Save, Search, Settings, Table, Trash2, Upload } from 'lucide-react';
import {
  Alert, Badge, Button, ButtonGroup, Card, Checkbox, CountBadge, DataTable, DescriptionList, Dialog, DialogBody, DialogContent, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger, EmptyState, Field, FormActions, FormSection, IconButton, Input, KbdCombo, List, ListItem,
  MultiSelect, Pagination, Popover, PopoverContent, PopoverTrigger, Progress, RadioGroup, SegmentedControl, Select, Sheet, SheetContent,
  SheetTrigger, Skeleton, StatCard, Steps, Switch, Tabs, TabsList, TabsTrigger, Textarea, ToastCard, Toaster, Tooltip, toast,
  Calendar, CommandPalette, DatePicker, DateRangePicker, Dropzone, Tree, UploadList, type TreeNode, type UploadItem, type DateRange,
} from '@/components/ui';
import { QUERIES } from '@/mocks/db';
import { ResizableGroup, ResizableHandle, ResizablePanel } from '@/components/optional/resizable';
import { Chart, barChart, comboChart, donutChart, fmt, funnelChart, heatmapChart, lineChart, rankingChart } from '@/components/optional/chart';

function Section({ no, title, children }: { no: string; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="rounded-xs border border-primary-line bg-surface px-[7px] font-mono text-caption leading-5 font-semibold text-primary shadow-xs">{no}</span>
        <h2 className="m-0 text-title-3 font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
const Row = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={'flex flex-wrap items-center gap-2 ' + (className ?? '')}>{children}</div>;
const Panel = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={'rounded-md border border-border bg-surface p-4 shadow-card ' + (className ?? '')}>{children}</div>;

const SQL = ['SELECT region, SUM(pay_amount) AS gmv, COUNT(*) AS orders', 'FROM orders_daily', "WHERE dt >= '2026-10-01'", 'GROUP BY region', 'ORDER BY gmv DESC;'];
const RESULT = [['华东', 4_826_310.5, 18_204], ['华南', 3_112_884.2, 12_930], ['华北', 2_704_115.8, 10_377], ['西南', 1_486_902.1, 6_118], ['华中', 1_203_447.6, 5_342]] as const;

function ResizableDemo() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-[380px] overflow-hidden rounded-md border border-border bg-surface shadow-card">
        <ResizableGroup>
          <ResizablePanel defaultSize="24" minSize={180} maxSize="40">
            <div className="flex h-full flex-col">
              <div className="flex h-11 items-center border-b border-border-subtle px-3 text-body-sm font-semibold">数据表</div>
              <div className="flex-1 overflow-auto py-1">
                <List divided={false} interactive>
                  {['orders_daily', 'orders_items', 'users', 'stores', 'coupons', 'refunds'].map((t, i) => (
                    <ListItem key={t} icon={<Table />} title={<span className="font-mono text-code">{t}</span>} selected={i === 0} />
                  ))}
                </List>
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel minSize={320}>
            <ResizableGroup orientation="vertical">
              <ResizablePanel defaultSize="44" minSize={96}>
                <div className="flex h-full flex-col">
                  <div className="flex h-11 items-center gap-2 border-b border-border-subtle px-3">
                    <span className="text-body-sm font-semibold">查询编辑器</span><span className="flex-1" />
                    <Button size="sm" leftIcon={<Save />}>保存</Button><Button size="sm" variant="default" leftIcon={<Play />}>运行</Button>
                  </div>
                  <pre className="m-0 flex-1 overflow-auto bg-surface-sunken px-4 py-3 font-mono text-code text-fg [font-variant-ligatures:none]">
                    {SQL.map((l, i) => <div key={i} className="flex gap-4"><span className="w-4 shrink-0 text-right text-fg-disabled tabular-nums select-none">{i + 1}</span>{l}</div>)}
                  </pre>
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel minSize={120}>
                <div className="flex h-full flex-col">
                  <div className="flex h-10 items-center gap-2 px-3 text-body-sm"><span className="font-semibold">结果</span><Badge tone="success">已完成</Badge><span className="text-fg-subtle tabular-nums">5 行 · 0.8 s</span></div>
                  <div className="flex-1 overflow-auto border-t border-border-subtle">
                    <table className="w-full border-separate border-spacing-0 text-body-sm">
                      <thead><tr>{['region', 'gmv', 'orders'].map((h, i) => <th key={h} className={'sticky top-0 h-8 border-b border-border-subtle bg-surface-sunken px-3 font-mono text-caption font-medium text-fg-muted ' + (i ? 'text-right' : 'text-left')}>{h}</th>)}</tr></thead>
                      <tbody>{RESULT.map(([r, g, o]) => <tr key={r} className="hover:[&>td]:bg-surface-hover"><td className="h-9 border-b border-border-subtle px-3">{r}</td><td className="border-b border-border-subtle px-3 text-right tabular-nums">{g.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</td><td className="border-b border-border-subtle px-3 text-right tabular-nums">{o.toLocaleString('zh-CN')}</td></tr>)}</tbody>
                    </table>
                  </div>
                </div>
              </ResizablePanel>
            </ResizableGroup>
          </ResizablePanel>
        </ResizableGroup>
      </div>
      <div className="h-[260px]">
        <ResizableGroup variant="gap">
          <ResizablePanel defaultSize="38" minSize={240}>
            <Card title="对话" className="h-full"><div className="flex flex-col gap-2 text-body-sm"><div className="self-end rounded-md bg-primary-soft px-3 py-2 text-fg">上个月各区域 GMV 排名</div><div className="self-start rounded-md border border-border-subtle bg-surface-sunken px-3 py-2">已按区域汇总 10 月 GMV，华东第一。</div></div></Card>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel minSize={320}>
            <Card title="结果" className="h-full" extra={<Button size="sm" leftIcon={<Download />}>导出</Button>}>
              <DescriptionList columns={2} items={RESULT.slice(0, 4).map(([r, g]) => ({ label: r, value: <span className="tabular-nums">{g.toLocaleString('zh-CN')}</span> }))} />
            </Card>
          </ResizablePanel>
        </ResizableGroup>
      </div>
    </div>
  );
}

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月'];
const REGIONS = ['华东', '华南', '华北', '西南', '华中', '西北'];
const yuan = (v: number) => '¥' + fmt.compact(v);
const w = (a: number[]) => a.map((v) => v * 1e4);
const HM = (() => {
  const out: Array<[number, number, number]> = [];
  for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) {
    const peak = Math.exp(-((h - 10) ** 2) / 10) + 0.8 * Math.exp(-((h - 15) ** 2) / 8) + 0.15;
    out.push([h, d, Math.round(peak * (d < 5 ? 1 : 0.45) * 260 + ((h * 7 + d * 13) % 17))]);
  }
  return out;
})();

function ChartsDemo() {
  const o = React.useMemo(() => ({
    line: lineChart({ categories: MONTHS, format: yuan, series: [
      { name: '华东', data: w([612, 580, 664, 708, 690, 752, 781, 744, 812, 862]) },
      { name: '华南', data: w([482, 510, 492, 548, 581, 560, 612, 630, 604, 661]) },
      { name: '华北', data: w([402, 381, 440, 421, 470, 452, 488, 520, 503, 540]) }] }),
    compare: barChart({ categories: REGIONS, format: yuan, compare: { name: '9 月', data: w([812, 604, 503, 288, 241, 132]) }, series: [{ name: '10 月', data: w([862, 661, 540, 302, 266, 151]) }] }),
    stack: barChart({ categories: MONTHS, stack: true, format: yuan, series: [
      { name: '线上', data: w([420, 380, 450, 470, 460, 510, 530, 500, 560, 600]) },
      { name: '门店', data: w([310, 290, 320, 340, 330, 350, 360, 352, 372, 390]) },
      { name: '分销', data: w([160, 150, 170, 180, 176, 190, 196, 188, 204, 214]) }] }),
    combo: comboChart({ categories: MONTHS, barFormat: yuan, lineFormat: (v) => fmt.percent(v),
      bars: [{ name: 'GMV', data: w([890, 820, 940, 990, 966, 1050, 1086, 1040, 1136, 1204]) }],
      line: { name: '毛利率', data: [0.212, 0.205, 0.221, 0.226, 0.219, 0.231, 0.236, 0.228, 0.241, 0.247] } }),
    rank: rankingChart({ format: yuan, items: [['上海', 326], ['杭州', 241], ['南京', 198], ['苏州', 172], ['宁波', 131], ['合肥', 108]].map(([name, v]) => ({ name: name as string, value: (v as number) * 1e4 })) }),
    donut: donutChart({ format: yuan, items: [['线上', 600], ['门店', 390], ['分销', 214], ['团购', 98], ['其他渠道', 42]].map(([name, v]) => ({ name: name as string, value: (v as number) * 1e4 })) }),
    heat: heatmapChart({ x: Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0')), y: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], data: HM, format: (v) => fmt.number(v) + ' 次' }),
    funnel: funnelChart({ stages: [{ name: '访问', value: 128400 }, { name: '浏览商品', value: 76300 }, { name: '加入购物车', value: 31200 }, { name: '提交订单', value: 14800 }, { name: '支付成功', value: 11900 }] }),
  }), []);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Card title="各区域 GMV"><Chart option={o.line} height={260} /></Card>
        <Card title="区域 GMV 环比"><Chart option={o.compare} height={260} /></Card>
        <Card title="各渠道 GMV"><Chart option={o.stack} height={260} /></Card>
        <Card title="GMV 与毛利率"><Chart option={o.combo} height={260} /></Card>
        <Card title="城市 GMV 排名"><Chart option={o.rank} height={240} /></Card>
        <Card title="渠道占比"><Chart option={o.donut} height={240} /></Card>
      </div>
      <Card title="查询时段分布"><Chart option={o.heat} height={232} /></Card>
      <div className="grid grid-cols-2 gap-4">
        <Card title="下单转化"><Chart option={o.funnel} height={240} /></Card>
        <Card title="区域 GMV"><Chart option={o.compare} height={240} loading /></Card>
      </div>
    </div>
  );
}

const TREE: TreeNode[] = [
  { id: 'pg', label: 'pg-prod-02', icon: <Database />, meta: 3, children: [
    { id: 'pg.analytics', label: 'analytics', icon: <Database />, children: [
      { id: 't.orders_daily', label: 'orders_daily', icon: <Table />, meta: '12.8M' }, { id: 't.orders_items', label: 'orders_items', icon: <Table />, meta: '48.1M' },
      { id: 't.users', label: 'users', icon: <Table />, meta: '2.3M' }] },
    { id: 'pg.ops', label: 'ops', icon: <Database />, children: [{ id: 't.stores', label: 'stores', icon: <Table />, meta: '1,204' }, { id: 't.refunds', label: 'refunds', icon: <Table />, meta: '86K' }] },
    { id: 'pg.tmp', label: 'tmp', icon: <Database />, children: [{ id: 't.tmp_0919', label: 'tmp_0919', icon: <Table />, meta: '12K' }] },
  ] },
  { id: 'ch', label: 'clickhouse-olap', icon: <Database />, meta: 1, children: [{ id: 'ch.events', label: 'events', icon: <Database />, children: [{ id: 't.page_views', label: 'page_views', icon: <Table />, meta: '1.2B' }] }] },
  { id: 'my', label: 'mysql-crm', icon: <Database />, disabled: true },
];

function NewComponentsDemo() {
  const [d, setD] = React.useState<Date | undefined>(new Date(2026, 9, 19));
  const [r, setR] = React.useState<DateRange | undefined>();
  const [sel, setSel] = React.useState('t.orders_daily');
  const [chk, setChk] = React.useState<string[]>(['t.orders_daily', 't.users']);
  const [kw, setKw] = React.useState('');
  const [files, setFiles] = React.useState<UploadItem[]>([
    { id: '1', name: '订单明细_10月.csv', size: 18.4 * 1024 ** 2, status: 'done' },
    { id: '2', name: '退款记录.xlsx', size: 6.1 * 1024 ** 2, status: 'uploading', progress: 54 },
    { id: '3', name: '门店照片.zip', size: 120 * 1024 ** 2, status: 'error', error: '格式不支持', retryable: false },
  ]);
  const [cmd, setCmd] = React.useState(false);
  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-wrap items-start gap-4">
        <div className="w-44"><DatePicker value={d} onValueChange={setD} /></div>
        <div className="w-60"><DateRangePicker value={r} onValueChange={setR} /></div>
        <Card padding="default"><Calendar value={d} onValueChange={setD} /></Card>
      </Panel>
      <div className="grid grid-cols-2 gap-4">
        <Card title="数据目录" padding="none"><div className="p-2"><Input leftIcon={<Search />} placeholder="搜索表" value={kw} onChange={(e) => setKw(e.target.value)} clearable onClear={() => setKw('')} /></div><div className="px-2 pb-2"><Tree data={TREE} value={sel} onValueChange={setSel} defaultExpanded={['pg', 'pg.analytics']} filter={kw} /></div></Card>
        <Card title="授权数据表" padding="none"><div className="p-2"><Tree data={TREE} checkable checked={chk} onCheckedChange={setChk} defaultExpanded="all" /></div></Card>
      </div>
      <div className="flex flex-col gap-3">
        <Dropzone accept=".csv,.xlsx" maxSize={50 * 1024 ** 2} title="拖拽 CSV、XLSX 文件到这里，或" onFiles={(ok, bad) => setFiles((f) => [...ok.map((x, i) => ({ id: 'n' + Date.now() + i, name: x.name, size: x.size, status: 'waiting' as const })), ...bad.map((b, i) => ({ id: 'b' + Date.now() + i, name: b.file.name, size: b.file.size, status: 'error' as const, error: b.reason, retryable: false })), ...f])} />
        <UploadList items={files} onRemove={(id) => setFiles((f) => f.filter((x) => x.id !== id))} onRetry={(id) => setFiles((f) => f.map((x) => (x.id === id ? { ...x, status: 'uploading', progress: 10, error: undefined } : x)))} />
      </div>
      <Row><Button leftIcon={<Search />} onClick={() => setCmd(true)}>打开命令面板</Button></Row>
      <CommandPalette open={cmd} onOpenChange={setCmd} placeholder="搜索页面、查询、数据表" groups={[
        { heading: '页面', items: [{ id: 'p1', label: '概览', icon: <Settings />, onSelect: () => {} }, { id: 'p2', label: '查询', icon: <Filter />, onSelect: () => {} }, { id: 'p3', label: '数据表', icon: <Table />, meta: '数据资产', onSelect: () => {} }] },
        { heading: '数据表', items: ['orders_daily', 'orders_items', 'users'].map((t) => ({ id: t, label: t, icon: <Table />, meta: 'pg-prod-02', onSelect: () => {} })) },
        { heading: '操作', items: [{ id: 'new', label: '新建查询', icon: <Plus />, shortcut: ['N'], onSelect: () => {} }] },
      ]} />
    </div>
  );
}

const cities = [['华东', ['上海', '杭州', '南京', '苏州', '宁波']], ['华南', ['广州', '深圳', '厦门']], ['华北', ['北京', '天津']]].flatMap(([g, cs]) => (cs as string[]).map((c) => ({ value: c, label: c + '仓', group: (g as string) + '区' })));

export function Gallery() {
  const variants = ['default', 'outline', 'secondary', 'ghost', 'link', 'destructive', 'destructive-outline'] as const;
  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-8 px-6 py-8">
      <h1 className="m-0 text-title-1 font-semibold">Strata 组件总览</h1>

      <Section no="1" title="按钮与小控件">
        <Panel className="flex flex-col gap-3">
          {variants.map((v) => (
            <Row key={v}>
              <span className="w-40 font-mono text-caption">{v}</span>
              <Button variant={v} leftIcon={v === 'link' ? undefined : <Plus />} rightIcon={v === 'link' ? <Download /> : undefined}>新建查询</Button>
              <Button variant={v} disabled>禁用</Button>
              <Button variant={v} size="sm">小号</Button>
            </Row>
          ))}
          <Row>
            <Button variant="default" loading>运行中</Button>
            <IconButton icon={<Pencil />} label="编辑" />
            <IconButton variant="outline" icon={<RefreshCw />} label="刷新" />
            <IconButton icon={<Search />} label="搜索" shortcut={['⌘', 'K']} />
            <ButtonGroup><Button leftIcon={<Upload />}>导入</Button><Button leftIcon={<Download />}>导出</Button><Button size="icon" leftIcon={<Ellipsis />} aria-label="更多" /></ButtonGroup>
            <ButtonGroup><Button variant="default" leftIcon={<Play />}>运行查询</Button><Button variant="default" size="icon" leftIcon={<Ellipsis />} aria-label="选项" /></ButtonGroup>
            <SegmentedControl options={[{ value: 'a', label: '概览' }, { value: 'b', label: '明细' }, { value: 'c', label: '运行日志' }]} />
          </Row>
          <Row>
            <Badge>草稿</Badge><Badge tone="primary">运行中</Badge><Badge tone="success">已完成</Badge><Badge tone="warning">待审核</Badge><Badge tone="danger">失败</Badge><Badge icon={false}>v2.6</Badge>
            <CountBadge count={12} tone="primary" /><CountBadge count={48} /><CountBadge count={128} tone="danger" />
            <KbdCombo keys={['⌘', 'K']} />
            <Tooltip content="复制查询链接"><Button leftIcon={<Copy />}>悬停提示</Button></Tooltip>
          </Row>
        </Panel>
      </Section>

      <Section no="2" title="表单">
        <Panel className="grid grid-cols-3 gap-4">
          <Field label="名称" required><Input placeholder="输入名称" /></Field>
          <Field label="名称" required error="名称已存在"><Input invalid defaultValue="orders" /></Field>
          <Field label="超时"><Input defaultValue="30" suffix="秒" /></Field>
          <Field label="搜索"><Input leftIcon={<Search />} clearable defaultValue="订单" /></Field>
          <Field label="密码"><Input type="password" defaultValue="secret-pass" /></Field>
          <Field label="地址"><Input addonBefore="https://" placeholder="example.com" /></Field>
          <Field label="类型"><Select defaultValue="pg" options={[{ value: 'pg', label: 'PostgreSQL', icon: <Database /> }, { value: 'my', label: 'MySQL', icon: <Database /> }]} /></Field>
          <Field label="仓库（>8 项带搜索）"><Select placeholder="选择仓库" options={cities} /></Field>
          <Field label="字段"><MultiSelect defaultValue={['上海', '杭州', '广州', '北京']} options={cities} /></Field>
          <Field label="描述" aside="计数"><Textarea showCount maxLength={200} defaultValue="华东区域订单明细" /></Field>
          <div className="flex flex-col gap-3">
            <Checkbox label="记住筛选" defaultChecked /><Checkbox label="全部" indeterminate /><Switch label="启用 SSL" defaultChecked />
            <RadioGroup orientation="horizontal" defaultValue="w" options={[{ value: 'd', label: '按日' }, { value: 'w', label: '按周' }, { value: 'm', label: '按月' }]} />
          </div>
          <RadioGroup variant="card" columns={2} defaultValue="pg" options={[{ value: 'pg', label: 'PostgreSQL', icon: <Database /> }, { value: 'csv', label: 'CSV 文件', icon: <Table /> }]} />
        </Panel>
        <Card title="新建数据源" footer={<FormActions start={<Button leftIcon={<RefreshCw />}>测试连接</Button>}><Button>取消</Button><Button variant="default" leftIcon={<Save />}>保存</Button></FormActions>}>
          <FormSection title="连接" columns={4}>
            <Field label="主机" required span={3}><Input defaultValue="10.20.8.14" /></Field>
            <Field label="端口" required><Input defaultValue="5432" /></Field>
          </FormSection>
          <FormSection title="高级" columns={2}><Switch label="启用 SSL" defaultChecked /><Switch label="只读连接" /></FormSection>
        </Card>
      </Section>

      <Section no="3" title="数据展示">
        <DataTable columns={[
          { key: 'name', title: '名称', render: (r) => <span className="font-medium">{r.name}</span> },
          { key: 'status', title: '状态', width: 108, render: (r) => <Badge tone={r.tone}>{r.status}</Badge> },
          { key: 'owner', title: '负责人', width: 96 },
          { key: 'rows', title: '行数', width: 104, numeric: true, sortable: true, render: (r) => r.rows.toLocaleString('zh-CN') },
          { key: 'updated', title: '更新时间', width: 150, sortable: true, render: (r) => <span className="text-fg-subtle">{r.updated}</span> },
        ]} data={QUERIES} rowKey={(r) => r.id} selectable
          toolbar={<><div className="w-60"><Input leftIcon={<Search />} placeholder="搜索" /></div><span className="flex-1" /><Button variant="default" leftIcon={<Plus />}>新建</Button></>}
          bulkActions={() => <Button size="sm" variant="destructive-outline" leftIcon={<Trash2 />}>删除</Button>}
          rowActions={() => <><IconButton size="sm" icon={<Pencil />} label="编辑" /><IconButton size="sm" icon={<Copy />} label="复制" /></>} />
        <Panel><Pagination total={128} defaultPage={7} /></Panel>
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="今日查询" value="1,284" delta="+12.4%" deltaGood compare="较昨日" trend={[8, 9, 8.7, 9.9, 10, 9.6, 11, 10.8, 11.5, 11.2, 11.9, 12.8]} />
          <StatCard label="平均耗时" value="2.4" unit="s" delta="−0.3 s" deltaGood compare="较上周" />
          <StatCard label="成功率" value="99.2" unit="%" delta="−0.4 pt" deltaGood={false} compare="较上周" />
          <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4 shadow-card"><Skeleton className="w-16" /><Skeleton className="h-6 w-24" /><Skeleton className="w-28" /></div>
        </div>
        <div className="grid grid-cols-3 items-start gap-4">
          <Card title="数据源" padding="none"><List><ListItem icon={<Database />} title="pg-prod-02" meta="PostgreSQL · 10.20.8.14" trailing={<Badge tone="success">已连接</Badge>} /><ListItem icon={<Database />} title="mysql-crm" meta="MySQL" trailing={<Badge tone="danger">连接失败</Badge>} selected /></List></Card>
          <Card title="基本信息"><DescriptionList bordered columns={1} items={[{ label: '名称', value: 'orders_daily', mono: true }, { label: '负责人', value: '张一鸣' }, { label: '行数', value: '12,840,562' }]} /></Card>
          <Card><EmptyState icon={<Database />} title="还没有数据集" action={<Button variant="default" leftIcon={<Plus />}>新建数据集</Button>} /></Card>
        </div>
      </Section>

      <Section no="4" title="导航">
        <Panel>
          <Tabs defaultValue="schema"><TabsList><TabsTrigger value="o">概览</TabsTrigger><TabsTrigger value="schema" count={32}>字段</TabsTrigger><TabsTrigger value="p">数据预览</TabsTrigger></TabsList></Tabs>
        </Panel>
      </Section>

      <Section no="5" title="浮层与反馈">
        <Row>
          <Dialog>
            <DialogTrigger asChild><Button variant="destructive-outline" leftIcon={<Trash2 />}>删除查询</Button></DialogTrigger>
            <DialogContent size="sm">
              <DialogHeader tone="danger"><DialogTitle>删除这个查询？</DialogTitle></DialogHeader>
              <DialogBody indent>「库存周转分析」及其 6 次运行记录将被永久删除。</DialogBody>
              <DialogFooter><Button>取消</Button><Button variant="destructive">删除</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger asChild><Button>打开侧滑面板</Button></SheetTrigger>
            <SheetContent title="库存周转分析" meta={<Badge tone="warning">待审核</Badge>} footer={<><Button>关闭</Button><Button variant="default">通过审核</Button></>}>
              <DescriptionList bordered columns={1} items={[{ label: '负责人', value: '王晓' }, { label: '数据源', value: 'pg-prod-02', mono: true }]} />
            </SheetContent>
          </Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button>更多操作</Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem icon={<Pencil />} shortcut="E">编辑</DropdownMenuItem>
              <DropdownMenuItem icon={<Copy />} shortcut="⌘D">复制</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>显示列</DropdownMenuLabel>
              <DropdownMenuCheckboxItem defaultChecked>名称</DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={<Trash2 />} danger>删除</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Popover>
            <PopoverTrigger asChild><Button leftIcon={<ListFilter />}>筛选</Button></PopoverTrigger>
            <PopoverContent title="筛选" footer={<><Button size="sm" variant="ghost">重置</Button><Button size="sm" variant="default">应用</Button></>}>
              <Field label="状态"><Select defaultValue="run" options={[{ value: 'run', label: '运行中' }]} /></Field>
            </PopoverContent>
          </Popover>
          <Button onClick={() => toast({ tone: 'success', title: '已保存', description: '数据集 orders_daily 已更新。' })}>触发 Toast</Button>
          <IconButton icon={<Bell />} label="通知" />
          <IconButton icon={<Settings />} label="设置" />
          <IconButton icon={<Filter />} label="过滤" />
        </Row>
        <div className="grid grid-cols-2 gap-3">
          <Alert tone="info" title="字段血缘视图已上线" action={<Button size="sm">查看</Button>} onClose={() => {}}>覆盖全部 128 张数据表。</Alert>
          <Alert tone="danger" title="数据源连接失败" action={<Button size="sm">重试</Button>} onClose={() => {}}>pg-prod-02 在 30 秒内无响应。</Alert>
          <ToastCard tone="success" title="已保存" description="数据集 orders_daily 已更新。" onClose={() => {}} />
          <ToastCard tone="loading" title="正在导出" description="orders_daily · 12,840 行" />
        </div>
        <Panel className="flex flex-col gap-4">
          <Steps current={2} items={[{ title: '选择数据源' }, { title: '配置连接' }, { title: '选择数据表' }, { title: '确认并创建' }]} />
          <div className="grid grid-cols-3 gap-4"><Progress label="存储空间" value={62} /><Progress label="同步完成" value={100} tone="success" /><Progress label="准备中" indeterminate /></div>
        </Panel>
      </Section>

      <Section no="6" title="可拖动分栏（可选组件）">
        <ResizableDemo />
      </Section>

      <Section no="8" title="日期 · 树 · 上传 · 命令面板">
        <NewComponentsDemo />
      </Section>

      <Section no="7" title="图表（可选组件 · ECharts）">
        <ChartsDemo />
      </Section>
      <Toaster />
    </div>
  );
}
