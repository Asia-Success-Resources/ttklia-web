import type { OpsMenuGroup, OpsMenuItem } from '../types/ops'

/**
 * Menu groups in today's order (doc 09, "Following today's admin"), filtered by the user's
 * abilities in the current workspace (doc 27). With no API configured (local preview) every
 * item is shown, so the screens can be reviewed; the API still decides what data comes back.
 */
export function useOpsMenu() {
    const { config } = useOpsShell()
    const { me, can } = useMe()
    const preview = computed(() => !useRuntimeConfig().public.apiBase)

    /** Links the user may open; a parent stays while any of its children does. */
    function visible(items: OpsMenuItem[]): OpsMenuItem[] {
        return items.flatMap((item) => {
            if (item.children) {
                const children = visible(item.children)
                return children.length ? [{ ...item, children }] : []
            }
            return item.permission && can(item.permission) ? [item] : []
        })
    }

    const groups = computed<OpsMenuGroup[]>(() => {
        if (preview.value && !me.value) return config.menu
        return config.menu
            .map((group) => ({ ...group, items: visible(group.items) }))
            .filter((group) => group.items.length > 0)
    })

    /** Every link, with the parents it sits under (for page search and the active item). */
    const links = computed(() =>
        groups.value.flatMap((group) => flattenMenu(group.items, [group.title])),
    )

    return { groups, links, preview }
}

/** The links of a menu tree, each with the titles above it (group, parent). */
export function flattenMenu(items: OpsMenuItem[], path: string[] = []): (OpsMenuItem & { to: string; trail: string[] })[] {
    return items.flatMap((item) =>
        item.children ? flattenMenu(item.children, [...path, item.label]) : item.to ? [{ ...item, to: item.to, trail: path }] : [],
    )
}
