import type { OpsAppConfig } from '../types/ops'

/** App menu and shell state. Each app sets `ops` in its app.config.ts. */
export function useOpsShell() {
  const config = useAppConfig().ops as unknown as OpsAppConfig
  const collapsed = useState<boolean>('ops-sidebar-collapsed', () => false)
  const mobileOpen = useState<boolean>('ops-sidebar-mobile', () => false)
  const { slug } = useWorkspace()

  /** Turns a menu path into a real one: `/trips` → `/klia2/trips` in the bus app. */
  function resolveTo(to: string): string {
    if (!config.locationInPath || !slug.value) return to
    return to === '/' ? `/${slug.value}` : `/${slug.value}${to}`
  }

  return { config, collapsed, mobileOpen, resolveTo }
}
