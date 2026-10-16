#!/usr/bin/env python3
from pathlib import Path
p=Path('public/graph-explorer-i18n.js')
s=p.read_text()
old="function init(){const select=document.getElementById('i2idl-language');if(!select)return;select.addEventListener('change',apply);apply();}"
new="""function init(){const select=document.getElementById('i2idl-language');if(!select)return;
 const requested=new URLSearchParams(window.location.search).get('lang');
 select.value=requested==='fr'?'fr':'en';
 select.addEventListener('change',apply);apply();
}"""
if new in s:
 print('PASS: already patched')
elif s.count(old)==1:
 p.write_text(s.replace(old,new)); print('PASS: French deep link initialization patched')
else: raise SystemExit('ERROR: unexpected JS source; not modified')
