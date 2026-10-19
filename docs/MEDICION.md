# Medición del experimento

## Qué cuenta cada herramienta

Mailchimp es la referencia para contactos únicos y estados de suscripción. `generate_lead` representa exclusivamente una **nueva solicitud aceptada por Mailchimp**, no el clic del botón y no necesariamente una dirección confirmada. Con double opt-in se crea con `pending`; con alta directa, `subscribed`. El evento incorpora `subscription_status`. La función consulta la configuración de la audiencia antes de crear cada contacto y POST no modifica contactos existentes. Los duplicados devuelven `created=false` sin evento. Los errores, timeouts y rechazos tampoco producen evento.

Un cambio posterior de Pending a Subscribed al pulsar el correo se verifica en Mailchimp. No se implementa webhook ni se inventa un evento GA de confirmación. Si la respuesta se pierde tras crear el contacto, reintentar no duplica el contacto, pero la conversión de navegador puede perderse. No se promete entrega exactamente una vez entre dos sistemas independientes.

GA4 solo mide a quienes aceptan analítica y no bloquean Google. El consentimiento no es obligatorio para registrarse. No hay pings sin consentimiento: el script ni siquiera se carga. No se recuperan conversiones previas si se acepta después del envío. Los datos de GA y Mailchimp pueden diferir por consentimiento, bloqueadores, desconexiones y contactos anteriores. No dividir todos los correos de Mailchimp entre las sesiones consentidas de GA como si fueran la misma población.

No se transmite el correo, el ID del contacto, un hash de correo ni el comprobante aleatorio a GA. `page_location` solo conserva rutas y parámetros UTM con letras ASCII, números, guiones y guiones bajos (máximo 100 caracteres). Nunca incluyas información personal en URLs ni en nombres de campaña. El referente se limita al origen. Analytics está restringido al origen de producción y sus cookies al subdominio.

## Configurar GA4

1. Comprobar que el flujo web corresponde a `https://mapa.compila.es` y usa **G-QKEN3GRY80**.
2. En la configuración de medición mejorada del flujo, desactivar «Interacciones con formularios» para evitar mezclar los eventos automáticos con el registro aceptado. No crear otra etiqueta `generate_lead` con un gestor de etiquetas ni otro listener del botón.
3. En Administrar → Visualización de datos → Eventos, marcar `generate_lead` como evento clave. Si aún no aparece, crear el nombre `generate_lead` desde la sección Eventos clave (la ubicación exacta puede variar con la interfaz). No crear un evento derivado que duplique el envío del código. Usar recuento **una vez por evento**: la aplicación ya excluye contactos existentes. La configuración no recalcula retroactivamente todos los datos históricos.
4. En Administrar → Definiciones personalizadas crear dimensiones de ámbito **Evento**: `landing_version`, `experiment_id` y `subscription_status`. Crearlas antes de iniciar campañas; su disponibilidad en informes no es inmediata ni retroactiva.
5. Verificar con Tiempo real y, con una sesión de depuración consentida, DebugView/Tag Assistant. La CSP es restrictiva; si una herramienta de depuración necesita permisos adicionales, revisarlos explícitamente para esa sesión. Las pruebas automatizadas bloquean Google y no cuentan como visitas verificadas.
6. Revisar conservación de datos y configuración de privacidad de la propiedad; mantener Google Signals y personalización de anuncios desactivados. Configurar filtros de tráfico interno según vuestro método y anotarlos antes de excluir datos: los filtros activos no recuperan después lo eliminado.

Informes → Adquisición de tráfico: comparar **fuente/medio de la sesión**, sesiones y evento clave `generate_lead`; añadir tasa de eventos clave de sesión. Exploraciones: filtrar `event_name=generate_lead`, desglosar por versión y estado; contrastar con sesiones de entrada a cada versión. `landing_version` se añade a la configuración de GA (incluido page_view) y al evento. No cambiar el ID de medición en cada iteración. La tasa por sesión es sesiones con al menos un lead / sesiones de esa versión; contar eventos/sesiones es otra razón y debe etiquetarse como tal.

## UTM para compartir

Usar siempre minúsculas, sin espacios ni datos de estudiantes:

```text
https://mapa.compila.es/?utm_source=whatsapp&utm_medium=messaging&utm_campaign=validacion_v1&utm_content=grupo_clase
https://mapa.compila.es/?utm_source=instagram&utm_medium=social&utm_campaign=validacion_v1&utm_content=bio
https://mapa.compila.es/?utm_source=universidad&utm_medium=referral&utm_campaign=validacion_v1&utm_content=delegacion
```

La fuente indica dónde se compartió; el medio, el tipo de canal; campaña y contenido distinguen el experimento y la pieza. WhatsApp puede aparecer como Directo sin UTM. Un medio personalizado como `messaging` puede quedar «Unassigned» en la agrupación predeterminada de GA: consultar fuente/medio o crear un grupo de canales propio. Los parámetros no se guardan en cookies antes del consentimiento ni se transfieren a Mailchimp. El enlace completo permanece en la URL hasta aceptar. No añadir UTMs a enlaces internos, pues altera la atribución.

## Versiones, capturas y entrega

Antes de modificar copy, guardar el estado actual con Git (repositorio independiente, commit descriptivo y tag como `landing-v1`) o `npm run snapshot` con la vista previa en ejecución. El script conserva capturas desktop/móvil con y sin panel de consentimiento, fuentes, configuración y lockfile en una carpeta con fecha; las capturas locales no demuestran despliegue ni resultados.

Para v2: cambiar textos, `version` a `v2` en `site.config.json`, crear `experiments/v2/README.md`, reconstruir, probar y desplegar. Actualizar `privacyVersion` si cambia el consentimiento. Archivar los datos antes de eliminar contactos por fin del plazo, usando solo totales anonimizados para la entrega. Evitar pruebas A/B simultáneas en esta primera versión: es un experimento secuencial y el periodo o el tráfico pueden explicar parte del cambio de conversión.

En cada iteración registrar hipótesis, único cambio principal, inicio/fin y zona horaria, commit, URL, enlaces de difusión, fuentes de tráfico, inversión si existe, visitas consentidas, solicitudes aceptadas, confirmaciones en Mailchimp y limitaciones. No sumar snapshots acumulados como si fueran contactos nuevos. No inferir el estado original de double opt-in a partir del estado actual; la versión y el rango temporal ayudan, pero los conteos requieren exportar los campos/fechas pertinentes de Mailchimp y respetar permisos y privacidad.

Exportar informes de GA por periodo (PDF/CSV) y guardar capturas de GA sin información personal en `experiments/vN/results/`. Mantener exports de contactos identificables en almacenamiento privado fuera de Git. No borrar ni recrear la audiencia o la propiedad para cada iteración.

Screencast sugerido (2–3 minutos): URL y propuesta → responsive → formulario y consentimiento → registro real con un correo propio (ocultando dirección) → estado Pending/Subscribed → Tiempo real y evento clave → adquisición con UTM → comparación de periodos y limitaciones. Si aún no hay datos, mostrarlo y explicar que la validación está pendiente; no generar tráfico ficticio para aparentar resultados.

## Fuentes oficiales

- [Consentimiento de etiquetas de Google](https://developers.google.com/tag-platform/security/guides/consent)
- [Marcar eventos clave en GA4](https://support.google.com/analytics/answer/13128484?hl=es)
- [Guía de cookies de la AEPD](https://www.aepd.es/guias/guia-cookies.pdf)
