import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diagnostic, safeField } from '../lib/mailchimp-diagnostics.mjs';
import { onRequest } from '../functions/api/subscribe.js';
import { config } from '../src/config.js';
const env = {SITE_ORIGIN:'https://mapa.compila.es',REGISTRATION_ENABLED:'true',MAILCHIMP_API_KEY:'private-test-key-us1',MAILCHIMP_AUDIENCE_ID:'36d5edad54'};
function request() {return new Request(env.SITE_ORIGIN+'/api/subscribe',{method:'POST',headers:{Origin:env.SITE_ORIGIN,'Content-Type':'application/json'},body:JSON.stringify({email:'private-student@example.com',privacy:true,website:'',version:config.version,privacyVersion:config.privacyVersion})});}
const json=(data,status=200)=>new Response(JSON.stringify(data),{status});
async function run(responses, verify, changes={}) {
 const originalFetch=globalThis.fetch, originalWarn=console.warn;const logs=[],calls=[];
 globalThis.fetch=async(url,options)=>{calls.push({url,options});const result=responses.shift();if(typeof result==='function')return result(url,options);if(result instanceof Error)throw result;if(!result)throw Error('Unexpected call');return result;};
 console.warn=value=>logs.push(JSON.parse(value));
 try {
  const response=await onRequest({request:request(),env:{...env,...changes}});
  const body=await response.json();await verify({response,body,logs,calls});
  const visible=JSON.stringify({logs,body});
  for(const secret of ['private-student@example.com','private-test-key-us1','Sensitive Person','raw-request-id','10.20.30.40']) assert.ok(!visible.includes(secret),'Personal information leaked: '+secret);
 } finally {globalThis.fetch=originalFetch;console.warn=originalWarn;}
}
const audience=(extra={})=>json({name:'Compila Mapa',double_optin:true,marketing_permissions:false,...extra});
test('payload solo usa propiedades admitidas, etiquetas string y pending con DOI',async()=>{
 await run([audience(),json({status:'pending'})],({body,calls,logs})=>{
  assert.equal(body.created,true);assert.equal(body.subscriptionStatus,'pending');assert.equal(logs.length,0);
  const payload=JSON.parse(calls[1].options.body);
  assert.deepEqual(Object.keys(payload).sort(),['email_address','language','status','tags','timestamp_signup']);
  assert.equal(payload.status,'pending');assert.ok(payload.tags.every(x=>typeof x==='string'));
  assert.match(payload.timestamp_signup,/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  assert.ok(Number.isFinite(Date.parse(payload.timestamp_signup)));
  assert.ok(!calls[1].url.includes('skip_merge_validation'));assert.equal(calls[1].options.method,'POST');
 });
});
test('regresión timestamp_signup: UTC sin milisegundos y alta pendiente con double opt-in',async t=>{
 t.mock.timers.enable({apis:['Date'],now:new Date('2026-10-19T10:45:09.702Z')});
 await run([audience(),(_url,options)=>{
  const payload=JSON.parse(options.body);
  // Emulates the observed timestamp rejection, without calling the real API.
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(payload.timestamp_signup)) {
   return json({title:'Invalid Resource',detail:'The resource submitted could not be validated.',errors:[{field:'timestamp_signup',message:'Invalid date format'}]},400);
  }
  return json({status:'pending'});
 }],({response,body,calls,logs})=>{
  assert.equal(response.status,200);assert.equal(body.accepted,true);assert.equal(body.created,true);
  assert.equal(body.subscriptionStatus,'pending');assert.equal(logs.length,0);
  const payload=JSON.parse(calls[1].options.body);
  assert.equal(payload.timestamp_signup,'2026-10-19T10:45:09Z');
  assert.equal(payload.status,'pending');assert.ok(!Object.hasOwn(payload,'timestamp_opt'));
  assert.ok(payload.tags.includes('consent:'+config.privacyVersion));
  assert.equal(calls.length,2);
 });
});
test('400 por FNAME obligatorio identifica el campo sin exponer error o correo al navegador',async()=>{
 await run([audience(),json({title:'Invalid Resource',status:400,detail:'Your merge fields were invalid. private-student@example.com',instance:'raw-request-id',errors:[{field:'FNAME',message:'Please enter a value Sensitive Person private-student@example.com'}]},400)],({response,body,logs,calls})=>{
  assert.equal(response.status,422);assert.equal(body.accepted,false);assert.equal(body.reference,logs[0].reference);
  assert.match(body.reference,/^[a-f0-9-]{36}$/);assert.equal(logs[0].reason,'merge_validation');
  assert.deepEqual(logs[0].fields,[{field:'merge_fields.FNAME',reason:'required_field'}]);
  assert.equal(logs[0].upstreamStatus,400);assert.equal(logs[0].requestedStatus,'pending');assert.equal(logs[0].doubleOptIn,true);
  assert.ok(!JSON.stringify(body).includes('FNAME'));assert.equal(calls.length,2);
 });
});
test('400 por permiso inválido identifica la ruta sin registrar el ID del permiso',async()=>{
 await run([audience({marketing_permissions:true}),json({title:'Invalid Resource',detail:'Invalid marketing permission private-test-key-us1',errors:[{field:'marketing_permissions.0.marketing_permission_id',message:'Invalid marketing permission private-permission'}]},400)],({body,logs,calls})=>{
  assert.equal(body.accepted,false);assert.equal(logs[0].marketingPermissions,true);
  assert.deepEqual(logs[0].fields,[{field:'marketing_permissions[].marketing_permission_id',reason:'marketing_permission_validation'}]);
  assert.ok(!JSON.stringify(logs).includes('private-permission'));
  const payload=JSON.parse(calls[1].options.body);assert.equal(payload.status,'pending');
  assert.deepEqual(payload.marketing_permissions,[{marketing_permission_id:'privatepermission',enabled:true}]);
 },{MAILCHIMP_MARKETING_PERMISSION_ID:'privatepermission'});
});
test('sin ID GDPR no se intenta crear un contacto ni se omite el permiso',async()=>{
 await run([audience({marketing_permissions:true})],({response,logs,calls})=>{
  assert.equal(response.status,503);assert.equal(calls.length,1);assert.equal(logs[0].reason,'missing_marketing_permission');assert.equal(logs[0].stage,'audience');
 });
});
test('parámetro rechazado en detail se convierte a un campo conocido, sin copiar detail',async()=>{
 await run([audience(),json({title:'Invalid Resource',detail:'Invalid date format in timestamp_signup for private-student@example.com'},400)],({logs,body,calls})=>{
  assert.deepEqual(logs[0].fields,[{field:'timestamp_signup',reason:'invalid_format'}]);assert.equal(body.accepted,false);assert.equal(calls.length,2);
 });
});
test('campo personalizado se identifica por merge_id, nunca por su nombre o etiqueta',async()=>{
 await run([audience(),json({title:'Invalid Resource',detail:'Your merge fields were invalid.',errors:[{field:'PRIVATE_CUSTOM_TAG',message:'Please enter a value Sensitive Person'}]},400),json({merge_fields:[{tag:'PRIVATE_CUSTOM_TAG',name:'Sensitive Person',merge_id:42,required:true}]})],({logs,calls})=>{
  assert.deepEqual(logs[0].fields,[{field:'merge_fields.custom',mergeFieldId:42,reason:'required_field'}]);
  assert.ok(!JSON.stringify(logs).includes('PRIVATE_CUSTOM_TAG'));assert.equal(calls.filter(x=>x.options.method==='POST').length,1);
  assert.ok(calls[2].url.endsWith('/merge-fields?count=1000'));assert.equal(calls[2].options.method,undefined);
 });
});
test('fallo de consulta auxiliar no oculta el 400 original ni provoca reintentos de alta',async()=>{
 await run([audience(),json({title:'Bad Request',errors:[{field:'private-student@example.com',message:'Sensitive Person'}]},400),new Error('private-test-key-us1')],({response,logs,calls})=>{
  assert.equal(response.status,422);assert.deepEqual(logs[0].fields,[{field:'unknown_field',reason:'unclassified'}]);
  assert.equal(logs[0].upstreamStatus,400);assert.equal(calls.filter(x=>x.options.method==='POST').length,1);
 });
});
test('JSON inválido, respuesta nula y timeout se diagnostican sin revelar cuerpos o excepciones',async()=>{
 const error=new Error('Sensitive Person private-student@example.com private-test-key-us1');error.name='TimeoutError';
 for(const [value,reason] of [[new Response('Sensitive Person',{status:400}),'invalid_json_response'],[json(null,400),'invalid_json_response'],[error,'timeout']]) {
  await run([audience(),value],({body,logs})=>{assert.equal(body.accepted,false);assert.equal(logs[0].reason,reason);assert.equal(logs[0].stage,'member');});
 }
});
test('DOI no se rebaja: subscribed inesperado no se devuelve como éxito ni genera lead',async()=>{
 await run([audience(),json({status:'subscribed'})],({response,body,logs})=>{
  assert.equal(response.status,503);assert.equal(body.created,undefined);assert.equal(body.accepted,false);assert.equal(logs[0].reason,'unexpected_subscription_status');
 });
});
test('clasificador soporta punteros JSON, arrays y rutas conocidas con vocabulario cerrado',()=>{
 for(const path of ['marketing_permissions[0].enabled','/marketing_permissions/12/enabled']) assert.deepEqual(safeField(path),{field:'marketing_permissions[].enabled'});
 for(const path of ['private-student@example.com',null,{},'FNAME private-student@example.com','tags[0].private-student@example.com']) assert.deepEqual(safeField(path),{field:'unknown_field'});
 const report=diagnostic({stage:'Sensitive Person',status:'private-test-key-us1',code:'private-test-key-us1',data:{title:'private-test-key-us1',type:'private-test-key-us1',detail:'Sensitive Person',errors:[{field:'private-student@example.com',message:'Sensitive Person',value:'10.20.30.40'}]},payload:{email_address:'private-student@example.com',status:'pending',privatefield:'private-test-key-us1'},audience:{name:'Sensitive Person',double_optin:true}});
 for(const value of ['Sensitive Person','private-student@example.com','private-test-key-us1','10.20.30.40']) assert.ok(!JSON.stringify(report).includes(value));
 assert.deepEqual(report.payloadFields,['email_address','status']);assert.equal(report.stage,'unknown');assert.equal(report.upstreamStatus,null);
});
