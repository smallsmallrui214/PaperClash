'use client';

import {useState} from 'react';
import Image from 'next/image';
import {ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, CircleHelp, ExternalLink, FileSearch, FlaskConical, GitCompareArrows, Layers3, LoaderCircle, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, X} from 'lucide-react';
import demo from '@/fixtures/real_demo_papers.json';
import demoResults from '@/fixtures/real_demo_analysis.json';
import type {Config} from '@/lib/provider';
import {validateResult, quoteRange, type Paper, type Result} from '@/lib/core';
import {conferences, conferenceGroups} from '@/lib/conferences';
import ConferencePicker from '@/components/ConferencePicker';
import Modal from '@/components/Modal';

const stances = {support: '支持', oppose: '反对', conditional: '条件性', insufficient: '证据不足'};
const relations = {potential_conflict: '潜在冲突', different_conditions: '条件不同', aligned: '观点一致', insufficient: '无法判定'};
const ccfLabels = {any: '不限 CCF 等级', A: 'CCF A 类', AB: 'CCF A / B 类', ABC: 'CCF A / B / C 类'};
const providerLabels = {openai: 'OpenAI', claude: 'Claude', deepseek: 'DeepSeek', glm: 'GLM', kimi: 'Kimi'};
type Ideas = {papers: {paperId: string; innovation: string; limitation: string; quote: string}[]; ideas: {title: string; proposal: string; difficulty: string; overlapRisk: string; verification: string}[]};
type ModalName = 'settings' | 'guide' | 'conferences' | null;

function Evidence({paper, judgment, isDemo, showTitle = false}: {paper: Paper; judgment: Result['judgments'][number]; isDemo: boolean; showTitle?: boolean}) {
  const range = quoteRange(paper.abstract.slice(0, 4000), judgment.evidenceQuote);
  const safeUrl = paper.url && (paper.url.startsWith('https://arxiv.org/abs/') || paper.url.startsWith('https://doi.org/'));
  return <div className="evidence-block">
    {showTitle && <h3 className="evidence-title">{paper.title}</h3>}
    <div className="evidence-quote">{judgment.evidenceQuote ? <q>{judgment.evidenceQuote}</q> : '没有可核验的证据引文'}</div>
    <details><summary>{isDemo ? '展开摘要节选与证据' : '展开摘要与证据'}</summary><p className="abstract-text">{range ? <>{paper.abstract.slice(0, range[0])}<mark>{paper.abstract.slice(range[0], range[1])}</mark>{paper.abstract.slice(range[1])}</> : paper.abstract}</p>
      {paper.abstract.length > 4000 && <p className="scope-note">分析仅使用摘要前 4000 个字符。</p>}
    </details>
    {safeUrl && <a className="source-link" href={paper.url} target="_blank" rel="noopener noreferrer">查看论文来源 <ExternalLink size={13}/></a>}
  </div>;
}

export default function Home() {
  const [config, setConfig] = useState<Config>({provider: 'deepseek', model: '', apiKey: ''});
  const [modal, setModal] = useState<ModalName>(null);
  const [question, setQuestion] = useState('');
  const [fromYear, setFromYear] = useState('');
  const [toYear, setToYear] = useState('');
  const [ccf, setCcf] = useState<keyof typeof ccfLabels>('any');
  const [conferenceIds, setConferenceIds] = useState<string[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [ideas, setIdeas] = useState<Ideas | null>(null);
  const [pairA, setPairA] = useState('');
  const [pairB, setPairB] = useState('');
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const ready = !!config.apiKey.trim() && !!config.model.trim();
  const selectedConferences = conferences.filter(conference => conferenceIds.includes(conference.id));
  const pair = result?.comparisons.find(comparison => (comparison.aId === pairA && comparison.bId === pairB) || (comparison.aId === pairB && comparison.bId === pairA));

  function loadDemo() {
    setQuestion(demo.question); setPapers(demo.papers); setSelected(demo.recommendedSelection);
    setResult(null); setIdeas(null); setError(''); setIsDemo(true); setModal(null);
  }

  function exitDemo() {
    setIsDemo(false); setPapers([]); setSelected([]); setResult(null); setIdeas(null); setQuestion(''); setError('');
  }

  async function search() {
    if (busy) return;
    if (!question.trim()) {setError('先写下一个具体的研究问题。'); return;}
    if (fromYear && toYear && Number(fromYear) > Number(toYear)) {setError('起始年份不能晚于结束年份。'); return;}
    if (!ready) {setModal('settings'); setError('配置模型 API 后，就可以开始联网检索。'); return;}
    setBusy('search'); setError(''); setResult(null); setIdeas(null); setPapers([]); setSelected([]);
    try {
      const response = await fetch('/api/search', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({question, config, fromYear: fromYear ? Number(fromYear) : null, toYear: toYear ? Number(toYear) : null, ccf, conferences: conferenceIds})});
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      setPapers(data.papers); setIsDemo(false);
      if (!data.papers.length) setError('没有找到符合条件且有可核验摘要的论文，请减少筛选条件或调整问题。');
    } catch (cause) {setError(cause instanceof Error ? cause.message : '检索失败，请重试。');}
    finally {setBusy('');}
  }

  async function analyze() {
    if (busy || selected.length < 2 || selected.length > 4 || !question.trim()) return;
    if (!isDemo && !ready) {setModal('settings'); return;}
    setBusy('analyze'); setError(''); setIdeas(null);
    try {
      const chosen = papers.filter(paper => selected.includes(paper.id));
      let data: Result;
      if (isDemo) {
        const ids = new Set(selected);
        data = validateResult({judgments: demoResults.judgments.filter(judgment => ids.has(judgment.paperId)), comparisons: demoResults.comparisons.filter(comparison => ids.has(comparison.aId) && ids.has(comparison.bId))}, chosen);
      } else {
        const response = await fetch('/api/analyze', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({question, papers: chosen, config})});
        data = await response.json();
        if (!response.ok) throw Error((data as unknown as {error: string}).error);
      }
      setResult(data);
      const first = data.judgments[0];
      const different = data.judgments.find(judgment => judgment.stance !== first.stance);
      setPairA(first.paperId); setPairB(different?.paperId || data.judgments[1].paperId); setFilter('all');
    } catch (cause) {setError(cause instanceof Error ? cause.message : '分析失败，请重试。');}
    finally {setBusy('');}
  }

  async function generateIdeas() {
    if (busy || !result) return;
    if (isDemo) {
      setIdeas({papers: [{paperId: 'bert', innovation: '双向预训练后通过微调适应任务。', limitation: '摘要未给出资源成本或跨任务泛化边界。', quote: demoResults.judgments[0].evidenceQuote}, {paperId: 'gpt3', innovation: '通过上下文示例在不更新参数时适应任务。', limitation: '摘要未充分说明各种任务下的失败边界。', quote: demoResults.judgments[1].evidenceQuote}], ideas: [{title: '比较有限资源下的任务适应方式', proposal: '在统一任务和资源预算下比较微调与上下文学习。', difficulty: '中高：需要可复现的任务、模型和资源预算。', overlapRisk: '仅基于两篇论文，无法判断是否已有类似研究。', verification: '检索近期对比研究，并核查数据集和评估指标。'}]});
      return;
    }
    if (!ready) {setModal('settings'); return;}
    setBusy('ideas'); setError('');
    try {
      const response = await fetch('/api/ideas', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({question, papers: papers.filter(paper => selected.includes(paper.id)), analysis: result, config})});
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      setIdeas(data);
    } catch (cause) {setError(cause instanceof Error ? cause.message : '生成失败，请重试。');}
    finally {setBusy('');}
  }

  return <main className="app-shell">
    <header className="site-header">
      <a className="brand" href="#" aria-label="PaperClash 首页"><Image src="/logo.svg" alt="" width={40} height={40}/><div><span className="brand-name">PaperClash</span><span className="brand-subtitle">论文观点对撞机</span></div></a>
      <div className="header-actions"><button className="button ghost" disabled={!!busy} onClick={() => setModal('guide')}><CircleHelp size={17}/>快速上手</button><button className="button secondary" disabled={!!busy} onClick={() => setModal('settings')}><Settings2 size={17}/>模型设置{ready && <span className="status-dot"/>}</button></div>
    </header>

    <section className="hero">
      <div className="hero-copy"><div className="eyebrow"><span className="status-dot"/>计算机文献 · 观点与证据</div><h1>让论文的分歧，<br/><span>成为研究的起点。</span></h1></div>
    </section>

    {isDemo && <div className="mode-banner"><span className="mode-badge"><FlaskConical size={15}/>示例体验</span><span>BERT × GPT-3 · 真实摘要节选</span><button className="text-button" disabled={!!busy} onClick={exitDemo}>退出示例 <ArrowUpRight size={15}/></button></div>}

    <div className="workspace">
      <section className="search-panel panel">
        <div className="panel-heading"><span className="step-label">01 / 定义问题</span><h2>你想探索什么？</h2></div>
        <label className="field-label question-field" htmlFor="question"><span className="sr-only">研究问题</span><textarea id="question" disabled={!!busy || isDemo} value={question} maxLength={500} onChange={event => {setQuestion(event.target.value); setResult(null); setIdeas(null);}} placeholder="例如：在小样本场景下，微调是否比上下文学习更有效？"/></label>
        <div className="question-meta"><span/><span>{question.length} / 500</span></div>
        {!isDemo && (!!fromYear || !!toYear || ccf !== 'any' || !!selectedConferences.length) && <div className="scope-chips" aria-label="当前检索条件">{(fromYear || toYear) && <span className="scope-chip">{fromYear || '不限'}—{toYear || '至今'}</span>}{ccf !== 'any' && <span className="scope-chip">{ccfLabels[ccf]}</span>}{selectedConferences.map(conference => <span className="scope-chip" key={conference.id}>{conference.shortName}<button disabled={!!busy} aria-label={`移除筛选 ${conference.shortName}`} onClick={() => setConferenceIds(conferenceIds.filter(id => id !== conference.id))}><X size={11}/></button></span>)}</div>}
        <div className="search-footer"><button className={`config-status${ready ? ' ready' : ''}`} disabled={!!busy} onClick={() => setModal('settings')}>{ready ? <ShieldCheck size={15}/> : <Settings2 size={15}/>}<span>{ready ? `${providerLabels[config.provider]} · 已配置` : '先配置模型 API'}</span><ArrowUpRight size={13}/></button><button className="button primary" disabled={!!busy || isDemo} onClick={search}>{busy === 'search' ? <LoaderCircle className="spinner" size={17}/> : <FileSearch size={17}/>} {busy === 'search' ? '检索与核验中…' : '开始联网检索'}{busy !== 'search' && <ArrowRight size={16}/>}</button></div>
      </section>
      <aside className="scope-panel panel" aria-label="检索范围">
        <div className="scope-header"><h2><SlidersHorizontal size={17}/>检索范围</h2><button className="text-button" disabled={!!busy || isDemo} onClick={() => {setFromYear(''); setToYear(''); setCcf('any'); setConferenceIds([]);}}>重置</button></div>
        <div className="scope-grid"><label className="field-label">起始年份<input type="number" min="1900" max="2100" value={fromYear} disabled={!!busy || isDemo} onChange={event => setFromYear(event.target.value)} placeholder="不限"/></label><label className="field-label">结束年份<input type="number" min="1900" max="2100" value={toYear} disabled={!!busy || isDemo} onChange={event => setToYear(event.target.value)} placeholder="至今"/></label></div>
        <label className="field-label scope-field">CCF 会议 / 期刊等级<select value={ccf} disabled={!!busy || isDemo} onChange={event => setCcf(event.target.value as keyof typeof ccfLabels)}><option value="any">不限等级</option><option value="A">CCF A 类</option><option value="AB">CCF A / B 类</option><option value="ABC">CCF A / B / C 类</option></select></label>
        <div className="scope-field"><span className="field-label">关注的知名会议 <span className="field-caption">可多选</span></span><button className="conference-trigger" disabled={!!busy || isDemo} onClick={() => setModal('conferences')}><span className="conference-trigger-label"><span>{selectedConferences.length ? `已选择 ${selectedConferences.length} 场会议` : '按研究方向选择会议'}</span><small>{selectedConferences.length ? selectedConferences.map(conference => conference.shortName).join(' · ') : `${conferenceGroups.length} 个方向 · ${conferences.length} 场会议`}</small></span><ChevronDown size={17}/></button></div>
      </aside>
    </div>

    {error && <div className="error-message" role="alert">{error}<button className="icon-button" onClick={() => setError('')} aria-label="关闭错误提示"><X size={16}/></button></div>}
    {busy === 'search' && <section className="loading-panel panel" role="status"><LoaderCircle size={24} className="spinner"/><h2>正在寻找相关论文</h2><p>联网搜索、筛选来源并核验摘要，可能需要一至两分钟。</p><div className="skeleton-line"/><div className="skeleton-line"/></section>}
    {!papers.length && !busy && <section className="empty-state"><div className="empty-icon"><BookOpen size={23}/></div><p>找到论文后，选择 2–4 篇开始观点对撞。</p></section>}

    {!!papers.length && <section className="results-section">
      <div className="section-heading"><div className="section-title"><span className="step-label">02 / 选择文献</span><h2>{isDemo ? '真实论文示例' : '相关论文'} <span>{papers.length} 篇</span></h2></div><div className="selection-count"><Layers3 size={16}/>已选 <strong>{selected.length}</strong> / 4</div></div>
      <div className="paper-grid">{papers.map(paper => <label className={`paper-card${selected.includes(paper.id) ? ' is-selected' : ''}`} key={paper.id}><div className="paper-topline"><span className="paper-meta">{paper.year || '年份未知'}<span>·</span>{isDemo ? '真实示例' : '题录已核验'}</span><span className="paper-select"><input type="checkbox" aria-label={`选择论文 ${paper.title}`} checked={selected.includes(paper.id)} disabled={!!busy || (!selected.includes(paper.id) && selected.length >= 4)} onChange={event => {setSelected(event.target.checked ? [...selected, paper.id] : selected.filter(id => id !== paper.id)); setResult(null); setIdeas(null);}}/></span></div><h3>{paper.title}</h3><div className="paper-source">{paper.source || '来源未提供'}</div><p className="abstract-preview">{paper.abstract}</p></label>)}</div>
      <div className="selection-bar"><div className="selection-hint"><Check size={16}/>{selected.length === 4 ? '已选满 4 篇，可以开始分析' : selected.length >= 2 ? `已选择 ${selected.length} 篇，准备好对照观点` : '再选择论文，至少 2 篇即可分析'}</div><button className="button primary" onClick={analyze} disabled={!!busy || selected.length < 2 || selected.length > 4 || !question.trim()}>{busy === 'analyze' ? <LoaderCircle size={17} className="spinner"/> : <GitCompareArrows size={17}/>} {busy === 'analyze' ? '正在分析观点…' : '开始观点分析'}<ArrowRight size={16}/></button></div>
    </section>}

    {result && <>
      <section className="analysis-section"><div className="section-heading"><div className="section-title"><span className="step-label">03 / 观点矩阵</span><h2>同一个问题，不同的回答</h2><p>{question}</p></div></div>
        <div className="stance-tabs" aria-label="筛选论文立场"><button aria-pressed={filter === 'all'} className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>全部 <span>{result.judgments.length}</span></button>{Object.entries(stances).map(([key, label]) => <button aria-pressed={filter === key} className={filter === key ? 'is-active' : ''} key={key} onClick={() => setFilter(key)}>{label} <span>{result.judgments.filter(judgment => judgment.stance === key).length}</span></button>)}</div>
        <div className="judgment-grid">{result.judgments.filter(judgment => filter === 'all' || judgment.stance === filter).map(judgment => {const paper = papers.find(value => value.id === judgment.paperId)!; return <article className="judgment-card panel" key={judgment.paperId}><span className={`stance-badge ${judgment.stance}`}>{stances[judgment.stance]}</span><h3>{paper.title}</h3><p className="claim">{judgment.claim}</p><Evidence paper={paper} judgment={judgment} isDemo={isDemo}/><p className="caveat">{judgment.caveat}</p></article>;})}</div>
        {!result.judgments.some(judgment => filter === 'all' || judgment.stance === filter) && <div className="info-message">当前没有这一立场的论文。</div>}
      </section>
      <section className="compare-panel panel"><div className="panel-heading"><span className="step-label">04 / 观点对撞</span><h2><GitCompareArrows size={24}/>两篇论文的对照</h2></div><div className="compare-selectors">{[pairA, pairB].map((value, index) => <label className="field-label" key={index}>{index ? '对照论文 B' : '对照论文 A'}<select value={value} onChange={event => index ? setPairB(event.target.value) : setPairA(event.target.value)}>{result.judgments.map(judgment => <option key={judgment.paperId} value={judgment.paperId} disabled={judgment.paperId === (index ? pairA : pairB)}>{papers.find(paper => paper.id === judgment.paperId)?.title}</option>)}</select></label>)}</div>
        {pair && <><div className="comparison-result"><span className={`relation-badge ${pair.relation}`}>{relations[pair.relation]}</span><p>{pair.explanation}</p><dl className="comparison-details"><div><dt>关键差异</dt><dd>{pair.difference}</dd></div><div><dt>下一步核查</dt><dd>{pair.verifyNext}</dd></div></dl></div><div className="evidence-grid">{[pairA, pairB].map(id => <Evidence key={id} paper={papers.find(paper => paper.id === id)!} judgment={result.judgments.find(judgment => judgment.paperId === id)!} isDemo={isDemo} showTitle/>)}</div></>}
      </section>
      <section className="ideas-panel panel"><div className="ideas-heading"><div className="panel-heading"><span className="step-label">05 / 研究启发</span><h2><Sparkles size={22}/>值得探索的下一步</h2></div><button className="button secondary" disabled={!!busy} onClick={generateIdeas}>{busy === 'ideas' ? <LoaderCircle size={16} className="spinner"/> : <Sparkles size={16}/>} {busy === 'ideas' ? '正在整理…' : ideas ? '重新生成启发' : '生成研究启发'}</button></div>
        {ideas && <><div className="idea-papers">{ideas.papers.map(paper => <article className="idea-paper" key={paper.paperId}><h3>{papers.find(value => value.id === paper.paperId)?.title}</h3><p><b>创新点</b>{paper.innovation}</p><p><b>局限</b>{paper.limitation}</p><div className="evidence-quote">{paper.quote || '证据不足'}</div></article>)}</div><div className="ideas-list">{ideas.ideas.map((idea, index) => <article className="idea-card" key={index}><span className="idea-index">方向 {String(index + 1).padStart(2, '0')}</span><h3>{idea.title}</h3><p>{idea.proposal}</p><dl><div><dt>实现难度</dt><dd>{idea.difficulty}</dd></div><div><dt>撞车风险</dt><dd>{idea.overlapRisk}</dd></div><div><dt>进一步验证</dt><dd>{idea.verification}</dd></div></dl></article>)}</div></>}
        <p className="scope-note">选题、难度与撞车风险仅供参考，需进一步验证。</p>
      </section>
    </>}

    <footer className="site-footer"><span>PaperClash</span><p>摘要级辅助判断；会议与等级请核查。</p><a href="https://www.ccf.org.cn/Academic_Evaluation/By_category/" target="_blank" rel="noopener noreferrer">CCF 官方目录 <ArrowUpRight size={13}/></a></footer>

    {modal === 'conferences' && <ConferencePicker selected={conferenceIds} onChange={setConferenceIds} onClose={() => setModal(null)}/>}
    {modal === 'settings' && <Modal title="连接你的模型" description="选择提供商，使用账号可调用的模型名称与 API Key。" onClose={() => setModal(null)}><div className="modal-body field-stack"><label className="field-label">模型提供商<select value={config.provider} onChange={event => setConfig({provider: event.target.value as Config['provider'], model: '', apiKey: ''})}><option value="openai">OpenAI</option><option value="claude">Claude / Anthropic</option><option value="deepseek">DeepSeek</option><option value="glm">GLM / 智谱</option><option value="kimi">Kimi / Moonshot</option></select></label><p className="provider-hint">{config.provider === 'deepseek' ? '联网检索请使用 deepseek-v4-pro。' : config.provider === 'glm' || config.provider === 'kimi' ? '该提供商目前可用于观点分析，尚未接入联网检索。' : '请选择支持联网搜索的模型，并确认账号已开通相应权限。'}</p><label className="field-label">模型名称<input value={config.model} onChange={event => setConfig({...config, model: event.target.value})} placeholder="填写账号可调用的模型 ID"/></label><label className="field-label">API Key<input type="password" autoComplete="off" value={config.apiKey} onChange={event => setConfig({...config, apiKey: event.target.value})} placeholder="填写对应厂商的 API Key"/></label><div className="settings-note"><ShieldCheck size={18}/><p>密钥只保存在当前页面内存，刷新后清除；调用时经本应用服务器转发给所选厂商。问题与摘要会发送给厂商，联网和分析可能产生费用。</p></div></div><div className="modal-footer"><button className="button ghost" onClick={() => setConfig({...config, apiKey: ''})}>清除密钥</button><button className="button primary" onClick={() => setModal(null)}>完成设置 <Check size={16}/></button></div></Modal>}
    {modal === 'guide' && <Modal title="从一个问题，开始探索" description="四步了解 PaperClash。你也可以直接体验真实论文示例。" onClose={() => setModal(null)}><div className="modal-body"><div className="guide-steps">{[{title: '连接模型', text: '在模型设置中填写提供商、模型名称和密钥，确认模型支持联网搜索。'}, {title: '圈定研究范围', text: '输入中文研究问题，选择年份、CCF 等级和关注的会议。多个筛选条件取交集。'}, {title: '对照论文证据', text: '选择 2–4 篇论文，查看立场、条件差异和摘要中的证据。'}, {title: '探索下一步', text: '汇总创新与局限，生成仍需进一步检索和实验验证的研究思路。'}].map((step, index) => <article key={step.title}><span className="guide-number">{index + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></article>)}</div><p className="scope-note">示例使用 BERT 与 GPT-3 的真实摘要节选，无需 API 配置。会议归属及 CCF 等级为模型筛选条件，仍需自行核查。</p></div><div className="modal-footer"><span>不配置密钥也能先试用</span><button className="button primary" onClick={loadDemo}>体验真实论文示例 <ArrowRight size={16}/></button></div></Modal>}
  </main>;
}
