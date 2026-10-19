import { config } from './config.js';
const KEY = 'compila-mapa-consent-v1';
const TTL = 180 * 24 * 60 * 60 * 1000;
let consent = null;
let loaded = false;
const seen = new Set();
function readConsent() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && ['granted', 'denied'].includes(saved.value) && saved.at <= Date.now() && Date.now() - saved.at < TTL) return saved.value;
  } catch { /* El almacenamiento puede estar bloqueado. */ }
  return null;
}
export function cleanLocation(raw) {
  const url = new URL(raw);
  const clean = new URL(url.origin + url.pathname);
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const value = url.searchParams.get(key);
    if (value && /^[a-zA-Z0-9_-]{1,100}$/.test(value)) clean.searchParams.set(key, value);
  }
  return clean.href;
}
function loadAnalytics() {
  if (loaded || consent !== 'granted' || location.origin !== config.origin) return;
  loaded = true;
  window['ga-disable-' + config.analyticsId] = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  window.gtag('consent', 'update', { analytics_storage: 'granted' });
  window.gtag('js', new Date());
  let referrer = '';
  try { if (document.referrer) referrer = new URL(document.referrer).origin + '/'; } catch { /* Sin referente válido. */ }
  window.gtag('config', config.analyticsId, {
    page_location: cleanLocation(location.href), page_referrer: referrer,
    cookie_domain: location.hostname, cookie_expires: 60 * 60 * 24 * 180,
    allow_google_signals: false, allow_ad_personalization_signals: false,
    landing_version: config.version, experiment_id: config.experiment
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + config.analyticsId;
  document.head.append(script);
}
function clearAnalyticsCookies() {
  for (const entry of document.cookie.split(';')) {
    const name = entry.trim().split('=')[0];
    if (!/^_ga($|_)/.test(name)) continue;
    document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax';
    document.cookie = name + '=; Max-Age=0; Path=/; Domain=' + location.hostname + '; SameSite=Lax';
  }
}
export function initConsent() {
  const banner = document.querySelector('#cookie-banner');
  if (!banner) return;
  consent = readConsent();
  banner.hidden = consent !== null;
  loadAnalytics();
  document.querySelector('#cookie-settings')?.addEventListener('click', () => {
    banner.hidden = false;
    banner.querySelector('button').focus();
  });
  banner.querySelectorAll('[data-consent]').forEach(button => button.addEventListener('click', () => {
    consent = button.dataset.consent;
    try { localStorage.setItem(KEY, JSON.stringify({ value: consent, at: Date.now() })); } catch { /* Consentimiento solo durante esta visita. */ }
    banner.hidden = true;
    if (consent === 'granted') loadAnalytics();
    else {
      window['ga-disable-' + config.analyticsId] = true;
      clearAnalyticsCookies();
      if (loaded) location.reload();
    }
  }));
}
export function trackLead(result) {
  if (consent !== 'granted' || !loaded || !result.created || !result.receipt || seen.has(result.receipt)) return;
  const key = 'compila-lead-' + result.receipt;
  try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch { /* Set evita duplicados en memoria. */ }
  seen.add(result.receipt);
  window.gtag('event', 'generate_lead', {
    landing_version: config.version, experiment_id: config.experiment,
    lead_type: 'waitlist', subscription_status: result.subscriptionStatus,
    method: 'mailchimp', ...{ page_location: cleanLocation(location.href) }
  });
}
