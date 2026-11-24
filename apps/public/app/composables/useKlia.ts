import { getActiveLanguage } from 'laravel-vue-i18n'
import { kliaRoute } from '~/klia/routes'

/** The signed-in customer as the klia-bus views read it (auth()->user()): name and points. */
export interface KliaUser { name: string; points: number; email?: string | null; phone?: string | null }

/**
 * What the copied klia-bus views read from Laravel: route('…'), request()->is('…'), config flags, the locale and the
 * signed-in customer. TODO(api): the customer from GET /me once the public site signs in through ttklia-api.
 */
export function useKlia() {
    const config = useRuntimeConfig().public
    const route = useRoute()
    // Chosen in plugins/klia.ts; changed through /language/{code} (server/routes/language).
    const locale = useState<string>('klia-locale', () => 'en')
    const user = useState<KliaUser | null>('klia-user', () => null)

    /** request()->is('bus/*', 'trips'): Laravel's wildcard match on the path without the leading slash. */
    const is = (...patterns: string[]) => {
        const path = route.path.replace(/^\//, '')
        return patterns.some((p) => new RegExp('^' + p.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$').test(path))
    }

    const initials = computed(() => {
        const name = user.value?.name?.trim() ?? ''
        return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('') || 'T'
    })

    return {
        route: kliaRoute,
        is,
        user,
        initials,
        locale,
        activeLanguage: getActiveLanguage,
        carCharterEnabled: Boolean(config.kliaCarCharter),
        cashbacksEnabled: Boolean(config.kliaCashbacks),
        teekoWhatsapp: String(config.teekoWhatsapp ?? ''),
    }
}
