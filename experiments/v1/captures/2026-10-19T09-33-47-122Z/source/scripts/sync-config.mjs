import { readFile, writeFile } from 'node:fs/promises';
const config = JSON.parse(await readFile('site.config.json','utf8'));
if (!/^v[0-9][a-zA-Z0-9._-]*$/.test(config.version)) throw new Error('Versión inválida');
await writeFile('src/config.js', '// Generado desde site.config.json. No incluir secretos.\nexport const config = ' + JSON.stringify(config,null,2) + ';\n');
