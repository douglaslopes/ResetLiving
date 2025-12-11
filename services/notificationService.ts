export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log("Este navegador não suporta notificações.");
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const sendNotification = (title: string, body: string) => {
  if (Notification.permission === 'granted') {
    // Check if service worker is ready for mobile support, else fallback to standard
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
       navigator.serviceWorker.ready.then(registration => {
         registration.showNotification(title, {
            body,
            icon: '/logo.png', // Assuming logo exists or fallback
            vibrate: [200, 100, 200],
            tag: 'resetliving-task'
         } as any);
       });
    } else {
        new Notification(title, {
            body,
            icon: '/logo.png',
        });
    }
  }
};