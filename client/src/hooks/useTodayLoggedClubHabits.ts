import { useState, useCallback } from "react"

const getStorageKey = () => {
    const today = new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
    return `loggedClubHabits_${today}`
}

const loadFromStorage = (): Set<string> => {
    try {
        const raw = localStorage.getItem(getStorageKey())
        if (raw) return new Set(JSON.parse(raw) as string[])
    } catch { /* ignore */ }
    return new Set()
}

const saveToStorage = (ids: Set<string>) => {
    try {
        localStorage.setItem(getStorageKey(), JSON.stringify(Array.from(ids)))
    } catch { /* ignore */ }
}

/**
 * Persists which club habit IDs have been logged today across page reloads.
 * Uses localStorage keyed by today's date — auto-clears the next day.
 */
export function useTodayLoggedClubHabits() {
    const [loggedIds, setLoggedIds] = useState<Set<string>>(loadFromStorage)

    const markLogged = useCallback((habitId: string) => {
        setLoggedIds(prev => {
            const next = new Set(prev).add(habitId)
            saveToStorage(next)
            return next
        })
    }, [])

    return { loggedIds, markLogged }
}
