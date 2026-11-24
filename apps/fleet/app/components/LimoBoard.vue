<script setup lang="ts">
import type { LimoColumnKey, LimoRow, LimoStatus } from '~/utils/limoBoard'

// The limo board: the same table layout as fleet-management's limousine board, on `fleet_bookings` (doc 19).
// A month list, then one coloured date group per pickup date, each a table with a frozen checkbox and RSVN column,
// status chips, pickers and a summary row. Used by /limo (every booking), /limo/pending and /limo/transferred, which
// differ only in which statuses they show.
//
// GET /ops/w/{workspace}/fleet/bookings?service=limo&from&to (one month at a time) and …/months for the month list;
// edits save at once: Enter in a cell (PATCH), the time picker, the status chip (cancel, cannot provide and transfer
// ask first), the zone pickers (from_zone_id, to_zone_id) and the driver picker (assigns the driver with the vehicle
// they last drove: POST /fleet/assignments; the old car comes off). "+ Add reservation number" keys a new booking.
// The booking number opens the booking (/limo/{uuid}) for everything else.

const props = withDefaults(
    defineProps<{
        title: string
        /** Show only bookings in these statuses (filtered by the API). */
        statuses?: LimoStatus[]
        /** The "+ Add reservation number" row (only where new bookings are keyed). */
        canAdd?: boolean
    }>(),
    { statuses: undefined, canAdd: false },
)

const toast = useToast()
const api = useFleetApi()
const { can } = useMe()
const canWrite = computed(() => can('fleet.limo.write'))

const today = todayYmd()
const activeMonth = ref(today.slice(0, 7))
const statusQuery = computed(() => props.statuses?.join(','))

function monthRange(month: string) {
    const [y, m] = month.split('-').map(Number) as [number, number]
    return { from: ymd(new Date(y, m - 1, 1)), to: ymd(new Date(y, m, 0)) }
}
const list = useApiAll<LimoRow>({
    path: '/fleet/bookings',
    workspaceScoped: true,
    query: () => ({ service: 'limo', ...monthRange(activeMonth.value), status: statusQuery.value, sort: 'pickup_asc' }),
    max: 3000,
})
const zones = useApiAll<{ id: number; name: string; code: string }>({ path: '/zones', workspaceScoped: true })
const drivers = useApiAll<{ id: number; name: string; usual_vehicle: string | null; usual_vehicle_id: number | null; day_status: string }>({
    path: '/fleet/drivers/today',
    workspaceScoped: true,
})
const monthCounts = ref<{ month: string; days: number }[]>([])
async function loadMonths() {
    try {
        monthCounts.value = (await api.get<{ data: { month: string; days: number }[] }>('/fleet/bookings/months', { service: 'limo', status: statusQuery.value })).data
    } catch {
        monthCounts.value = []
    }
}
onMounted(() => {
    list.load()
    loadMonths()
    zones.load()
    drivers.load()
})
watch(activeMonth, () => list.load())
const reload = () => Promise.all([list.load(), loadMonths()])

function failed(what: string, e: unknown) {
    toast.add({ title: `${what} not saved`, description: fleetError(e), color: 'error', icon: 'i-bx-alert-circle' })
}
async function patch(row: LimoRow, body: Record<string, unknown>, what: string) {
    try {
        await api.patch(`/fleet/bookings/${row.uuid}`, body)
        toast.add({ title: `${what} saved`, color: 'success' })
        await list.load()
    } catch (e) {
        failed(what, e)
        await list.load()
    }
}

// ---------------------------------------------------------------- months and date groups
/** Months and dates added on the board before any booking sits on them (fleet-management's "+" and "New Date"). */
const addedMonths = ref<string[]>([])
const addedDates = ref<string[]>([])
const collapsed = ref<Record<string, boolean>>({})
const searchQuery = ref('')

const rowsByDate = computed(() => {
    const byDate: Record<string, LimoRow[]> = {}
    for (const row of list.rows.value) (byDate[pickupDate(row.pickup_at)] ||= []).push(row)
    for (const rows of Object.values(byDate)) rows.sort((a, b) => a.pickup_at.localeCompare(b.pickup_at))
    return byDate
})

const allDates = computed(() => [...new Set([...Object.keys(rowsByDate.value), ...addedDates.value])].sort())

const months = computed(() => {
    const counts = new Map(monthCounts.value.map((m) => [m.month, m.days]))
    const keys = new Set([today.slice(0, 7), ...addedMonths.value, ...counts.keys()])
    return [...keys].sort().map((month) => ({
        month,
        groups: month === activeMonth.value ? allDates.value.filter((d) => d.startsWith(month)).length : (counts.get(month) ?? 0),
    }))
})

function matches(row: LimoRow): boolean {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return true
    return [row.client_reference, row.reference, row.guest_name, row.driver_name, row.flight_no, row.vehicle_plate, row.from_text, row.to_text]
        .some((v) => v?.toLowerCase().includes(q))
}

/** Date groups of the open month, newest first, as fleet-management. */
const groups = computed(() => {
    const dates = allDates.value.filter((d) => d.startsWith(activeMonth.value))
    return dates
        .map((date, i) => ({
            date,
            title: groupTitle(date),
            color: GROUP_COLOURS[i % GROUP_COLOURS.length]!,
            items: (rowsByDate.value[date] ?? []).filter(matches),
        }))
        .reverse()
})

/** "November 2026": the open month, beside the board title. */
const monthLabel = computed(() => {
    const [y, m] = activeMonth.value.split('-').map(Number) as [number, number]
    return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1))
})

const monthBounds = computed(() => {
    const { from, to } = monthRange(activeMonth.value)
    return { min: from, max: to }
})

function selectMonth(month: string) {
    activeMonth.value = month
    cancelAddGroup()
}

function addMonth() {
    const latest = months.value.at(-1)!.month
    const [y, m] = latest.split('-').map(Number) as [number, number]
    const next = ymd(new Date(y, m, 1)).slice(0, 7)
    addedMonths.value.push(next)
    activeMonth.value = next
}

/** Day after the newest date on this month's board, kept inside the month. */
function nextGroupDate(): string {
    const { min, max } = monthBounds.value
    const latest = allDates.value.filter((d) => d.startsWith(activeMonth.value)).at(-1)
    if (!latest) return activeMonth.value === today.slice(0, 7) ? today : min
    const [y, m, d] = latest.split('-').map(Number) as [number, number, number]
    const next = ymd(new Date(y, m - 1, d + 1))
    return next > max ? max : next
}

function addDate(date: string) {
    if (!date.startsWith(activeMonth.value)) return
    if (allDates.value.includes(date)) {
        toast.add({ title: 'That date already has a group', color: 'warning', icon: 'i-bx-alert-circle' })
        return
    }
    addedDates.value.push(date)
}

const isAddingGroup = ref(false)
const newGroupDate = ref('')
const newGroupInput = ref<HTMLInputElement | null>(null)

async function startAddGroup() {
    isAddingGroup.value = true
    newGroupDate.value = nextGroupDate()
    await nextTick()
    newGroupInput.value?.focus()
}
function confirmAddGroup() {
    if (newGroupDate.value) addDate(newGroupDate.value)
    cancelAddGroup()
}
function cancelAddGroup() {
    isAddingGroup.value = false
    newGroupDate.value = ''
}

// ---------------------------------------------------------------- rows
const newDrafts = reactive<Record<string, string>>({})

/** A new booking from its RSVN on that date (09:00 until the time is set); the rest is filled in on the row. */
async function addReservation(date: string) {
    const rsvn = (newDrafts[date] ?? '').trim()
    if (!rsvn) return
    try {
        await api.post('/fleet/bookings', { client_reference: rsvn, pickup_at: `${date} 09:00`, vehicle_class: 'alphard' })
        newDrafts[date] = ''
        toast.add({ title: `Booking ${rsvn} added`, color: 'success' })
        await reload()
    } catch (e) {
        failed('Booking', e)
    }
}

/** The booking field each editable column saves to. */
const FIELD: Partial<Record<LimoColumnKey | 'rsvn', string>> = {
    rsvn: 'client_reference', passengerName: 'guest_name', flightNo: 'flight_no', remarks: 'remarks',
}
/** Inline edits save only on Enter; any other way out restores the saved value (as fleet-management). */
function commitEdit(event: Event, row: LimoRow, key: LimoColumnKey | 'rsvn', label: string) {
    const el = event.target as HTMLElement
    const value = el.innerText.trim()
    el.blur()
    const field = FIELD[key]
    if (!field) return
    patch(row, { [field]: value || null }, label)
}
function revertEdit(event: Event, saved: string | null) {
    ;(event.target as HTMLElement).innerText = saved ?? ''
}
function saveTime(row: LimoRow, value: string) {
    if (!value) return
    patch(row, { pickup_at: `${pickupDate(row.pickup_at)} ${value}` }, 'Time')
}

function statusStyle(value: string | null | undefined) {
    const bg = limoStatus(value)?.color ?? UNSET_STATUS_COLOR
    return { backgroundColor: bg, color: statusTextColor(bg) }
}

function timeRange(items: LimoRow[]): string {
    const times = items.map((i) => pickupTime(i.pickup_at)).sort()
    if (times.length === 0) return '-'
    return times.length === 1 ? times[0]! : `${times[0]} - ${times.at(-1)}`
}

function statusBreakdown(items: LimoRow[]) {
    if (items.length === 0) return [{ color: UNSET_STATUS_COLOR, percent: 100 }]
    const counts = new Map<LimoStatus, number>()
    for (const item of items) counts.set(item.status, (counts.get(item.status) ?? 0) + 1)
    const rank = (s: LimoStatus) => LIMO_STATUSES.findIndex((o) => o.value === s)
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || rank(a[0]) - rank(b[0]))
        .map(([status, count]) => ({ color: limoStatus(status)?.color ?? UNSET_STATUS_COLOR, percent: (count / items.length) * 100 }))
}

// ---------------------------------------------------------------- popovers (status and pickers)
interface Menu { row: LimoRow | null; key: LimoColumnKey | null; x: number; y: number; query: string }
const statusMenu = reactive<Menu>({ row: null, key: null, x: 0, y: 0, query: '' })
const pickerMenu = reactive<Menu>({ row: null, key: null, x: 0, y: 0, query: '' })

function place(menu: Menu, row: LimoRow, key: LimoColumnKey, event: MouseEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    Object.assign(menu, { row, key, x: rect.left + rect.width / 2, y: rect.bottom + 8, query: '' })
}
function openStatusMenu(row: LimoRow, event: MouseEvent) {
    pickerMenu.row = null
    if (statusMenu.row === row) statusMenu.row = null
    else place(statusMenu, row, 'status', event)
}
function openPickerMenu(row: LimoRow, key: LimoColumnKey, event: MouseEvent) {
    statusMenu.row = null
    if (pickerMenu.row === row && pickerMenu.key === key) pickerMenu.row = null
    else place(pickerMenu, row, key, event)
}

const reasonAction = useReasonAction()
/** Open statuses save at once; cancel and cannot provide ask for the reason; assigned comes from picking a driver. */
function setStatus(status: LimoStatus) {
    const row = statusMenu.row
    statusMenu.row = null
    if (!row || row.status === status) return
    if (status === 'assigned') {
        toast.add({ title: 'Pick a driver to assign the job', color: 'info', icon: 'i-bx-info-circle' })
        return
    }
    if (status === 'transferred') {
        navigateTo(`/limo/${row.uuid}?action=transfer`)
        return
    }
    if (status === 'cancelled' || status === 'cannot_provide') {
        const cancel = status === 'cancelled'
        reasonAction.ask({
            title: cancel ? `Cancel ${row.client_reference ?? row.reference}` : `Cannot provide ${row.client_reference ?? row.reference}`,
            submitLabel: cancel ? 'Cancel booking' : 'Mark cannot provide',
            run: async (reason) => {
                await api.post(`/fleet/bookings/${row.uuid}/${cancel ? 'cancel' : 'cannot-provide'}`, cancel ? { reason, cancellation: 'no_charge' } : { reason })
                toast.add({ title: cancel ? 'Booking cancelled (no charge; add a charge on the booking)' : 'Marked cannot provide', color: 'success' })
                await list.load()
            },
        })
        return
    }
    patch(row, { status }, 'Status')
}

const pickerNoun = computed(() => (pickerMenu.key === 'driverName' ? 'driver' : 'zone'))
const pickerOptions = computed(() => {
    const q = pickerMenu.query.trim().toLowerCase()
    const options = pickerMenu.key === 'driverName'
        ? drivers.rows.value.map((d) => ({ id: d.id, name: d.name, sub: d.day_status === 'available' ? (d.usual_vehicle ?? '') : d.day_status.replace(/_/g, ' ') }))
        : zones.rows.value.map((z) => ({ id: z.id, name: z.name, sub: z.code.toUpperCase() }))
    return q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options
})
async function setPicker(id: number) {
    const row = pickerMenu.row
    const key = pickerMenu.key
    pickerMenu.row = null
    if (!row) return
    if (key === 'pickupZone') return patch(row, { from_zone_id: id }, 'Pickup zone')
    if (key === 'dropoffZone') return patch(row, { to_zone_id: id }, 'Dropoff zone')
    // Driver: their usual vehicle goes with them; the car on the job now comes off first.
    const driver = drivers.rows.value.find((d) => d.id === id)
    if (!driver?.usual_vehicle_id) {
        toast.add({ title: 'No usual vehicle for this driver', description: 'Open the booking to choose the vehicle.', color: 'warning', icon: 'i-bx-alert-circle' })
        return
    }
    try {
        if (row.assignment_id) await api.post(`/fleet/assignments/${row.assignment_id}/release`)
        await api.post('/fleet/assignments', { fleet_booking_uuid: row.uuid, driver_id: driver.id, vehicle_id: driver.usual_vehicle_id })
        toast.add({ title: `${driver.name} assigned`, color: 'success' })
    } catch (e) {
        failed('Driver', e)
    }
    await list.load()
}
</script>


<template>
    <div class="isolate flex h-[calc(100dvh-6rem)] min-h-0 overflow-hidden rounded-md bg-zinc-900 font-sans text-(--gm-board-text) md:h-[calc(100dvh-7rem)]">
        <LimoMonthPanel :months="months" :active="activeMonth" @select="selectMonth" @add="addMonth" />

        <div class="flex min-h-0 min-w-0 flex-1 flex-col">
            <!-- Header -->
            <div class="shrink-0 border-b border-(--gm-board-border-strong) px-5 pb-0 pt-4">
                <div class="flex items-center gap-1 pb-3">
                    <h1 class="text-[26px] font-bold leading-tight text-white">{{ props.title }}</h1>
                    <span class="ml-2 self-end pb-1 text-[15px] text-(--gm-board-placeholder)">{{ monthLabel }}</span>
                </div>

                <div class="flex flex-wrap items-center gap-1.5 py-2.5">
                    <div class="mr-2 flex items-center">
                        <button
                            type="button"
                            class="flex h-8 items-center rounded-l bg-(--gm-action) px-3.5 text-sm font-medium text-white transition hover:bg-(--gm-action-hover)"
                            @click="addDate(nextGroupDate())"
                        >
                            New Date
                        </button>
                        <button
                            type="button"
                            class="flex size-8 items-center justify-center rounded-r border-l border-white/20 bg-(--gm-action) text-white hover:bg-(--gm-action-hover)"
                            title="Pick a date"
                            aria-label="Pick a date"
                            @click="startAddGroup"
                        >
                            <UIcon name="i-bx-chevron-down" class="size-5" />
                        </button>
                    </div>

                    <div class="relative">
                        <UIcon name="i-bx-search" class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-(--gm-board-placeholder)" />
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Search"
                            aria-label="Search bookings"
                            class="h-8 w-40 rounded border-none bg-transparent pl-8 pr-2 text-sm text-(--gm-board-text) placeholder-(--gm-board-placeholder) transition focus:outline-none focus:ring-2 focus:ring-(--gm-focus)"
                        >
                    </div>

                    <!-- TODO: Person, Filter, Sort, Hide and Group by, as fleet-management's toolbar (not built there either). -->
                    <button v-for="tool in [['i-bx-user', 'Person'], ['i-bx-filter', 'Filter'], ['i-bx-arrow-up-down', 'Sort'], ['i-bx-eye-slash', 'Hide'], ['i-bx-grid-column-left', 'Group by']]" :key="tool[1]" type="button" class="flex h-8 items-center gap-1.5 rounded px-2.5 text-sm text-(--gm-board-text-soft) hover:bg-(--gm-board-row-hover)">
                        <UIcon :name="tool[0]!" class="size-4" />
                        {{ tool[1] }}
                    </button>
                    <button type="button" class="flex size-8 items-center justify-center rounded text-(--gm-board-text-soft) hover:bg-(--gm-board-row-hover)" aria-label="More">
                        <UIcon name="i-bx-dots-horizontal-rounded" class="size-4" />
                    </button>
                </div>
            </div>

            <!-- Date groups -->
            <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
                <p v-if="list.pending.value && !list.rows.value.length" class="py-2 text-sm text-(--gm-board-placeholder)">Loading…</p>
                <p v-else-if="groups.length === 0" class="py-2 text-sm text-(--gm-board-placeholder)">No bookings this month.</p>

                <div v-for="group in groups" :key="group.date" class="mb-2">
                    <div class="flex items-center" style="height: 40px">
                        <div class="sticky left-0 z-20 flex items-center gap-1.5 bg-zinc-900 pr-4">
                            <button type="button" class="flex size-5 items-center justify-center" :style="{ color: group.color }" :aria-label="`Fold ${group.title}`" @click="collapsed[group.date] = !collapsed[group.date]">
                                <UIcon name="i-bxf-chevron-down" class="size-5 transition-transform" :class="{ '-rotate-90': collapsed[group.date] }" />
                            </button>
                            <span class="text-[15px] font-bold" :style="{ color: group.color }">{{ group.title }}</span>
                        </div>
                    </div>

                    <div v-show="!collapsed[group.date]" class="scrollbar-hidden w-full min-w-0 max-h-[70vh] overflow-auto">
                        <div style="width: max-content; min-width: 100%">
                            <!-- Header, rows and the add row in one bordered card; overflow-clip keeps the frozen columns working. -->
                            <div class="overflow-clip rounded-t-md rounded-bl-md border border-(--gm-board-border-strong) [overflow-clip-margin:0px]">
                                <!-- Column header: sticky inside the group's scroll box (max-h 70vh, as fleet-management), so it stays
                                     on top while the date's rows scroll under it, until the last row has gone by. The card's
                                     overflow-clip is not a scroll container, so it does not stop the sticking. -->
                                <div class="sticky top-0 z-40 flex items-stretch bg-(--gm-board-header) text-[13px] text-(--gm-board-text-soft) shadow-[0_1px_0_var(--gm-board-border-strong)]" style="height: 42px">
                                    <div :style="{ width: `${CHECKBOX_WIDTH}px` }" class="sticky left-0 z-30 flex shrink-0 items-center justify-center overflow-hidden rounded-tl-md bg-(--gm-board-header)">
                                        <div class="absolute bottom-0 left-0 top-0 w-1.5" :style="{ backgroundColor: group.color }" />
                                        <input type="checkbox" class="size-4 rounded border border-(--gm-board-checkbox) bg-transparent accent-(--gm-focus)" aria-label="Select all">
                                    </div>
                                    <div :style="{ width: `${NAME_WIDTH}px`, left: `${CHECKBOX_WIDTH}px` }" class="sticky z-30 flex shrink-0 items-center justify-center border-l border-(--gm-board-border-strong) bg-(--gm-board-header)">
                                        <span class="font-medium">Reservation Number (RSVN)</span>
                                    </div>
                                    <div
                                        v-for="col in LIMO_COLUMNS"
                                        :key="col.key"
                                        :style="{ width: `${col.width}px` }"
                                        class="flex shrink-0 items-center justify-center gap-1.5 border-l border-(--gm-board-border-strong)"
                                    >
                                        <span class="font-medium">{{ col.label }}</span>
                                        <UIcon v-if="col.info" name="i-bx-info-circle" class="size-3.5 text-(--gm-board-placeholder)" />
                                    </div>
                                </div>

                                <!-- Rows -->
                                <div
                                    v-for="row in group.items"
                                    :key="row.uuid"
                                    class="group/row flex items-stretch border-b border-(--gm-board-border) bg-(--gm-board-row) transition-colors hover:bg-(--gm-board-row-hover)"
                                    style="height: 38px"
                                >
                                    <div :style="{ width: `${CHECKBOX_WIDTH}px` }" class="sticky left-0 z-30 flex shrink-0 items-center justify-center bg-(--gm-board-row) group-hover/row:bg-(--gm-board-row-hover)">
                                        <div class="absolute bottom-0 left-0 top-0 w-1.5" :style="{ backgroundColor: group.color }" />
                                        <input type="checkbox" class="size-4 rounded border border-(--gm-board-checkbox) bg-transparent accent-(--gm-focus) opacity-70 group-hover/row:opacity-100" :aria-label="`Select ${row.client_reference ?? row.reference}`">
                                    </div>
                                    <div :style="{ width: `${NAME_WIDTH}px`, left: `${CHECKBOX_WIDTH}px` }" class="sticky z-30 flex shrink-0 items-center border-l border-(--gm-board-border) bg-(--gm-board-row) pr-2 group-hover/row:bg-(--gm-board-row-hover)">
                                        <span
                                            class="flex-1 truncate pl-3 text-[13px] outline-none"
                                            spellcheck="false"
                                            :contenteditable="canWrite"
                                            @keydown.enter.prevent="commitEdit($event, row, 'rsvn', 'RSVN')"
                                            @keydown.esc="($event.target as HTMLElement).blur()"
                                            @blur="revertEdit($event, row.client_reference ?? row.reference)"
                                        >{{ row.client_reference ?? row.reference }}</span>
                                        <NuxtLink
                                            v-if="row.pending_changes"
                                            :to="`/limo/changes?booking=${row.uuid}`"
                                            class="mr-1 shrink-0 rounded-full bg-(--gm-status-workshop) px-2 py-0.5 text-[11px] font-semibold text-black"
                                            :title="`${row.pending_changes} client change(s) waiting`"
                                        >{{ row.pending_changes }} {{ row.pending_changes === 1 ? 'change' : 'changes' }}</NuxtLink>
                                        <NuxtLink :to="`/limo/${row.uuid}`" class="flex size-6 shrink-0 items-center justify-center text-(--gm-board-placeholder) opacity-0 transition hover:text-white group-hover/row:opacity-100" :title="`Open booking ${row.reference}`">
                                            <UIcon name="i-bx-arrow-out-up-right-square" class="size-[18px]" />
                                        </NuxtLink>
                                    </div>

                                    <template v-for="col in LIMO_COLUMNS" :key="col.key">
                                        <!-- Status chip -->
                                        <div v-if="col.type === 'status'" :style="{ width: `${col.width}px` }" class="shrink-0 border-l border-(--gm-board-border)">
                                            <button
                                                type="button"
                                                class="flex size-full items-center justify-center px-2 text-center text-[13px] font-medium"
                                                :class="{ 'outline-2 -outline-offset-2 outline-(--gm-action) outline': statusMenu.row === row }"
                                                :style="statusStyle(row.status)"
                                                title="Change status"
                                                :disabled="!canWrite"
                                                @click="openStatusMenu(row, $event)"
                                            >
                                                {{ limoStatus(row.status)?.label ?? row.status }}
                                            </button>
                                        </div>

                                        <!-- Searchable picker (zones, driver) -->
                                        <div v-else-if="col.type === 'picker'" :style="{ width: `${col.width}px` }" class="shrink-0 border-l border-(--gm-board-border)">
                                            <button
                                                type="button"
                                                class="group/picker flex size-full items-center justify-center gap-1 px-2 text-[13px] hover:bg-(--gm-board-cell-hover)"
                                                :class="{ 'outline-2 -outline-offset-2 outline-(--gm-action) outline': pickerMenu.row === row && pickerMenu.key === col.key }"
                                                :disabled="!canWrite"
                                                @click="openPickerMenu(row, col.key, $event)"
                                            >
                                                <span class="truncate" :class="cellValue(row, col.key) ? 'text-(--gm-board-text)' : 'text-(--gm-board-placeholder)'">
                                                    {{ cellValue(row, col.key) || `Select ${col.key === 'driverName' ? 'driver' : 'zone'}` }}
                                                </span>
                                                <UIcon name="i-bx-chevron-down" class="size-4 text-(--gm-board-placeholder) opacity-0 group-hover/picker:opacity-100" />
                                            </button>
                                        </div>

                                        <!-- Read-only, from a linked record -->
                                        <div v-else-if="col.type === 'readonly'" :style="{ width: `${col.width}px` }" class="flex shrink-0 cursor-not-allowed select-none items-center justify-center border-l border-(--gm-board-border) text-[13px] text-(--gm-board-text-muted)" title="Filled automatically">
                                            <span class="truncate px-2">{{ cellValue(row, col.key) || '-' }}</span>
                                        </div>

                                        <!-- Time -->
                                        <div v-else-if="col.type === 'time'" :style="{ width: `${col.width}px` }" class="flex shrink-0 items-center justify-center border-l border-(--gm-board-border) text-[13px]">
                                            <input
                                                type="time"
                                                :value="cellValue(row, 'time')"
                                                class="time-input w-full rounded bg-transparent px-2 text-center text-[13px] outline-none focus:ring-2 focus:ring-(--gm-focus)"
                                                :aria-label="`Pickup time for ${row.client_reference ?? row.reference}`"
                                                :disabled="!canWrite"
                                                @change="saveTime(row, ($event.target as HTMLInputElement).value)"
                                            >
                                        </div>

                                        <!-- Editable text -->
                                        <div v-else :style="{ width: `${col.width}px` }" class="flex shrink-0 items-center justify-center border-l border-(--gm-board-border) text-[13px]">
                                            <span
                                                class="w-full truncate px-2 text-center outline-none"
                                                :contenteditable="canWrite"
                                                spellcheck="false"
                                                @keydown.enter.prevent="commitEdit($event, row, col.key, col.label)"
                                                @keydown.esc="($event.target as HTMLElement).blur()"
                                                @blur="revertEdit($event, cellValue(row, col.key))"
                                            >{{ cellValue(row, col.key) }}</span>
                                        </div>
                                    </template>
                                </div>

                                <!-- Add row (name frozen) -->
                                <!-- Add row: sticky just above the sticky summary (44 px), so a record can be added without scrolling to the end. -->
                                <div v-if="props.canAdd && canWrite" class="group/add sticky z-[35] flex items-stretch bg-(--gm-board-row) shadow-[0_-1px_0_var(--gm-board-border-strong)]" style="height: 40px; bottom: 44px">
                                    <div :style="{ width: `${CHECKBOX_WIDTH}px` }" class="sticky left-0 z-30 shrink-0 overflow-hidden rounded-bl-md bg-(--gm-board-row)">
                                        <div class="absolute bottom-0 left-0 top-0 w-1.5 opacity-40 transition group-hover/add:opacity-100" :style="{ backgroundColor: group.color }" />
                                    </div>
                                    <div :style="{ width: `${NAME_WIDTH}px`, left: `${CHECKBOX_WIDTH}px` }" class="sticky z-30 flex shrink-0 items-center bg-(--gm-board-row)">
                                        <input
                                            v-model="newDrafts[group.date]"
                                            type="text"
                                            placeholder="+ Add reservation number"
                                            class="w-full bg-transparent px-3 text-[13px] placeholder-(--gm-board-placeholder) outline-none"
                                            @keyup.enter="addReservation(group.date)"
                                        >
                                    </div>
                                    <div class="flex-1" />
                                </div>
                            </div>

                            <!-- Summary: attached under the table, spanning to the end. Sticky at the bottom of the group's scroll
                                 box (as the header is at the top), so it stays in view while the rows scroll above it. -->
                            <div class="sticky bottom-0 z-40 flex items-stretch" style="height: 44px">
                                <div :style="{ width: `${CHECKBOX_WIDTH + NAME_WIDTH}px` }" class="sticky left-0 z-30 shrink-0 bg-zinc-900" />
                                <div class="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-b-md border-x border-b border-(--gm-board-border-group) bg-(--gm-board-row)">
                                    <template v-for="col in LIMO_COLUMNS" :key="col.key">
                                        <div v-if="col.type === 'time'" :style="{ width: `${col.width}px` }" class="flex shrink-0 items-center justify-center">
                                            <span v-if="group.items.length" class="whitespace-nowrap rounded-full bg-(--gm-time-pill) px-3 py-1 text-xs font-medium text-white">{{ timeRange(group.items) }}</span>
                                        </div>
                                        <div v-else-if="col.type === 'status'" :style="{ width: `${col.width}px` }" class="flex shrink-0 items-center border-l border-(--gm-board-border) px-3">
                                            <div class="flex h-[18px] w-full overflow-hidden rounded-sm" title="Status breakdown">
                                                <div v-for="(seg, i) in statusBreakdown(group.items)" :key="i" :style="{ width: `${seg.percent}%`, backgroundColor: seg.color }" />
                                            </div>
                                        </div>
                                        <div v-else :style="{ width: `${col.width}px` }" class="shrink-0 border-l border-(--gm-board-border)" />
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Add a date group -->
                <div class="mt-3">
                    <button v-if="!isAddingGroup" type="button" class="flex h-8 items-center gap-1.5 px-1.5 text-sm font-medium text-(--gm-text-soft) hover:text-(--gm-action)" @click="startAddGroup">
                        <span class="text-base leading-none">+</span> Add new date
                    </button>
                    <div v-else class="flex items-center gap-2">
                        <input
                            ref="newGroupInput"
                            v-model="newGroupDate"
                            type="date"
                            :min="monthBounds.min"
                            :max="monthBounds.max"
                            class="h-8 rounded border border-(--gm-action) bg-zinc-800 px-3 text-sm text-zinc-100 focus:outline-none"
                            @keyup.enter="confirmAddGroup"
                            @keyup.esc="cancelAddGroup"
                        >
                        <button type="button" class="h-8 rounded bg-(--gm-action) px-3 text-sm font-medium text-white transition hover:bg-(--gm-action-hover)" @click="confirmAddGroup">Create</button>
                        <button type="button" class="h-8 px-3 text-sm text-(--gm-text-soft) hover:text-zinc-200" @click="cancelAddGroup">Cancel</button>
                    </div>
                </div>
            </div>
        </div>

        <OpsReasonModal :action="reasonAction" />

        <!-- Status and picker popovers: teleported, so the groups' scroll containers do not clip them -->
        <Teleport to="body">
            <template v-if="statusMenu.row">
                <div class="fixed inset-0 z-[100]" @click="statusMenu.row = null" />
                <div class="fixed z-[101] flex w-[260px] -translate-x-1/2 flex-col gap-2 rounded-lg bg-(--gm-board-popover) p-5 shadow-[0_8px_24px_var(--gm-board-shadow)]" :style="{ left: `${statusMenu.x}px`, top: `${statusMenu.y}px` }">
                    <div class="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-(--gm-board-popover)" />
                    <button
                        v-for="option in LIMO_STATUSES"
                        :key="option.value"
                        type="button"
                        class="relative min-h-8 rounded-sm px-3 py-1 text-[14px] font-medium transition hover:brightness-110"
                        :style="statusStyle(option.value)"
                        @click="setStatus(option.value)"
                    >
                        {{ option.label }}
                    </button>
                </div>
            </template>

            <template v-if="pickerMenu.row">
                <div class="fixed inset-0 z-[100]" @click="pickerMenu.row = null" />
                <div class="fixed z-[101] flex w-[280px] -translate-x-1/2 flex-col gap-2 rounded-lg bg-(--gm-board-popover) p-3 shadow-[0_8px_24px_var(--gm-board-shadow)]" :style="{ left: `${pickerMenu.x}px`, top: `${pickerMenu.y}px` }">
                    <div class="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-(--gm-board-popover)" />
                    <div class="relative">
                        <UIcon name="i-bx-search" class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-(--gm-board-placeholder)" />
                        <input
                            v-model="pickerMenu.query"
                            type="text"
                            :placeholder="`Search ${pickerNoun}`"
                            class="h-8 w-full rounded border border-(--gm-board-border-strong) bg-(--gm-board-input) pl-8 pr-2 text-[13px] text-(--gm-board-text) placeholder-(--gm-board-placeholder) outline-none focus:border-(--gm-focus)"
                        >
                    </div>
                    <div class="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
                        <button
                            v-for="option in pickerOptions"
                            :key="option.id"
                            type="button"
                            class="flex min-h-8 items-center justify-between gap-2 rounded-sm bg-(--gm-board-chip) px-3 py-1 text-[14px] font-medium text-white transition hover:bg-(--gm-board-chip-hover)"
                            @click="setPicker(option.id)"
                        >
                            <span class="truncate">{{ option.name }}</span>
                            <span class="shrink-0 text-[11px] text-(--gm-board-text-sub)">{{ option.sub }}</span>
                        </button>
                        <div v-if="pickerOptions.length === 0" class="py-2 text-center text-[13px] text-(--gm-board-placeholder)">No {{ pickerNoun }}s found</div>
                    </div>
                </div>
            </template>
        </Teleport>
    </div>
</template>

<style scoped>
/* Dark-friendly native time picker, as fleet-management: the clock button is black by default. */
.time-input::-webkit-calendar-picker-indicator {
    filter: invert(1);
    opacity: 0.45;
    cursor: pointer;
}
.time-input::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
}
.time-input::-webkit-inner-spin-button {
    display: none;
}
</style>
