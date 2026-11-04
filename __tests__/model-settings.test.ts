import { describe, expect, it, vi } from 'vitest';
import { clearStoredKey, defaultConfig, readSettings, saveSettingsToStorage } from '../lib/model-settings';

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}
describe('本地模型设置', () => {
  it('保存后可重新读取，清除密钥后保留其他配置', () => {
    const local = storage();
    const config = {...defaultConfig, model: 'test-model', apiKey: 'test-key', thinking: true, webSearch: true};
    saveSettingsToStorage(local, config);
    expect(readSettings(local)).toEqual(config);
    clearStoredKey(local, config);
    expect(readSettings(local)).toEqual({...config, apiKey: ''});
  });
  it('浏览器拒绝存储时向界面报告错误', () => {
    const local = storage();
    local.setItem = vi.fn(() => { throw new Error('storage unavailable'); });
    expect(() => saveSettingsToStorage(local, defaultConfig)).toThrow('storage unavailable');
  });
});
