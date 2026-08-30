/**
 * Typsicherer Client fuer die Vercel-`api/`-Endpunkte.
 *
 * Die spaeteren Screens rufen NUR diese Funktionen auf (kein fetch im UI-Code).
 * Im Web laeuft alles relativ ("/api/..."). Fuer die native App (Expo Go) die
 * volle Deploy-URL setzen: EXPO_PUBLIC_API_BASE=https://<projekt>.vercel.app
 */
import type { AttendanceRecord, AttendanceStatus, CommunityEvent, Member } from '../types';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || '';

async function call<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: init?.method || 'GET',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.reason || `HTTP ${res.status}`);
  }
  return data as T;
}

// --- Mitglieder ---
export async function getMembers(): Promise<Member[]> {
  return (await call<{ members: Member[] }>('/api/members')).members;
}
export async function createMember(input: {
  name: string;
  email?: string;
  active?: boolean;
}): Promise<Member> {
  return (await call<{ member: Member }>('/api/members', { method: 'POST', body: input })).member;
}

// --- Termine ---
export async function getEvents(): Promise<CommunityEvent[]> {
  return (await call<{ events: CommunityEvent[] }>('/api/events')).events;
}
export async function createEvent(input: {
  title: string;
  date: string;
  location?: string;
  notes?: string;
}): Promise<CommunityEvent> {
  return (await call<{ event: CommunityEvent }>('/api/events', { method: 'POST', body: input })).event;
}

// --- Anwesenheit ---
export async function getAttendance(params: {
  eventId?: string;
  memberId?: string;
} = {}): Promise<AttendanceRecord[]> {
  const q = new URLSearchParams();
  if (params.eventId) q.set('eventId', params.eventId);
  if (params.memberId) q.set('memberId', params.memberId);
  const suffix = q.toString() ? `?${q.toString()}` : '';
  return (await call<{ records: AttendanceRecord[] }>(`/api/attendance${suffix}`)).records;
}
export async function setAttendance(input: {
  memberId: string;
  eventId: string;
  status: AttendanceStatus;
  memberName?: string;
  eventTitle?: string;
}): Promise<AttendanceRecord> {
  return (await call<{ record: AttendanceRecord }>('/api/attendance', { method: 'POST', body: input })).record;
}

// --- Unterschrift ---
export async function signAttendance(input: {
  memberId: string;
  eventId: string;
  signaturePng: string;
  memberName?: string;
  eventTitle?: string;
}): Promise<{ pdfBase64: string; signatureRef: string }> {
  return call<{ pdfBase64: string; signatureRef: string }>('/api/sign', { method: 'POST', body: input });
}

// --- News ---
export async function sendNews(input: {
  subject: string;
  body: string;
  audience?: string;
}): Promise<{ sent: number }> {
  return call<{ sent: number }>('/api/news', { method: 'POST', body: input });
}
