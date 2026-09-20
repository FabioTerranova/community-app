/**
 * Notion-Schema der Community-App — zentral, damit alle api-Functions dieselben
 * Datenbank-Namen, Env-Var-IDs und Spalten verwenden.
 *
 * Spalten werden bei Bedarf automatisch angelegt (ensureProperties). Du musst in
 * Notion nur je eine Datenbank anlegen (Titel enthaelt das Stichwort unten) und
 * mit der Integration teilen — den Rest ergaenzt die App.
 */

export interface DbConfig {
  /** Titel-Muster fuer die Auto-Suche (case-insensitive). */
  match: RegExp;
  /** Name der Env-Var mit fester DB-ID (optional, ueberschreibt die Suche). */
  env: string;
  /** Gewuenschte Spalten (Notion-Property-Definitionen), ohne die Titel-Spalte. */
  props: Record<string, any>;
}

export const MEMBERS: DbConfig = {
  match: /mitglied|member/i,
  env: 'NOTION_MEMBERS_DB_ID',
  props: {
    'E-Mail': { email: {} },
    Aktiv: { checkbox: {} },
  },
};

export const EVENTS: DbConfig = {
  match: /termin|event/i,
  env: 'NOTION_EVENTS_DB_ID',
  props: {
    Datum: { date: {} },
    Ort: { rich_text: {} },
    Notizen: { rich_text: {} },
  },
};

export const ATTENDANCE: DbConfig = {
  match: /anwesenheit|attendance|teilnahme/i,
  env: 'NOTION_ATTENDANCE_DB_ID',
  props: {
    'Mitglied-ID': { rich_text: {} },
    Mitglied: { rich_text: {} },
    'Termin-ID': { rich_text: {} },
    Termin: { rich_text: {} },
    Status: {
      select: {
        options: [
          { name: 'yes', color: 'green' },
          { name: 'no', color: 'red' },
          { name: 'maybe', color: 'yellow' },
          { name: 'attended', color: 'blue' },
        ],
      },
    },
    'Unterschrieben am': { date: {} },
    Unterschrift: { rich_text: {} },
  },
};

/**
 * Push-Abos fuer Termin-Erinnerungen (Web-Push, ~2h vor Beginn).
 * Eine Zeile = ein Geraet-Abo fuer EINEN Termin. Endpoint/Keys stammen aus dem
 * Browser-Push-Abo. `Gesendet` verhindert doppelten Versand.
 */
export const PUSH: DbConfig = {
  match: /push|erinnerung|reminder|abo/i,
  env: 'NOTION_PUSH_DB_ID',
  props: {
    'Mitglied-ID': { rich_text: {} },
    Mitglied: { rich_text: {} },
    'Termin-ID': { rich_text: {} },
    Termin: { rich_text: {} },
    'Termin-Datum': { date: {} },
    Endpoint: { rich_text: {} },
    P256dh: { rich_text: {} },
    Auth: { rich_text: {} },
    Gesendet: { checkbox: {} },
  },
};

/** Liest eine feste DB-ID aus der Umgebung (oder undefined fuer Auto-Suche). */
export const envId = (cfg: DbConfig): string | undefined => process.env[cfg.env];
