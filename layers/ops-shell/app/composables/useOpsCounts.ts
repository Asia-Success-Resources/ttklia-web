/**
 * Pending counts shown on menu items and rolled up onto their group (doc 09, sidebar).
 * TODO(api): doc 04 has no counts endpoint yet; the counts stay empty until it exists.
 */
export function useOpsCounts() {
    const counts = useState<Record<string, number>>('ops-counts', () => ({}))
    return { counts }
}
