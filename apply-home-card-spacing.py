from pathlib import Path
p=Path('public/index.html')
s=p.read_text(encoding='utf-8')
marker='/* I2IDL homepage card spacing refinement */'
if marker in s:
    print('Homepage card spacing refinement already applied.')
    raise SystemExit(0)
if '<div class="grid">' not in s or '</style>' not in s or '.card.featured' not in s:
    raise SystemExit('Expected homepage structure not found; no file changed.')
css='''
/* I2IDL homepage card spacing refinement */
@media (min-width:801px){
  .grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}
  .grid .card.featured{grid-column:1 / -1;min-height:210px}
  .grid .card:not(.featured){min-height:265px}
}
.grid .card{padding:30px;gap:0}
.grid .card h3{font-size:clamp(23px,2.2vw,29px);line-height:1.2;margin:20px 0 13px}
.grid .card p{font-size:16px;line-height:1.6;margin-bottom:25px}
.grid .card a{font-size:15px;line-height:1.45;margin-top:auto}
.grid .card .tag{font-size:11px;line-height:1.35}
@media (max-width:800px){
  .grid{gap:18px}
  .grid .card{min-height:250px;padding:25px}
  .grid .card.featured{min-height:230px}
}
@media (max-width:570px){
  .grid .card,.grid .card.featured{min-height:0;padding:25px}
  .grid .card h3{margin-top:17px}
}
'''
s=s.replace('</style>',css+'</style>',1)
p.write_text(s,encoding='utf-8')
print('Updated public/index.html with a roomier two-column card grid and improved typography.')
print('Homepage links, content, and all routes are untouched.')
