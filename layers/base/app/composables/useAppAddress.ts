/**
 * The address of another ttklia-web app, for the workspace switcher (doc 09) and links between apps.
 *
 * Doc 16 ("Apps and API services", "Domains and locations"): one domain per app, named after the app
 * (`bus.ttklia.com`, `taxi.ttklia.com`, `admin.ttklia.com`, …; staging under `*.staging.ttklia.com`), and one
 * login shared on the parent domain. So another app's address is this page's host with its first label swapped
 * for the app's name: no host is written in code, and staging stays on staging.
 *
 * In local development every app is its own port on localhost (scripts/dev-all.mjs), so there the address is
 * the same host with that app's port. Returns null for any other host where the rule does not hold (an IP
 * address, a single-label host).
 */
const SUBDOMAIN: Record<string, string> = {
    public: 'www', // doc 16: the public app is www.ttklia.com
    ride: 'teeko', // Teeko (e-hailing): the ride app is teeko.ttklia.com (doc 00, "Ride = Teeko")
}

/** Keep in step with APPS in scripts/dev-all.mjs. */
const DEV_PORT: Record<string, number> = {
    admin: 3000,
    bus: 3001,
    taxi: 3002,
    fleet: 3003,
    vendor: 3004,
    ride: 3005,
    operator: 3006,
    public: 3007,
}

export function useAppAddress() {
    function appAddress(app: string, path = '/'): string | null {
        if (!import.meta.client) return null
        const { protocol, hostname, port } = window.location
        const route = path.startsWith('/') ? path : `/${path}`
        // Cookies ignore the port, so the sign-in token carries over between the apps on localhost.
        if ((hostname === 'localhost' || hostname === '127.0.0.1') && DEV_PORT[app]) {
            return `${protocol}//${hostname}:${DEV_PORT[app]}${route}`
        }
        const labels = hostname.split('.')
        if (labels.length < 3 || hostname === 'localhost' || /^[\d.]+$/.test(hostname) || hostname.includes(':')) return null
        const host = [SUBDOMAIN[app] ?? app, ...labels.slice(1)].join('.')
        return `${protocol}//${host}${port ? `:${port}` : ''}${path.startsWith('/') ? path : `/${path}`}`
    }

    return { appAddress }
}
