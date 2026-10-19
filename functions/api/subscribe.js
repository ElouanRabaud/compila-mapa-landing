import { config } from '../../src/config.js';
const MAX_BODY = 4096;
function reply(status, payload) {
  return new Response(JSON.stringify(payload), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'"
  } });
}
function failure(status, message) { return reply(status, { accepted: false, message }); }
async function readBody(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('body');
  let length = 0;
  const chunks = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BODY) { await reader.cancel(); throw new Error('size'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } });
  const origin = new URL(request.url).origin;
  if (request.headers.get('Origin') !== origin || origin !== env.SITE_ORIGIN) return failure(403, 'No se permite enviar desde este origen.');
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return failure(415, 'Formato de solicitud no admitido.');
  let body;
  try { body = await readBody(request); } catch { return failure(400, 'Solicitud no válida o demasiado grande.'); }
  if (!body || typeof body !== 'object') return failure(400, 'Solicitud no válida.');
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>.]+(?:\.[^\s@<>.]+)+$/.test(email) || email.split('@')[0].length > 64) return failure(400, 'Introduce un correo electrónico válido.');
  if (body.privacy !== true) return failure(400, 'Necesitamos tu consentimiento para avisarte por email.');
  if (body.website || body.version !== config.version || body.privacyVersion !== config.privacyVersion) return failure(400, 'Recarga la página y vuelve a intentarlo.');
  const key = env.MAILCHIMP_API_KEY || '';
  const dc = key.match(/-(us[0-9]+)$/)?.[1];
  const list = env.MAILCHIMP_AUDIENCE_ID;
  if (env.REGISTRATION_ENABLED !== 'true' || !dc || !/^[a-zA-Z0-9]+$/.test(list || '')) return failure(503, 'La lista de espera aún no está abierta. Vuelve a intentarlo más adelante.');
  const endpoint = `https://${dc}.api.mailchimp.com/3.0/lists/${list}`;
  const headers = { Authorization: 'Basic ' + btoa('compila:' + key), 'Content-Type': 'application/json' };
  const mc = async (url, options = {}) => {
    const response = await fetch(url, { ...options, headers, signal: AbortSignal.timeout(9000) });
    let data;
    try { data = await response.json(); } catch { throw new Error('upstream'); }
    return { response, data };
  };
  try {
    const audience = await mc(endpoint);
    if (!audience.response.ok || audience.data.name !== 'Compila Mapa' || typeof audience.data.double_optin !== 'boolean') throw new Error('audience');
    const permission = env.MAILCHIMP_MARKETING_PERMISSION_ID;
    if (audience.data.marketing_permissions && !/^[a-zA-Z0-9]+$/.test(permission || '')) throw new Error('permission');
    const payload = {
      email_address: email, status: audience.data.double_optin ? 'pending' : 'subscribed',
      language: 'es', timestamp_signup: new Date().toISOString(),
      tags: ['compila-mapa', 'landing:' + config.version, 'consent:' + config.privacyVersion]
    };
    if (audience.data.marketing_permissions) payload.marketing_permissions = [{ marketing_permission_id: permission, enabled: true }];
    // POST crea exclusivamente: no reactiva bajas ni sobrescribe contactos existentes.
    const member = await mc(endpoint + '/members', { method: 'POST', body: JSON.stringify(payload) });
    if (!member.response.ok) {
      if (member.data.title === 'Member Exists') return reply(200, {
        accepted: true, created: false, subscriptionStatus: 'existing',
        message: 'Este correo ya figura en la audiencia. Si tenías una confirmación pendiente, revisa tu bandeja de entrada y spam. Si te diste de baja, utiliza el formulario de Mailchimp para volver a solicitar el alta.'
      });
      if (member.response.status === 400) return failure(422, 'Mailchimp no ha aceptado el alta. Revisa el correo. Si te diste de baja anteriormente, vuelve a suscribirte desde el formulario de Mailchimp.');
      throw new Error('mailchimp');
    }
    if (!['pending', 'subscribed'].includes(member.data.status)) throw new Error('status');
    const pending = member.data.status === 'pending';
    return reply(200, { accepted: true, created: true, receipt: crypto.randomUUID(),
      subscriptionStatus: member.data.status,
      message: pending ? '¡Solicitud recibida! Revisa tu correo y pulsa el enlace de Mailchimp para confirmar tu dirección. Hasta entonces, tu suscripción está pendiente. Mira también en spam.' : '¡Ya estás en la lista de espera! Te avisaremos por email cuando Compila Mapa esté disponible. No necesitas confirmar otro correo.'
    });
  } catch {
    // No registrar correos, claves ni cuerpos de respuesta de Mailchimp.
    return failure(503, 'No hemos podido confirmar el alta con Mailchimp. Inténtalo de nuevo más tarde; no se duplicará tu registro.');
  }
}
