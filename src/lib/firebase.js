import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { saveUserFcmToken } from './supabase';

export const firebaseConfig = {
  apiKey: "AIzaSyD21GJ1QjLLrI3he70oXC9Tbgmodf5Jv5c",
  authDomain: "routek9-e3f6b.firebaseapp.com",
  projectId: "routek9-e3f6b",
  storageBucket: "routek9-e3f6b.firebasestorage.app",
  messagingSenderId: "36617032545",
  appId: "1:36617032545:web:53ca8974776ab6a5dc2b20"
};

export const VAPID_KEY = "BBN3E-n8Z_CxWCgCy_nnZkHMhxuROPME2q4jLrTk6zdczp8CHAADBwQjh7qx-OSKM-64Ipm2sFUxWQhDOXOi9yM";

// Initialize Firebase App safely (singleton pattern)
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * Get or register the Firebase Messaging Service Worker registration
 */
async function getOrRegisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    return registration;
  } catch (err) {
    console.warn('[Firebase] Service Worker registration notice:', err);
    return null;
  }
}

/**
 * Request notification permission and retrieve FCM device token
 * @param {string} userId - Optional user ID to associate token in DB
 * @returns {Promise<string|null>} FCM registration token or null
 */
export async function requestFcmToken(userId = null) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  try {
    const supported = await isSupported();
    if (!supported) {
      console.info('[Firebase] Web push messaging is not supported in this environment.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('[Firebase] Notification permission not granted:', permission);
      return null;
    }

    const swRegistration = await getOrRegisterServiceWorker();
    const messaging = getMessaging(firebaseApp);

    const tokenOptions = {
      vapidKey: VAPID_KEY
    };
    if (swRegistration) {
      tokenOptions.serviceWorkerRegistration = swRegistration;
    }

    const currentToken = await getToken(messaging, tokenOptions);

    if (currentToken) {
      if (userId) {
        await saveUserFcmToken(userId, currentToken);
      }
      return currentToken;
    }
    return null;
  } catch (err) {
    console.warn('[Firebase] Notice retrieving FCM token:', err);
    return null;
  }
}

/**
 * Set up foreground push message listener
 * @param {Function} onMessageCallback - Callback triggered with message payload
 * @returns {Function|null} Unsubscribe function
 */
export async function listenToForegroundMessages(onMessageCallback) {
  if (typeof window === 'undefined') return null;

  try {
    const supported = await isSupported();
    if (!supported) return null;

    const messaging = getMessaging(firebaseApp);
    return onMessage(messaging, (payload) => {
      if (typeof onMessageCallback === 'function') {
        onMessageCallback(payload);
      }
    });
  } catch (err) {
    console.warn('[Firebase] Notice setting up foreground listener:', err);
    return null;
  }
}

/**
 * Show a native OS/Browser Desktop Notification banner
 */
export function showBrowserDesktopNotification(title, options = {}) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[Desktop Notif] Notification API not supported in this browser.');
    return;
  }

  console.log('[Desktop Notif] Current permission:', Notification.permission, '| Dispatching:', title);

  const defaultOptions = {
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: options.tag || `routek9-${Date.now()}`,
    renotify: true,
    requireInteraction: false,
    data: {
      url: options.url || '/dispatch-orders'
    },
    ...options
  };

  if (Notification.permission === 'granted') {
    // 1. Trigger via standard browser Notification API
    try {
      const notif = new Notification(title, defaultOptions);
      notif.onclick = () => {
        window.focus();
        if (options.url) window.location.href = options.url;
      };
    } catch (e) {
      console.warn('[Desktop Notif] Standard notification notice:', e.message);
    }

    // 2. Also trigger via Service Worker registration for OS tray delivery
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          return reg.showNotification(title, defaultOptions);
        })
        .catch((swErr) => {
          console.warn('[Desktop Notif] Service Worker notice:', swErr.message);
        });
    }
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      console.log('[Desktop Notif] User responded to permission prompt:', permission);
      if (permission === 'granted') {
        showBrowserDesktopNotification(title, options);
      }
    });
  } else {
    console.warn('[Desktop Notif] Blocked: Notification.permission is "denied" for this site. Enable it in Chrome site settings (click the icon next to localhost in URL bar).');
  }
}

if (typeof window !== 'undefined') {
  window.testDesktopNotification = (title, body) => {
    showBrowserDesktopNotification(title || '⚡ Test Order RK-9999', {
      body: body || 'New nearby dispatch order available • Payout: $350.00',
      url: '/dispatch-orders'
    });
  };
}

let sharedAudioCtx = null;

function getUnlockedAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

// Unlock Web Audio context on user's first interaction anywhere on the page
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    getUnlockedAudioContext();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}

/**
 * Play an audible chime sound when a new dispatch order arrives
 */
export function playNotificationSound() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getUnlockedAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => playChimeTone(ctx)).catch(() => {});
    } else {
      playChimeTone(ctx);
    }
  } catch (e) {
    console.warn('[Audio] Notice playing notification chime:', e.message);
  }
}

function playChimeTone(ctx) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch (err) {
    // Ignore audio rendering errors
  }
}
