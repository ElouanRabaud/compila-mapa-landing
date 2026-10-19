// Never log upstream bodies, messages, field values, URLs, identifiers or exceptions.
// Every string emitted below comes from a fixed vocabulary, except our random reference.
const PAYLOAD_FIELDS = ['email_address', 'status', 'language', 'timestamp_signup', 'tags', 'marketing_permissions', 'merge_fields'];
const TITLES = new Map([
  ['Invalid Resource', 'invalid_resource'], ['Bad Request', 'bad_request'],
  ['Member Exists', 'member_exists'], ['Forgotten Email Not Subscribed', 'forgotten_contact'],
  ['API Key Invalid', 'invalid_credentials'], ['API Key Missing', 'missing_credentials'],
  ['Forbidden', 'forbidden'], ['Too Many Requests', 'rate_limited']
]);
const CANONICAL = new Set([
  ...PAYLOAD_FIELDS, 'tags[]', 'marketing_permissions[].marketing_permission_id',
  'marketing_permissions[].enabled', 'merge_fields.FNAME', 'merge_fields.LNAME',
  'merge_fields.ADDRESS', 'merge_fields.PHONE', 'merge_fields.BIRTHDAY', 'merge_fields.COMPANY'
]);
export function safeField(raw, mergeFields = []) {
  if (typeof raw !== 'string' || raw.length > 200) return { field: 'unknown_field' };
  // Mailchimp reports either FNAME, merge_fields.FNAME, or a JSON pointer.
  const path = raw.replace(/^\//, '').replace(/\//g, '.').replace(/\[\d+\]/g, '[]').replace(/\.\d+(?=\.|$)/g, '[]');
  if (CANONICAL.has(path)) return { field: path };
  if (CANONICAL.has('merge_fields.' + path)) return { field: 'merge_fields.' + path };
  const tag = path.startsWith('merge_fields.') ? path.slice(13) : path;
  const custom = Array.isArray(mergeFields) && mergeFields.find(item => item?.tag === tag && Number.isSafeInteger(item.merge_id) && item.merge_id >= 0);
  // A custom tag/name can itself contain PII. Only emit its numeric schema ID.
  return custom ? { field: 'merge_fields.custom', mergeFieldId: custom.merge_id } : { field: 'unknown_field' };
}
function reason(text) {
  if (typeof text !== 'string') return 'unclassified';
  if (/required|must provide|please enter a value|missing.*(?:field|value)/i.test(text)) return 'required_field';
  if (/unknown field|unrecognized|unexpected property|additional propert|not allowed|unsupported.*(?:field|parameter)/i.test(text)) return 'unsupported_parameter';
  if (/merge fields.*invalid/i.test(text)) return 'merge_validation';
  if (/marketing.permission|permission.*(?:invalid|not found|does not exist)/i.test(text)) return 'marketing_permission_validation';
  if (/timestamp|date.time|date format|valid date|format/i.test(text)) return 'invalid_format';
  if (/email.*(?:invalid|valid|rejected|banned|fake)|(?:invalid|valid).*email/i.test(text)) return 'email_validation';
  if (/status|subscri.*(?:state|pending)/i.test(text)) return 'subscription_state';
  if (/invalid|could not be validated/i.test(text)) return 'invalid_value';
  return 'unclassified';
}
export function diagnostic({ reference = crypto.randomUUID(), stage, status, data, payload, audience, mergeFields, code }) {
  const fields = (Array.isArray(data?.errors) ? data.errors : []).slice(0, 20).map(error => ({
    ...safeField(error?.field, mergeFields), reason: reason(error?.message)
  }));
  // Some errors only identify the rejected parameter in detail, without errors[].
  // Match fixed API names; never extract arbitrary text from detail.
  if (!fields.length && typeof data?.detail === 'string') {
    for (const field of PAYLOAD_FIELDS) {
      if (new RegExp('\\b' + field + '\\b').test(data.detail)) fields.push({ field, reason: reason(data.detail) });
    }
  }
  const result = {
    event: 'mailchimp_diagnostic', schemaVersion: 1, reference,
    stage: ['audience', 'member', 'merge_schema'].includes(stage) ? stage : 'unknown',
    upstreamStatus: Number.isInteger(status) && status >= 100 && status <= 599 ? status : null,
    errorType: TITLES.get(data?.title) || 'unclassified',
    reason: ['audience_mismatch', 'invalid_audience_configuration', 'missing_marketing_permission',
      'unexpected_subscription_status', 'timeout', 'upstream_unavailable', 'invalid_json_response'].includes(code) ? code : reason(data?.detail),
    fields,
    payloadFields: PAYLOAD_FIELDS.filter(field => Object.hasOwn(payload || {}, field)),
    requestedStatus: ['pending', 'subscribed'].includes(payload?.status) ? payload.status : null,
    doubleOptIn: typeof audience?.double_optin === 'boolean' ? audience.double_optin : null,
    marketingPermissions: typeof audience?.marketing_permissions === 'boolean' ? audience.marketing_permissions : null
  };
  return result;
}
export function reportDiagnostic(context) {
  const report = diagnostic(context);
  console.warn(JSON.stringify(report));
  return report.reference;
}
