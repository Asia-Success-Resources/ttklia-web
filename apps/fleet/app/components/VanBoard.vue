<script setup lang="ts">
import type { VanColumnKey, VanRow, VanStatus } from '~/utils/vanBoard'

// The van board: the limo board's table design (components/LimoBoard.vue) on `van_trips` (doc 19, "Van trips"),
// with the columns of fleet-management's van trips board (the GGM daily trip sheet). A month list, then one
// coloured date group per service date, each a table with a frozen checkbox and trip number, status chips,
// driver and route pickers, and a summary row with the pickup and return time ranges and the total pax.
//
// GET /ops/w/{workspace}/fleet/van-trips?from&to (one month at a time) and …/months for the month list. Edits save at
// once (PATCH /fleet/van-trips/{id}): Enter in Remarks or Pax, the time pickers, the status chip and the route picker.
// The driver picker assigns the driver with the van they last drove (POST /fleet/assignments; the old one comes off).
// Trips are made each night from the rosters (doc 19); "+ Add trip" adds one by hand (POST /fleet/van-trips).

const props = withDefaults(
    defineProps<{
        title: string
        /** Show only trips in these statuses. */
        statuses?: VanStatus[]
        /** The "+ Add trip" row. */
        canAdd?: boolean
    }>(),
    { statuses: undefined, canAdd: false },
)

const toast = useToast()
const api = useFleetApi()
const { can } = useMe()
const canWrite = computed(() => can('fleet.van_trips.write'))

const today = todayYmd()
const activeMonth = ref(today.slice(0, 7))
function monthRange(month: string) {
    const [y, m] = month.split('-').map(Number) as [number, number]
    return { from: ymd(new Date(y, m - 1, 1)), to: ymd(new Date(y, m, 0)) }
}
const list = useApiAll<VanRow>({
    path: '/fleet/van-trips',
    workspaceScoped: true,
    query: () => ({ ...monthRange(activeMonth.value), status: props.statuses?.join(',') }),
    max: 5000,
})
const routes = useApiAll<{ id: number; name: string; code: string; status: string }>({ path: '/fleet/van-routes', workspaceScoped: true })
const drivers = useApiAll<{ id: number; name: string; usual_vehicle: string | null; usual_vehicle_id: number | null; day_status: string }>({
    path: '/fleet/drivers/today',
    workspaceScoped: true,
})
const monthCounts = ref<{ month: string; days: number }[]>([])
async function loadMonths() {
    try {
        monthCounts.value = (await api.get<{ data: { month: string; days: number }[] }>('/fleet/van-trips/months')).data
    } catch {
        monthCounts.value = []
    }
}
onMounted(() => {
    list.load()
    loadMonths()
    routes.load()
    drivers.load()
})
watch(activeMonth, () => list.load())

function failed(what: string, e: unknown) {
    toast.add({ title: `${what} not saved`, description: fleetError(e), color: 'error', icon: 'i-bx-alert-circle' })
}
async function patch(row: VanRow, body: Record<string, unknown>, what: string) {
    try {
        await api.patch(`/fleet/van-trips/${row.id}`, body)
        toast.add({ title: `${what} saved`, color: 'success' })
    } catch (e) {
        failed(what, e)
    }
    await list.load()
}

// ---------------------------------------------------------------- months and date groups
const addedMonths = ref<string[]>([])
const addedDates = ref<string[]>([])
const collapsed = ref<Record<string, boolean>>({})
const searchQuery = ref('')

const rowsByDate = computed(() => {
    const byDate: Record<string, VanRow[]> = {}
    for (const row of list.rows.value) {
        if (props.statuses && !props.statuses.includes(row.status)) continue
        ;(byDate[row.service_date] ||= []).push(row)
    }
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

function matches(row: VanRow): boolean {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return true
    return [row.trip_no, row.route_name, row.pickup_point_name, row.driver_name, row.driver_phone, row.vehicle_plate, row.remarks]
        .some((v) => v?.toLowerCase().includes(q))
}

/** Date groups of the open month, newest first, as the limo board. */
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

const monthLabel = computed(() => {
    const [y, m] = activeMonth.value.split('-').map(Number) as [number, number]
    return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1))
})

const monthBounds = computed(() => {
    const [y, m] = activeMonth.value.split('-').map(Number) as [number, number]
    return { min: ymd(new Date(y, m - 1, 1)), max: ymd(new Date(y, m, 0)) }
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
// "+ Add trip": a popup with the route and times, for a trip the rosters did not make.
const { form: addForm, fieldError: addError, show: showAdd, submit: submitAdd } = useFormModal(() => ({
    date: '', van_route_id: undefined as number | undefined, pickup: '06:00', back: '', remarks: '',
}))
const routeItems = computed(() => routes.rows.value.filter((r) => r.status === 'active').map((r) => ({ label: `${r.name} (${r.code})`, value: r.id })))
function addTrip(date: string) {
    showAdd({ date })
}
async function saveTrip() {
    const saved = await submitAdd((d) => api.post('/fleet/van-trips', {
        van_route_id: d.van_route_id,
        pickup_at: `${d.date} ${d.pickup}`,
        return_at: d.back ? `${d.date} ${d.back}` : null,
        remarks: d.remarks || null,
    }))
    if (saved) {
        toast.add({ title: 'Trip added', color: 'success' })
        await Promise.all([list.load(), loadMonths()])
    }
}

/** Inline edits save only on Enter; any other way out restores the saved value (as the limo board). */
function commitEdit(event: Event, row: VanRow, key: VanColumnKey, label: string) {
    const el = event.target as HTMLElement
    const value = el.innerText.trim()
    if (key === 'pax' && value !== '' && !/^\d+$/.test(value)) {
        toast.add({ title: 'Pax must be a whole number', color: 'warning', icon: 'i-bx-alert-circle' })
        el.blur()
        return
    }
    el.blur()
    if (key === 'pax') patch(row, { pax_count: value === '' ? null : Number(value) }, label)
    else if (key === 'remarks') patch(row, { remarks: value || null }, label)
}
function saveTime(row: VanRow, key: VanColumnKey, value: string) {
    if (!value) return
    patch(row, { [key === 'returnTime' ? 'return_at' : 'pickup_at']: `${row.service_date} ${value}` }, key === 'returnTime' ? 'Return time' : 'Pick up time')
}
function revertEdit(event: Event, saved: string | null) {
    ;(event.target as HTMLElement).innerText = saved ?? ''
}

function statusStyle(value: string | null | undefined) {
    const bg = vanStatus(value)?.color ?? UNSET_STATUS_COLOR
    return { backgroundColor: bg, color: statusTextColor(bg) }
}

function timeRange(items: VanRow[], key: 'pickupTime' | 'returnTime'): string {
    const times = items.map((i) => vanCellValue(i, key)).filter(Boolean).sort()
    if (times.length === 0) return ''
    return times.length === 1 ? times[0]! : `${times[0]} - ${times.at(-1)}`
}

function totalPax(items: VanRow[]): number {
    return items.reduce((sum, i) => sum + (i.pax_count ?? 0), 0)
}

function statusBreakdown(items: VanRow[]) {
    if (items.length === 0) return [{ color: UNSET_STATUS_COLOR, percent: 100 }]
    const counts = new Map<VanStatus, number>()
    for (const item of items) counts.set(item.status, (counts.get(item.status) ?? 0) + 1)
    const rank = (s: VanStatus) => VAN_STATUSES.findIndex((o) => o.value === s)
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || rank(a[0]) - rank(b[0]))
        .map(([status, count]) => ({ color: vanStatus(status)?.color ?? UNSET_STATUS_COLOR, percent: (count / items.length) * 100 }))
}

// ---------------------------------------------------------------- popovers (status and pickers)
interface Menu { row: VanRow | null; key: VanColumnKey | null; x: number; y: number; query: string }
const statusMenu = reactive<Menu>({ row: null, key: null, x: 0, y: 0, query: '' })
const pickerMenu = reactive<Menu>({ row: null, key: null, x: 0, y: 0, query: '' })

function place(menu: Menu, row: VanRow, key: VanColumnKey, event: MouseEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    Object.assign(menu, { row, key, x: rect.left + rect.width / 2, y: rect.bottom + 8, query: '' })
}
function openStatusMenu(row: VanRow, event: MouseEvent) {
    pickerMenu.row = null
    if (statusMenu.row === row) statusMenu.row = null
    else place(statusMenu, row, 'status', event)
}
function openPickerMenu(row: VanRow, key: VanColumnKey, event: MouseEvent) {
    statusMenu.row = null
    if (pickerMenu.row === row && pickerMenu.key === key) pickerMenu.row = null
    else place(pickerMenu, row, key, event)
}
function setStatus(status: VanStatus) {
    const row = statusMenu.row
    statusMenu.row = null
    if (!row || row.status === status) return
    if (status === 'assigned') {
        toast.add({ title: 'Pick a driver to assign the trip', color: 'info', icon: 'i-bx-info-circle' })
        return
    }
    if (status === 'cancelled' && !confirm(`Cancel trip ${row.trip_no}? Its driver is taken off.`)) return
    patch(row, { status }, 'Status')
}

const pickerNoun = computed(() => (pickerMenu.key === 'driverName' ? 'driver' : 'route'))
const pickerOptions = computed(() => {
    const q = pickerMenu.query.trim().toLowerCase()
    const options = pickerMenu.key === 'driverName'
        ? drivers.rows.value.map((d) => ({ id: d.id, name: d.name, sub: d.day_status === 'available' ? (d.usual_vehicle ?? '') : d.day_status.replace(/_/g, ' ') }))
        : routes.rows.value.map((r) => ({ id: r.id, name: r.name, sub: r.code.toUpperCase() }))
    return q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options
})
async function setPicker(id: number) {
    const row = pickerMenu.row
    const key = pickerMenu.key
    pickerMenu.row = null
    if (!row) return
    if (key === 'route') return patch(row, { van_route_id: id }, 'Route')
    // Driver: their usual van goes with them; the one on the trip now comes off first.
    const driver = drivers.rows.value.find((d) => d.id === id)
    if (!driver?.usual_vehicle_id) {
        toast.add({ title: 'No usual van for this driver', color: 'warning', icon: 'i-bx-alert-circle' })
        return
    }
    try {
        for (const assignment of row.assignment_ids) await api.post(`/fleet/assignments/${assignment}/release`)
        await api.post('/fleet/assignments', { van_trip_id: row.id, driver_id: driver.id, vehicle_id: driver.usual_vehicle_id })
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
                            aria-label="Search trips"
                            class="h-8 w-40 rounded border-none bg-transparent pl-8 pr-2 text-sm text-(--gm-board-text) placeholder-(--gm-board-placeholder) transition focus:outline-none focus:ring-2 focus:ring-(--gm-focus)"
                        >
                    </div>

                    <!-- TODO: Person, Filter, Sort, Hide and Group by, as the limo board's toolbar (not built there either). -->
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
                <p v-if="groups.length === 0" class="py-2 text-sm text-(--gm-board-placeholder)">No trips this month.</p>

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
                                    <div :style="{ width: `${VAN_NAME_WIDTH}px`, left: `${CHECKBOX_WIDTH}px` }" class="sticky z-30 flex shrink-0 items-center justify-center border-l border-(--gm-board-border-strong) bg-(--gm-board-header)">
                                        <span class="font-medium">Trip No</span>
                                    </div>
                                    <div
                                        v-for="col in VAN_COLUMNS"
                                        :key="col.key"
                                        :style="{ width: `${col.width}px` }"
                                        class="flex shrink-0 flex-col items-center justify-center border-l border-(--gm-board-border-strong) leading-tight"
                                    >
                                        <span v-if="col.group" class="text-[10px] uppercase tracking-wide text-(--gm-board-placeholder)">{{ col.group }}</span>
                                        <span class="flex items-center gap-1.5 font-medium">
                                            {{ col.label }}
                                            <UIcon v-if="col.info" name="i-bx-info-circle" class="size-3.5 text-(--gm-board-placeholder)" />
                                        </span>
                                    </div>
                                </div>

                                <!-- Rows -->
                                <div
                                    v-for="row in group.items"
                                    :key="row.id"
                                    class="group/row flex items-stretch border-b border-(--gm-board-border) bg-(--gm-board-row) transition-colors hover:bg-(--gm-board-row-hover)"
                                    style="height: 38px"
                                >
                                    <div :style="{ width: `${CHECKBOX_WIDTH}px` }" class="sticky left-0 z-30 flex shrink-0 items-center justify-center bg-(--gm-board-row) group-hover/row:bg-(--gm-board-row-hover)">
                                        <div class="absolute bottom-0 left-0 top-0 w-1.5" :style="{ backgroundColor: group.color }" />
                                        <input type="checkbox" class="size-4 rounded border border-(--gm-board-checkbox) bg-transparent accent-(--gm-focus) opacity-70 group-hover/row:opacity-100" :aria-label="`Select ${row.trip_no}`">
                                    </div>
                                    <div :style="{ width: `${VAN_NAME_WIDTH}px`, left: `${CHECKBOX_WIDTH}px` }" class="sticky z-30 flex shrink-0 select-none items-center justify-center border-l border-(--gm-board-border) bg-(--gm-board-row) text-[13px] group-hover/row:bg-(--gm-board-row-hover)">
                                        <span class="truncate px-2">{{ row.trip_no }}</span>
                                    </div>

                                    <template v-for="col in VAN_COLUMNS" :key="col.key">
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
                                                {{ vanStatus(row.status)?.label ?? row.status }}
                                            </button>
                                        </div>

                                        <!-- Searchable picker (driver, route) -->
                                        <div v-else-if="col.type === 'picker'" :style="{ width: `${col.width}px` }" class="shrink-0 border-l border-(--gm-board-border)">
                                            <button
                                                type="button"
                                                class="group/picker flex size-full items-center justify-center gap-1 px-2 text-[13px] hover:bg-(--gm-board-cell-hover)"
                                                :class="{ 'outline-2 -outline-offset-2 outline-(--gm-action) outline': pickerMenu.row === row && pickerMenu.key === col.key }"
                                                :disabled="!canWrite"
                                                @click="openPickerMenu(row, col.key, $event)"
                                            >
                                                <span class="truncate" :class="vanCellValue(row, col.key) ? 'text-(--gm-board-text)' : 'text-(--gm-board-placeholder)'">
                                                    {{ vanCellValue(row, col.key) || `Select ${col.key === 'driverName' ? 'driver' : 'route'}` }}
                                                </span>
                                                <UIcon name="i-bx-chevron-down" class="size-4 text-(--gm-board-placeholder) opacity-0 group-hover/picker:opacity-100" />
                                            </button>
                                        </div>

                                        <!-- Read-only, from a linked record -->
                                        <div v-else-if="col.type === 'readonly'" :style="{ width: `${col.width}px` }" class="flex shrink-0 cursor-not-allowed select-none items-center justify-center border-l border-(--gm-board-border) text-[13px] text-(--gm-board-text-muted)" title="Filled automatically">
                                            <span class="truncate px-2">{{ vanCellValue(row, col.key) || '-' }}</span>
                                        </div>

                                        <!-- Pick up / return time -->
                                        <div v-else-if="col.type === 'time'" :style="{ width: `${col.width}px` }" class="flex shrink-0 items-center justify-center border-l border-(--gm-board-border) text-[13px]">
                                            <input
                                                type="time"
                                                :value="vanCellValue(row, col.key)"
                                                class="time-input w-full rounded bg-transparent px-2 text-center text-[13px] outline-none focus:ring-2 focus:ring-(--gm-focus)"
                                                :aria-label="`${col.label} time for ${row.trip_no}`"
                                                :disabled="!canWrite"
                                                @change="saveTime(row, col.key, ($event.target as HTMLInputElement).value)"
                                            >
                                        </div>

                                        <!-- Editable text or number -->
                                        <div v-else :style="{ width: `${col.width}px` }" class="flex shrink-0 items-center justify-center border-l border-(--gm-board-border) text-[13px]">
                                            <span
                                                class="w-full truncate px-2 text-center outline-none"
                                                :inputmode="col.type === 'number' ? 'numeric' : undefined"
                                                :contenteditable="canWrite"
                                                spellcheck="false"
                                                @keydown.enter.prevent="commitEdit($event, row, col.key, col.label)"
                                                @keydown.esc="($event.target as HTMLElement).blur()"
                                                @blur="revertEdit($event, vanCellValue(row, col.key))"
                                            >{{ vanCellValue(row, col.key) }}</span>
                                        </div>
                                    </template>
                                </div>

                                <!-- Add row (frozen) -->
                                <div v-if="props.canAdd && canWrite" class="group/add flex items-stretch bg-(--gm-board-row)" style="height: 40px">
                                    <div :style="{ width: `${CHECKBOX_WIDTH}px` }" class="sticky left-0 z-30 shrink-0 overflow-hidden rounded-bl-md bg-(--gm-board-row)">
                                        <div class="absolute bottom-0 left-0 top-0 w-1.5 opacity-40 transition group-hover/add:opacity-100" :style="{ backgroundColor: group.color }" />
                                    </div>
                                    <div :style="{ left: `${CHECKBOX_WIDTH}px` }" class="sticky z-30 flex shrink-0 items-center bg-(--gm-board-row)">
                                        <button type="button" class="whitespace-nowrap px-3 text-[13px] text-(--gm-board-placeholder) hover:text-(--gm-board-text)" @click="addTrip(group.date)">
                                            + Add trip
                                        </button>
                                    </div>
                                    <div class="flex-1" />
                                </div>
                            </div>

                            <!-- Summary: attached under the table, spanning to the end -->
                            <div class="flex items-stretch" style="height: 44px">
                                <div :style="{ width: `${CHECKBOX_WIDTH + VAN_NAME_WIDTH}px` }" class="sticky left-0 z-30 shrink-0 bg-zinc-900" />
                                <div class="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-b-md border-x border-b border-(--gm-board-border-group) bg-(--gm-board-row)">
                                    <template v-for="(col, i) in VAN_COLUMNS" :key="col.key">
                                        <div v-if="col.type === 'time'" :style="{ width: `${col.width}px` }" class="flex shrink-0 items-center justify-center" :class="{ 'border-l border-(--gm-board-border)': i }">
                                            <span v-if="timeRange(group.items, col.key as 'pickupTime' | 'returnTime')" class="whitespace-nowrap rounded-full bg-(--gm-time-pill) px-3 py-1 text-xs font-medium text-white">{{ timeRange(group.items, col.key as 'pickupTime' | 'returnTime') }}</span>
                                        </div>
                                        <div v-else-if="col.type === 'status'" :style="{ width: `${col.width}px` }" class="flex shrink-0 items-center px-3" :class="{ 'border-l border-(--gm-board-border)': i }">
                                            <div class="flex h-[18px] w-full overflow-hidden rounded-sm" title="Status breakdown">
                                                <div v-for="(seg, s) in statusBreakdown(group.items)" :key="s" :style="{ width: `${seg.percent}%`, backgroundColor: seg.color }" />
                                            </div>
                                        </div>
                                        <div v-else-if="col.key === 'pax'" :style="{ width: `${col.width}px` }" class="flex shrink-0 flex-col items-center justify-center border-l border-(--gm-board-border) leading-tight" title="Total pax">
                                            <span class="text-[13px] font-medium text-white">{{ totalPax(group.items) }}</span>
                                            <span class="text-[10px] text-(--gm-board-placeholder)">sum</span>
                                        </div>
                                        <div v-else :style="{ width: `${col.width}px` }" class="shrink-0" :class="{ 'border-l border-(--gm-board-border)': i }" />
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

        <!-- Status and picker popovers: teleported, so the groups' scroll containers do not clip them -->
        <OpsFormModal v-model:open="addForm.open" :title="`Add trip: ${addForm.data.date}`" :saving="addForm.saving" :error="addForm.error" submit-label="Add Trip" @submit="saveTrip">
            <OpsFormField label="Route" required full :error="addError('van_route_id')">
                <USelectMenu v-model="addForm.data.van_route_id" :items="routeItems" value-key="value" class="w-full" />
            </OpsFormField>
            <OpsFormField label="Pick up" required :error="addError('pickup_at')"><UInput v-model="addForm.data.pickup" type="time" class="w-full" /></OpsFormField>
            <OpsFormField label="Return" :error="addError('return_at')"><UInput v-model="addForm.data.back" type="time" class="w-full" /></OpsFormField>
            <OpsFormField label="Remarks" full :error="addError('remarks')"><UInput v-model="addForm.data.remarks" class="w-full" /></OpsFormField>
        </OpsFormModal>

        <Teleport to="body">
            <template v-if="statusMenu.row">
                <div class="fixed inset-0 z-[100]" @click="statusMenu.row = null" />
                <div class="fixed z-[101] flex w-[260px] -translate-x-1/2 flex-col gap-2 rounded-lg bg-(--gm-board-popover) p-5 shadow-[0_8px_24px_var(--gm-board-shadow)]" :style="{ left: `${statusMenu.x}px`, top: `${statusMenu.y}px` }">
                    <div class="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-(--gm-board-popover)" />
                    <button
                        v-for="option in VAN_STATUSES"
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
/* Dark-friendly native time picker, as the limo board: the clock button is black by default. */
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
