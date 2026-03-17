// GCP IAM authentication for Cloudflare Workers/Pages Functions.
// Signs a JWT with a GCP service account key, exchanges it for a Google OIDC
// identity token, and caches the result until 5 minutes before expiry.

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:jwt-bearer';

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  private_key_id: string;
}

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}

const tokenCache = new Map<string, CachedToken>();

function base64url(input: ArrayBuffer | Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN .*-----/, '')
    .replace(/-----END .*-----/, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

async function signJwt(payload: Record<string, unknown>, key: ServiceAccountKey): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT', kid: key.private_key_id };

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(key.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64url(signature)}`;
}

/**
 * Returns a Google OIDC identity token for the given audience.
 * The token is cached in memory and refreshed 5 minutes before expiry.
 */
export async function getIdentityToken(serviceAccountKeyJson: string, audience: string): Promise<string> {
  const cached = tokenCache.get(audience);
  if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cached.token;
  }

  const key: ServiceAccountKey = JSON.parse(serviceAccountKeyJson);

  const now = Math.floor(Date.now() / 1000);
  const jwt = await signJwt(
    {
      iss: key.client_email,
      sub: key.client_email,
      aud: TOKEN_ENDPOINT,
      iat: now,
      exp: now + 3600,
      target_audience: audience,
    },
    key,
  );

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent(GRANT_TYPE)}&assertion=${encodeURIComponent(jwt)}`,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get identity token: ${res.status} ${text}`);
  }

  const { id_token } = await res.json() as { id_token: string };

  tokenCache.set(audience, {
    token: id_token,
    expiresAt: (now + 3600) * 1000, // JWT exp in ms
  });

  return id_token;
}
