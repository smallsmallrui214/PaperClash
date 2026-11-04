import type { Config } from './provider';

export const CONFIG_STORAGE_KEY = 'paperclash-model-config-v1';
export const defaultConfig: Config = {provider: 'deepseek', model: 'deepseek-flash', apiKey: '', thinking: false, webSearch: false};
type LocalStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function readSettings(storage: LocalStorage): Config | null {
  const saved = storage.getItem(CONFIG_STORAGE_KEY);
  if (!saved) return null;
  const value: unknown = JSON.parse(saved);
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.model !== 'string' || typeof record.apiKey !== 'string') return null;
  return {provider: 'deepseek', model: record.model.slice(0, 120), apiKey: record.apiKey.slice(0, 500), thinking: record.thinking === true, webSearch: record.webSearch === true};
}

export function saveSettingsToStorage(storage: LocalStorage, config: Config): void {
  storage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function clearStoredKey(storage: LocalStorage, config: Config): void {
  storage.removeItem(CONFIG_STORAGE_KEY);
  saveSettingsToStorage(storage, {...config, apiKey: ''});
}
