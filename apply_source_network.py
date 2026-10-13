#!/usr/bin/env python3
"""Replace common-label frequency analytics with a source co-coverage network."""
from pathlib import Path
import re

js = Path('public/graph-explorer.js')
html = Path('public/graph.html')
s = js.read_text(encoding='utf-8')
h = html.read_text(encoding='utf-8')
start = s.find('// Source coverage is based on the active definition')
end = s.find('function renderAnalytics(){renderGraphAnalytics();renderSourceTermAnalytics()}', start)
if start < 0 or end < 0:
    raise SystemExit('Expected source analytics block not found. Check main branch before applying.')
replacement = r'''// Source network is a weighted one-mode projection of the concept-to-source evidence graph.
// A shared concept yields exactly one link contribution between each distinct source pair.
function sourceCoverageData(){
  const byId=new Map(provenanceGraph.filter(x=>x&&x['@id']).map(x=>[x['@id'],x]));
  const sources=new Map();let evidenceRecords=0;
  for(const concept of nodes){
    const def=byId.get(rid(concept['gs:activeDefinition']));if(!def)continue;
    for(const ev of refs(def['gs:evidence'])){
      const id=rid(ev&&ev['dcterms:source']);if(!id)continue;
      const source=byId.get(id);
      if(!sources.has(id))sources.set(id,{id,name:source?.['dcterms:title']||ev['gs:sourceLabel']||id,concepts:new Set(),records:0,direct:0,supporting:0});
      const item=sources.get(id);item.concepts.add(concept['@id']);item.records++;evidenceRecords++;
      if(ev['gs:evidenceRelation']==='direct')item.direct++;
      if(ev['gs:evidenceRelation']==='supporting')item.supporting++;
    }
  }
  const ordered=[...sources.values()].sort((a,b)=>b.concepts.size-a.concepts.size||a.name.localeCompare(b.name));
  const edges=[];
  for(let i=0;i<ordered.length;i++)for(let j=i+1;j<ordered.length;j++){
    const a=ordered[i],b=ordered[j],shared=[...a.concepts].filter(id=>b.concepts.has(id));
    if(shared.length)edges.push({a,b,shared,count:shared.length});
  }
  return {ordered,edges,evidenceRecords};
}
function renderSourceAnalytics(){
  const out=$('analytics-result');const {ordered,edges,evidenceRecords}=sourceCoverageData();
  const section=(title,description)=>{const el=document.createElement('section');el.className='result-card';const hd=document.createElement('h3');hd.textContent=title;hd.style.margin='0 0 5px';const p=document.createElement('p');p.className='muted-note';p.textContent=description;el.append(hd,p);out.append(el);return el};
  const showConcepts=(holder,ids)=>{
    holder.replaceChildren();const list=document.createElement('div');list.className='source-term-concepts';
    for(const id of [...ids].sort((a,b)=>tagName(a).localeCompare(tagName(b))))if(map.has(id))list.append(nodeButton(id));
    holder.append(list);
  };
  const networkSection=section('Source co-coverage network',`${ordered.length} sources · ${edges.length} shared-concept connections. Node area represents the number of distinct concepts supported by each source. Edge width represents the number of concepts both sources support. This indicates overlap within the glossary, not citations between sources or independent scholarly influence.`);
  if(ordered.length){
    const area=document.createElement('div');area.className='source-network-area';
    const svg=document.createElementNS(SVG_NS,'svg');svg.setAttribute('viewBox','0 0 900 560');svg.setAttribute('role','group');svg.setAttribute('aria-label','Interactive source overlap network; choose a source or connection to inspect associated concepts');
    const info=document.createElement('div');info.className='source-network-inspect';info.textContent='Click a source node to inspect its concepts, or a connecting line to inspect the shared concepts. Drag nodes to arrange the network.';
    area.append(svg,info);networkSection.append(area);
    const maxCoverage=Math.max(1,...ordered.map(x=>x.concepts.size));
    const maxShared=Math.max(1,...edges.map(x=>x.count));
    const points=new Map();const n=ordered.length;
    ordered.forEach((s,i)=>{const a=(i/n)*Math.PI*2-Math.PI/2;points.set(s.id,{x:450+Math.cos(a)*205,y:265+Math.sin(a)*205,r:13+Math.sqrt(s.concepts.size/maxCoverage)*33,vx:0,vy:0})});
    // Deterministic, bounded spring relaxation to separate labels and related source groups.
    for(let tick=0;tick<200;tick++){
      for(const item of points.values()){item.vx+=(450-item.x)*.0008;item.vy+=(265-item.y)*.0008}
      for(let i=0;i<ordered.length;i++)for(let j=i+1;j<ordered.length;j++){
        const p=points.get(ordered[i].id),q=points.get(ordered[j].id),dx=q.x-p.x,dy=q.y-p.y,d=Math.max(1,Math.hypot(dx,dy));
        const min=p.r+q.r+39,force=d<min?-(min-d)*.012:-90/(d*d);
        const fx=dx/d*force,fy=dy/d*force;p.vx+=fx;p.vy+=fy;q.vx-=fx;q.vy-=fy;
      }
      for(const e of edges){const p=points.get(e.a.id),q=points.get(e.b.id),dx=q.x-p.x,dy=q.y-p.y,d=Math.max(1,Math.hypot(dx,dy)),target=165;const f=(d-target)*(.0008+.0012*e.count/maxShared);p.vx+=dx/d*f;p.vy+=dy/d*f;q.vx-=dx/d*f;q.vy-=dy/d*f}
      for(const p of points.values()){p.vx*=.84;p.vy*=.84;p.x=Math.max(p.r+18,Math.min(900-p.r-18,p.x+p.vx));p.y=Math.max(p.r+22,Math.min(560-p.r-45,p.y+p.vy))}
    }
    function inspect(title,description,ids){info.replaceChildren();const h=document.createElement('strong');h.textContent=title;const p=document.createElement('p');p.textContent=description;info.append(h,p);showConcepts(info,ids)}
    const paths=[];
    for(const e of edges.sort((a,b)=>a.count-b.count)){
      const line=document.createElementNS(SVG_NS,'line');line.classList.add('source-network-edge');line.setAttribute('stroke-width',String(1.1+7*Math.sqrt(e.count/maxShared)));line.setAttribute('tabindex','0');line.setAttribute('role','button');line.setAttribute('aria-label',`${e.a.name} and ${e.b.name}: ${e.count} shared concepts`);
      const title=document.createElementNS(SVG_NS,'title');title.textContent=`${e.a.name} / ${e.b.name}: ${e.count} shared concepts`;line.append(title);
      const activate=()=>inspect(`${e.a.name} + ${e.b.name}`,`${e.count} distinct concept${e.count===1?'':'s'} supported by both sources.`,e.shared);
      line.addEventListener('click',activate);line.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();activate()}});svg.append(line);paths.push({line,e});
    }
    const markers=[];
    const redraw=()=>{for(const {line,e} of paths){const p=points.get(e.a.id),q=points.get(e.b.id);line.setAttribute('x1',p.x);line.setAttribute('y1',p.y);line.setAttribute('x2',q.x);line.setAttribute('y2',q.y)}for(const {g,s} of markers){const p=points.get(s.id);g.setAttribute('transform',`translate(${p.x} ${p.y})`)}};
    for(const s of ordered){
      const p=points.get(s.id),g=document.createElementNS(SVG_NS,'g');g.classList.add('source-network-node');g.setAttribute('tabindex','0');g.setAttribute('role','button');g.setAttribute('aria-label',`${s.name}, ${s.concepts.size} concepts`);
      const circle=document.createElementNS(SVG_NS,'circle');circle.setAttribute('r',p.r);g.append(circle);
      const short=s.name.length>29?s.name.slice(0,26)+'…':s.name;
      const txt=document.createElementNS(SVG_NS,'text');txt.textContent=short;txt.setAttribute('y',p.r+15);txt.setAttribute('text-anchor','middle');g.append(txt);
      const num=document.createElementNS(SVG_NS,'text');num.textContent=String(s.concepts.size);num.classList.add('source-network-number');num.setAttribute('text-anchor','middle');num.setAttribute('dy','5');g.append(num);
      const tip=document.createElementNS(SVG_NS,'title');tip.textContent=`${s.name}: ${s.concepts.size} concepts, ${s.records} evidence records`;g.append(tip);
      let drag=null,suppress=false;
      const coordinate=ev=>{const pt=svg.createSVGPoint();pt.x=ev.clientX;pt.y=ev.clientY;const m=svg.getScreenCTM();return m?pt.matrixTransform(m.inverse()):pt};
      g.addEventListener('pointerdown',ev=>{if(ev.button!==0)return;const xy=coordinate(ev);drag={id:ev.pointerId,x:xy.x,y:xy.y,ox:p.x,oy:p.y,moved:false};suppress=false;g.setPointerCapture(ev.pointerId)});
      g.addEventListener('pointermove',ev=>{if(!drag||drag.id!==ev.pointerId)return;const xy=coordinate(ev),dx=xy.x-drag.x,dy=xy.y-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<5)return;drag.moved=true;p.x=Math.max(p.r+18,Math.min(900-p.r-18,drag.ox+dx));p.y=Math.max(p.r+22,Math.min(560-p.r-45,drag.oy+dy));redraw()});
      const end=ev=>{if(drag&&drag.id===ev.pointerId){suppress=drag.moved;drag=null;if(g.hasPointerCapture(ev.pointerId))g.releasePointerCapture(ev.pointerId)}};
      g.addEventListener('pointerup',end);g.addEventListener('pointercancel',end);
      const activate=()=>inspect(s.name,`${s.concepts.size} distinct concepts · ${s.records} evidence records (${s.direct} direct, ${s.supporting} supporting).`,s.concepts);
      g.addEventListener('click',ev=>{if(suppress){suppress=false;ev.preventDefault();return}activate()});g.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();activate()}});
      svg.append(g);markers.push({g,s});
    }
    redraw();
  }
  const sourceSection=section('Source coverage',`${ordered.length} cited sources · ${evidenceRecords} evidence records. Each concept is counted once per source; direct and supporting evidence records are shown separately.`);
  const rows=document.createElement('div');rows.className='source-term-rows';
  for(const s of ordered){const detail=document.createElement('details');const summary=document.createElement('summary');const name=document.createElement('strong');name.textContent=s.name;const count=document.createElement('span');count.className='small';count.textContent=`${s.concepts.size} concepts · ${s.records} records (${s.direct} direct, ${s.supporting} supporting)`;summary.append(name,count);const inside=document.createElement('div');inside.className='source-term-concepts';detail.addEventListener('toggle',()=>{if(detail.open&&!inside.childNodes.length)showConcepts(inside,s.concepts)});detail.append(summary,inside);rows.append(detail)}
  sourceSection.append(rows);
}
'''
s=s[:start]+replacement+s[end:]
s=s.replace('function renderAnalytics(){renderGraphAnalytics();renderSourceTermAnalytics()}', 'function renderAnalytics(){renderGraphAnalytics();renderSourceAnalytics()}')
if 'renderSourceTermAnalytics' in s or 'Common terms in concept names' in s:
    raise SystemExit('Old common-term analytics unexpectedly remain')
css='''.source-network-area{display:grid;gap:14px}.source-network-area svg{display:block;width:100%;height:auto;max-height:600px;background:#faf7fb;border:1px solid var(--line);border-radius:8px}.source-network-edge{stroke:#9166a0;stroke-opacity:.38;cursor:pointer}.source-network-edge:hover,.source-network-edge:focus{stroke:#ef8b17;stroke-opacity:.92;outline:none}.source-network-node{cursor:grab;touch-action:none;user-select:none}.source-network-node:active{cursor:grabbing}.source-network-node circle{fill:#ede2f0;stroke:#724886;stroke-width:2}.source-network-node:hover circle,.source-network-node:focus circle{fill:#ffe9c7;stroke:#da7a14}.source-network-node text{font:12px Lato,Arial,sans-serif;fill:#33163c;pointer-events:none}.source-network-node .source-network-number{font-size:16px;font-weight:900}.source-network-inspect{border:1px solid var(--line);background:#fff;padding:14px;border-radius:8px;min-height:65px}.source-network-inspect p{font-size:13px;margin:6px 0}.source-network-inspect .source-term-concepts{display:flex;flex-wrap:wrap;gap:6px;max-height:210px;overflow:auto}.source-network-inspect .source-term-concepts button{border:1px solid #d4c4dc;background:#fff;border-radius:5px;padding:5px 8px;color:#3b174b;cursor:pointer}.source-network-inspect .source-term-concepts button:hover{border-color:#ef8b17}'''
if '.source-network-area{' not in h:
    if '</style>' not in h:raise SystemExit('Could not locate graph styles')
    h=h.replace('</style>',css+'</style>',1)
js.write_text(s,encoding='utf-8');html.write_text(h,encoding='utf-8')
print('Updated public/graph-explorer.js and public/graph.html; removed common-term analytics.')
