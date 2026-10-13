#!/usr/bin/env python3
"""Install aggregate Explorer Activity features without replacing the current UI."""
from pathlib import Path
import json

root=Path.cwd()
source=Path(__file__).resolve().parent
for path in ['public/graph.html','api/research.mjs','vercel.json']:
    if not (root/path).exists(): raise SystemExit(f'Missing {path}; run in the repository root')
html=(root/'public/graph.html').read_text()
research=(root/'api/research.mjs').read_text()
vercel=json.loads((root/'vercel.json').read_text())
if any((root/x).exists() for x in ['api/activity.mjs','lib/activity-store.mjs','public/activity.html','public/activity-dashboard.js','public/explorer-activity.js']) or 'explorer-activity.js' in html or 'recordResearch' in research or any(x.get('source')=='/activity' for x in vercel['rewrites']):
    raise SystemExit('Activity installation appears already applied; no changes made')
if '<script src="/graph-explorer.js" defer></script>' not in html or 'return res.status(200).json({concepts:ids' not in research:
    raise SystemExit('Explorer or Research API structure has changed; no changes made')
if 'source' not in vercel['rewrites'][0] or 'headers' not in vercel:
    raise SystemExit('Unexpected Vercel configuration; no changes made')
html=html.replace('<script src="/graph-explorer.js" defer></script>', '<script src="/explorer-activity.js" defer></script><script src="/graph-explorer.js" defer></script>',1)
html=html.replace('<footer>Research prototype', '<footer><a href="/activity">Public Explorer Activity ↗</a> · Research prototype',1)
research=research.replace("const DOMAIN='https://api.openalex.org/works';", "import {recordResearch,activityConfigured} from '../lib/activity-store.mjs';\nconst DOMAIN='https://api.openalex.org/works';",1)
needle="  return res.status(200).json({concepts:ids"
research=research.replace(needle,"  if(activityConfigured()){try{await recordResearch(works.slice(0,15).length)}catch(error){console.error('Research activity counter:',error.message)}}\n"+needle,1)
vercel['rewrites'].insert(1,{'source':'/activity','destination':'/activity.html'})
csp="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"
for path in ['/activity','/activity.html']:
    vercel['headers'].append({'source':path,'headers':[{'key':'Content-Security-Policy','value':csp},{'key':'X-Frame-Options','value':'DENY'}]})
for target,contents in [('public/graph.html',html),('api/research.mjs',research),('vercel.json',json.dumps(vercel,indent=2)+'\n')]:
    (root/target).write_text(contents)
for filename,target in [('activity.mjs','api/activity.mjs'),('lib/activity-store.mjs','lib/activity-store.mjs'),('activity.html','public/activity.html'),('activity-dashboard.js','public/activity-dashboard.js'),('explorer-activity.js','public/explorer-activity.js')]:
    destination=root/target;destination.parent.mkdir(parents=True,exist_ok=True)
    if destination.exists():raise SystemExit(f'Already exists: {target}')
    destination.write_bytes((source/filename).read_bytes())
print('Installed Explorer Activity dashboard, collector, and research counter integration.')
print('IMPORTANT: Set Upstash Redis REST environment variables on Vercel before production use.')
