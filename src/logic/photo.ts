/**
 * Foto-Auswahl fuer den Avatar. Aktuell WEB-only (die App laeuft primaer als PWA):
 * oeffnet den Datei-Dialog, schneidet quadratisch zu und verkleinert stark auf
 * ~256px als JPEG — so bleibt der Upload klein und schnell.
 *
 * Rueckgabe: Base64 (ohne data:-Prefix) + contentType, oder null (abgebrochen /
 * nicht im Web). Native (Expo Go) koennte spaeter expo-image-picker ergaenzen.
 */
import { Platform } from 'react-native';

const MAX = 256;
const QUALITY = 0.82;

export function canPickPhoto(): boolean {
  return Platform.OS === 'web' && typeof (globalThis as any).document !== 'undefined';
}

export async function pickPhoto(): Promise<{ base64: string; contentType: string } | null> {
  if (!canPickPhoto()) return null;
  const doc: any = (globalThis as any).document;

  const file: File | null = await new Promise((resolve) => {
    const input = doc.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.onchange = () => resolve(input.files && input.files[0] ? input.files[0] : null);
    // Falls der Dialog ohne Auswahl geschlossen wird, bleibt das Promise offen —
    // das ist ok, es wird beim naechsten Versuch neu geoeffnet.
    doc.body.appendChild(input);
    input.click();
    doc.body.removeChild(input);
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
    img.onload = () => {
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
        g.URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', QUALITY));
      } catch (e) {
        reject(e as Error);
      }
    };
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
    img.src = url;
  });
}
