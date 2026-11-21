/** One row of `GET /me/notifications` (ttklia-api Platform NotificationController). */
export interface AppNotification {
    id: string
    /** Notification class, e.g. RefundRequested. */
    type: string
    /** `data.type`: bus, taxi, genting, ... */
    category: string | null
    title: string
    message: string
    url: string | null
    read_at: string | null
    created_at: string
}

export interface NotificationFilter {
    key: string
    label: string
}

interface NotificationPage {
    data: AppNotification[] | null
    meta: import('../../../base/app/types/api').PageMeta
    total: number
    unread_count: number
    filters: NotificationFilter[]
}

/**
 * The header bell's state, shared by the bell and /notifications (ported from today's ttklia-v2 admin:
 * components/header/notification-dropdown.blade.php). Opening either marks everything read, as there.
 */
export function useNotifications() {
    const api = useApi()
    const enabled = computed(() => !!useRuntimeConfig().public.apiBase)
    const recent = useState<AppNotification[]>('ops-notifications-recent', () => [])
    const unreadCount = useState<number>('ops-notifications-unread', () => 0)

    async function page(query: { filter?: string; page?: number; limit?: number } = {}): Promise<NotificationPage | null> {
        if (!enabled.value) return null
        return await api.get<NotificationPage>('/me/notifications', query)
    }

    /** The ten newest and the unread count, for the bell. */
    async function refresh() {
        try {
            const res = await page({ limit: 10 })
            if (!res) return
            recent.value = res.data ?? []
            unreadCount.value = res.unread_count ?? 0
        } catch {
            // The bell stays as it was; the page shows its own error.
        }
    }

    async function markAllRead() {
        if (!enabled.value || unreadCount.value === 0) return
        unreadCount.value = 0
        const now = new Date().toISOString()
        recent.value = recent.value.map((n) => (n.read_at ? n : { ...n, read_at: now }))
        try {
            await api.post('/me/notifications/read-all')
        } catch {
            await refresh()
        }
    }

    return { recent, unreadCount, page, refresh, markAllRead }
}

/** "5 minutes ago", as ttklia-v2's diffForHumans(). */
export function timeAgo(iso: string): string {
    const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
    const units: [Intl.RelativeTimeFormatUnit, number][] = [
        ['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60],
    ]
    const format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
    for (const [unit, size] of units) {
        if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit)
    }
    return 'just now'
}
