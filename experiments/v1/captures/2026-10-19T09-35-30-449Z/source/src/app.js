import { config } from './config.js';
import { initConsent, trackLead } from './analytics.js';
initConsent();
const form = document.querySelector('#waitlist');
let busy = false;
form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || !form.reportValidity()) return;
  busy = true;
  const button = document.querySelector('#submit');
  const status = document.querySelector('#form-status');
  const original = button.innerHTML;
  button.disabled = true;
  button.textContent = 'Enviando…';
  form.setAttribute('aria-busy', 'true');
  status.className = '';
  status.textContent = '';
  try {
    const response = await fetch('/api/subscribe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email.value.trim(), privacy: form.privacy.checked,
        website: form.website.value, version: config.version, privacyVersion: config.privacyVersion }),
      signal: AbortSignal.timeout(25000)
    });
    const result = await response.json();
    if (!response.ok || !result.accepted) throw new Error(result.message || 'No se ha podido enviar. Inténtalo de nuevo más tarde.');
    status.textContent = result.message;
    trackLead(result);
    form.reset();
  } catch (error) {
    status.className = 'error';
    status.textContent = ['TimeoutError', 'AbortError', 'TypeError', 'SyntaxError'].includes(error.name)
      ? 'No hemos podido confirmar el envío. Comprueba tu conexión y vuelve a intentarlo; no se duplicará tu registro.'
      : error.message;
  } finally {
    busy = false;
    button.disabled = false;
    button.innerHTML = original;
    form.removeAttribute('aria-busy');
    status.focus();
  }
});
