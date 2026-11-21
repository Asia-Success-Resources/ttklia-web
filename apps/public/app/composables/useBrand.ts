/**
 * The public app serves two brands from one build (doc 09): `ttklia` on www.ttklia.com and `teeko` on teeko.ai.
 * The brand comes from `/bootstrap` (`app_domains.brand`), never from a host name in the code.
 * Sign-in on teeko.ai goes through auth.ttklia.com and back with a one-time code, and teeko.ai keeps its own
 * session cookie (doc 09). TODO(api): the auth hand-off once the auth app exists.
 */
export type Brand = 'ttklia' | 'teeko'

interface NavLink { label: string; to: string }

const NAV: Record<Brand, NavLink[]> = {
    ttklia: [
        { label: 'Bus', to: '/' },
        { label: 'Ride', to: '/ride' },
        { label: 'Tours', to: '/tours' },
        { label: 'Rentals', to: '/rentals' },
        { label: 'Protection', to: '/protection' },
        { label: 'Help', to: '/help' },
    ],
    teeko: [
        { label: 'Ride', to: '/ride' },
        { label: 'Airport rides', to: '/airport' },
        { label: 'Drive with Teeko', to: '/drive' },
        { label: 'Business', to: '/business' },
        { label: 'Help', to: '/help' },
    ],
}

const FOOTER: Record<Brand, NavLink[]> = {
    ttklia: [{ label: 'Help', to: '/help' }],
    teeko: [
        { label: 'Ride', to: '/ride' },
        { label: 'Drive', to: '/drive' },
        { label: 'Business', to: '/business' },
        { label: 'Help', to: '/help' },
        { label: 'Explore Malaysia', to: '/explore' },
        { label: 'Privacy notice', to: '/privacy' },
        { label: 'Terms', to: '/terms' },
    ],
}

export function useBrand() {
    const { bootstrap } = useBootstrap()
    const brand = computed<Brand>(() => (bootstrap.value?.brand === 'teeko' ? 'teeko' : 'ttklia'))
    const isTeeko = computed(() => brand.value === 'teeko')
    const name = computed(() => (isTeeko.value ? 'Teeko' : 'TTKLIA'))
    const nav = computed(() => NAV[brand.value])
    const footer = computed(() => FOOTER[brand.value])
    return { brand, isTeeko, name, nav, footer }
}
