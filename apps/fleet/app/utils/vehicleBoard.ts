import { VEHICLE_CLASSES } from '~/composables/useFleetOptions'

// Vehicles board (fleet /vehicles): the same table layout as the limo and van boards, after fleet-management's
// vehicles board (one group per vehicle type, plate frozen, status chips, a status-breakdown summary), on
// `vehicles` (doc 03, doc 19).

/** One row: GET /ops/w/{workspace}/vehicles (VehicleController, fleet branch). */
export interface VehicleRow {
    id: number
    plate_no: string
    type: VehicleType
    vehicle_class: string
    make: string | null
    model: string | null
    year: number | null
    seats: number | null
    colour: string | null
    condition_grade: string | null
    toll_class: number | null
    status: VehicleStatus
    organisation_name: string | null
    open_issues: number
    /** An open issue keeps it off the road. */
    blocked: boolean
    insurance_expires_on: string | null
    road_tax_expires_on: string | null
    jobs_30d: number
    last_driver_name: string | null
}

export type VehicleType = 'mpv' | 'van' | 'car'
export type VehicleStatus = 'active' | 'in_service' | 'retired'

/** The groups, in order; each always shows, even empty (fleet-management showed Limousine and Van). */
export const VEHICLE_GROUPS: { type: VehicleType; title: string; color: string }[] = [
    { type: 'mpv', title: 'MPV (Alphard, Vellfire)', color: '#ff642e' },
    { type: 'van', title: 'Van', color: '#579bfc' },
    { type: 'car', title: 'Car', color: '#00c875' },
]

/** `vehicles.status`, with fleet-management's online / workshop / offline colours. */
export const VEHICLE_STATUSES: { value: VehicleStatus; label: string; color: string }[] = [
    { value: 'active', label: 'Active', color: '#00c875' },
    { value: 'in_service', label: 'In service', color: '#fdab3d' },
    { value: 'retired', label: 'Retired', color: '#797e93' },
]

export function vehicleStatus(value: string | null | undefined) {
    return VEHICLE_STATUSES.find((s) => s.value === value)
}

export type VehicleColumnType = 'status' | 'picker' | 'readonly' | 'text' | 'issues' | 'expiry'
export type VehicleColumnKey =
    | 'status' | 'driver' | 'vehicle_class' | 'make' | 'model' | 'year' | 'seats' | 'colour'
    | 'condition_grade' | 'toll_class' | 'issues' | 'insurance' | 'roadTax' | 'jobs'

export const VEHICLE_COLUMNS: { key: VehicleColumnKey; label: string; width: number; type: VehicleColumnType; info?: boolean }[] = [
    { key: 'status', label: 'Status', width: 158, type: 'status', info: true },
    { key: 'driver', label: 'Last Driver', width: 190, type: 'readonly' },
    { key: 'vehicle_class', label: 'Class', width: 140, type: 'picker' },
    { key: 'make', label: 'Make', width: 120, type: 'text' },
    { key: 'model', label: 'Model', width: 170, type: 'text' },
    { key: 'year', label: 'Year', width: 90, type: 'text' },
    { key: 'seats', label: 'Seats', width: 90, type: 'text' },
    { key: 'colour', label: 'Colour', width: 110, type: 'text' },
    { key: 'condition_grade', label: 'Condition', width: 120, type: 'picker' },
    { key: 'toll_class', label: 'Toll Class', width: 110, type: 'picker' },
    { key: 'issues', label: 'Open Issues', width: 150, type: 'issues' },
    { key: 'insurance', label: 'Insurance Expiry', width: 150, type: 'expiry' },
    { key: 'roadTax', label: 'Road Tax Expiry', width: 150, type: 'expiry' },
    { key: 'jobs', label: 'Jobs (30 days)', width: 120, type: 'readonly' },
]
export const PLATE_WIDTH = 220

/** Options of each picker column: value saved, label shown. */
export const VEHICLE_PICKERS: Partial<Record<VehicleColumnKey, { value: string; label: string }[]>> = {
    vehicle_class: VEHICLE_CLASSES.map((c) => ({ value: c.value, label: c.label })),
    condition_grade: [{ value: 'new', label: 'New' }, { value: 'good', label: 'Good' }, { value: 'fair', label: 'Fair' }],
    toll_class: ['1', '2', '3', '4', '5'].map((v) => ({ value: v, label: `Class ${v}` })),
}

/** What each column shows for a row. */
export function vehicleCell(row: VehicleRow, key: VehicleColumnKey): string {
    switch (key) {
        case 'driver': return row.last_driver_name ?? ''
        case 'vehicle_class': return VEHICLE_CLASSES.find((c) => c.value === row.vehicle_class)?.label ?? row.vehicle_class
        case 'make': return row.make ?? ''
        case 'model': return row.model ?? ''
        case 'year': return row.year ? String(row.year) : ''
        case 'seats': return row.seats ? String(row.seats) : ''
        case 'colour': return row.colour ?? ''
        case 'condition_grade': return VEHICLE_PICKERS.condition_grade!.find((c) => c.value === row.condition_grade)?.label ?? ''
        case 'toll_class': return row.toll_class ? `Class ${row.toll_class}` : ''
        case 'insurance': return row.insurance_expires_on ?? ''
        case 'roadTax': return row.road_tax_expires_on ?? ''
        case 'jobs': return String(row.jobs_30d)
        default: return ''
    }
}
