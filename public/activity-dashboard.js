(()=>{'use strict';const $=id=>document.getElementById(id);const fmt=n=>Number(n||0).toLocaleString();
fetch('/api/activity',{cache:'no-store'}).then(async r=>{const data=await r.json();if(!r.ok)throw Error(data.error||'Unable to load activity');return data}).then(data=>{
 const t=data.totals;$('pageviews').textContent=fmt(t.pageviews);$('nodes').textContent=fmt(t.nodesExplored);$('searches').textContent=fmt(t.researchSearches);$('papers').textContent=fmt(t.papersDiscovered);
 const trend=data.trend||[],max=Math.max(1,...trend.map(x=>x.pageviews));for(const d of trend){const bar=document.createElement('div');bar.className='bar';bar.style.height=Math.max(d.pageviews?3:0,100*d.pageviews/max)+'%';bar.title=d.day+': '+d.pageviews+' pageviews';$('daily').append(bar)}
 $('first-day').textContent=trend[0]?.day||'';$('last-day').textContent=trend.at(-1)?.day||'';
 for(const item of data.popularConcepts||[]){const row=document.createElement('div');row.className='row';const link=document.createElement('a');link.href='/explore?concept='+encodeURIComponent(item.id);link.textContent=item.id.replace(/-/g,' ');const count=document.createElement('strong');count.textContent=fmt(item.count);row.append(link,count);$('popular').append(row)}
 if(!data.popularConcepts?.length)$('popular').textContent='No concept activity recorded yet.';
 $('status').textContent='Last '+data.periodDays+' days · UTC · updated on page load';
}).catch(error=>{$('status').textContent='Activity not available: '+error.message+'. Check the dashboard storage setup.'});})();
