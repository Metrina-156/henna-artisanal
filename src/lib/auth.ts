const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-default-secret-key-32-chars';

// Base64 converters compatible with standard Node and Edge browser environments
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate cryptographic key for HMAC
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Encodes, signs, and generates a session token using native Web Crypto subtle APIs.
 * Runs seamlessly in both Edge runtime (middleware) and standard Node environment.
 */
export async function signSessionToken(
  payload: { email: string; role: string },
  expiryDays: number = 7
): Promise<string> {
  const expiry = Date.now() + expiryDays * 24 * 60 * 60 * 1000;
  const dataObject = { ...payload, expiry };
  const dataStr = JSON.stringify(dataObject);

  const key = await getCryptoKey(JWT_SECRET);
  const encoder = new TextEncoder();
  
  // Sign the raw string data
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(dataStr));
  const signatureStr = arrayBufferToBase64(signatureBuffer);

  // Encode payload to base64 safely supporting Unicode characters
  const dataBase64 = btoa(encodeURIComponent(dataStr));
  return `${dataBase64}.${signatureStr}`;
}

/**
 * Validates, checks expiration, and verifies the signature of a session token.
 * Returns null if signature verification fails or token has expired.
 */
export async function verifySessionToken(
  token: string
): Promise<{ email: string; role: string } | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [dataBase64, signatureStr] = parts;

  try {
    const dataStr = decodeURIComponent(atob(dataBase64));
    const dataObject = JSON.parse(dataStr);

    // Expiry validation check
    if (Date.now() > dataObject.expiry) {
      console.warn('Session token has expired.');
      return null;
    }

    const key = await getCryptoKey(JWT_SECRET);
    const encoder = new TextEncoder();
    const sigBuffer = base64ToArrayBuffer(signatureStr);

    // Verify HMAC-SHA256 signature
    const isValid = await crypto.subtle.verify('HMAC', key, sigBuffer, encoder.encode(dataStr));
    if (!isValid) {
      console.warn('Session token signature check failed.');
      return null;
    }

    return {
      email: dataObject.email,
      role: dataObject.role,
    };
  } catch (error) {
    console.error('Session token verification failed:', error);
    return null;
  }
}

/**
 * Signs a guest order token to authenticate guests viewing their checkout success receipt.
 */
export async function signGuestOrderToken(orderId: string): Promise<string> {
  const key = await getCryptoKey(JWT_SECRET);
  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(orderId));
  return arrayBufferToBase64(signatureBuffer);
}

/**
 * Verifies a guest order token against the given order ID.
 */
export async function verifyGuestOrderToken(orderId: string, token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const key = await getCryptoKey(JWT_SECRET);
    const encoder = new TextEncoder();
    const sigBuffer = base64ToArrayBuffer(token);
    return await crypto.subtle.verify('HMAC', key, sigBuffer, encoder.encode(orderId));
  } catch (error) {
    console.error('Guest order token verification failed:', error);
    return false;
  }
}

