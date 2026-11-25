/**
 * A menu entry. A link has `to` and `permission`; a parent (ttklia-v2's submenu, e.g. Operations) has `children`
 * instead, folds open in the sidebar, and shows when any child does.
 */
export interface OpsMenuItem {
    label: string
    /** Path relative to the app root; the location is prepended when the app has one in its path. Not on a parent. */
    to?: string
    /** Boxicons name (`i-bx-…`, https://boxicons.com) shown before the label, and alone when the sidebar is collapsed. */
    icon?: string
    /** `<module>.<resource>.<action>` (doc 27). Not on a parent. */
    permission?: string
    /** Key into the pending counts that roll up onto the group (doc 09, sidebar). */
    countKey?: string
    /** `*` on the sitemap: no table yet in the data model (doc 09). */
    noTableYet?: boolean
    /** Sub-items of a parent; one more level (e.g. Configuration › Tours › Tour packages) is allowed, as in v2. */
    children?: OpsMenuItem[]
}

export interface OpsMenuGroup {
    title: string
    items: OpsMenuItem[]
}

/** Name and mark at the top of the sidebar. Defaults in layers/ops-shell/app/app.config.ts. */
export interface OpsBrand {
    /** Defaults to the app's `title`. */
    name?: string
    /** Image path or URL. Defaults to /img/logo.png, i.e. apps/<app>/public/img/logo.png. */
    logo: string | null
    /**
     * A wide logo (wordmark) shown alone, without the name, while the sidebar is open; the square `logo` shows when it
     * is collapsed. As ttklia-v2's sidebar (bus and taxi): /img/logo-full.png.
     */
    logoWide?: string | null
    /** Icon name (e.g. `i-bx-shapes`), shown only while the logo is missing or fails to load. */
    icon: string
}

export interface OpsAppConfig {
    /** Same as NUXT_PUBLIC_APP. */
    app: 'bus' | 'taxi' | 'fleet' | 'ride' | 'admin' | 'operator' | 'vendor'
    title: string
    /** Boxicons name for the workspace badge. */
    badgeIcon: string
    /** True for taxi and vendor: the location (or outlet) is the first part of the path (doc 16, doc 32). */
    locationInPath: boolean
    /**
     * Bus: no location in the path; the one chosen (on /choose-location, or from the workspace switcher) is kept in a
     * cookie (useSavedLocation). The workspace type the app's locations have, e.g. 'bus_terminal'.
     */
    savedLocationType?: string
    menu: OpsMenuGroup[]
    brand?: Partial<OpsBrand>
    /**
     * List pages as ttklia-v2's generic index (vebase): search, Filter, Export, Import and "Create {item}" all on the
     * title row, instead of the search on its own row below. The bus app turns it on.
     */
    v2ListHeader?: boolean
}

/** One dropdown in a list page's Filter panel (ttklia-v2 model `$filters`). `type: 'date'` shows a date field. */
export interface OpsListFilter {
    key: string
    label: string
    items?: { label: string; value: string }[]
    type?: 'select' | 'multi' | 'date' | 'time'
    /** Label of the empty choice; v2 shows "All" (or nothing when the filter has a default). */
    emptyLabel?: string
}

export interface OpsField {
    label: string
    value: string | number | null
}
