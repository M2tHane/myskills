import * as React from 'react';
import { SegmentedControl } from '@/components/ui';

/**
 * 原型专用：顶栏正中的状态切换（正常 / 加载中 / 空数据 / 出错 / 无权限）。点一下就改地址里的 ?state=，
 * src/mocks/delay.ts 发现状态变了会整页重新加载，所有模拟请求按新状态返回。
 * 正式产品删掉这个文件和 main.tsx 里挂它的那一行。
 */
const STATES = [
  { value: 'normal', label: '正常' },
  { value: 'loading', label: '加载中' },
  { value: 'empty', label: '空数据' },
  { value: 'error', label: '出错' },
  { value: 'forbidden', label: '无权限' },
];

const split = (hash: string) => {
  const [path, qs = ''] = hash.replace(/^#/, '').split('?');
  return { path, params: new URLSearchParams(qs) };
};

export function StateBar() {
  const [hash, setHash] = React.useState(() => window.location.hash);
  React.useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const { params } = split(hash);
  const cur = params.get('state') ?? 'normal';
  const go = (state: string) => {
    const { path, params: next } = split(window.location.hash);
    if (state === 'normal') next.delete('state');
    else next.set('state', state);
    const qs = next.toString();
    window.location.hash = (path || '/') + (qs ? `?${qs}` : '');
  };
  return (
    <div className="fixed top-3 left-1/2 z-50 -translate-x-1/2" aria-label="原型状态切换">
      <SegmentedControl size="sm" options={STATES} value={cur} onValueChange={go} />
    </div>
  );
}
