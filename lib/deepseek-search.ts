import type {Config} from './provider';
export async function deepseekSearch(config:Config, question:string):Promise<string>{
 try{
  const r=await fetch('https://api.deepseek.com/v1/tools/search',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+config.apiKey},body:JSON.stringify({query:question.slice(0,128),count:5,need_content:false}),signal:AbortSignal.timeout(20000),redirect:'error'});
  if(!r.ok)throw Error('网页搜索返回 '+r.status+'，请检查余额或网络后重试。');
  const data=await r.json();
  const results=(Array.isArray(data.results)?data.results:[]).slice(0,5).map((x:{title?:string;url?:string;snippet?:string})=>({title:String(x.title||'').slice(0,180),url:String(x.url||'').slice(0,300),snippet:String(x.snippet||'').slice(0,200)}));
  return JSON.stringify({results});
 }catch(e){if(e instanceof Error&&(e.name==='TimeoutError'||e.name==='AbortError'))throw Error('网页搜索超时，已完成的服务调用可能产生费用，请检查账单后重试。');throw e}
}
