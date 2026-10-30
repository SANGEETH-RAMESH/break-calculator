// Service Worker Push Listener for iPhone (APNs) and Android (FCM)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Break Calculator', body: event.data.text() };
    }
  }

  const title = data.title || 'Thambi... time aayiduchu! ⏰';
  const options = {
    body: data.body || 'Your break is over. Time to get back to work! 💪',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'break-reminder',
    requireInteraction: true,
    vibrate: [300, 150, 300, 150, 300],
    sound: '/sounds/break-alert.mp3',
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
  };

  // Broadcast to all open tabs/windows to play the alert sound immediately
  const notifyClients = self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((windowClients) => {
      windowClients.forEach((client) => {
        client.postMessage({ type: 'PLAY_BREAK_SOUND' });
      });
    })
    .catch((err) => console.warn('Could not postMessage to clients:', err));

  event.waitUntil(Promise.all([self.registration.showNotification(title, options), notifyClients]));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const base = (event.notification.data && event.notification.data.url) || '/';
  const urlToOpen = base.includes('?') ? `${base}&playAlarm=1` : `${base}?playAlarm=1`;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url && 'focus' in client) {
          client.postMessage({ type: 'PLAY_BREAK_SOUND' });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
