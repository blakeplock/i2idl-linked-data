// SPDX-License-Identifier: Apache-2.0
import {activityConfigured,recordEvent,getActivity} from '../lib/activity-store.mjs';
const ORIGIN='https://id.i2idl.org';
const send=(res,code,data)=>res.status(code).json(data);
export default async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Cache-Control','no-store');
  if(req.method==='GET'){
    if(!activityConfigured())return send(res,503,{error:'Activity dashboard is not configured yet'});
    try{return send(res,200,await getActivity());}catch(e){console.error('Activity read failed',e.message);return send(res,503,{error:'Activity statistics unavailable'});}
  }
  if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return send(res,405,{error:'Method not allowed'});}
  const origin=req.headers.origin;
  if(origin!==ORIGIN)return send(res,403,{error:'Origin not allowed'});
  const type=req.body?.type,concept=req.body?.concept;
  if(!['page_view','concept_selected'].includes(type)||Object.keys(req.body||{}).some(k=>!['type','concept'].includes(k)))return send(res,400,{error:'Invalid event'});
  if(type==='page_view'&&concept!==undefined)return send(res,400,{error:'Unexpected concept'});
  if(type==='concept_selected'&&(typeof concept!=='string'||concept.length>150||!(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).test(concept)))return send(res,400,{error:'Invalid concept'});
  // Public, anonymous metrics are inherently susceptible to scripted traffic.
  // Validate schema/origin and use modest client throttling; do not claim bot-proof counts.
  try{await recordEvent(type,concept||'');return send(res,200,{ok:true});}
  catch(e){console.error('Activity event failed',e.message);return send(res,503,{error:'Activity collection unavailable'});}
}
