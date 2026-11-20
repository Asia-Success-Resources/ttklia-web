// Van board (fleet /van/trips): the limo board's table design (components/LimoBoard.vue) with the columns of
// fleet-management's van trips board, which follow the GGM daily trip sheet (doc 19, "Van trips"), on `van_trips`.
// Shared helpers (dates, colours, status text colour) come from utils/limoBoard.ts.

import { pickupTime } from './limoBoard'

/**
 * One row of the board: a van trip with its route and its first assignment's driver and vehicle.
 * TODO(api): GET /fleet/van-trips is a stub; field names for the route and assignment from the generated client.
 */
export interface VanRow {
    uuid: string
    trip_no: string
    /** yyyy-mm-dd: what date groups sort on. */
    service_date: string
    status: VanStatus
    /** RFC 3339 UTC (doc 04); shown in Asia/Kuala_Lumpur. */
    pickup_at: string
    return_at: string | null
    /** `van_routes.name`: the area as staff say it (KEPONG, CHERAS). */
    route_name: string | null
    /** The route's agreed pickup point (`van_routes.pickup_poi_id`). */
    pickup_point_name: string | null
    /** From the trip's assignment; the phone comes from the driver record (doc 19). */
    driver_name: string | null
    driver_phone: string | null
    vehicle_plate: string | null
    pax_count: number | null
    remarks: string | null
}

export type VanStatus = 'planned' | 'assigned' | 'departed' | 'at_destination' | 'returned' | 'completed' | 'cancelled'

/** `van_trips.status`, in the order the picker shows them, in the limo board's palette. */
export const VAN_STATUSES: { value: VanStatus; label: string; color: string }[] = [
    { value: 'planned', label: 'Planned', color: '#fdab3d' },
    { value: 'assigned', label: 'Assigned', color: '#66ccff' },
    { value: 'departed', label: 'Departed', color: '#0073ea' },
    { value: 'at_destination', label: 'At destination', color: '#784bd1' },
    { value: 'returned', label: 'Returned', color: '#579bfc' },
    { value: 'completed', label: 'Completed', color: '#00c875' },
    { value: 'cancelled', label: 'Cancelled', color: '#e2445c' },
]

export function vanStatus(value: string | null | undefined) {
    return VAN_STATUSES.find((s) => s.value === value)
}

export type VanColumnType = 'status' | 'time' | 'picker' | 'readonly' | 'text' | 'number'
export type VanColumnKey =
    | 'status' | 'hpNo' | 'driverName' | 'vehicleNumber' | 'pickupTime' | 'returnTime'
    | 'route' | 'pickupPoint' | 'remarks' | 'pax'

/**
 * The GGM sheet's columns in fleet-management's order and widths, with the limo board's Status first.
 * `group` puts a small heading over the label (Time: Pick Up, Return), as fleet-management's van board.
 */
export const VAN_COLUMNS: { key: VanColumnKey; label: string; width: number; type: VanColumnType; group?: string; info?: boolean }[] = [
    { key: 'status', label: 'Status', width: 220, type: 'status', info: true },
    { key: 'hpNo', label: 'H/P No', width: 160, type: 'readonly' },
    { key: 'driverName', label: 'Driver Name', width: 200, type: 'picker' },
    { key: 'vehicleNumber', label: 'Vehicle Number', width: 160, type: 'readonly' },
    { key: 'pickupTime', label: 'Pick Up', width: 140, type: 'time', group: 'Time' },
    { key: 'returnTime', label: 'Return', width: 140, type: 'time', group: 'Time' },
    { key: 'route', label: 'Route', width: 160, type: 'picker' },
    { key: 'pickupPoint', label: 'Pick Up Point', width: 240, type: 'readonly' },
    { key: 'remarks', label: 'Remarks', width: 240, type: 'text' },
    { key: 'pax', label: 'Pax', width: 90, type: 'number' },
]
/** The frozen trip number column ("No" on the GGM sheet). */
export const VAN_NAME_WIDTH = 120

/** What each column shows for a row. */
export function vanCellValue(row: VanRow, key: VanColumnKey): string {
    switch (key) {
        case 'hpNo': return row.driver_phone ?? ''
        case 'driverName': return row.driver_name ?? ''
        case 'vehicleNumber': return row.vehicle_plate ?? ''
        case 'pickupTime': return pickupTime(row.pickup_at)
        case 'returnTime': return row.return_at ? pickupTime(row.return_at) : ''
        case 'route': return row.route_name ?? ''
        case 'pickupPoint': return row.pickup_point_name ?? ''
        case 'remarks': return row.remarks ?? ''
        case 'pax': return row.pax_count === null ? '' : String(row.pax_count)
        default: return ''
    }
}
