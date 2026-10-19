import { mkdir, readFile, copyFile, writeFile, cp } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const config = JSON.parse(await readFile('site.config.json','utf8'));
const date = new Date().toISOString().replace(/[:.]/g,'-');
const directory = 'experiments/' + config.version + '/captures/' + date;
await mkdir(directory,{recursive:true});
const browser = await chromium.launch();
try {
 for (const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]) {
  const page = await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:8788');await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:directory + '/' + name + '-consent.png',fullPage:true});
  await page.getByRole('button',{name:'Rechazar',exact:true}).click();
  await page.screenshot({path:directory + '/' + name + '.png',fullPage:true});await page.close();
 }
 for (const name of ['src','functions','assets','scripts']) await cp(name,directory + '/source/' + name,{recursive:true});
 for (const name of ['site.config.json','wrangler.jsonc','package.json','package-lock.json']) await copyFile(name,directory + '/source/' + name);
 await copyFile('site.config.json',directory + '/site.config.json');
 await writeFile(directory + '/README.txt','Capturas locales de ' + config.version + '. No acreditan suscripciones, tráfico ni despliegue.\n');
 console.log(directory);
} finally {await browser.close();}
