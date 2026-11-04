import { describe, expect, it } from 'vitest';
import { normalizeAnalysis } from '../lib/analysis-normalize';
import papers from '../fixtures/demo_papers.json';
import results from '../fixtures/demo_analysis.json';

const chosen = papers.papers.slice(0, 2);
function sample() {
  return {
    judgments: results.judgments.slice(0, 2).map((j, i) => ({ ...j, paperId: `P${i + 1}` })),
    comparisons: [{ ...results.comparisons[0], aId: 'P1', bId: 'P2' }],
  };
}
describe('模型对照编号兼容', () => {
  it('将短编号映射回论文且保留有效对照', () => {
    const r = normalizeAnalysis(sample(), chosen);
    expect(r.judgments.map(j => j.paperId)).toEqual(chosen.map(p => p.id));
    expect(r.comparisons[0].relation).toBe('potential_conflict');
  });
  it('忽略自身对照和未知编号，对缺失对照明确标记证据不足', () => {
    const value = sample();
    value.comparisons = [{ ...value.comparisons[0], bId: 'P1' }, { ...value.comparisons[0], bId: 'P9' }];
    const r = normalizeAnalysis(value, chosen);
    expect(r.comparisons).toHaveLength(1);
    expect(r.comparisons[0].relation).toBe('insufficient');
    expect(r.comparisons[0].explanation).toContain('未提供');
  });
  it('对重复或反向重复配对不猜测结果，保留单篇分析', () => {
    const value = sample();
    value.comparisons.push({ ...value.comparisons[0], aId: 'P2', bId: 'P1' });
    const r = normalizeAnalysis(value, chosen);
    expect(r.comparisons[0].relation).toBe('insufficient');
    expect(r.judgments[0].claim).toBe(value.judgments[0].claim);
  });
  it('缺失单篇判断时不把其他论文的判断套用过去', () => {
    const value = sample();
    value.judgments[0].paperId = 'P9';
    const r = normalizeAnalysis(value, chosen);
    expect(r.judgments[0].stance).toBe('insufficient');
    expect(r.comparisons[0].relation).toBe('insufficient');
  });
});
