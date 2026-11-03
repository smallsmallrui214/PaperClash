'use client';

import {useState} from 'react';
import {Search, X, Check} from 'lucide-react';
import {conferenceGroups, conferences, MAX_CONFERENCES} from '@/lib/conferences';
import Modal from './Modal';

export default function ConferencePicker({selected, onChange, onClose}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const normalized = query.trim().toLowerCase();
  const visible = conferenceGroups.filter(group => category === 'all' || group.id === category)
    .flatMap(group => group.conferences.map(conference => ({...conference, area: group.label})))
    .filter(conference => `${conference.shortName} ${conference.fullName} ${conference.area}`.toLowerCase().includes(normalized));

  return (
    <Modal title="选择会议" onClose={onClose} wide>
      <div className="modal-body">
        <div className="conference-toolbar"><Search size={18}/><input aria-label="搜索会议" placeholder="搜索简称、英文全称或研究方向" value={query} onChange={event => setQuery(event.target.value)}/></div>
        <div className="conference-categories" aria-label="会议研究方向">
          <button type="button" aria-pressed={category === 'all'} className={category === 'all' ? 'is-active' : ''} onClick={() => setCategory('all')}>全部领域</button>
          {conferenceGroups.map(group => <button type="button" key={group.id} aria-pressed={category === group.id} className={category === group.id ? 'is-active' : ''} onClick={() => setCategory(group.id)}>{group.label}</button>)}
        </div>
        <div className="conference-selection-summary"><span>已选 {selected.length} / {MAX_CONFERENCES} 场会议</span><button type="button" className="conference-reset" disabled={!selected.length} onClick={() => onChange([])}>清空选择</button></div>
        {!!selected.length && <div className="selected-conferences">{selected.map(id => <span className="selected-conference" key={id}>{conferences.find(conference => conference.id === id)?.shortName}<button type="button" aria-label={`移除 ${conferences.find(conference => conference.id === id)?.shortName}`} onClick={() => onChange(selected.filter(value => value !== id))}><X size={12}/></button></span>)}</div>}
        <div className="conference-list">
          {visible.map(conference => <label className="conference-option" key={conference.id}>
            <span className="conference-check"><input type="checkbox" checked={selected.includes(conference.id)} disabled={!selected.includes(conference.id) && selected.length >= MAX_CONFERENCES} onChange={event => onChange(event.target.checked ? [...selected, conference.id] : selected.filter(id => id !== conference.id))}/></span>
            <span className="conference-name"><strong>{conference.shortName}</strong><small>{conference.fullName}</small></span><span className="conference-area">{conference.area}</span>
          </label>)}
          {!visible.length && <p className="no-conferences">没有匹配的会议，试试简称或其他研究方向。</p>}
        </div>
        <p className="scope-note">多选会议取并集，与年份、CCF 条件取交集。</p>
      </div>
      <div className="modal-footer"><span>{selected.length ? `已选择 ${selected.length} 场会议` : '不限会议来源'}</span><button type="button" className="button primary" onClick={onClose}><Check size={16}/>完成选择</button></div>
    </Modal>
  );
}
