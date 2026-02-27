import { useCallback, useEffect } from "react"

const PERM_KEY = "hf_notif_asked"
const TODAY_SCHEDULED_KEY = "hf_reminder_date"

/** Returns today as YYYY-MM-DD */
function todayStr() {
    return new Date().toISOString().slice(0, 10)
}

/** Get the service worker controller (if registered & active) */
async function getSW(): Promise<ServiceWorker | null> {
    if (!("serviceWorker" in navigator)) return null
    const reg = await navigator.serviceWorker.getRegistration()
    return reg?.active ?? null
}

/**
 * Requests browser notification permission once on first app load.
 * Call this once in App root.
 */
export function useNotificationPermission() {
    useEffect(() => {
        if (!("Notification" in window)) return
        if (Notification.permission === "granted") return
        if (Notification.permission === "denied") return
        if (localStorage.getItem(PERM_KEY)) return

        const t = setTimeout(async () => {
            const perm = await Notification.requestPermission()
            localStorage.setItem(PERM_KEY, "1")
            if (perm === "granted") {
                new Notification("HabitForge notifications enabled 🎉", {
                    body: "You'll get end-of-day reminders for pending habits and challenges.",
                    icon: "/favicon.ico",
                })
            }
        }, 2000)

        return () => clearTimeout(t)
    }, [])
}

/**
 * Schedules an end-of-day Chrome OS notification via the Service Worker.
 *
 * Call this once when the dashboard loads with the current pending counts.
 * The reminder fires at `reminderHour` (default 21 = 9 PM) local time.
 * Only schedules once per calendar day (deduplicated via localStorage).
 */
export async function scheduleEndOfDayReminder(
    pendingHabits: number,
    pendingTasks: number,
    pendingChallenges: number,
    reminderHour = 21  // 9 PM local time
) {
    if (!("Notification" in window)) return
    if (Notification.permission !== "granted") return
    if (pendingHabits === 0 && pendingTasks === 0 && pendingChallenges === 0) return

    // Only schedule once per day
    if (localStorage.getItem(TODAY_SCHEDULED_KEY) === todayStr()) return

    // Compute the fire time (today at reminderHour:00)
    const fireAt = new Date()
    fireAt.setHours(reminderHour, 0, 0, 0)

    // If the time has already passed today, skip until tomorrow
    if (fireAt.getTime() <= Date.now()) return

    const sw = await getSW()
    if (!sw) return

    sw.postMessage({
        type: "SCHEDULE_REMINDER",
        pendingHabits,
        pendingTasks,
        pendingChallenges,
        fireAtMs: fireAt.getTime(),
    })

    localStorage.setItem(TODAY_SCHEDULED_KEY, todayStr())
}

/**
 * Returns a `notify` helper for one-off immediate OS notifications.
 * (Used for task/habit completion events.)
 */
export function useNotifications() {
    const notify = useCallback(
        (title: string, body?: string, icon = "/favicon.ico") => {
            if (!("Notification" in window)) return
            if (Notification.permission !== "granted") return
            try {
                new Notification(title, { body, icon })
            } catch {
                // Safari quirks — ignore
            }
        },
        []
    )

    return { notify }
}

