// SPDX-License-Identifier: Apache-2.0
// Aggregate-only Explorer Activity counters. No visitor IDs, IPs, cookies or search text.
const PREFIX = 'i2idl:activity:v1';
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const url = () => (process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
const token = () => process.env.UPSTASH_REDIS_REST_TOKEN || '';
export const activityConfigured = () => /^https:\/\//.test(url()) && !!token();
export const todayUTC = () => new Date().toISOString().slice(0,10);
function dayKey(day) { if (!DAY.test(day)) throw Error('Invalid date'); return `${PREFIX}:day:${day}`; }
function conceptKey(day) { if (!DAY.test(day)) throw Error('Invalid date'); return `${PREFIX}:concepts:${day}`; }
async function pipeline(commands) {
  if (!activityConfigured()) throw Error('Activity storage unavailable');
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 3500);
  try {
    const response = await fetch(url() + '/pipeline', {
      method:'POST', headers:{'Authorization':'Bearer '+token(),'Content-Type':'application/json'},
      body:JSON.stringify(commands), signal:ctl.signal
    });
    if (!response.ok) throw Error('Activity storage response '+response.status);
    const result = await response.json();
    if (!Array.isArray(result) || result.some(x => x.error)) throw Error('Activity storage command failed');
    return result.map(x=>x.result);
  } finally { clearTimeout(timer); }
}
export async function recordEvent(type, concept = '') {
  if (!['page_view','concept_selected'].includes(type)) throw Error('Invalid event');
  if (type === 'concept_selected' && (!ID.test(concept) || concept.length > 150)) throw Error('Invalid concept');
  const day = todayUTC(), key = dayKey(day);
  const cmds = [['HINCRBY',key,type,1],['EXPIRE',key,7776000]];
  if (type === 'concept_selected') cmds.push(['ZINCRBY',conceptKey(day),1,concept],['EXPIRE',conceptKey(day),7776000]);
  await pipeline(cmds);
}
export async function recordResearch(papers) {
  const n = Number(papers);
  if (!Number.isInteger(n) || n < 0 || n > 15) throw Error('Invalid paper count');
  const key = dayKey(todayUTC());
  await pipeline([['HINCRBY',key,'research_searches',1],['HINCRBY',key,'papers_returned',n],['EXPIRE',key,7776000]]);
}
export async function getActivity(days=30) {
  if (days !== 30) throw Error('Unsupported reporting period');
  const dates = Array.from({length:days},(_,i)=>new Date(Date.now()-(days-1-i)*86400000).toISOString().slice(0,10));
  const cmds = dates.flatMap(day=>[['HGETALL',dayKey(day)],['ZREVRANGE',conceptKey(day),0,29,'WITHSCORES']]);
  const results = await pipeline(cmds);
  const totals = {pageviews:0,nodesExplored:0,researchSearches:0,papersDiscovered:0};
  const conceptCounts = new Map();
  const trend = dates.map((day,i)=>{
    const raw=results[i*2];const obj={};
    // Upstash HGETALL returns a flat array for Redis protocol.
    if(Array.isArray(raw))for(let j=0;j<raw.length;j+=2)obj[raw[j]]=raw[j+1];
    else if(raw && typeof raw==='object')Object.assign(obj,raw);
    const item={day,pageviews:Number(obj.page_view)||0,nodesExplored:Number(obj.concept_selected)||0,researchSearches:Number(obj.research_searches)||0,papersDiscovered:Number(obj.papers_returned)||0};
    for(const key of Object.keys(totals))totals[key]+=item[key];
    const pairs=results[i*2+1]||[];
    for(let j=0;j<pairs.length;j+=2){const id=pairs[j];if(ID.test(id))conceptCounts.set(id,(conceptCounts.get(id)||0)+(Number(pairs[j+1])||0));}
    return item;
  });
  const popularConcepts=[...conceptCounts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,15).map(([id,count])=>({id,count}));
  return {periodDays:days,timezone:'UTC',totals,trend,popularConcepts,definitions:{pageviews:'Explorer page loads, not unique visitors',nodesExplored:'Concept selections, including initial selection',researchSearches:'Successful OpenAlex research queries',papersDiscovered:'Returned publication results across searches, not unique papers'}};
}
