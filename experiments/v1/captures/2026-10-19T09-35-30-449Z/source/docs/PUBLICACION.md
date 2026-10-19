# Publicación y comprobaciones reales

## Pendiente de aportar o confirmar

Audience ID ya recibido: **36d5edad54**. Faltan:

1. API key privada de Mailchimp: perfil → Account & billing → Extras → API keys → Create a key. Guardarla directamente como secreto; no enviarla por chat. El sufijo `-usN` permite deducir el centro de datos.
2. Responsables y NIF incorporados tras confirmar que son los mismos de compila.es. Falta completar domicilio y email para derechos de privacidad. Completar `legal` en `site.config.json`. El plazo propuesto de 12 meses debe revisarse y ejecutarse realmente.
3. Si la audiencia usa permisos GDPR, proporcionar el ID del permiso de email cuyo texto cubra exclusivamente el aviso de Compila Mapa. La función falla sin ese ID cuando la audiencia exige permisos; no habilita todas las opciones indiscriminadamente. Puede localizarse en el JSON `marketing_permissions` de un contacto de prueba mediante la API o con ayuda del soporte de Mailchimp. No reutilizar un permiso de publicidad general si su finalidad no corresponde.
4. Verificar en Mailchimp que solo EMAIL sea obligatorio. Si FNAME, LNAME u otro merge field es obligatorio, la API rechazará el registro: hacerlo opcional en esa audiencia, si procede. Revisar el nombre exacto «Compila Mapa», double opt-in, remitente, footer y formulario alojado para resuscripciones.
5. Revisar los acuerdos de tratamiento y transferencias con los proveedores y aprobar el texto legal específico. No abrir el registro con texto de borrador.

## Cloudflare Pages: proyecto separado

No se necesita compartir la contraseña de Cloudflare. Puedes ejecutar los pasos en tu sesión. Si se delega, usar OAuth con `npx wrangler login` en tu equipo o un token limitado a la cuenta y permisos de Pages necesarios; no pegar tokens aquí. No conceder permisos de DNS para preparar o subir este proyecto.

1. Crea un repositorio para este directorio, excluyendo `.dev.vars`, `.env`, `node_modules` y `public`. Conserva `package-lock.json`.
2. En Workers & Pages crea un proyecto **Pages** nuevo, `compila-mapa`, independiente del proyecto principal. Elige desde el inicio integración Git o Direct Upload: cambiar entre modalidades puede exigir otro proyecto.
3. Con Git: framework «None», build `npm run build:production`, output `public`, Node 22 o 24. La carpeta `functions/` está en la raíz y se compila como Pages Functions.
4. Alternativa CLI: `npx wrangler login`, `npx wrangler pages project create compila-mapa` y, cuando esté configurado y autorizado publicar, `npm run deploy`. No uses arrastrar y soltar para esta web: necesitas desplegar también Functions. No uses un proyecto existente de compila.es.

Configuración pública se define en `wrangler.jsonc` (fuente de verdad): `MAILCHIMP_AUDIENCE_ID=36d5edad54`, `SITE_ORIGIN=https://mapa.compila.es` y `REGISTRATION_ENABLED=false` inicialmente. Tras revisar legal e integración, cambia la última a `true` y despliega. No confíes en sobrescribir en el panel valores que ya se declaran en Wrangler. Si hay permisos GDPR, añade también `MAILCHIMP_MARKETING_PERMISSION_ID` a `vars`.

Añade la clave como secreto de Pages mediante el panel Settings → Variables and Secrets o de forma interactiva:

```sh
npx wrangler pages secret put MAILCHIMP_API_KEY --project-name compila-mapa
```

El comando pide la clave sin incluirla en el historial de comandos. Configúrala para producción; evita secretos de producción en previews. Vuelve a desplegar cuando cambies secretos si hace falta. Las previews quedan cerradas porque su origen no coincide con `SITE_ORIGIN`. No se cargará GA en pages.dev.

Para probar Mailchimp localmente, copia `.dev.vars.example` a `.dev.vars`, introduce ahí la clave sin compartirla y activa `REGISTRATION_ENABLED=true` tras revisar legal. Usa exclusivamente un correo de prueba propio autorizado. `npm run dev` lee ese archivo ignorado por Git; `npm run dev:cloudflare` permite comprobar la misma función en el runtime de Cloudflare.

## Conectar mapa.compila.es — requiere autorización de infraestructura

**No se ha ejecutado ninguno de estos cambios.** En el proyecto nuevo, Custom domains → Set up a custom domain → `mapa.compila.es`. Sigue la asociación de Pages antes de crear manualmente un CNAME. Si la zona está en Cloudflare, el asistente suele proponer el registro `mapa` hacia el proyecto Pages. Revisa el cambio y autoriza únicamente ese registro.

No modificar `@`, `www`, nameservers, MX, reglas de redirección globales ni registros de compila.es. Si `mapa` ya existe, parar y revisar su uso. No mover la web principal a este proyecto. Esperar a que el dominio aparezca «Active» y el certificado esté emitido. Comprobar en navegador `https://mapa.compila.es` y redirección desde HTTP. No dar HTTPS por verificado antes de verlo activo. Los límites gratuitos pueden cambiar: revisar el plan y cuotas en la cuenta antes del lanzamiento.

## Prueba de aceptación externa (pendiente)

Antes de compartir campañas, registrar fecha, versión y evidencia de cada comprobación. No publicar correos ni claves en capturas del trabajo.

- HTTPS y dominio activos en el proyecto independiente; confirmar que compila.es sigue intacto.
- Abrir sesión privada: no hay peticiones a Google antes de elegir. Rechazar permite registrarse. Aceptar permite ver `gtag/js?id=G-QKEN3GRY80` y peticiones de medición; revocar las detiene tras recargar.
- Enviar un correo propio, nuevo y autorizado. Verificar en Mailchimp Audience → Compila Mapa → All contacts que aparece con estado correcto. Si double opt-in está activo, estado Pending antes del clic y Subscribed después. Verificar ambos mensajes y revisar spam.
- Repetir el mismo correo: no se añade otro contacto ni otro `generate_lead`. No se reactivan bajas con la API. Un contacto antiguo pendiente debe usar su correo de confirmación o el formulario alojado de Mailchimp.
- Verificar en GA Tiempo real/DebugView un `page_view` y `generate_lead` con `landing_version=v1` y `subscription_status=pending` o `subscribed`. No confundir aceptación con confirmación de email. No se envía un evento de confirmación double opt-in desde esta landing.
- Probar URL UTM desde una campaña de prueba, revisar adquisición por fuente/medio y comprobar el evento. Los informes estándar pueden tardar en procesarse.
- Probar un email incorrecto, consentimiento sin marcar, fallos de red y el contacto existente. Ver errores claros sin falsas altas.
- Revisar código servido y red: solo endpoint local `/api/subscribe`; nunca API key ni llamadas directas desde el navegador a Mailchimp. No registrar bodies, direcciones o cabeceras privadas en herramientas de depuración.
- Verificar el runtime real con `npm run dev:cloudflare` o preview protegido antes de abrir producción. Las pruebas del servidor Node no prueban por sí solas el runtime Pages.

La función limita el tamaño del cuerpo, comprueba origen y versiones y utiliza un campo trampa. Si aparece abuso, configurar límites de solicitudes para `/api/subscribe` en el proyecto o zona, con autorización, según las capacidades del plan. No hay almacenamiento adicional ni una garantía de rate limiting distribuido en este código.

## Fuentes oficiales consultadas

- [Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Wrangler para Pages](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)
- [Dominios personalizados](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Mailchimp: Audience ID](https://mailchimp.com/help/find-audience-id/)
- [Mailchimp: API keys](https://mailchimp.com/help/about-api-keys/)
- [Mailchimp: configuración de audiencia](https://mailchimp.com/developer/marketing/api/lists/get/)
- [Mailchimp: crear contacto](https://mailchimp.com/developer/marketing/api/lists/members/create-member/)
