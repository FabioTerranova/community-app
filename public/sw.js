/* JUHA Service-Worker — empfaengt Web-Push und zeigt die Benachrichtigung an.
   Liegt in public/ und wird so im Web-Dev-Server UND im Export (dist/) unter /sw.js
   ausgeliefert. Registriert wird er clientseitig in src/logic/push.ts. */

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'JUHA';
  const options = {
    body: data.body || 'Erinnerung an einen Termin.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: data.tag || 'juha-reminder',
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});

// Sofort aktiv werden, nicht auf Reload warten.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
