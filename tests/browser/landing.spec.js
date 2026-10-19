import { test, expect } from '@playwright/test';
import { config } from '../../src/config.js';
const accepted={accepted:true,created:true,receipt:'test-receipt-not-a-real-subscription',subscriptionStatus:'pending',message:'Solicitud de prueba aceptada. Confirma tu correo.'};
async function send(page) {
 await page.getByLabel('Tu correo electrónico',{exact:true}).fill('prueba@example.com');
 await page.locator('#privacy').check();
 await page.getByRole('button',{name:'Quiero acceso anticipado'}).click();
}
async function productionPreview(page) {
 const scripts=[];
 await page.route('https://www.googletagmanager.com/**',route=>{scripts.push(route.request().url());return route.fulfill({status:200,contentType:'text/javascript',body:'/* GA bloqueado: prueba local, no tráfico real */'});});
 await page.route('https://mapa.compila.es/**',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/api/subscribe')return route.fulfill({json:accepted});
  const response=await route.fetch({url:'http://127.0.0.1:8790'+url.pathname+url.search});await route.fulfill({response});
 });
 await page.goto('https://mapa.compila.es/?utm_source=whatsapp&utm_medium=messaging&utm_campaign=validacion_v1&email=privado@example.com');
 return scripts;
}
test('desktop y móvil: no hay desbordamiento y los controles son utilizables',async({page})=>{
 for(const width of [320,390,768,1440]) {
  await page.setViewportSize({width,height:900});await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const button=await page.locator('#submit').boundingBox();expect(button.height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button',{name:'Rechazar',exact:true}).click();
  await expect(page.locator('#submit')).toBeVisible();
  await page.evaluate(()=>localStorage.clear());
 }
});
test('validación de email y consentimiento; error real del servidor sin secreto',async({page})=>{
 let posts=0;page.on('request',r=>{if(r.url().endsWith('/api/subscribe'))posts++;});
 await page.goto('/');await page.getByRole('button',{name:'Rechazar',exact:true}).click();
 await page.locator('#email').fill('mal');await page.locator('#submit').click();expect(posts).toBe(0);
 await page.locator('#email').fill('alumno@example.com');await page.locator('#submit').click();expect(posts).toBe(0);
 await page.locator('#privacy').check();await page.locator('#submit').click();
 await expect(page.locator('#form-status')).toContainText('aún no está abierta');expect(posts).toBe(1);
});
test('no carga GA antes de consentir y rechazar no impide el formulario',async({page})=>{
 const scripts=await productionPreview(page);expect(scripts).toHaveLength(0);
 await page.getByRole('button',{name:'Rechazar',exact:true}).click();await send(page);
 await expect(page.locator('#form-status')).toContainText('Confirma tu correo');expect(scripts).toHaveLength(0);
 expect(await page.evaluate(()=>window.dataLayer)).toBeUndefined();
});
test('consentir habilita GA; lead solo tras aceptación, sin duplicados ni datos personales',async({page})=>{
 const scripts=await productionPreview(page);
 await page.getByRole('button',{name:'Aceptar analítica',exact:true}).click();await expect.poll(()=>scripts.length).toBe(1);
 const leads=()=>page.evaluate(()=>(window.dataLayer||[]).filter(x=>x[0]==='event'&&x[1]==='generate_lead').map(x=>x[2]));
 expect(await leads()).toHaveLength(0);await send(page);await expect(page.locator('#form-status')).toContainText('Confirma');
 await expect.poll(async()=>(await leads()).length).toBe(1);
 await send(page);await expect(page.locator('#form-status')).toContainText('Confirma');expect(await leads()).toHaveLength(1);
 const events=await leads();expect(events[0].subscription_status).toBe('pending');expect(events[0].landing_version).toBe(config.version);
 expect(events[0].page_location).toContain('utm_source=whatsapp');expect(JSON.stringify(events)).not.toContain('example.com');
 expect(JSON.stringify(await page.evaluate(()=>(window.dataLayer||[]).map(x=>Array.from(x))))).not.toContain('privado');
});
test('no hay conversión ante error de Mailchimp ni ante contacto existente',async({page})=>{
 await productionPreview(page);await page.getByRole('button',{name:'Aceptar analítica',exact:true}).click();
 for(const data of [{accepted:false,message:'Error de prueba'},{accepted:true,created:false,subscriptionStatus:'existing',message:'Contacto ya existente'}]) {
  await page.route('https://mapa.compila.es/api/subscribe',route=>route.fulfill({status:data.accepted?200:503,json:data}));
  await send(page);await expect(page.locator('#form-status')).toContainText(data.message);
 }
 expect(await page.evaluate(()=>(window.dataLayer||[]).filter(x=>x[1]==='generate_lead').length)).toBe(0);
});
test('revocar borra cookies y no vuelve a cargar Analytics',async({page})=>{
 const scripts=await productionPreview(page);await page.getByRole('button',{name:'Aceptar analítica',exact:true}).click();await expect.poll(()=>scripts.length).toBe(1);
 await page.context().addCookies([{name:'_ga',value:'test',domain:'mapa.compila.es',path:'/'}]);
 await page.getByRole('button',{name:'Configurar cookies'}).click();await page.getByRole('button',{name:'Rechazar',exact:true}).click();
 await page.waitForLoadState('load');expect(scripts).toHaveLength(1);expect((await page.context().cookies()).some(c=>c.name==='_ga')).toBe(false);
});
test('teclado, reduced motion y páginas legales',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.keyboard.press('Tab');await expect(page.getByText('Saltar al contenido')).toBeFocused();
 for(const path of ['/privacidad.html','/aviso-legal.html','/cookies.html']) {await page.goto(path);await expect(page.locator('h1')).toBeVisible();await expect(page.locator('a[href="/"]').first()).toBeVisible();}
});
