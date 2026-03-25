/**
 * HabitForge Service Worker
 * Handles scheduled notifications for:
 *   - End-of-day habit/task reminders
 *   - Task deadline reminders (persisted in IndexedDB so they survive SW restarts)
 *
 * Messages accepted:
 *   { type: 'SCHEDULE_REMINDER', pendingHabits, pendingTasks, pendingChallenges, fireAtMs }
 *   { type: 'CANCEL_REMINDER' }
 *   { type: 'SCHEDULE_TASK_REMINDER', taskId, taskTitle, fireAtMs }
 *   { type: 'CANCEL_TASK_REMINDER', taskId }
 */

const DB_NAME = 'habitforge-sw';
const STORE_NAME = 'task-reminders';
const DB_VERSION = 1;

// In-memory timers (will be rebuilt on SW restart from IndexedDB)
let reminderTimer = null;
const taskTimers = {};

// ── IndexedDB helpers ──────────────────────────────────────────────────────────
function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'taskId' });
            }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

async function saveReminder(taskId, taskTitle, fireAtMs) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put({ taskId, taskTitle, fireAtMs });
        tx.oncomplete = resolve;
        tx.onerror = (e) => reject(e.target.error);
    });
}

async function deleteReminder(taskId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(taskId);
        tx.oncomplete = resolve;
        tx.onerror = (e) => reject(e.target.error);
    });
}

async function getAllReminders() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = (e) => resolve(e.target.result || []);
        req.onerror = (e) => reject(e.target.error);
    });
}

// ── Schedule a single task timer in memory ────────────────────────────────────
function scheduleInMemory(taskId, taskTitle, fireAtMs) {
    // Clear any existing timer
    if (taskTimers[taskId]) {
        clearTimeout(taskTimers[taskId]);
        delete taskTimers[taskId];
    }

    const delay = fireAtMs - Date.now();
    if (delay <= 0) {
        // Already overdue — delete from DB and skip
        deleteReminder(taskId).catch(() => { });
        return;
    }

    taskTimers[taskId] = setTimeout(async () => {
        try {
            await self.registration.showNotification('Task due now ⚡ — HabitForge', {
                body: `"${taskTitle}" is due right now. Get it done!`,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `habitforge-task-${taskId}`,
                renotify: true,
            });
        } catch (e) { /* ignore notification errors */ }
        delete taskTimers[taskId];
        await deleteReminder(taskId).catch(() => { });
    }, delay);
}

// ── On SW activate: reschedule all persisted reminders ────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            getAllReminders().then((reminders) => {
                for (const { taskId, taskTitle, fireAtMs } of reminders) {
                    scheduleInMemory(taskId, taskTitle, fireAtMs);
                }
            }).catch(() => { }),
        ])
    );
});

self.addEventListener('install', () => self.skipWaiting());

// ── Message handler ───────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
    const { type } = event.data || {};

    // ── End-of-day reminder ────────────────────────────────────────────────────
    if (type === 'SCHEDULE_REMINDER') {
        const { pendingHabits = 0, pendingTasks = 0, pendingChallenges = 0, fireAtMs } = event.data;

        if (reminderTimer !== null) { clearTimeout(reminderTimer); reminderTimer = null; }

        const delay = fireAtMs - Date.now();
        if (delay <= 0) return;

        const parts = [];
        if (pendingHabits > 0) parts.push(`${pendingHabits} habit${pendingHabits > 1 ? 's' : ''}`);
        if (pendingChallenges > 0) parts.push(`${pendingChallenges} club challenge${pendingChallenges > 1 ? 's' : ''}`);
        if (pendingTasks > 0) parts.push(`${pendingTasks} task${pendingTasks > 1 ? 's' : ''}`);
        if (parts.length === 0) return;

        const body = `You still have ${parts.join(', ')} to complete today. Don't break your streak! 🔥`;
        reminderTimer = setTimeout(() => {
            self.registration.showNotification('HabitForge — Day ending soon ⏰', {
                body, icon: '/favicon.ico', badge: '/favicon.ico',
                tag: 'habitforge-daily-reminder', renotify: true,
            });
            reminderTimer = null;
        }, delay);

    } else if (type === 'CANCEL_REMINDER') {
        if (reminderTimer !== null) { clearTimeout(reminderTimer); reminderTimer = null; }

        // ── Task deadline reminder ─────────────────────────────────────────────────
    } else if (type === 'SCHEDULE_TASK_REMINDER') {
        const { taskId, taskTitle, fireAtMs } = event.data;
        if (!taskId || !fireAtMs) return;

        // Persist first, then schedule in memory
        saveReminder(taskId, taskTitle, fireAtMs)
            .then(() => scheduleInMemory(taskId, taskTitle, fireAtMs))
            .catch(() => scheduleInMemory(taskId, taskTitle, fireAtMs));

    } else if (type === 'CANCEL_TASK_REMINDER') {
        const { taskId } = event.data;
        if (!taskId) return;
        if (taskTimers[taskId]) { clearTimeout(taskTimers[taskId]); delete taskTimers[taskId]; }
        deleteReminder(taskId).catch(() => { });
    }
});

// ── Notification click: focus or open the app ─────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url && 'focus' in client) return client.focus();
            }
            if (self.clients.openWindow) return self.clients.openWindow('/tasks');
        })
    );
});
