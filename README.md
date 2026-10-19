# Compila Mapa

Landing estática independiente + Cloudflare Pages Function. No contiene un MVP del producto. Audiencia configurada: `36d5edad54` («Compila Mapa»). GA4: `G-QKEN3GRY80`.

## Abrir en local

Requiere Node 22 o posterior y npm.

```sh
npm ci
npm run build
npm run dev
```

Abrir http://127.0.0.1:8788. El servidor de desarrollo ejecuta la misma función de registro que Pages, pero no reproduce los headers de Cloudflare. GA se mantiene desactivado fuera del origen de producción. Sin secreto y apertura explícita, el formulario responde con error de configuración, nunca con un registro simulado.

`npm test` comprueba la integración con respuestas controladas. `npm run test:browser` comprueba navegador con GA y Mailchimp interceptados. El navegador de pruebas usa un servidor separado en el puerto 8790, con registro cerrado y sin cargar .dev.vars, para evitar altas reales accidentales. Estas pruebas NO acreditan suscripciones ni visitas reales. El navegador Playwright se instala si hace falta con `npx playwright install chromium`.

## Archivos editables

- `src/index.html`: titular, propuesta, llamada a la acción.
- `src/styles.css`: estilos responsive; Nunito e Inter servidas localmente con sus licencias.
- `site.config.json`: versión del experimento, medición y datos públicos del responsable.
- `functions/api/subscribe.js`: integración servidor a servidor con Mailchimp.
- `scripts/build.mjs`: genera `public/`, incluidas las páginas legales.
- `docs/PUBLICACION.md`: configuración, secretos, dominio y pruebas externas.
- `docs/MEDICION.md`: GA4, conversiones, UTM y límites de la medición.
- `experiments/v1/README.md`: registro inicial sin resultados inventados.

No edites `public/` ni `src/config.js`: se generan con el build. No pongas claves privadas en `site.config.json`, archivos del navegador ni Git.

## Antes de publicar

Completar los datos legales y revisar la finalidad y conservación; configurar el secreto de Mailchimp, revisar permisos GDPR si están activados y cambiar `REGISTRATION_ENABLED` a `true` únicamente después de esa revisión. `npm run build:production` bloquea la publicación si faltan datos del responsable. La confirmación por email se decide leyendo `double_optin` de la audiencia en cada envío: nunca se presupone ni se desactiva.

No se ha modificado compila.es, su DNS ni sus recursos. Este proyecto utiliza exclusivamente el subdominio que se configure para él.
