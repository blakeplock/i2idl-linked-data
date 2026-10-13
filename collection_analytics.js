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
