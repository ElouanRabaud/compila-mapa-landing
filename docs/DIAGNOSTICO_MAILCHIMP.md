# Diagnóstico seguro del HTTP 400 de Mailchimp

## Hallazgo y límite de la investigación

El diagnóstico recibido de producción identifica `stage=member`, HTTP 400, `timestamp_signup` y `invalid_format`. En ese envío, `requestedStatus=pending`, `doubleOptIn=true` y `marketingPermissions=false`. El rechazo observado corresponde al formato de la fecha; no hay evidencia en ese diagnóstico de un problema de permisos o de otros campos.

El código enviaba `new Date().toISOString()`, que incluye milisegundos (`YYYY-MM-DDTHH:mm:ss.sssZ`). La corrección conserva la fecha UTC y elimina únicamente la fracción de segundo: `YYYY-MM-DDTHH:mm:ssZ`, como el ejemplo de fecha de la documentación de Mailchimp. No cambia el instante salvo por truncar milisegundos, ni la política de double opt-in, los permisos, las etiquetas de consentimiento o los datos legales. No se envía `timestamp_opt`, que correspondería a la confirmación del opt-in.

Se añade una regresión con fecha fija y milisegundos no nulos: el servidor simulado rechaza una fecha con fracciones y acepta la fecha UTC sin fracciones, manteniendo el estado `pending`. Esto comprueba la corrección local; la aceptación definitiva por Mailchimp y el correo de confirmación deben verificarse en un nuevo intento real autorizado después del despliegue. No se copia aquí el evento completo del proveedor ni sus datos de conexión.

El POST admite `email_address`, `status`, `language`, `timestamp_signup`, `tags` como array de strings y `marketing_permissions` como array de objetos con `marketing_permission_id` y `enabled`. El ajuste está limitado al formato de `timestamp_signup`; se conserva el diagnóstico seguro para identificar cualquier rechazo posterior.

## Qué registra la función

Ante fallos se escribe una única línea JSON de aplicación con `event=mailchimp_diagnostic`:

- Referencia UUID aleatoria generada por la función, compartida con el mensaje de error del navegador.
- Etapa (`audience` o `member`), HTTP de Mailchimp, tipo y motivo de error clasificados mediante vocabulario fijo.
- Campos rechazados de una lista cerrada, sin valores. Para campos personalizados: `merge_fields.custom` y su ID numérico `mergeFieldId`, obtenido con un GET auxiliar al esquema de merge fields. Nunca se registran etiquetas/nombres personalizados, que podrían contener datos personales.
- Nombres admitidos de campos del payload, estado solicitado, flags double opt-in/GDPR.

No se registra el objeto request, el payload completo, la respuesta de Mailchimp, `detail`, mensajes libres, excepciones/stack, email, hashes de email, IDs de contactos, IP, URL, cabeceras o API keys. Los campos desconocidos se sustituyen por `unknown_field`, sin intentar ocultar solo fragmentos mediante expresiones regulares. El navegador solo recibe un mensaje genérico y la referencia; no recibe configuración de audiencia ni errores de campos. Estos límites se refieren a los logs de aplicación: las herramientas del proveedor pueden mostrar sus propios metadatos de peticiones, que no deben compartirse sin revisar.

No se reintenta el POST automáticamente. El GET auxiliar solo se realiza después de un rechazo con un campo desconocido; si falla, se conserva el diagnóstico del rechazo original.

## Obtener la causa real sin compartir datos privados

1. Revisar y autorizar el despliegue de esta corrección solo en el proyecto `compila-mapa`. Este trabajo no ha desplegado ni activado nada. No sobrescribir configuración de producción: el repositorio conserva `REGISTRATION_ENABLED=false` y los datos legales locales pendientes, que difieren de la web publicada.
2. En los logs de Functions del despliegue aprobado, filtrar `mailchimp_diagnostic`. Después, realizar únicamente una prueba autorizada con un correo propio. Una prueba puede crear un contacto real si el alta funciona: no utilizar direcciones ajenas ni generadas.
3. Buscar la referencia mostrada al fallar y conservar únicamente el JSON sanitizado de aplicación. No copiar la respuesta original, capturas con emails ni el evento completo del proveedor.
4. Compartir únicamente `stage`, `upstreamStatus`, `errorType`, `reason`, `fields`, `requestedStatus`, `doubleOptIn` y `marketingPermissions` para terminar de identificar la causa. La referencia puede compartirse para correlación.

## Interpretación

| Diagnóstico | Acción concreta |
| --- | --- |
| `merge_validation`, `merge_fields.FNAME` / `LNAME`, `required_field` | La audiencia exige un campo que el formulario de solo email no solicita. Revisar la obligatoriedad en esa audiencia y acordar el ajuste. No inventar nombres ni añadir `skip_merge_validation=true`. |
| `merge_fields.custom`, `mergeFieldId=N` | Identificar ese ID en el esquema de merge fields desde una consulta privada autorizada. No publicar su etiqueta ni valor. |
| `marketing_permissions[].marketing_permission_id` | Verificar que el ID configurado pertenece a esta audiencia y al permiso cuyo texto corresponde al aviso solicitado. No desactivar GDPR ni marcar permisos adicionales. |
| `missing_marketing_permission` en etapa audience | Falta un ID válido antes del POST; no se ha intentado crear el contacto. |
| `timestamp_signup`, `invalid_format` | Mailchimp ha señalado el timestamp: revisar el formato observado y corregirlo con una prueba específica. No atribuirlo a ese campo si el diagnóstico señala otro. |
| `email_address`, `email_validation` | Mailchimp rechaza la dirección por su validación o política; no registrar su valor. |
| `unsupported_parameter` | Revisar el campo indicado frente al contrato del endpoint. No retirar campos de consentimiento a ciegas. |
| `unexpected_subscription_status` | La respuesta no coincide con el estado pedido; no se comunica éxito ni se emite conversión. No se intenta revertir ni reactivar el contacto automáticamente. |
| `unclassified` / `unknown_field` | La respuesta no permite clasificación segura con el esquema actual. No activar un modo de logs crudos; ampliar la clasificación mediante una revisión privada autorizada. |

Las modificaciones de audiencia o producción requieren autorización. Se mantienen consentimiento obligatorio del formulario, origen exacto, límite de cuerpo, validación, campo trampa, comprobación de versiones, respeto de bajas y ausencia de eventos de conversión tras rechazo.

## Pruebas

`npm test`: respuestas controladas, incluida la reproducción de HTTP 400 con datos privados dentro de todos los campos de error, verificación de que no salen por logs ni navegador, rutas de permisos, campos personalizados, timestamps, timeouts y coherencia de double opt-in. Las pruebas no se conectan a Mailchimp.

Fuentes: [Crear contacto](https://mailchimp.com/developer/marketing/api/lists/members/create-member/), [Errores](https://mailchimp.com/developer/marketing/api-concepts/errors), [Merge fields](https://mailchimp.com/developer/marketing/concepts/audiences/merge-fields/).
