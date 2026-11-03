import { describe, expect, it } from 'vitest';
import { conferenceGroups, conferences, MAX_CONFERENCES } from '../lib/conferences';
import { buildSearchPrompt, searchInputSchema, searchResultNotice } from '../lib/search';

const request = {
  question: '如何改善代码生成？',
  config: { provider: 'openai', model: 'test-model', apiKey: 'test-key' },
  fromYear: 2023, toYear: 2026, ccf: 'AB', conferences: ['icse', 'neurips'],
};

describe('会议筛选输入', () => {
  it('允许空会议选择并兼容旧请求', () => {
    const legacy = { ...request, conferences: undefined };
    expect(searchInputSchema.parse(legacy).conferences).toEqual([]);
    expect(searchInputSchema.parse({ ...request, conferences: [] }).conferences).toEqual([]);
  });
  it('拒绝未知会议，避免任意文本进入会议范围', () => {
    expect(searchInputSchema.safeParse({ ...request, conferences: ['not-a-conference'] }).success).toBe(false);
  });
  it('去除重复会议，不改变其他筛选条件', () => {
    const parsed = searchInputSchema.parse({ ...request, conferences: ['acl', 'acl', 'icml'] });
    expect(parsed.conferences).toEqual(['acl', 'icml']);
    expect(parsed.ccf).toBe('AB');
  });
  it('限制会议数量并拒绝倒置年份', () => {
    expect(searchInputSchema.safeParse({ ...request, conferences: conferences.slice(0, MAX_CONFERENCES + 1).map(x => x.id) }).success).toBe(false);
    expect(searchInputSchema.safeParse({ ...request, fromYear: 2026, toYear: 2023 }).success).toBe(false);
  });
});

describe('会议与等级、年份共同约束检索', () => {
  it('将会议全称、截止日期和条件交集传入提示词', () => {
    const input = searchInputSchema.parse(request);
    const prompt = buildSearchPrompt(input, '2026-11-03');
    expect(prompt).toContain('2026-11-03');
    expect(prompt).toContain('2023 至 2026');
    expect(prompt).toContain('CCF A 或 B');
    expect(prompt).toContain('IEEE/ACM International Conference on Software Engineering');
    expect(prompt).toContain('Conference on Neural Information Processing Systems');
    expect(prompt).toContain('取交集');
    expect(prompt).toContain('返回空数组，不得自行放宽条件');
    expect(prompt).not.toContain('test-key');
  });
  it('说明未选择会议时不限制具体会议', () => {
    const input = searchInputSchema.parse({ ...request, conferences: [] });
    expect(buildSearchPrompt(input, '2026-11-03')).toContain('不限具体会议');
  });
  it('空结果说明可能因交集为空或摘要缺失，并建议减少条件', () => {
    expect(searchResultNotice(true)).toContain('交集可能为空');
    expect(searchResultNotice(true)).toContain('尝试减少条件');
    expect(searchResultNotice(false)).toContain('尚未由程序独立核验');
  });
  it('会议字典无重复编号且全部有官方来源', () => {
    expect(conferenceGroups.length).toBe(10);
    expect(new Set(conferences.map(x => x.id)).size).toBe(conferences.length);
    expect(conferences.every(x => x.url.startsWith('https://'))).toBe(true);
  });
});

