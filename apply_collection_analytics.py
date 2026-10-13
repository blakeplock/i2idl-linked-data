#!/usr/bin/env python3
"""Apply additive collection analytics in a local checkout. Do not commit installer."""
from pathlib import Path
p=Path('public/graph-explorer.js')
h=Path('public/graph.html')
if not p.exists() or not h.exists(): raise SystemExit('Run from the i2idl-linked-data repository root')
js=p.read_text()
marker='function renderAnalytics(){renderGraphAnalytics();renderSourceAnalytics()}'
if 'function renderCollectionSourceAnalytics()' in js: raise SystemExit('Already installed; nothing changed')
if js.count(marker)!=1: raise SystemExit('Expected analytics insertion point not found; no changes made')
snippet=Path(__file__).with_name('collection_analytics.js').read_text()
updated=js.replace(marker,snippet+'\nfunction renderAnalytics(){renderGraphAnalytics();renderSourceAnalytics();renderCollectionSourceAnalytics()}')
html=h.read_text()
if html.count('</style>')!=1: raise SystemExit('Expected one style block; no changes made')
style='''\n/* Collection connectivity and source dependency analytics */\n.collection-network-layout{width:100%;overflow:hidden}\n.collection-network-layout svg{display:block;width:100%;height:auto;max-height:690px;background:#fcfafc;border:1px solid var(--line);border-radius:8px}\n.collection-network-edge{cursor:pointer;outline:none}\n.collection-network-edge:hover,.collection-network-edge:focus{opacity:.85!important;stroke:#fa981d}\n.collection-network-node{cursor:grab;outline:none}\n.collection-network-node:focus circle,.collection-network-node:hover circle{stroke:#f79b26;stroke-width:3}\n.collection-network-label{font:12px Lato,Arial,sans-serif;fill:#3b174b;pointer-events:none}\n.collection-network-count{font:bold 13px Lato,Arial,sans-serif;fill:#3b174b;pointer-events:none}\n.collection-heatmap-wrap{overflow:auto;width:100%;border:1px solid var(--line);border-radius:8px}\n.collection-heatmap{border-collapse:separate;border-spacing:2px;min-width:1100px;width:100%;font-size:12px}\n.collection-heatmap th{padding:7px 5px;text-align:left;background:#f7f3f8}\n.collection-heatmap thead th:not(:first-child){min-width:54px;max-width:72px;writing-mode:vertical-rl;transform:rotate(180deg);height:160px;text-align:left;vertical-align:bottom}\n.collection-heatmap tbody th{min-width:190px;max-width:260px;position:sticky;left:0;z-index:1;box-shadow:2px 0 3px #00000010}\n.collection-heatmap td{padding:0;text-align:center}\n.collection-heatmap td button{border:0;border-radius:3px;width:100%;min-width:48px;min-height:38px;font-size:11px;font-weight:700;cursor:pointer}\n.collection-heatmap td button:focus-visible{outline:3px solid #ff9f1c;outline-offset:1px}\n'''
updated_html=html.replace('</style>',style+'</style>')
p.write_text(updated)
h.write_text(updated_html)
print('Updated public/graph-explorer.js and public/graph.html')
