import { z } from 'zod';
import { searchWithWeb } from '@/lib/web-search';
import { buildSearchPrompt, searchInputSchema, searchResultNotice } from '@/lib/search';

const candidates = z.object({ papers: z.array(z.object({ doi: z.string().max(200) })).max(12) });

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    if (raw.length > 5000) return Response.json({ error: '请求过长。' }, { status: 413 });
    let request: unknown;
    try { request = JSON.parse(raw); }
    catch { return Response.json({ error: '请求格式无效。' }, { status: 400 }); }
    const input = searchInputSchema.safeParse(request);
    if (!input.success) {
      return Response.json({ error: input.error.issues.map(issue => issue.message).join(' ') }, { status: 400 });
    }
    const { config, ...scope } = input.data;
    const { fromYear, toYear } = scope;
    const today = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    const result = candidates.parse(await searchWithWeb(
      config,
      '使用联网搜索来检索计算机科学论文，并以指定 JSON 结构输出结果。',
      buildSearchPrompt(scope, today),
    ));
    const seen = new Set<string>();
    const resolved = await Promise.all(result.papers.map(async candidate => {
      const doi = candidate.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').trim();
      if (!/^10\.\d{4,9}\/\S+$/i.test(doi) || seen.has(doi.toLowerCase())) return null;
      seen.add(doi.toLowerCase());
      try {
        const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
          signal: AbortSignal.timeout(12000),
        });
        if (!response.ok) return null;
        const work = (await response.json()).message;
        const abstract = typeof work.abstract === 'string'
          ? work.abstract.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
        const year = work.published?.['date-parts']?.[0]?.[0] || null;
        if (!abstract || ((fromYear || toYear) && (!year || (fromYear && year < fromYear) || (toYear && year > toYear)))) return null;
        return {
          id: doi, title: work.title?.[0] || '未提供标题', year,
          source: work['container-title']?.[0] || 'Crossref', url: `https://doi.org/${doi}`, abstract,
        };
      } catch { return null; }
    }));
    const papers = resolved.filter(Boolean);
    return Response.json({ papers, notice: searchResultNotice(papers.length === 0) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : '检索失败，请重试。' }, { status: 502 });
  }
}
