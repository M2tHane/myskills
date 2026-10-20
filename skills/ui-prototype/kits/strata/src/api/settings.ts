/** 工作区设置：按分组读取和保存。 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { delay } from '@/mocks/delay';
import { SETTINGS } from '@/mocks/db';
import { queryClient } from './query-client';

export type Settings = typeof SETTINGS;
export type SettingsSection = keyof Settings;
let current: Settings = structuredClone(SETTINGS);
export type SaveInput = { [K in SettingsSection]: { section: K; values: Settings[K] } }[SettingsSection];

const api = {
  get: () => delay(current),
  save: ({ section, values }: SaveInput) => {
    current = { ...current, [section]: values };
    return delay(current[section], 600);
  },
};

export const useSettings = () => useQuery({ queryKey: ['settings'], queryFn: api.get });
export const useSaveSettings = () => useMutation({ mutationFn: api.save, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }) });
