// Shared API shapes (doc 04, "Conventions"). These are hand-written until
// packages/api-client-ts is generated from openapi.yaml; then they are replaced
// by the generated types. TODO(api): swap for @ttklia/api-client-ts types.

/** Money is always integer sen (doc 04). */
export type Sen = number

/** One page of a list, numbered as in ttklia-v2: `?page=2&limit=10` → `{ data, meta }` (doc 04). */
export interface PageMeta {
    current_page: number
    last_page: number
    per_page: number
    total: number
    /** 1-based position of the first and last row on this page; null when the list is empty. */
    from: number | null
    to: number | null
}

export interface Page<T> {
    data: T[]
    meta: PageMeta
}

/** RFC 9457 problem details with a stable `code` (doc 04, "Error codes"). */
export interface Problem {
    type?: string
    title: string
    status: number
    code:
        | 'validation_failed'
        | 'unauthenticated'
        | 'forbidden'
        | 'not_found'
        | 'idempotency_key_reused'
        | 'state_conflict'
        | 'counter_in_use'
        | 'session_already_open'
        | 'counter_inactive'
        | 'insufficient_balance'
        | 'seat_taken'
        | 'outside_service_area'
        | 'document_expired'
        | 'rate_limited'
        | 'dependency_unavailable'
        | (string & {})
    detail?: string
    errors?: Record<string, string[]>
}

/** `workspaces.type` in tools/schema.py. */
export type WorkspaceType = 'global' | 'bus_terminal' | 'fleet' | 'taxi' | 'ride'

export interface WorkspaceRef {
    slug: string
    code: string
    name: string
    type: WorkspaceType
    /** `workspaces.time_format`: how its screens show times (useTimeFormat). */
    time_format?: '12h' | '24h'
}

/** `GET /me?workspace=…` (doc 27, "How it is enforced", step 5). TODO(api): final shape from the generated client. */
export interface Me {
    uuid: string
    /** `users.name` (`profiles` was folded into `users` on 20 Nov 2026, doc 03). */
    name: string
    /** `users.locale`: ms, en, zh. */
    locale?: string
    email: string | null
    phone_e164?: string | null
    status?: 'active' | 'suspended' | 'closed'
    /** The profile picture (Account settings), or null for initials. */
    avatar_url?: string | null
    /** Every workspace the user holds an assignment in. */
    workspaces: WorkspaceRef[]
    /** Holds a global role (no workspace): shows the Global tile in the workspace switcher (doc 09). */
    global?: boolean
    /** Permission names in the requested workspace, e.g. `bus.bookings.read`. */
    abilities: string[]
    /** Role names (global, plus the requested workspace's), for display only; menus follow `abilities`. */
    roles?: string[]
}

/** `GET /bootstrap` (doc 04, doc 16). TODO(api): final shape from the generated client. */
export interface Bootstrap {
    app: string
    /** From the host's `app_domains` row; public app only: `teeko` on teeko.ai (doc 09). */
    brand?: 'ttklia' | 'teeko'
    workspace: WorkspaceRef | null
    name: string
    logo_url: string | null
    languages: string[]
    features: string[]
    reverb_key: string | null
}
