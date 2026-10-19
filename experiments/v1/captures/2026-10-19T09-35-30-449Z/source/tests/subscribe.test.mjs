import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/subscribe.js';
import { config } from '../src/config.js';
const env = { SITE_ORIGIN:'https://mapa.compila.es',REGISTRATION_ENABLED:'true',MAILCHIMP_API_KEY:'test-secret-us1',MAILCHIMP_AUDIENCE_ID:'36d5edad54' };
const valid = {email:' Alumno@example.com ',privacy:true,website:'',version:config.version,privacyVersion:config.privacyVersion};
function request(body=valid, extra={}) {return new Request(env.SITE_ORIGIN+'/api/subscribe', {method:'POST',headers:{Origin:env.SITE_ORIGIN,'Content-Type':'application/json',...extra},body:JSON.stringify(body)});}
const json = (body,status=200)=>new Response(JSON.stringify(body),{status});
async function mockFetch(responses,run) {
 const original=globalThis.fetch;const calls=[];
 globalThis.fetch=async (url,options)=>{calls.push({url,options});const next=responses.shift();if(next instanceof Error)throw next;if(!next)throw Error('Unexpected request');return next;};
 try {await run(calls);} finally {globalThis.fetch=original;}
}
test('rechaza dirección inválida, consentimiento ausente, versión antigua y honeypot sin llamar a Mailchimp',async()=>{
 await mockFetch([],async calls=>{
  for(const change of [{email:'mal'},{email:'a@b'},{email:'a@b..es'},{email:'a\n@example.com'},{email:'a'.repeat(255)+'@example.com'},{privacy:false},{version:'v0'},{privacyVersion:'old'},{website:'bot'}]) {
   const response=await onRequest({request:request({...valid,...change}),env});assert.equal(response.status,400);
  }
  assert.equal(calls.length,0);
 });
});
test('solo admite POST JSON del mismo origen y tamaño limitado',async()=>{
 for(const [req,status] of [
  [new Request(env.SITE_ORIGIN+'/api/subscribe'),405],
  [request(valid,{Origin:'https://evil.example'}),403],
  [request(valid,{'Content-Type':'text/plain'}),415],
  [request({...valid,extra:'x'.repeat(5000)}),400]
 ]) assert.equal((await onRequest({request:req,env})).status,status);
});
test('falla de forma cerrada sin secreto o sin apertura explícita',async()=>{
 for (const change of [{MAILCHIMP_API_KEY:''},{REGISTRATION_ENABLED:'false'},{MAILCHIMP_AUDIENCE_ID:'bad/id'}]) {
  const response=await onRequest({request:request(),env:{...env,...change}});assert.equal(response.status,503);
 }
});
test('respeta double opt-in, normaliza email y guarda versión del consentimiento',async()=>{
 for(const double_optin of [true,false]) {
  await mockFetch([json({name:'Compila Mapa',double_optin}),json({status:double_optin?'pending':'subscribed'})],async calls=>{
   const response=await onRequest({request:request(),env});assert.equal(response.status,200);
   const result=await response.json();assert.equal(result.created,true);assert.ok(result.receipt);assert.equal(result.subscriptionStatus,double_optin?'pending':'subscribed');
   const payload=JSON.parse(calls[1].options.body);assert.equal(payload.email_address,'alumno@example.com');assert.equal(payload.status,double_optin?'pending':'subscribed');assert.ok(payload.tags.includes('consent:'+config.privacyVersion));
   assert.ok(!JSON.stringify(result).includes('alumno@example.com'));assert.equal(response.headers.get('cache-control'),'no-store');
  });
 }
});
test('contacto existente no genera lead ni se actualiza o reactiva',async()=>{
 await mockFetch([json({name:'Compila Mapa',double_optin:true}),json({title:'Member Exists'},400)],async calls=>{
  const response=await onRequest({request:request(),env});const result=await response.json();assert.equal(result.created,false);assert.equal(result.subscriptionStatus,'existing');assert.equal(result.receipt,undefined);assert.equal(calls.length,2);assert.equal(calls[1].options.method,'POST');
 });
});
test('no escribe en otra audiencia ni adivina la configuración',async()=>{
 for(const list of [{name:'Otra audiencia',double_optin:true},{name:'Compila Mapa'},{name:'Compila Mapa',double_optin:true,marketing_permissions:true}]) {
  await mockFetch([json(list)],async calls=>{assert.equal((await onRequest({request:request(),env})).status,503);assert.equal(calls.length,1);});
 }
});
test('incluye únicamente el permiso GDPR configurado cuando corresponde',async()=>{
 await mockFetch([json({name:'Compila Mapa',double_optin:true,marketing_permissions:true}),json({status:'pending'})],async calls=>{
  assert.equal((await onRequest({request:request(),env:{...env,MAILCHIMP_MARKETING_PERMISSION_ID:'123abc'}})).status,200);
  assert.deepEqual(JSON.parse(calls[1].options.body).marketing_permissions,[{marketing_permission_id:'123abc',enabled:true}]);
 });
});
test('errores y timeouts nunca dan un éxito ficticio ni filtran respuesta privada',async()=>{
 for(const reply of [json({detail:'private',title:'Invalid Resource'},400),json({detail:'secret'},429),json({status:'unsubscribed'}),new Error('secret')]) {
  await mockFetch([json({name:'Compila Mapa',double_optin:true}),reply],async()=>{
   const response=await onRequest({request:request(),env});assert.ok(response.status>=400);const data=await response.json();assert.equal(data.accepted,false);assert.ok(!JSON.stringify(data).includes('secret'));assert.ok(!JSON.stringify(data).includes('private'));
  });
 }
});
