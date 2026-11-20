export interface OpsMenuItem {
    label: string
    /** Path relative to the app root; the location is prepended when the app has one in its path. */
    to: string
    /** Boxicons name (`i-bx-…`, https://boxicons.com) shown before the label, and alone when the sidebar is collapsed. */
    icon?: string
    /** `<module>.<resource>.<action>` (doc 27). */
    permission: string
    /** Key into the pending counts that roll up onto the group (doc 09, sidebar). */
    countKey?: string
    /** `*` on the sitemap: no table yet in the data model (doc 09). */
    noTableYet?: boolean
}

export interface OpsMenuGroup {
    title: string
    items: OpsMenuItem[]
}

/** Name and mark at the top of the sidebar. Defaults in layers/ops-shell/app/app.config.ts. */
export interface OpsBrand {
    /** Defaults to the app's `title`. */
    name?: string
    /** Image path or URL. Defaults to /logo.png, i.e. apps/<app>/public/logo.png. */
    logo: string | null
    /** Icon name (e.g. `i-bx-shapes`), shown only while the logo is missing or fails to load. */
    icon: string
}

export interface OpsAppConfig {
    /** Same as NUXT_PUBLIC_APP. */
    app: 'bus' | 'taxi' | 'fleet' | 'ride' | 'admin' | 'operator' | 'vendor'
    title: string
    /** Boxicons name for the workspace badge. */
    badgeIcon: string
    /** True for bus, taxi and vendor: the location (or outlet) is the first part of the path (doc 16, doc 32). */
    locationInPath: boolean
    menu: OpsMenuGroup[]
    brand?: Partial<OpsBrand>
}

export interface OpsField {
    label: string
    value: string | number | null
}
