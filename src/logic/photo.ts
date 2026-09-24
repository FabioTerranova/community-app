/**
 * Foto-Auswahl fuer den Avatar. Aktuell WEB-only (die App laeuft primaer als PWA):
 * oeffnet den Datei-Dialog, schneidet quadratisch zu und verkleinert stark auf
 * ~256px als JPEG — so bleibt der Upload klein und schnell (~10–30 KB).
 *
 * Robust gebaut: erkennt Abbruch (cancel-Event + Fokus-Fallback), damit der
 * aufrufende Spinner nie haengen bleibt; das <input> bleibt bis zur Auswahl im
 * DOM (offscreen statt display:none -> iOS/Safari-tauglich).
 *
 * Rueckgabe: Base64 (ohne data:-Prefix) + contentType, oder null (abgebrochen /
 * nicht im Web). Native (Expo Go) koennte spaeter expo-image-picker ergaenzen.
 */
import { Platform } from 'react-native';

const MAX = 256;
const QUALITY = 0.82;
const DECODE_TIMEOUT_MS = 15000;

export function canPickPhoto(): boolean {
  return Platform.OS === 'web' && typeof (globalThis as any).document !== 'undefined';
}

export async function pickPhoto(): Promise<{ base64: string; contentType: string } | null> {
  if (!canPickPhoto()) return null;
  const g: any = globalThis as any;
  const doc: any = g.document;

  const file: File | null = await new Promise((resolve) => {
    const input = doc.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // Offscreen statt display:none (iOS Safari oeffnet display:none-Inputs teils nicht).
    input.style.position = 'fixed';
    input.style.left = '-10000px';
    input.style.top = '0';
    input.style.opacity = '0';

    let done = false;
    const finish = (f: File | null) => {
      if (done) return;
      done = true;
      try {
        g.removeEventListener && g.removeEventListener('focus', onFocus);
      } catch {}
      try {
        input.remove();
      } catch {}
      resolve(f);
    };

    const onChange = () => finish(input.files && input.files[0] ? input.files[0] : null);
    // Abbruch: modernes 'cancel'-Event + Fallback ueber Fokus-Rueckkehr ins Fenster.
    const onCancel = () => finish(null);
    const onFocus = () => {
      // Nach Schliessen des Dialogs kurz warten; kam kein 'change' -> Abbruch.
      setTimeout(() => {
        if (!input.files || input.files.length === 0) finish(null);
      }, 1200);
    };

    input.addEventListener('change', onChange);
    input.addEventListener('cancel', onCancel);
    doc.body.appendChild(input);
    try {
      g.addEventListener && g.addEventListener('focus', onFocus);
    } catch {}
    input.click();
  });

  if (!file) return null;
  const dataUrl = await downscaleSquare(file);
  const base64 = dataUrl.split(',')[1] || '';
  return base64 ? { base64, contentType: 'image/jpeg' } : null;
}

/** Laedt die Datei, schneidet mittig quadratisch zu und skaliert auf MAX px (JPEG). */
function downscaleSquare(file: File): Promise<string> {
  const g: any = globalThis as any;
  return new Promise((resolve, reject) => {
    const url = g.URL.createObjectURL(file);
    const img = new g.Image();
    let settled = false;
    const cleanup = () => {
      try {
        g.URL.revokeObjectURL(url);
      } catch {}
    };
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Bild-Format wird nicht unterstuetzt (evtl. HEIC). Bitte JPG/PNG waehlen.'));
    }, DECODE_TIMEOUT_MS);

    img.onload = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const out = Math.min(MAX, side);
        const canvas = g.document.createElement('canvas');
        canvas.width = out;
        canvas.height = out;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out);
        cleanup();
        resolve(canvas.toDataURL('image/jpeg', QUALITY));
      } catch (e) {
        cleanup();
        reject(e as Error);
      }
    };
    img.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cleanup();
      reject(new Error('Bild konnte nicht geladen werden. Bitte ein anderes Foto (JPG/PNG) waehlen.'));
    };
    img.src = url;
  });
}
