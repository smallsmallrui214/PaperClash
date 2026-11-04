import { resultSchema, validateResult, type Paper, type Result } from './core';

/** Map short model-facing IDs back to papers without guessing ambiguous matches. */
export function normalizeAnalysis(input: unknown, papers: Paper[]): Result {
  const raw = resultSchema.parse(input);
  const idMap = new Map(papers.map((paper, i) => [`P${i + 1}`, paper.id]));
  const judgments = new Map<string, Result['judgments'][number] | null>();
  for (const item of raw.judgments) {
    const id = idMap.get(item.paperId);
    if (!id) continue;
    judgments.set(id, judgments.has(id) ? null : { ...item, paperId: id });
  }
  const comparisons = new Map<string, Result['comparisons'][number] | null>();
  const key = (a: string, b: string) => JSON.stringify([a, b].sort());
  for (const item of raw.comparisons) {
    const a = idMap.get(item.aId), b = idMap.get(item.bId);
    if (!a || !b || a === b) continue;
    const pair = key(a, b);
    comparisons.set(pair, comparisons.has(pair) ? null : { ...item, aId: a, bId: b });
  }
  const normalized: Result = {
    judgments: papers.map(paper => judgments.get(paper.id) || {
      paperId: paper.id, stance: 'insufficient', claim: '证据不足', evidenceQuote: '',
      caveat: '模型未提供可匹配的论文分析，请查阅论文原文。',
    }),
    comparisons: [],
  };
  for (let i = 0; i < papers.length; i++) for (let j = i + 1; j < papers.length; j++) {
    const a = papers[i].id, b = papers[j].id;
    normalized.comparisons.push(comparisons.get(key(a, b)) || {
      aId: a, bId: b, relation: 'insufficient', explanation: '模型未提供可匹配的论文对照。',
      difference: '证据不足', verifyNext: '查阅两篇论文原文。',
    });
  }
  return validateResult(normalized, papers);
}
