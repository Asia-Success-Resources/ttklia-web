/**
 * The address of another ttklia-web app, for the workspace switcher (doc 09) and links between apps.
 *
 * Doc 16 ("Apps and API services", "Domains and locations"): one domain per app, named after the app
 * (`bus.ttklia.com`, `taxi.ttklia.com`, `admin.ttklia.com`, …; staging under `*.staging.ttklia.com`), and one
 * login shared on the parent domain. So another app's address is this page's host with its first label swapped
 * for the app's name: no host is written in code, and staging stays on staging.
 *
 * Returns null where that does not hold (localhost, an IP address, a single-label host): in local development
 * every app is its own port on localhost, so there is no other app to point at.
 */
const SUBDOMAIN: Record<string, string> = {
  public: 'www', // doc 16: the public app is www.ttklia.com
}

export function useAppAddress() {
  function appAddress(app: string, path = '/'): string | null {
    if (!import.meta.client) return null
    const { protocol, hostname, port } = window.location
    const labels = hostname.split('.')
    if (labels.length < 3 || hostname === 'localhost' || /^[\d.]+$/.test(hostname) || hostname.includes(':')) return null
    const host = [SUBDOMAIN[app] ?? app, ...labels.slice(1)].join('.')
    return `${protocol}//${host}${port ? `:${port}` : ''}${path.startsWith('/') ? path : `/${path}`}`
  }

  return { appAddress }
}
