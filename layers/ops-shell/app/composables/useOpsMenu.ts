import type { OpsMenuGroup } from '../types/ops'

/**
 * Menu groups in today's order (doc 09, "Following today's admin"), filtered by the user's
 * abilities in the current workspace (doc 27). With no API configured (local preview) every
 * item is shown, so the screens can be reviewed; the API still decides what data comes back.
 */
export function useOpsMenu() {
  const { config } = useOpsShell()
  const { me, can } = useMe()
  const preview = computed(() => !useRuntimeConfig().public.apiBase)

  const groups = computed<OpsMenuGroup[]>(() => {
    if (preview.value && !me.value) return config.menu
    return config.menu
      .map((group) => ({ ...group, items: group.items.filter((item) => can(item.permission)) }))
      .filter((group) => group.items.length > 0)
  })

  return { groups, preview }
}
