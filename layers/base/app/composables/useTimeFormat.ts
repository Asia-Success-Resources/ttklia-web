/**
 * Times as the current workspace wants them (`workspaces.time_format`, set on its Settings page): 12-hour
 * ("2:05 PM", the default) or 24-hour ("14:05"). The value comes with each workspace in GET /me.
 * All in Malaysia time, as formatTime / formatDateTime (utils/datetime.ts).
 */
export function useTimeFormat() {
    const { me } = useMe()
    const { slug } = useWorkspace()
    const hour12 = computed(() => (me.value?.workspaces.find((w) => w.slug === slug.value)?.time_format ?? '12h') === '12h')

    return {
        hour12,
        /** "2:05 PM" / "14:05"; `seconds: true` adds them. */
        time: (value: string | Date | null | undefined, opts: { seconds?: boolean } = {}) =>
            formatTime(value, { hour12: hour12.value, seconds: opts.seconds ?? false }),
        /** "20/11/2026 2:05 PM" / "20/11/2026 14:05". */
        dateTime: (value: string | Date | null | undefined) => formatDateTime(value, { hour12: hour12.value }),
        /** "2 PM" / "14:00": a departure hour. */
        hour: (value: string | Date | null | undefined) => formatHour(value, { hour12: hour12.value }),
    }
}
