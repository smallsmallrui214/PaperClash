import { z } from 'zod';
import type { Paper } from './core';

const candidateSchema=z.object({title:z.string().trim().min(1).max(500),url:z.string().max(2000).optional(),doi:z.string().max(200).optional(),year:z.number().int().min(1800).max(2100).nullable().optional(),source:z.string().max(300).nullable().optional(),abstract:z.string().max(6000).nullable().optional()});
export const recommendationsSchema=z.object({papers:z.array(candidateSchema).max(4)});
export function safePaperUrl(raw:string):string|null {try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.hostname==='localhost'||u.hostname.endsWith('.localhost')||/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)||u.hostname.includes(':'))return null;return u.href}catch{return null}}
export function normalizeRecommendations(value:unknown,fromYear:number|null,toYear:number|null):{papers:Paper[]}{
 const input=recommendationsSchema.parse(value),papers:Paper[]=[],seen=new Set<string>();
 for(const candidate of input.papers){const doi=candidate.doi?.replace(/^https?:\/\/(dx\.)?doi\.org\//i,'').trim()||'';const url=safePaperUrl(candidate.url||'')||(/^10\.\d{4,9}\/\S+$/i.test(doi)?safePaperUrl('https://doi.org/'+doi):null);if(!url||seen.has(url.toLowerCase()))continue;seen.add(url.toLowerCase());const year=candidate.year??null;if(year&&((fromYear&&year<fromYear)||(toYear&&year>toYear)))continue;const abstract=candidate.abstract?.trim()||'模型未提供论文内容概要。';papers.push({id:url,title:candidate.title,year,source:candidate.source||'来源未提供',url,abstract,abstractSource:'模型提供'});}
 return {papers};
}
