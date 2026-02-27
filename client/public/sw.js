/**
 * HabitForge Service Worker
 * Handles scheduled end-of-day reminder notifications.
 *
 * Messages accepted:
 *   { type: 'SCHEDULE_REMINDER', pendingHabits, pendingTasks, pendingChallenges, fireAtMs }
 *   { type: 'CANCEL_REMINDER' }
 */

let reminderTimer = null;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('message', (event) => {
    const { type } = event.data || {};

    if (type === 'SCHEDULE_REMINDER') {
        const { pendingHabits = 0, pendingTasks = 0, pendingChallenges = 0, fireAtMs } = event.data;

        // Clear any existing timer
        if (reminderTimer !== null) {
            clearTimeout(reminderTimer);
            reminderTimer = null;
        }

        const delay = fireAtMs - Date.now();
        if (delay <= 0) return; // already past the time

        const parts = [];
        if (pendingHabits > 0) parts.push(`${pendingHabits} habit${pendingHabits > 1 ? 's' : ''}`);
        if (pendingChallenges > 0) parts.push(`${pendingChallenges} club challenge${pendingChallenges > 1 ? 's' : ''}`);
        if (pendingTasks > 0) parts.push(`${pendingTasks} task${pendingTasks > 1 ? 's' : ''}`);

        if (parts.length === 0) return; // nothing pending

        const body = `You still have ${parts.join(', ')} to complete today. Don't break your streak! 🔥`;

        reminderTimer = setTimeout(() => {
            self.registration.showNotification('HabitForge — Day ending soon ⏰', {
                body,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: 'habitforge-daily-reminder',   // replaces any previous reminder notification
                renotify: true,
                requireInteraction: false,
            });
            reminderTimer = null;
        }, delay);

    } else if (type === 'CANCEL_REMINDER') {
        if (reminderTimer !== null) {
            clearTimeout(reminderTimer);
            reminderTimer = null;
        }
    }
});

// When user clicks the notification, focus or open the app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url && 'focus' in client) return client.focus();
            }
            if (self.clients.openWindow) return self.clients.openWindow('/dashboard');
        })
    );
});
