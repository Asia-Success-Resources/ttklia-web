import type { CounterKind, SaleCounter, SaleSession } from '~/types/sale'

/**
 * The signed-in user's open cash session and the counters they can open one on
 * (doc 09, "Counter sessions"; endpoints in doc 04). A user has at most one open session.
 * TODO(api): swap the raw calls for the generated client once it exists.
 */
export function useCounterSession(kind: CounterKind) {
    const api = useApi()
    const { slug } = useWorkspace()
    const preview = computed(() => !useRuntimeConfig().public.apiBase)

    const session = useState<SaleSession | null>('bus-cash-session', () => null)
    const loaded = ref(false)
    const counters = ref<SaleCounter[]>([])
    const error = ref<string | null>(null)
    const busy = ref(false)

    /** The open session belongs to this screen; one of the other kind blocks starting a new one. */
    const mine = computed(() => (session.value?.kind === kind ? session.value : null))
    const other = computed(() => (session.value && session.value.kind !== kind ? session.value : null))

    const path = (p: string) => api.workspacePath(slug.value ?? '', p)

    function message(e: unknown, fallback: string): string {
        const problem = toProblem(e)
        if (problem?.code === 'counter_in_use') return 'Counter already in use by another staff.'
        if (problem?.code === 'session_already_open') return 'You already have a started session.'
        if (problem?.code === 'counter_inactive') return 'Counter not enabled.'
        return problem?.detail ?? problem?.title ?? fallback
    }

    async function load() {
        error.value = null
        if (preview.value || !slug.value) {
            loaded.value = true
            return
        }
        try {
            const [current, list] = await Promise.all([
                api.get<{ data: SaleSession | null }>(path('/cash-sessions/current')),
                api.get<{ data: SaleCounter[] | null }>(path('/locations'), { type: 'counter', counter_kind: kind }),
            ])
            session.value = current?.data ?? null
            counters.value = Array.isArray(list?.data) ? list.data : []
        } catch (e) {
            error.value = message(e, 'Unable to load the counter session.')
        } finally {
            loaded.value = true
        }
    }

    async function start(counterUuid: string, openingFloatSen: number): Promise<boolean> {
        busy.value = true
        error.value = null
        try {
            const res = await api.post<{ data: SaleSession | null }>(path('/cash-sessions'), {
                location_uuid: counterUuid,
                kind,
                opening_float_sen: openingFloatSen,
            })
            session.value = res?.data ?? null
            if (!session.value) await load()
            return true
        } catch (e) {
            error.value = message(e, 'Unable to start the session.')
            await load()
            return false
        } finally {
            busy.value = false
        }
    }

    async function end(countedSen: number, reason?: string): Promise<boolean> {
        const current = session.value
        if (!current) return false
        busy.value = true
        error.value = null
        try {
            await api.post(path(`/cash-sessions/${encodeURIComponent(current.uuid)}/close`), { counted_sen: countedSen, reason })
            session.value = null
            await load()
            return true
        } catch (e) {
            error.value = message(e, 'Unable to end the session.')
            return false
        } finally {
            busy.value = false
        }
    }

    return { session, mine, other, counters, loaded, error, busy, preview, load, start, end }
}
