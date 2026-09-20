/**
 * Web-Push-Client (nur Web/PWA): Erlaubnis anfragen, Service-Worker registrieren,
 * ein Push-Abo anlegen und beim Backend fuer EINEN Termin an-/abmelden.
 *
 * ⚠️ iOS: Web-Push funktioniert NUR, wenn die App ueber Safari „Zum Home-Bildschirm"
 * hinzugefuegt wurde (iOS 16.4+). Im normalen Browser-Tab kommt kein Popup.
 * Am Desktop/Android geht es auch im Browser.
 */
import { Platform } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || '';

/** Kann dieses Geraet/dieser Browser ueberhaupt Web-Push? */
export function isPushSupported(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    'Notification' in window
  );
}

let swReg: ServiceWorkerRegistration | null = null;
async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (swReg) return swReg;
  swReg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  return swReg;
}

let cachedKey: string | null = null;
async function publicKey(): Promise<string> {
  if (cachedKey) return cachedKey;
  const res = await fetch(`${API_BASE}/api/push`);
  const data: any = await res.json().catch(() => ({}));
  if (!data?.publicKey) {
    throw new Error('Kein VAPID-Public-Key vom Server (Env-Var VAPID_PUBLIC_KEY setzen).');
  }
  cachedKey = data.publicKey as string;
  return cachedKey;
}

/** Base64URL (VAPID-Key) -> Uint8Array fuer applicationServerKey. */
function urlB64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function getSubscription(): Promise<PushSubscription> {
  const reg = await ensureServiceWorker();
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  const key = await publicKey();
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlB64ToUint8Array(key),
  });
}

export interface PushEventInfo {
  memberId: string;
  memberName?: string;
  eventId: string;
  eventTitle?: string;
  /** ISO-Datum/Zeit des Termins (fuer das 2h-Fenster im Cron). */
  eventDate?: string;
}

/** Erlaubnis holen + Abo anlegen + Termin-Erinnerung beim Backend anmelden. */
export async function enablePushForEvent(info: PushEventInfo): Promise<void> {
  if (!isPushSupported()) throw new Error('Push wird auf diesem Geraet nicht unterstuetzt.');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Keine Benachrichtigungs-Erlaubnis erteilt.');
  const sub = await getSubscription();
  const res = await fetch(`${API_BASE}/api/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'subscribe', ...info, subscription: sub.toJSON() }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.reason || `Anmeldung fehlgeschlagen (HTTP ${res.status}).`);
  }
}

/** Termin-Erinnerung abmelden (das Geraet-Abo bleibt fuer andere Termine bestehen). */
export async function disablePushForEvent(info: PushEventInfo): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const reg = await ensureServiceWorker();
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await fetch(`${API_BASE}/api/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unsubscribe', ...info, subscription: sub.toJSON() }),
    });
  } catch {
    /* still: Abmelden ist best-effort */
  }
}
