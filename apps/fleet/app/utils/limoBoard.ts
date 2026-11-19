// Limo board (fleet /limo): the same table layout as fleet-management's limousine bookings board,
// on the v2 data model (`fleet_bookings` and `fleet_assignments`, doc 03 and doc 19).

/** One row of the board: a limo booking with its first assignment's driver and vehicle. */
export interface LimoRow {
  uuid: string
  /** Our booking number. */
  reference: string
  /** Genting's reservation number (RSVN); the board's name column. */
  client_reference: string | null
  status: LimoStatus
  /** RFC 3339 UTC (doc 04); shown in Asia/Kuala_Lumpur. */
  pickup_at: string
  from_text: string
  from_zone_name: string | null
  to_text: string | null
  to_zone_name: string | null
  guest_name: string | null
  guest_phone: string | null
  /** From the booking's assignment. TODO(api): field names from the generated client. */
  driver_name: string | null
  vehicle_plate: string | null
  flight_no: string | null
  remarks: string | null
  /** Client changes waiting for staff (`fleet_booking_changes`, status pending). TODO(api): name from the generated client. */
  pending_changes?: number
}

export type LimoStatus =
  | 'pending_reservation' | 'on_hold' | 'confirmed' | 'assigned' | 'standby'
  | 'in_progress' | 'completed' | 'cancelled' | 'cannot_provide' | 'transferred'

/**
 * `fleet_bookings.status`, in the order the picker shows them, with fleet-management's board colours
 * (the same values as the `--gm-group-*` and `--gm-status-*` palette in layers/base theme.css).
 * TODO(pending: ops): fleet-management let ops set each status colour; these are a starting set.
 */
export const LIMO_STATUSES: { value: LimoStatus; label: string; color: string }[] = [
  { value: 'pending_reservation', label: 'Pending RSVN', color: '#fdab3d' },
  { value: 'on_hold', label: 'On hold', color: '#784bd1' },
  { value: 'confirmed', label: 'Confirmed', color: '#579bfc' },
  { value: 'assigned', label: 'Assigned', color: '#66ccff' },
  { value: 'standby', label: 'Standby', color: '#ff642e' },
  { value: 'in_progress', label: 'In progress', color: '#0073ea' },
  { value: 'completed', label: 'Completed', color: '#00c875' },
  { value: 'cancelled', label: 'Cancelled', color: '#e2445c' },
  { value: 'cannot_provide', label: 'Cannot provide', color: '#797e93' },
  { value: 'transferred', label: 'Transferred', color: '#037f4c' },
]
export const UNSET_STATUS_COLOR = '#797e93'

export function limoStatus(value: string | null | undefined) {
  return LIMO_STATUSES.find((s) => s.value === value)
}

/** Black or white text, whichever has the higher WCAG contrast against the fill (as fleet-management). */
export function statusTextColor(bg: string): string {
  const hex = bg.replace('#', '')
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
  const channels = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
  if (channels.some(Number.isNaN)) return '#ffffff'
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number]
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? '#000000' : '#ffffff'
}

export type LimoColumnType = 'status' | 'time' | 'picker' | 'readonly' | 'text'
export type LimoColumnKey =
  | 'status' | 'time' | 'pickupZone' | 'dropoffZone' | 'passengerName' | 'passengerPhone'
  | 'driverName' | 'vehicleNumber' | 'flightNo' | 'remarks'

/** fleet-management's columns and widths, in the same order. */
export const LIMO_COLUMNS: { key: LimoColumnKey; label: string; width: number; type: LimoColumnType; info?: boolean }[] = [
  { key: 'status', label: 'Status', width: 220, type: 'status', info: true },
  { key: 'time', label: 'Time', width: 150, type: 'time' },
  { key: 'pickupZone', label: 'Pickup Zone', width: 200, type: 'picker' },
  { key: 'dropoffZone', label: 'Dropoff Zone', width: 200, type: 'picker' },
  { key: 'passengerName', label: 'Passenger Name', width: 200, type: 'text' },
  { key: 'passengerPhone', label: 'Passenger Phone No', width: 200, type: 'readonly' },
  { key: 'driverName', label: 'Driver Name', width: 180, type: 'picker' },
  { key: 'vehicleNumber', label: 'Vehicle Number', width: 160, type: 'readonly' },
  { key: 'flightNo', label: 'Flight No', width: 130, type: 'text' },
  { key: 'remarks', label: 'Remarks', width: 240, type: 'text' },
]
export const NAME_WIDTH = 290
export const CHECKBOX_WIDTH = 40

/** What each column shows for a row. */
export function cellValue(row: LimoRow, key: LimoColumnKey): string {
  switch (key) {
    case 'time': return pickupTime(row.pickup_at)
    case 'pickupZone': return row.from_zone_name ?? row.from_text ?? ''
    case 'dropoffZone': return row.to_zone_name ?? row.to_text ?? ''
    case 'passengerName': return row.guest_name ?? ''
    case 'passengerPhone': return row.guest_phone ?? ''
    case 'driverName': return row.driver_name ?? ''
    case 'vehicleNumber': return row.vehicle_plate ?? ''
    case 'flightNo': return row.flight_no ?? ''
    case 'remarks': return row.remarks ?? ''
    default: return ''
  }
}

/** Group colours, in fleet-management's order. */
export const GROUP_COLOURS = ['#ff642e', '#579bfc', '#00c875', '#784bd1', '#fdab3d', '#e2445c', '#66ccff', '#037f4c']

const TIME_ZONE = 'Asia/Kuala_Lumpur' // doc 04: times are UTC, clients show Kuala Lumpur time

/** yyyy-mm-dd of a pickup in Kuala Lumpur time: what date groups sort on. */
export function pickupDate(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
}

export function pickupTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso))
}

/** "Wednesday, 23 Sep 2026", as fleet-management's group titles. */
export function groupTitle(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number) as [number, number, number]
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(y, m - 1, d))
}

export function todayYmd(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export function ymd(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
