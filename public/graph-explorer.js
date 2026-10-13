(()=>{'use strict';const $=id=>document.getElementById(id),SVG_NS='http://www.w3.org/2000/svg';let provenanceGraph=[],nodes=[],map=new Map(),active=null,history=[],fields=new Map(),fieldFor=new Map();const refs=x=>x==null?[]:Array.isArray(x)?x:[x];const rid=x=>typeof x==='string'?x:x&&x['@id'];const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const label=n=>n['skos:prefLabel']||n['dcterms:identifier']||n['@id'].split('/').pop();const slug=n=>n['@id'].split('/').pop();function onGraph(data){if(!data||!Array.isArray(data['@graph']))throw Error('Not a JSON-LD graph');const graph=data['@graph'];provenanceGraph=graph;nodes=graph.filter(n=>refs(n['@type']).includes('skos:Concept'));map=new Map(nodes.map(n=>[n['@id'],n]));fields=new Map(graph.filter(n=>refs(n['@type']).includes('skos:Collection')&&n['gs:facet']==='field').map(n=>[n['@id'],n['skos:prefLabel']]));fieldFor=new Map(nodes.map(n=>[n['@id'],rid(n['gs:fieldCollection'])||'other']));const select=$('collection');select.replaceChildren(new Option('All fields','all'));for(const [id,name] of [...fields].sort((a,b)=>a[1].localeCompare(b[1])))select.add(new Option(name,id));select.add(new Option('Other / Unclassified','other'));$('depth').disabled=false;select.disabled=false;populateResearch();if(nodes.length<10)throw Error('Too few concepts');$('status').textContent=`Loaded ${nodes.length} I2IDL concepts from ${'published JSON-LD'}. Select any connected node to navigate.`;$('search').disabled=false;$('reset').disabled=false;$('share').disabled=false;const requested=new URLSearchParams(location.search).get('concept');const target=nodes.find(n=>slug(n)===requested)||nodes.find(n=>slug(n)==='competency')||nodes[0];focus(target,false)}
function neighborItems(n){const output=new Map();for(const [prop,type] of [['skos:broader','broader'],['skos:narrower','narrower'],['skos:related','related']]){for(const r of refs(n[prop])){let id=rid(r);if(!map.has(id)||id===n['@id'])continue;const key=id+'|'+type;output.set(key,{node:map.get(id),type})}}return [...output.values()].sort((a,b)=>label(a.node).localeCompare(label(b.node)))}
function focus(n,push=true){if(!n)return;if(active&&push&&active['@id']!==n['@id'])history.push(active);active=n;$('back').disabled=history.length===0;$('title').textContent=label(n);const links=neighborItems(n);try{const url=new URL(location.href);url.searchParams.set('concept',slug(n));window.history.replaceState(null,'',url)}catch(_){}draw(n,links);details(n,links);$('results').style.display='none'}
function fieldId(n){return fieldFor.get(n['@id'])||'other'}
function hue(field){let hash=0;for(let i=0;i<field.length;i++)hash=((hash*31)+field.charCodeAt(i))>>>0;return hash%360}
function palette(field){const h=hue(field);return {fill:`hsl(${h} 38% 91%)`,stroke:`hsl(${h} 35% 49%)`,ink:`hsl(${h} 50% 23%)`}}
function network(center){const depth=Number($('depth').value),filter=$('collection').value,selected=new Map([[center['@id'],{node:center,dist:0}]]),queue=[center];let head=0;while(head<queue.length){const n=queue[head++],current=selected.get(n['@id']);if(current.dist>=depth)continue;for(const link of neighborItems(n)){const other=link.node;if(!selected.has(other['@id'])){selected.set(other['@id'],{node:other,dist:current.dist+1});queue.push(other)}}}const all=[...selected.values()];const filtered=all.filter(x=>x.dist===0||filter==='all'||fieldId(x.node)===filter);const budget=depth===2?65:36;const visible=[filtered[0],...filtered.slice(1).sort((a,b)=>a.dist-b.dist||label(a.node).localeCompare(label(b.node))).slice(0,budget-1)];const included=new Set(visible.map(x=>x.node['@id']));const edges=new Map();for(const {node} of visible){for(const item of neighborItems(node)){if(!included.has(item.node['@id']))continue;const a=node['@id'],b=item.node['@id'],pair=[a,b].sort().join('|'),type=item.type==='related'?'related':a===center['@id']?item.type:item.type;const key=pair+'|'+(type==='related'?'related':'hierarchy');if(!edges.has(key))edges.set(key,{a,b,type})}}return {visible,edges:[...edges.values()],total:filtered.length,depth,filter}}
function make(tag,attrs={}){let e=document.createElementNS(SVG_NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e}
function wrapLabel(s,max=21){let words=s.split(/\s+/),lines=[''];for(const w of words){let i=lines.length-1;if((lines[i]+' '+w).trim().length>max&&lines[i])lines.push(w);else lines[i]=(lines[i]+' '+w).trim()}return lines.slice(0,3)}
let dragGraph=null; // i2idl-draggable-nodes-v1
function draw(center,links){const svg=$('svg');svg.replaceChildren();const data=network(center),w=840,h=570,cx=w/2,cy=h/2,clustered=$('cluster').checked;const positions=new Map([[center['@id'],{x:cx,y:cy}]]);dragGraph={svg,positions,edges:[]};const secondary=data.visible.slice(1);const groups=new Map();for(const item of secondary){const k=clustered?fieldId(item.node):'all';if(!groups.has(k))groups.set(k,[]);groups.get(k).push(item)}const categories=[...groups].sort((a,b)=>a[0].localeCompare(b[0]));const groupCount=categories.length;categories.forEach(([field,items],gi)=>{const angle=-Math.PI/2+2*Math.PI*gi/Math.max(groupCount,1);const anchorR=clustered&&groupCount>1?175:0;const ax=cx+Math.cos(angle)*anchorR,ay=cy+Math.sin(angle)*anchorR;const n=items.length;const ringR=clustered&&groupCount>1?Math.min(105,25+n*10):Math.min(230,85+n*4);items.forEach((item,j)=>{const a=angle+2*Math.PI*j/Math.max(n,1);let x=ax+Math.cos(a)*ringR,y=ay+Math.sin(a)*ringR;x=Math.max(81,Math.min(w-81,x));y=Math.max(35,Math.min(h-42,y));positions.set(item.node['@id'],{x,y})});if(clustered&&field!=='all'){const tag=make('text',{x:Math.max(100,Math.min(w-100,ax)),y:Math.max(15,Math.min(h-14,ay-118)),'text-anchor':'middle',class:'edge-label'});tag.textContent=fields.get(field)||'Other';svg.append(tag)}});
for(const edge of data.edges){const a=positions.get(edge.a),b=positions.get(edge.b);if(!a||!b)continue;const line=make('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'edge '+edge.type,opacity:edge.type==='related'?.34:.62});svg.append(line);dragGraph.edges.push({line,edge})}for(const item of secondary){const xy=positions.get(item.node['@id']);addNode(svg,item.node,xy.x,xy.y,false,item.dist)}addNode(svg,center,cx,cy,true,0);$('count').textContent=`· ${data.visible.length} visible concepts, ${data.edges.length} links · ${data.depth} hop${data.depth>1?'s':''}`;if(data.total>data.visible.length){const note=make('text',{x:420,y:554,'text-anchor':'middle',class:'edge-label'});note.textContent=`Showing ${data.visible.length} of ${data.total} reachable/filter-matching concepts. Search or recenter to explore more.`;svg.append(note)}}
function addNode(svg,n,x,y,center,dist=0){const lines=wrapLabel(label(n),center?28:21),width=center?210:Math.min(168,Math.max(112,...lines.map(v=>v.length*7+24))),height=lines.length>1?50:38;const g=make('g',{class:'network-node'+(center?' center':''),role:'button',tabindex:'0','aria-label':'Select '+label(n),style:'cursor:pointer'});const pal=palette(fieldId(n));g.append(make('rect',{x:x-width/2,y:y-height/2,width,height,rx:height/2,class:'node-bg',...(!center?{style:'fill:'+pal.fill+';stroke:'+pal.stroke}:{}),opacity:dist===2?.85:1}));const text=make('text',{x,y:y-((lines.length-1)*7),'text-anchor':'middle',class:'node-label'});lines.forEach((line,i)=>{const t=make('tspan',{x,dy:i===0?4:14});t.textContent=line;text.append(t)});if(!center)text.setAttribute('style','fill:'+pal.ink);g.append(text);// Drag nodes without accidentally opening them. Pointer events cover mouse, pen, and touch.
let down=null,suppressClick=false;
const svgPoint=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const ctm=svg.getScreenCTM();return ctm?p.matrixTransform(ctm.inverse()):{x:e.clientX,y:e.clientY}};
g.style.touchAction='none';
g.addEventListener('pointerdown',e=>{if(e.button!==0||!dragGraph||dragGraph.svg!==svg)return;const p=svgPoint(e);down={id:e.pointerId,x:p.x,y:p.y,origin:{...dragGraph.positions.get(n['@id'])},moved:false};suppressClick=false;g.setPointerCapture(e.pointerId)});
g.addEventListener('pointermove',e=>{if(!down||e.pointerId!==down.id||!dragGraph||dragGraph.svg!==svg)return;const p=svgPoint(e),dx=p.x-down.x,dy=p.y-down.y;if(!down.moved&&Math.hypot(dx,dy)<5)return;down.moved=true;const x=Math.max(75,Math.min(765,down.origin.x+dx)),y=Math.max(30,Math.min(535,down.origin.y+dy));dragGraph.positions.set(n['@id'],{x,y});g.setAttribute('transform',`translate(${x-down.origin.x} ${y-down.origin.y})`);for(const {line,edge} of dragGraph.edges){if(edge.a!==n['@id']&&edge.b!==n['@id'])continue;const a=dragGraph.positions.get(edge.a),b=dragGraph.positions.get(edge.b);line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y)}});
const stopDrag=e=>{if(!down||e.pointerId!==down.id)return;suppressClick=down.moved;down=null;if(g.hasPointerCapture(e.pointerId))g.releasePointerCapture(e.pointerId)};
g.addEventListener('pointerup',stopDrag);g.addEventListener('pointercancel',stopDrag);
g.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopPropagation();suppressClick=false;return}focus(n)});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();focus(n)}});svg.append(g)}
function details(n,links){const root=$('detail');root.replaceChildren();const kicker=document.createElement('span');kicker.className='caption';kicker.textContent='SELECTED CONCEPT';root.append(kicker);const h=document.createElement('h2');h.textContent=label(n);root.append(h);const fieldNote=document.createElement('p');fieldNote.className='small';fieldNote.textContent='Primary field: '+(fields.get(fieldId(n))||'Unclassified');root.append(fieldNote);const desc=document.createElement('p');desc.textContent=n['skos:definition']||'See the published glossary for the definition.';root.append(desc);const sl=document.createElement('div');sl.className='section';const uri=document.createElement('a');uri.href=/^https:\/\/id\.i2idl\.org\/concepts\/[a-z0-9-]+$/.test(n['@id'])?n['@id']:'#';uri.target='_blank';uri.rel='noopener';uri.textContent='Persistent URI ↗';sl.append(uri,document.createTextNode(' · '));const jump=document.createElement('a');jump.href='https://www.i2idl.org/glossary?concept='+encodeURIComponent(slug(n));jump.target='_blank';jump.rel='noopener';jump.textContent='Open glossary card ↗';sl.append(jump);root.append(sl);const researchBtn=document.createElement('button');researchBtn.type='button';researchBtn.className='button research-cta';researchBtn.textContent='Find research ↗';researchBtn.dataset.researchConcept=slug(n);researchBtn.dataset.researchLabel=label(n);root.append(researchBtn);for(const type of ['broader','narrower','related']){const items=links.filter(v=>v.type===type);if(!items.length)continue;const sec=document.createElement('section');sec.className='section';const sh=document.createElement('b');sh.textContent=({broader:'Broader concepts',narrower:'Narrower concepts',related:'Related concepts'})[type]+' ('+items.length+')';sec.append(sh);const list=document.createElement('ul');list.className='listlinks';for(const item of items){const li=document.createElement('li'),btn=document.createElement('button');btn.type='button';btn.textContent=label(item.node);btn.addEventListener('click',()=>focus(item.node));li.append(btn);list.append(li)}sec.append(list);root.append(sec)}}

// Research tools operate on the same graph used by the explorer, never on proposed links.
let analysisAdj=new Map(),analysisEdgeCount=0;
function computeAdjacency(){analysisAdj=new Map(nodes.map(n=>[n['@id'],new Set()]));const seen=new Set();for(const n of nodes){for(const {node} of neighborItems(n)){const a=n['@id'],b=node['@id'];analysisAdj.get(a).add(b);analysisAdj.get(b).add(a);seen.add([a,b].sort().join('|'))}}analysisEdgeCount=seen.size}
function populateResearch(){computeAdjacency();for(const id of ['path-a','path-b','compare-a','compare-b']){const sel=$(id);sel.replaceChildren();for(const n of [...nodes].sort((a,b)=>label(a).localeCompare(label(b)))){sel.add(new Option(label(n),n['@id']))}sel.disabled=false}const find=term=>nodes.find(n=>slug(n)===term)?.['@id']||nodes[0]['@id'];$('path-a').value=find('learning-analytics');$('path-b').value=find('competency');$('compare-a').value=find('personalization');$('compare-b').value=find('adaptive-instructional-system');$('find-path').disabled=false;$('run-compare').disabled=false;$('path-result').replaceChildren();$('compare-result').replaceChildren();$('path-hint').textContent='Uses unweighted graph distance';$('analytics-result').textContent='Open Graph analytics to calculate network statistics.'}
function bfs(start,goal){const prev=new Map([[start,null]]),q=[start];for(let i=0;i<q.length;i++){const cur=q[i];if(cur===goal)break;for(const next of analysisAdj.get(cur)||[]){if(!prev.has(next)){prev.set(next,cur);q.push(next)}}}if(!prev.has(goal))return null;const path=[];for(let at=goal;at!==null;at=prev.get(at))path.push(at);return path.reverse()}
function tagName(id){return label(map.get(id))}
function nodeButton(id){const b=document.createElement('button');b.type='button';b.textContent=tagName(id);b.addEventListener('click',()=>{focus(map.get(id));document.getElementById('viz').scrollIntoView({behavior:'smooth',block:'center'})});return b}
function relationsBetween(a,b){const n=map.get(a),m=map.get(b);const types=[];for(const [p,t] of [['skos:related','related'],['skos:broader','broader'],['skos:narrower','narrower']]){if(refs(n[p]).map(rid).includes(b))types.push(t);else if(refs(m[p]).map(rid).includes(a))types.push(t==='broader'?'narrower':t==='narrower'?'broader':t)}return [...new Set(types)].join(', ')||'connected'}
function runPath(){const a=$('path-a').value,b=$('path-b').value,result=$('path-result');result.replaceChildren();const path=bfs(a,b);if(!path){result.textContent='No path connects these concepts within the published SKOS graph.';return}const card=document.createElement('div');card.className='result-card';const title=document.createElement('b');title.textContent=`Shortest path: ${path.length-1} relationship${path.length===2?'':'s'}`;const steps=document.createElement('div');steps.className='path-steps';steps.style.marginTop='12px';path.forEach((id,i)=>{if(i){const sep=document.createElement('span');sep.className='small';sep.textContent='→ '+relationsBetween(path[i-1],id)+' →';steps.append(sep)}steps.append(nodeButton(id))});card.append(title,steps);const note=document.createElement('p');note.className='muted-note';note.textContent='Multiple equally short routes may exist. A path denotes a chain of editorially asserted relationships, not a causal or logical implication.';card.append(note);result.append(card)}
function listLinks(ids){const ul=document.createElement('ul');for(const id of ids.slice(0,24)){const li=document.createElement('li');li.append(nodeButton(id));ul.append(li)}if(ids.length>24){const li=document.createElement('li');li.textContent=`…and ${ids.length-24} more`;ul.append(li)}return ul}
function runCompare(){const a=$('compare-a').value,b=$('compare-b').value,out=$('compare-result');out.replaceChildren();if(a===b){out.textContent='Choose two different concepts.';return}const na=analysisAdj.get(a)||new Set(),nb=analysisAdj.get(b)||new Set();const shared=[...na].filter(id=>nb.has(id)).sort((x,y)=>tagName(x).localeCompare(tagName(y)));const onlyA=[...na].filter(id=>!nb.has(id)).sort((x,y)=>tagName(x).localeCompare(tagName(y)));const onlyB=[...nb].filter(id=>!na.has(id)).sort((x,y)=>tagName(x).localeCompare(tagName(y)));const container=document.createElement('div');container.className='comparison';for(const [title,items,kind] of [[`Shared neighbors (${shared.length})`,shared,'shared'],[`${tagName(a)} only (${onlyA.length})`,onlyA,'unique'],[`${tagName(b)} only (${onlyB.length})`,onlyB,'unique']]){const section=document.createElement('section');if(kind==='shared')section.className='shared';const h=document.createElement('b');h.textContent=title;section.append(h,items.length?listLinks(items):document.createTextNode(' None'));container.append(section)}const fa=new Set(refs(map.get(a)['gs:fieldCollection']).map(rid)),fb=new Set(refs(map.get(b)['gs:fieldCollection']).map(rid));const foot=document.createElement('p');foot.className='small';foot.textContent=`Direct relationship: ${na.has(b)?relationsBetween(a,b):'none'}. Shared primary field: ${fieldId(map.get(a))===fieldId(map.get(b))?'yes':'no'}. Common neighbors are based on the current graph.`;out.append(foot,container)}
function renderGraphAnalytics(){const out=$('analytics-result');out.replaceChildren();const counts=[['Concepts',nodes.length],['Unique links',analysisEdgeCount],['Connected components',0],['Mean degree',nodes.length?(2*analysisEdgeCount/nodes.length).toFixed(2):'—']];const seen=new Set(),components=[];for(const n of nodes){const start=n['@id'];if(seen.has(start))continue;const q=[start];seen.add(start);for(let i=0;i<q.length;i++)for(const x of analysisAdj.get(q[i])||[])if(!seen.has(x)){seen.add(x);q.push(x)}components.push(q)}counts[2][1]=components.length;const grid=document.createElement('div');grid.className='stat-grid';for(const [name,v] of counts){const box=document.createElement('div');box.className='stat';const strong=document.createElement('strong');strong.textContent=v;const lab=document.createElement('span');lab.className='small';lab.textContent=name;box.append(strong,lab);grid.append(box)}out.append(grid);const deg=nodes.map(n=>({id:n['@id'],score:analysisAdj.get(n['@id']).size})).sort((a,b)=>b.score-a.score||tagName(a.id).localeCompare(tagName(b.id)));const inter=new Map();for(const n of nodes){const a=n['@id'],f=fieldId(n);for(const b of analysisAdj.get(a)){if(a>=b)continue;const g=fieldId(map.get(b));if(f===g)continue;inter.set(a,(inter.get(a)||0)+1);inter.set(b,(inter.get(b)||0)+1)}}const bridges=nodes.map(n=>({id:n['@id'],score:inter.get(n['@id'])||0})).sort((a,b)=>b.score-a.score||tagName(a.id).localeCompare(tagName(b.id)));const grid2=document.createElement('div');grid2.className='rank-list';for(const [title,arr] of [['Most connected concepts',deg],['Cross-primary-field connections',bridges]]){const card=document.createElement('div');card.className='result-card';const h=document.createElement('b');h.textContent=title;const ol=document.createElement('ol');for(const item of arr.slice(0,10)){const li=document.createElement('li');li.append(nodeButton(item.id),document.createTextNode(' — '+item.score));ol.append(li)}card.append(h,ol);grid2.append(card)}out.append(grid2);const info=document.createElement('p');info.className='muted-note';info.textContent=`Largest connected component: ${Math.max(...components.map(x=>x.length))} concepts. These metrics describe I2IDL's curated graph, not objective scholarly importance. Cross-field score uses primary field only; secondary memberships are not counted.`;out.append(info)}

// Source network is a weighted one-mode projection of the concept-to-source evidence graph.
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
// I2IDL collection/source analytics: derived solely from the published JSON-LD.
function renderCollectionSourceAnalytics(){
  const root=$('analytics-result');
  const graphNodes=provenanceGraph.filter(n=>n&&n['@id']);
  const byId=new Map(graphNodes.map(n=>[n['@id'],n]));
  const collections=graphNodes.filter(n=>refs(n['@type']).includes('skos:Collection')&&n['gs:facet']==='field').sort((a,b)=>String(a['skos:prefLabel']).localeCompare(String(b['skos:prefLabel'])));
  const conceptSet=new Set(nodes.map(n=>n['@id']));
  const members=new Map(collections.map(c=>[c['@id'],new Set(refs(c['skos:member']).map(rid).filter(id=>conceptSet.has(id)))]));
  const belong=new Map(nodes.map(n=>[n['@id'],[]]));
  for(const c of collections)for(const id of members.get(c['@id']))belong.get(id).push(c['@id']);
  const sources=graphNodes.filter(n=>n['@id'].startsWith('https://id.i2idl.org/sources/')).sort((a,b)=>String(a['dcterms:title']).localeCompare(String(b['dcterms:title'])));
  const covered=new Map(sources.map(s=>[s['@id'],new Set()]));
  for(const n of nodes){
    const definition=byId.get(rid(n['gs:activeDefinition']));
    for(const evidence of refs(definition?.['gs:evidence'])){
      const sourceId=rid(evidence?.['dcterms:source']);
      if(covered.has(sourceId))covered.get(sourceId).add(n['@id']);
    }
  }
  const section=(title,description)=>{const el=document.createElement('section');el.className='result-card';const h=document.createElement('h3');h.textContent=title;h.style.margin='0 0 6px';const p=document.createElement('p');p.className='muted-note';p.textContent=description;el.append(h,p);root.append(el);return el};
  const conceptButtons=(place,ids)=>{place.replaceChildren();const wrap=document.createElement('div');wrap.className='source-term-concepts';for(const id of [...ids].sort((a,b)=>tagName(a).localeCompare(tagName(b))))if(map.has(id))wrap.append(nodeButton(id));place.append(wrap)};
  const relationPairs=new Map();const seen=new Set();
  for(const n of nodes){
    for(const prop of ['skos:related','skos:broader','skos:narrower'])for(const ref of refs(n[prop])){
      const a=n['@id'],b=rid(ref);if(!conceptSet.has(b)||a===b)continue;
      const key=[a,b].sort().join('|');if(seen.has(key))continue;seen.add(key);
      for(const x of belong.get(a)||[])for(const y of belong.get(b)||[]){
        if(x===y)continue;const ids=[x,y].sort(),pair=ids.join('|');
        if(!relationPairs.has(pair))relationPairs.set(pair,{a:ids[0],b:ids[1],links:new Set(),concepts:new Set()});
        const entry=relationPairs.get(pair);entry.links.add(key);entry.concepts.add(a);entry.concepts.add(b);
      }
    }
  }
  const pairs=[...relationPairs.values()].sort((a,b)=>b.links.size-a.links.size);
  const sectionGraph=section('Collection connectivity network',`${collections.length} field collections · ${pairs.length} connected collection pairs. Node area represents collection membership. Edge width represents distinct curated SKOS concept relationships crossing collections (each concept relationship counted once per collection pair). Shared collection membership is not counted as an edge. Drag nodes to separate labels; click a node or edge to inspect the concepts.`);
  const frame=document.createElement('div');frame.className='collection-network-layout';const svg=make('svg',{viewBox:'0 0 1040 700',role:'group','aria-label':'Interactive field collection relationship network'});const info=document.createElement('div');info.className='source-network-inspect';info.textContent='Select a collection or connection to inspect its concepts.';frame.append(svg,info);sectionGraph.append(frame);
  const maxMembership=Math.max(1,...collections.map(c=>members.get(c['@id']).size));
  const maxLinks=Math.max(1,...pairs.map(p=>p.links.size));
  const positions=new Map();const n=collections.length;
  collections.forEach((c,i)=>{const theta=2*Math.PI*i/Math.max(n,1)-Math.PI/2;positions.set(c['@id'],{x:520+360*Math.cos(theta),y:346+230*Math.sin(theta),r:10+20*Math.sqrt(members.get(c['@id']).size/maxMembership)})});
  const drawnEdges=[];
  // Cap displayed edges for legibility; totals above and the data remain complete.
  const visualPairs=pairs.slice(0,100);
  for(const p of visualPairs){const a=positions.get(p.a),b=positions.get(p.b);const line=make('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:'#a990ba','stroke-width':(0.8+6*Math.sqrt(p.links.size/maxLinks)).toFixed(2),opacity:'.33',class:'collection-network-edge',tabindex:'0',role:'button','aria-label':`${p.links.size} cross-collection relationships`});
    const inspect=()=>{info.replaceChildren();const h=document.createElement('strong');h.textContent=`${byId.get(p.a)?.['skos:prefLabel']} ↔ ${byId.get(p.b)?.['skos:prefLabel']}: ${p.links.size} concept links`;const detail=document.createElement('p');detail.className='small';detail.textContent=`${p.concepts.size} participating concepts. Relationship counts are distinct concept pairs, not evidence citations.`;info.append(h,detail);conceptButtons(info,p.concepts)};
    line.addEventListener('click',inspect);line.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspect()}});svg.append(line);drawnEdges.push({p,line});
  }
  for(const c of collections){const id=c['@id'],pos=positions.get(id),g=make('g',{class:'collection-network-node',tabindex:'0',role:'button','aria-label':`Inspect ${c['skos:prefLabel']}`});const circle=make('circle',{cx:0,cy:0,r:pos.r,fill:'#ede4f2',stroke:'#75548b','stroke-width':2});const t=make('text',{x:0,y:pos.r+15,'text-anchor':'middle',class:'collection-network-label'});let name=String(c['skos:prefLabel']||'');t.textContent=name.length>26?name.slice(0,25)+'…':name;const count=make('text',{x:0,y:4,'text-anchor':'middle',class:'collection-network-count'});count.textContent=members.get(id).size;g.append(circle,count,t);g.setAttribute('transform',`translate(${pos.x} ${pos.y})`);svg.append(g);
    const inspect=()=>{info.replaceChildren();const title=document.createElement('strong');title.textContent=`${c['skos:prefLabel']}: ${members.get(id).size} concepts`;info.append(title);conceptButtons(info,members.get(id))};
    let drag=null,suppress=false;
    const at=e=>{const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const m=svg.getScreenCTM();return m?pt.matrixTransform(m.inverse()):pt};
    g.style.touchAction='none';
    g.addEventListener('pointerdown',e=>{if(e.button!==0)return;const p=at(e);drag={id:e.pointerId,x:p.x,y:p.y,ox:pos.x,oy:pos.y,moved:false};suppress=false;g.setPointerCapture(e.pointerId)});
    g.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const p=at(e),dx=p.x-drag.x,dy=p.y-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<5)return;drag.moved=true;pos.x=Math.max(75,Math.min(965,drag.ox+dx));pos.y=Math.max(44,Math.min(638,drag.oy+dy));g.setAttribute('transform',`translate(${pos.x} ${pos.y})`);for(const {p:edge,line} of drawnEdges)if(edge.a===id||edge.b===id){const a=positions.get(edge.a),b=positions.get(edge.b);line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y)}});
    const up=e=>{if(!drag||drag.id!==e.pointerId)return;suppress=drag.moved;drag=null;if(g.hasPointerCapture(e.pointerId))g.releasePointerCapture(e.pointerId)};
    g.addEventListener('pointerup',up);g.addEventListener('pointercancel',up);
    g.addEventListener('click',e=>{if(suppress){suppress=false;e.stopPropagation();return}inspect()});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspect()}});
  }
  if(pairs.length>visualPairs.length){const note=document.createElement('p');note.className='muted-note';note.textContent=`Showing the ${visualPairs.length} strongest connections of ${pairs.length} total to keep the graph readable.`;sectionGraph.append(note)}
  const sectionHeat=section('Source dependency by collection',`Each cell shows the percentage of concepts in that field collection whose active definitions cite a given source. Counts use distinct concepts, not evidence-record volume. Since concepts may cite multiple sources, column percentages can exceed 100% when added together.`);
  const holder=document.createElement('div');holder.className='collection-heatmap-wrap';const table=document.createElement('table');table.className='collection-heatmap';const header=document.createElement('thead'),headRow=document.createElement('tr');const th=document.createElement('th');th.textContent='Source / Field';headRow.append(th);
  for(const c of collections){const cell=document.createElement('th');cell.textContent=c['skos:prefLabel'];cell.title=c['skos:prefLabel'];headRow.append(cell)}header.append(headRow);table.append(header);
  const body=document.createElement('tbody');
  for(const source of sources){const tr=document.createElement('tr');const labelCell=document.createElement('th');labelCell.scope='row';labelCell.textContent=source['dcterms:title']||source['@id'];tr.append(labelCell);
    for(const c of collections){const group=members.get(c['@id']),shared=[...covered.get(source['@id'])].filter(id=>group.has(id)),ratio=group.size?shared.length/group.size:0;const cell=document.createElement('td');const btn=document.createElement('button');btn.type='button';btn.textContent=`${Math.round(ratio*100)}%`;btn.title=`${shared.length} of ${group.size} concepts: ${source['dcterms:title']} / ${c['skos:prefLabel']}`;btn.style.background=`rgba(108,58,137,${(0.05+0.85*ratio).toFixed(3)})`;btn.style.color=ratio>.53?'#fff':'#32183e';btn.addEventListener('click',()=>{selection.replaceChildren();const title=document.createElement('strong');title.textContent=`${source['dcterms:title']} × ${c['skos:prefLabel']}: ${shared.length} of ${group.size} concepts (${Math.round(ratio*100)}%)`;selection.append(title);conceptButtons(selection,shared);selection.scrollIntoView({behavior:'smooth',block:'nearest'})});cell.append(btn);tr.append(cell)}body.append(tr)
  }
  table.append(body);holder.append(table);sectionHeat.append(holder);
  const selection=document.createElement('div');selection.className='source-network-inspect';selection.textContent='Select a cell to inspect the contributing concepts.';sectionHeat.append(selection);
  const disclaimer=document.createElement('p');disclaimer.className='muted-note';disclaimer.textContent='These are coverage and dependency indicators, not judgments of a source’s quality, influence outside I2IDL, or independence. Concepts can belong to multiple field collections.';sectionHeat.append(disclaimer);
}

function renderAnalytics(){renderGraphAnalytics();renderSourceAnalytics();renderCollectionSourceAnalytics()}

for(const btn of document.querySelectorAll('[data-tab]'))btn.addEventListener('click',()=>{for(const b of document.querySelectorAll('[data-tab]')){const yes=b===btn;b.setAttribute('aria-selected',yes?'true':'false');$(b.dataset.tab+'-panel').hidden=!yes}if(btn.dataset.tab==='analytics'&&nodes.length)renderAnalytics()});
$('share').addEventListener('click',()=>{const url=new URL(location.href);url.searchParams.set('concept',active?slug(active):'competency');const text=url.toString();if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(text).then(()=>{$('status').textContent='Explorer link copied.'}).catch(()=>window.prompt('Copy this explorer URL:',text))}else{window.prompt('Copy this explorer URL:',text)}});$('find-path').addEventListener('click',runPath);$('run-compare').addEventListener('click',runCompare);

for(const id of ['depth','collection','cluster'])$(id).addEventListener('change',()=>{if(active)focus(active,false)});
// Rank concept names and aliases first, before less precise description matches.
// All dynamic suggestion labels are inserted with textContent, never as HTML.
function normalizeSearch(value){return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function rankedConceptSearch(query){
  const q=normalizeSearch(query);if(!q)return [];
  const tokens=q.split(' ').filter(Boolean);
  const scored=[];
  for(const n of nodes){
    const title=normalizeSearch(label(n));
    const alternatives=refs(n['skos:altLabel']).map(v=>normalizeSearch(typeof v==='string'?v:(v&&v['@value'])||''));
    const identifier=normalizeSearch(n['dcterms:identifier']||slug(n));
    const names=[title,...alternatives,identifier].filter(Boolean);
    const definition=normalizeSearch(n['skos:definition']||'');
    let score=0;
    if(names.some(v=>v===q))score=1000;
    else if(title.startsWith(q))score=850;
    else if(alternatives.some(v=>v.startsWith(q)))score=800;
    else if(names.some(v=>v.includes(q)))score=700;
    else if(tokens.every(word=>names.some(v=>v.split(' ').some(part=>part.startsWith(word)))))score=600;
    else if(definition.includes(q))score=250;
    else if(tokens.every(word=>definition.includes(word)))score=100;
    if(score)scored.push({n,score});
  }
  scored.sort((a,b)=>b.score-a.score||label(a.n).localeCompare(label(b.n)));
  return scored.map(item=>item.n);
}

$('search').addEventListener('input',e=>{const val=e.target.value.trim().toLowerCase(),res=$('results');res.replaceChildren();if(!val){res.style.display='none';return}for(const n of rankedConceptSearch(val).slice(0,12)){const b=document.createElement('button');b.textContent=label(n);b.type='button';b.addEventListener('click',()=>{$('search').value='';focus(n)});res.append(b)}res.style.display=res.childNodes.length?'block':'none'});$('back').onclick=()=>{const prev=history.pop();if(prev)focus(prev,false);$('back').disabled=history.length===0};$('reset').onclick=()=>{history=[];focus(nodes.find(n=>slug(n)==='competency')||nodes[0],false)};fetch('/glossary.jsonld',{headers:{Accept:'application/ld+json'},cache:'default'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(onGraph).catch(err=>{$('status').textContent='Unable to load the published graph ('+err.message+'). Please try again later.';const detail=$('detail');detail.replaceChildren();const caption=document.createElement('span');caption.className='caption';caption.textContent='PREVIEW';const heading=document.createElement('h2');heading.textContent='Load the glossary graph';const explanation=document.createElement('p');explanation.textContent='This prototype reads real SKOS relationships from the published graph. If local-file browser restrictions prevent fetching it directly, use the file chooser above.';detail.append(caption,heading,explanation)})})();
