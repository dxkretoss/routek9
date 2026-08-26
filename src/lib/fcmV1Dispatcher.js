/**
 * Google Firebase Cloud Messaging HTTP v1 API Dispatcher
 * Authenticates using Service Account Private Key via Web Crypto RSA-SHA256 signing
 * and dispatches pushes directly to FCM v1 endpoint.
 */

const FIREBASE_SERVICE_ACCOUNT = {
  project_id: "routek9-e3f6b",
  client_email: "firebase-adminsdk-fbsvc@routek9-e3f6b.iam.gserviceaccount.com",
  private_key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCjGjVAPrB4qluq
Ihs8LLcc5QM2j/USWqXNKjcjukfS+NaIljKlrE657Tnpu7o2EVhYI/fnG5FP64J3
OXpmAqsEAoIwHQAie1wy9HCwWKYI1loCkdid1o5Wl6XDGc1mFFFcJDHA+mwqbeJo
yOLpsBGSbqZPBZ5ACxBfEkVm3sESHOdF3C8AFekEIfnIGjVqaf7ByW7pEHeCoTTp
WQriBa2IcjMt3fUNFt3Hxpan8D9GPkL7G60n6RxSQ1W/Ht8VIVHVNGsOt4oR5u+V
Fht0LXfxgiqKYf5sSYmoI6Zb8FJVelZb4VRz5hGSbQLFoCbgBDAbWIA2v9pyOWZ9
fJGFaA3xAgMBAAECggEAA1ZKads/9GWGo3Y93RfMe2hXH3eBscxT3PoZHh9+ye9c
qlRveRLLsgOog+5DshovKFgk9hR5nDb5jQrh3AQ6L3q/wDMfVjJdWk8V+8vfE21C
ChBIt+6OrE4zrmtiTBMsZFcdscJYGFjHWKOiqXFPqaMe+Rz5+RI/bOOiSgSYmIpn
KARSIU6/qAIb2LIZ+z3TraIYTUn/kloMGoLyCkbNt2hfFNGr4OWzGfo/ZN5oTgrD
ODEvjf0kJTjX96kct6PfWzM7cLXoxtO58Bw4rwjeUF0ZzXhn+H37vMByNkMnkgWA
oTsGVOF1OZeEIuPNGRC2djW1E15Nrj6+qNnXrZg4LQKBgQDYw2TRuRv1Eyu5ezVQ
i1xTRGV9ejQJhirrUc26AaKDAdeNzf1SVGdr8p2eYsJ83fqBS5sWy4OdVb8opUHN
TWZdJo1AsNOmnHmtnDpxspHfYFUVP5o112zXVYzZjWxR7b8Ji886nt25B+QfEVZW
I8cCS9VzZcPetXlLojeCNJrA5QKBgQDAoDgdwmKLSCpX32vFKTxdYaNA7wb2LKVx
tnI/faxc7U9lVS5iWfdWtuXcRivWuUVKWBe9LxBMj/JQIAXYXYg3Loi9QBrx5Jw2
TQXPA7zy5qeJ5R/KdUGqf2/u7911BvGZuc20nIEnyEf8VnEwuBMuLmIrrJ2gI6TI
X93ZjcAkHQKBgQCEJ3yMMKNO44VA7FEw7gY37fdCbQLU26vHFHSs9toxrSnSFshf
LX5wXdai/es9Xcigk4vWdfWkMub8zOQ1Wv8Rw7NSwXwIlFXK9vja4Nf2rDCzZ7eJ
I/IDxvC8onBr8tsJ4udRAhKEAL+gAV313pIyYDGezWiBm3p8FkZpZ9EB0QKBgEFX
WBHIOZNTpIFwWWdlCIQItc82Bd+F341GPVUKNWjEWzVdgsF8ESnKGwjwiLhq2nVQ
kqTrDRVbku/ZHQJ7H9TQJTRFRZ6eVNsan4jMlNC0q0pcfb84rVC/r+GWXkHvXA8w
dvX4TNuI1dpkHDtRhbgZpdV41XNYA/Kwilnc+ruFAoGAbHm4WGMUOiM3KKyjmvMw
xYXQEwYE6kHx3zVn2tAgMwYVq6uO4T84jI+/NP0w2bEXnlg0Noe6clJcFpglfUxN
zV/JQw7Q7bjiEeC8qu3glTMu+/a4F5CEJvzEtaKyLIyH8ul6YXhb/xZu87g89tH6
UX750i7gzXFTg59ZPbXPnQQ=
-----END PRIVATE KEY-----`
};

let cachedAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Base64 URL Encoder
 */
function base64UrlEncode(str) {
  const bytes = typeof str === 'string' ? new TextEncoder().encode(str) : new Uint8Array(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Converts PEM private key to binary ArrayBuffer
 */
function pemToArrayBuffer(pem) {
  const b64Lines = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const raw = atob(b64Lines);
  const buffer = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    buffer[i] = raw.charCodeAt(i);
  }
  return buffer.buffer;
}

/**
 * Generates a Google OAuth2 Access Token for Firebase Cloud Messaging HTTP v1
 */
export async function getGoogleOAuth2AccessToken() {
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && tokenExpiresAt > nowSeconds + 60) {
    return cachedAccessToken;
  }

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const payload = {
    iss: FIREBASE_SERVICE_ACCOUNT.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: nowSeconds,
    exp: nowSeconds + 3600
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Sign with Web Crypto API RSA-SHA256
  const keyBuffer = pemToArrayBuffer(FIREBASE_SERVICE_ACCOUNT.private_key);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: { name: 'SHA-256' }
    },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = base64UrlEncode(signatureBuffer);
  const signedJwt = `${unsignedToken}.${encodedSignature}`;

  // Exchange signed JWT for OAuth2 Access Token with Google
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedJwt
    })
  });

  const data = await response.json();
  if (data.access_token) {
    cachedAccessToken = data.access_token;
    tokenExpiresAt = nowSeconds + (data.expires_in || 3600);
    return cachedAccessToken;
  }

  throw new Error(data.error_description || data.error || 'Failed to obtain Google OAuth2 Access Token');
}

/**
 * Dispatches a native push notification to a device token using Firebase Cloud Messaging HTTP v1 API
 */
export async function sendFcmV1PushNotification(fcmToken, title, body, dataPayload = {}) {
  if (!fcmToken || typeof fcmToken !== 'string' || !fcmToken.trim()) {
    return { success: false, error: 'Missing fcm_token' };
  }

  try {
    const accessToken = await getGoogleOAuth2AccessToken();
    const cleanToken = fcmToken.trim();
    const orderMatch = `${title} ${body}`.match(/RK-[A-Za-z0-9]+|ORD-[A-Za-z0-9]+/i);
    const orderTag = orderMatch ? `order-${orderMatch[0].toUpperCase()}` : 'routek9-general';

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${FIREBASE_SERVICE_ACCOUNT.project_id}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          message: {
            token: cleanToken,
            notification: {
              title: title || 'RouteK9 Notification',
              body: body || 'You have a new update in RouteK9.'
            },
            data: {
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
              title: title || 'RouteK9 Notification',
              body: body || 'You have a new update in RouteK9.',
              tag: orderTag,
              ...Object.fromEntries(
                Object.entries(dataPayload).map(([k, v]) => [k, String(v ?? '')])
              )
            },
            android: {
              priority: 'HIGH',
              notification: {
                sound: 'default',
                channel_id: 'high_importance_channel',
                notification_priority: 'PRIORITY_HIGH',
                default_vibrate_timings: true,
                tag: orderTag
              }
            },
            webpush: {
              headers: {
                Urgency: 'high',
                Topic: orderTag
              },
              notification: {
                title: title || 'RouteK9 Notification',
                body: body || 'You have a new update in RouteK9.',
                icon: '/favicon.png',
                badge: '/favicon.png',
                tag: orderTag,
                renotify: false,
                requireInteraction: false
              },
              fcm_options: {
                link: String(dataPayload?.url || dataPayload?.click_action || '/dispatch-orders')
              }
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                  'content-available': 1,
                  'thread-id': orderTag
                }
              }
            }
          }
        })
      }
    );

    const result = await response.json();
    if (response.ok) {
      console.log('✅ [FCM v1 Push] Push delivered successfully to device:', result.name || cleanToken.substring(0, 15));
      return { success: true, result };
    } else {
      const isUnregistered = result.error?.code === 404 || 
        result.error?.message === 'NotRegistered' || 
        result.error?.details?.some?.(d => d.errorCode === 'UNREGISTERED');

      if (isUnregistered) {
        console.info('ℹ️ [FCM v1 Push] Device token has expired or is unregistered on Google FCM. Device will refresh on next launch.');
      } else {
        console.warn('⚠️ [FCM v1 Push] Google returned notice:', result.error?.message || result);
      }
      return { success: false, error: result.error?.message || 'Push failed', isUnregistered };
    }
  } catch (err) {
    console.warn('❌ [FCM v1 Push] Execution error:', err.message);
    return { success: false, error: err.message };
  }
}
