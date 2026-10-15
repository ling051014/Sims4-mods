// L1nG: use Cloudflare's server-provided request.cf.country for regional consent.
// Never return IPs, log visitors, or guess region from browser language.
const OPT_OUT_ALLOWED = new Set(['TW','US','JP','AU','NZ','SG']);
const PRE_CONSENT_REQUIRED = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU',
  'IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES',
  'SE','IS','LI','NO','GB','CH'
]);

export function onRequestGet({request}) {
  const country = request.cf?.country;
  const valid = typeof country === 'string' && /^[A-Z]{2}$/.test(country);
  // Conservative policy: unknown/unreviewed countries require opt-in.
  const mode = valid && OPT_OUT_ALLOWED.has(country) && !PRE_CONSENT_REQUIRED.has(country)
    ? 'opt-out' : 'opt-in';
  return new Response(JSON.stringify({mode}), {
    headers: {
      'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':'no-store, private',
      'X-Content-Type-Options':'nosniff'
    }
  });
}
