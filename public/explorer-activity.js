(()=>{'use strict';
// Anonymous aggregate events only. No cookies, sessions, IPs, fingerprints or search terms.
const sent=new Map();
function emit(type,concept){const key=type+':'+(concept||'');const now=Date.now();if(now-(sent.get(key)||0)<1500)return;sent.set(key,now);
  const body=JSON.stringify(concept?{type,concept}:{type});
  fetch('/api/activity',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true,credentials:'same-origin'}).catch(()=>{});
}
emit('page_view');
document.addEventListener('i2idl:concept-selected',event=>{const id=event.detail?.id;if(typeof id==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))emit('concept_selected',id);});
})();
