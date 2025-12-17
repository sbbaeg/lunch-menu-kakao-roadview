self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push event received!');
  
  let data;
  try {
    data = event.data?.json() || {};
  } catch (e) {
    console.error('[Service Worker] Failed to parse push data:', e);
    data = {};
  }

  const { title, body, icon, badgeCount } = data;

  const broadcastDebug = (message) => {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        client.postMessage({ type: 'debug', message });
      }
    });
  };

  broadcastDebug(`[SW] Push received. Raw data: ${JSON.stringify(data)}`);
  broadcastDebug(`[SW] Parsed - Title: ${title}, Body: ${body}, Badge: ${badgeCount}`);

  // 뱃지 카운트 업데이트
  if ('setAppBadge' in navigator) {
    broadcastDebug('[SW] Badging API is supported.');
    if (badgeCount !== undefined) {
      const count = parseInt(badgeCount, 10);
      if (!isNaN(count)) {
        navigator.setAppBadge(count)
          .then(() => broadcastDebug(`[SW] App badge set to ${count}.`))
          .catch(error => {
            console.error('[Service Worker] Failed to set app badge:', error);
            broadcastDebug(`[SW] Error setting badge: ${error.message}`);
          });
      } else {
        broadcastDebug(`[SW] badgeCount is not a number: ${badgeCount}`);
      }
    } else {
      broadcastDebug('[SW] badgeCount is undefined.');
    }
  } else {
    broadcastDebug('[SW] Badging API not supported.');
  }

  // 알림 표시 로직
  const notificationPromise = new Promise((resolve, reject) => {
    if (!title) {
      broadcastDebug('[SW] Notification title is missing, skipping showNotification.');
      // A push event must be handled by showing a notification, so show a default one.
      self.registration.showNotification('새 알림', { body: '새로운 알림이 도착했습니다.' })
        .then(resolve)
        .catch(e => {
            broadcastDebug(`[SW] Default notification failed: ${e.message}`);
            reject(e);
        });
    } else {
      broadcastDebug('[SW] Attempting to show notification...');
      self.registration.showNotification(title, {
        body: body || '새로운 알림이 도착했습니다.',
        icon: icon || '/icon.png',
      })
      .then(() => {
        broadcastDebug('[SW] showNotification successful.');
        resolve();
      })
      .catch(e => {
        console.error('[Service Worker] Failed to show notification:', e);
        broadcastDebug(`[SW] showNotification failed: ${e.message}`);
        reject(e);
      });
    }
  });

  // UI 업데이트를 위한 메시지 브로드캐스트
  const clientsPromise = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
    if (clientList.length > 0) {
      broadcastDebug(`[SW] Broadcasting 'new-notification' to ${clientList.length} clients.`);
      for (const client of clientList) {
        client.postMessage({ type: 'new-notification' });
      }
    } else {
      broadcastDebug('[SW] No clients to broadcast to.');
    }
  });

  event.waitUntil(Promise.all([notificationPromise, clientsPromise]));
});

// 알림 클릭 이벤트 리스너
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // 알림 닫기

  event.waitUntil(
    self.clients.openWindow('/') // 알림 클릭 시 메인 페이지로 이동
  );
});
