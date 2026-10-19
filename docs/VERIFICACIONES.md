# Verificaciones de v1 · 19 de octubre de 2026

## Comprobado localmente

- Build estático generado: `npm run build`.
- Ocho pruebas de servidor superadas: formato y tamaño de solicitudes, email, consentimiento, origen, configuración, estado pending/subscribed, GDPR, duplicados y fallos de Mailchimp. Todas usan respuestas controladas; no hay suscripciones reales.
- Siete pruebas de navegador superadas: layout a 320, 390, 768 y 1440 px, controles táctiles, email y checkbox obligatorios, error real de configuración, consentimiento, revocación, evento tras aceptación sin duplicados, ausencia de PII en parámetros, teclado, reduced motion y páginas legales. Las peticiones a Google y Mailchimp se interceptan expresamente en las pruebas de éxito.
- Chromium revisado visualmente en capturas de escritorio 1440 × 1000 y móvil 390 × 844. Sin desbordamiento horizontal en los anchos comprobados.
- Cloudflare Wrangler 4.151.1 compiló la función y leyó las tres reglas de `_headers`. HTTP local devuelve la CSP y las páginas. Una solicitud válida desde el origen local autorizado obtiene 503 «La lista de espera aún no está abierta», tal como corresponde sin credenciales y con registro cerrado.
- La comprobación de build de producción debe rechazar datos legales incompletos. No se habilita el registro automáticamente.
- No hay API keys reales en el proyecto. La configuración pública contiene únicamente identificadores públicos y datos legales. Las llamadas reales a Mailchimp se ejecutarán únicamente desde la función. `.dev.vars` y `.env` están excluidos de Git; no existen credenciales suministradas en esta sesión.
- Fuentes servidas localmente y licencias conservadas. Dependencias de desarrollo instaladas con lockfile; npm no informó vulnerabilidades en esa instalación.

## No comprobado; no atribuirlo al experimento

- Creación real de contacto y envío del correo de confirmación por Mailchimp. Falta configurar el secreto.
- Configuración y valor real de double opt-in y permisos GDPR de la audiencia; se consultarán por API al registrar.
- Visitas ni eventos reales en GA4, atribución real de campañas, evento clave ni dimensiones creadas en la propiedad. El código se ha probado con Google interceptado; esto no confirma recepción en GA.
- Despliegue en Pages, asociación del dominio, DNS y certificado HTTPS. No se ha accedido a la cuenta Cloudflare ni alterado infraestructura.
- Cumplimentación y revisión final del domicilio y correo de privacidad. Responsables y NIF incorporados tras confirmación del usuario respecto de la web principal.
- Resultados de mercado, entrevistas, umbrales de aceptación ni tasas de conversión: todavía no existen datos aportados.

Ver `PUBLICACION.md` para el protocolo de aceptación externo. Las capturas locales y sus fuentes quedan en `experiments/v1/captures/`; no demuestran publicación ni demanda de mercado.
