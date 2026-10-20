/** 数据源：列表、测试连接、读取远端表、创建。 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { delay, fail } from '@/mocks/delay';
import { REMOTE_TABLES, SOURCE_ROWS, type SourceKind, type SourceRow } from '@/mocks/db';
import { queryClient } from './query-client';

export type { SourceKind, SourceRow };
let rows = [...SOURCE_ROWS];

export interface ConnectionInput { kind: SourceKind; host: string; port: string; database: string; user: string; password: string; ssl: boolean }
export interface CreateSourceInput extends ConnectionInput { name: string; tables: string[]; schedule: string }

const api = {
  list: () => delay(rows),
  /** 演示规则：主机含 "bad" 时连接失败。 */
  test: (c: ConnectionInput) => (c.host.includes('bad') ? fail(`无法连接 ${c.host}:${c.port}`, 900) : delay({ latency: 38, version: c.kind === 'mysql' ? 'MySQL 8.0' : c.kind === 'clickhouse' ? 'ClickHouse 24.3' : 'PostgreSQL 16.2' }, 900)),
  tables: () => delay(REMOTE_TABLES),
  create: (input: CreateSourceInput) => {
    const row: SourceRow = { id: 's' + Date.now(), name: input.name, kind: input.kind, host: `${input.host}:${input.port}`, database: input.database, tables: input.tables.length, status: '同步中', tone: 'primary', owner: '张一鸣', updated: '2026-10-19 12:00' };
    rows = [row, ...rows];
    return delay(row, 700);
  },
};

export const sourceKeys = { list: ['sources'] as const, remote: ['sources', 'remote-tables'] as const };
export const useSources = () => useQuery({ queryKey: sourceKeys.list, queryFn: api.list });
export const useRemoteTables = (enabled: boolean) => useQuery({ queryKey: sourceKeys.remote, queryFn: api.tables, enabled });
export const useTestConnection = () => useMutation({ mutationFn: api.test });
export const useCreateSource = () => useMutation({ mutationFn: api.create, onSuccess: () => queryClient.invalidateQueries({ queryKey: sourceKeys.list }) });
