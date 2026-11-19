// Shared API shapes (doc 04, "Conventions"). These are hand-written until
// packages/api-client-ts is generated from openapi.yaml; then they are replaced
// by the generated types. TODO(api): swap for @ttklia/api-client-ts types.

/** Money is always integer sen (doc 04). */
export type Sen = number

/** Cursor pagination: `?cursor=…&limit=50` → `{ data, next_cursor }`. */
export interface CursorPage<T> {
  data: T[]
  next_cursor: string | null
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
export type WorkspaceType = 'bus_terminal' | 'fleet' | 'taxi' | 'ride'

export interface WorkspaceRef {
  slug: string
  code: string
  name: string
  type: WorkspaceType
}

/** `GET /me?workspace=…` (doc 27, "How it is enforced", step 5). TODO(api): final shape from the generated client. */
export interface Me {
  uuid: string
  name: string
  email: string | null
  /** Every workspace the user holds an assignment in. */
  workspaces: WorkspaceRef[]
  /** Permission names in the requested workspace, e.g. `bus.bookings.read`. */
  abilities: string[]
  /** Table `profiles`: who the person is (users holds sign-in only). TODO(api): add to `GET /me`. */
  profile?: MeProfile | null
  /** Role names in the requested workspace, for display only; menus follow `abilities`. TODO(api). */
  roles?: string[]
}

export interface MeProfile {
  first_name: string
  surname: string | null
  locale: string
  /** TODO(api): `profiles` has no picture column yet; the header falls back to initials. */
  avatar_url?: string | null
}

/** `GET /bootstrap` (doc 04, doc 16). TODO(api): final shape from the generated client. */
export interface Bootstrap {
  app: string
  workspace: WorkspaceRef | null
  name: string
  logo_url: string | null
  languages: string[]
  features: string[]
  reverb_key: string | null
}
