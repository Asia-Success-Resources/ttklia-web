<script setup lang="ts">
import type { VehicleColumnKey, VehicleRow, VehicleStatus, VehicleType } from '~/utils/vehicleBoard'

// Vehicles (doc 19): the same table layout as the limo and van boards, after fleet-management's vehicles board. One
// coloured group per type (MPV, van, car), each a table with a frozen checkbox and plate column, a sticky header,
// status chips, pickers, an add row and a status-breakdown summary. The fleet's vans, MPVs (Alphard, Vellfire) and
// cars with class, seats, condition (for "must good condition" requests), toll class, open issues (red when one keeps
// it off the road), insurance and road tax expiry, and jobs in the last 30 days.
//
// GET /ops/w/{workspace}/vehicles (all of them; retired are hidden until "Show retired"). Edits save at once: Enter in a
// cell, the status chip and the pickers (PATCH /vehicles/{id}). "+ Add vehicle" opens the form with the typed plate
// and the group's type (POST /vehicles). The plate opens the vehicle (/vehicles/{id}) for documents, issues and
// services. Permission: fleet.vehicles.read / write (doc 27).
useHead({ title: 'Vehicles' })

const toast = useToast()
const api = useFleetApi()
const { can } = useMe()
const canWrite = computed(() => can('fleet.vehicles.write'))

const list = useApiAll<VehicleRow>({ path: '/vehicles', workspaceScoped: true, max: 3000 })
onMounted(() => list.load())

function failed(what: string, e: unknown) {
    toast.add({ title: `${what} not saved`, description: fleetError(e), color: 'error', icon: 'i-bx-alert-circle' })
}
async function patch(row: VehicleRow, body: Record<string, unknown>, what: string) {
    try {
        await api.patch(`/vehicles/${row.id}`, body)
        toast.add({ title: `${row.plate_no}: ${what} saved`, color: 'success' })
    } catch (e) {
        failed(what, e)
    }
    await list.load()
}

// ---------------------------------------------------------------- groups
const searchQuery = ref('')
const showRetired = ref(false)
const collapsed = ref<Record<string, boolean>>({})

function matches(row: VehicleRow): boolean {
    if (!showRetired.value && row.status === 'retired') return false
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return true
    return [row.plate_no, row.make, row.model, row.colour, row.last_driver_name, row.vehicle_class].some((v) => v?.toLowerCase().includes(q))
}

const groups = computed(() =>
    VEHICLE_GROUPS.map((g) => ({
        ...g,
        items: list.rows.value.filter((r) => r.type === g.type && matches(r)).sort((a, b) => a.plate_no.localeCompare(b.plate_no)),
    })),
)
const shown = computed(() => groups.value.reduce((n, g) => n + g.items.length, 0))

const today = todayYmd()
/** Expired: red; within 30 days: amber. */
function expiryClass(date: string | null): string {
    if (!date) return 'text-(--gm-board-placeholder)'
    if (date < today) return 'font-medium text-(--gm-danger)'
    const soon = ymd(new Date(Date.now() + 30 * 86400_000))
    return date <= soon ? 'text-(--gm-status-workshop)' : ''
}

function statusStyle(value: string | null | undefined) {
    const bg = vehicleStatus(value)?.color ?? UNSET_STATUS_COLOR
    return { backgroundColor: bg, color: statusTextColor(bg) }
}

function statusBreakdown(items: VehicleRow[]) {
    if (items.length === 0) return [{ color: UNSET_STATUS_COLOR, percent: 100 }]
    const counts = new Map<VehicleStatus, number>()
    for (const item of items) counts.set(item.status, (counts.get(item.status) ?? 0) + 1)
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([status, count]) => ({ color: vehicleStatus(status)?.color ?? UNSET_STATUS_COLOR, percent: (count / items.length) * 100 }))
}
const sum = (items: VehicleRow[], pick: (r: VehicleRow) => number) => items.reduce((n, r) => n + pick(r), 0)

// ---------------------------------------------------------------- inline edits
/** The field each editable text column saves to; year and seats are numbers. */
const NUMBER_FIELDS: VehicleColumnKey[] = ['year', 'seats']
/** Inline edits save only on Enter; any other way out restores the saved value (as fleet-management). */
function commitEdit(event: Event, row: VehicleRow, key: VehicleColumnKey | 'plate_no', label: string) {
    const el = event.target as HTMLElement
    const value = el.innerText.trim()
    el.blur()
    if (key === 'plate_no') {
        if (value && value.toUpperCase() !== row.plate_no) patch(row, { plate_no: value }, 'Plate')
        return
    }
    const saved = vehicleCell(row, key)
    if (value === saved) return
    patch(row, { [key]: NUMBER_FIELDS.includes(key) ? (value ? Number(value) : null) : value || null }, label)
}
function revertEdit(event: Event, saved: string | null) {
    ;(event.target as HTMLElement).innerText = saved ?? ''
}

// ---------------------------------------------------------------- popovers (status and pickers)
interface Menu { row: VehicleRow | null; key: VehicleColumnKey | null; x: number; y: number }
const statusMenu = reactive<Menu>({ row: null, key: null, x: 0, y: 0 })
const pickerMenu = reactive<Menu>({ row: null, key: null, x: 0, y: 0 })

function place(menu: Menu, row: VehicleRow, key: VehicleColumnKey, event: MouseEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    Object.assign(menu, { row, key, x: rect.left + rect.width / 2, y: rect.bottom + 8 })
}
function openStatusMenu(row: VehicleRow, event: MouseEvent) {
    pickerMenu.row = null
    if (statusMenu.row === row) statusMenu.row = null
    else place(statusMenu, row, 'status', event)
}
function openPickerMenu(row: VehicleRow, key: VehicleColumnKey, event: MouseEvent) {
    statusMenu.row = null
    if (pickerMenu.row === row && pickerMenu.key === key) pickerMenu.row = null
    else place(pickerMenu, row, key, event)
}

function setStatus(status: VehicleStatus) {
    const row = statusMenu.row
    statusMenu.row = null
    if (!row || row.status === status) return
    if (status === 'retired' && !confirm(`Retire ${row.plate_no}? It is no longer offered for jobs.`)) return
    patch(row, { status }, 'Status')
}

const pickerOptions = computed(() => (pickerMenu.key ? VEHICLE_PICKERS[pickerMenu.key] ?? [] : []))
function setPicker(value: string) {
    const row = pickerMenu.row
    const key = pickerMenu.key
    pickerMenu.row = null
    if (!row || !key) return
    const col = VEHICLE_COLUMNS.find((c) => c.key === key)!
    patch(row, { [key]: key === 'toll_class' ? Number(value) : value }, col.label)
}

// ---------------------------------------------------------------- add a vehicle
const newDrafts = reactive<Record<string, string>>({})
const { form, fieldError, show, submit } = useFormModal(() => ({
    plate_no: '', type: 'mpv', vehicle_class: 'alphard', make: '', model: '', year: '', seats: '', colour: '', condition_grade: undefined as string | undefined, toll_class: '1',
}))
const DEFAULT_CLASS: Record<VehicleType, string> = { mpv: 'alphard', van: 'van', car: 'car' }

/** "+ Add vehicle": the form, with the typed plate and the group's type (as fleet-management). */
function addVehicle(type: VehicleType) {
    show({ plate_no: (newDrafts[type] ?? '').trim().toUpperCase(), type, vehicle_class: DEFAULT_CLASS[type], toll_class: type === 'van' ? '2' : '1' })
    newDrafts[type] = ''
}
async function save() {
    const saved = await submit(async (d) => {
        const n = (v: string) => (v ? Number(v) : null)
        await api.post('/vehicles', {
            plate_no: d.plate_no, type: d.type, vehicle_class: d.vehicle_class, make: d.make || null, model: d.model || null, year: n(d.year),
            seats: n(d.seats), colour: d.colour || null, condition_grade: d.condition_grade ?? null, toll_class: n(d.toll_class), status: 'active',
        })
    })
    if (saved) {
        toast.add({ title: `${form.data.plate_no.toUpperCase()} added`, color: 'success' })
        await list.load()
    }
}
</script>

<template>
    <div class="isolate flex h-[calc(100dvh-6rem)] min-h-0 flex-col overflow-hidden rounded-md bg-zinc-900 font-sans text-(--gm-board-text) md:h-[calc(100dvh-7rem)]">
        <!-- Header -->
        <div class="shrink-0 border-b border-(--gm-board-border-strong) px-5 pb-0 pt-4">
            <div class="flex items-center gap-1 pb-3">
                <h1 class="text-[26px] font-bold leading-tight text-white">Vehicles</h1>
                <span class="ml-2 self-end pb-1 text-[15px] text-(--gm-board-placeholder)">{{ shown }} shown</span>
            </div>

            <div class="flex flex-wrap items-center gap-1.5 py-2.5">
                <button
                    v-if="canWrite"
                    type="button"
                    class="mr-2 flex h-8 items-center rounded bg-(--gm-action) px-3.5 text-sm font-medium text-white transition hover:bg-(--gm-action-hover)"
                    @click="addVehicle('mpv')"
                >
                    New Vehicle
                </button>

                <div class="relative">
                    <UIcon name="i-bx-search" class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-(--gm-board-placeholder)" />
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Search"
                        aria-label="Search vehicles"
                        class="h-8 w-40 rounded border-none bg-transparent pl-8 pr-2 text-sm text-(--gm-board-text) placeholder-(--gm-board-placeholder) transition focus:outline-none focus:ring-2 focus:ring-(--gm-focus)"
                    >
                </div>

                <button
                    type="button"
                    class="flex h-8 items-center gap-1.5 rounded px-2.5 text-sm hover:bg-(--gm-board-row-hover)"
                    :class="showRetired ? 'text-white' : 'text-(--gm-board-text-soft)'"
                    @click="showRetired = !showRetired"
                >
                    <UIcon :name="showRetired ? 'i-bx-eye' : 'i-bx-eye-slash'" class="size-4" />
                    {{ showRetired ? 'Hide retired' : 'Show retired' }}
                </button>
            </div>
        </div>

        <!-- Type groups -->
        <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
            <p v-if="list.pending.value && !list.rows.value.length" class="py-2 text-sm text-(--gm-board-placeholder)">Loading…</p>

            <div v-for="group in groups" :key="group.type" class="mb-2">
                <div class="flex items-center" style="height: 40px">
                    <div class="sticky left-0 z-20 flex items-center gap-1.5 bg-zinc-900 pr-4">
                        <button type="button" class="flex size-5 items-center justify-center" :style="{ color: group.color }" :aria-label="`Fold ${group.title}`" @click="collapsed[group.type] = !collapsed[group.type]">
                            <UIcon name="i-bxf-chevron-down" class="size-5 transition-transform" :class="{ '-rotate-90': collapsed[group.type] }" />
                        </button>
                        <span class="text-[15px] font-bold" :style="{ color: group.color }">{{ group.title }}</span>
                        <span class="text-[13px] text-(--gm-board-placeholder)">{{ group.items.length }} {{ group.items.length === 1 ? 'vehicle' : 'vehicles' }}</span>
                    </div>
                </div>

                <div v-show="!collapsed[group.type]" class="scrollbar-hidden w-full min-w-0 max-h-[70vh] overflow-auto">
                    <div style="width: max-content; min-width: 100%">
                        <!-- Header, rows and the add row in one bordered card; overflow-clip keeps the frozen columns working. -->
                        <div class="overflow-clip rounded-t-md rounded-bl-md border border-(--gm-board-border-strong) [overflow-clip-margin:0px]">
                            <!-- Column header: sticky at the top of the group's scroll box -->
                            <div class="sticky top-0 z-40 flex items-stretch bg-(--gm-board-header) text-[13px] text-(--gm-board-text-soft) shadow-[0_1px_0_var(--gm-board-border-strong)]" style="height: 42px">
                                <div :style="{ width: `${CHECKBOX_WIDTH}px` }" class="sticky left-0 z-30 flex shrink-0 items-center justify-center overflow-hidden rounded-tl-md bg-(--gm-board-header)">
                                    <div class="absolute bottom-0 left-0 top-0 w-1.5" :style="{ backgroundColor: group.color }" />
                                    <input type="checkbox" class="size-4 rounded border border-(--gm-board-checkbox) bg-transparent accent-(--gm-focus)" aria-label="Select all">
                                </div>
                                <div :style="{ width: `${PLATE_WIDTH}px`, left: `${CHECKBOX_WIDTH}px` }" class="sticky z-30 flex shrink-0 items-center justify-center border-l border-(--gm-board-border-strong) bg-(--gm-board-header)">
                                    <span class="font-medium">Plate Number</span>
                                </div>
                                <div
                                    v-for="col in VEHICLE_COLUMNS"
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
                                :key="row.id"
                                class="group/row flex items-stretch border-b border-(--gm-board-border) bg-(--gm-board-row) transition-colors hover:bg-(--gm-board-row-hover)"
                                style="height: 38px"
                            >
                                <div :style="{ width: `${CHECKBOX_WIDTH}px` }" class="sticky left-0 z-30 flex shrink-0 items-center justify-center bg-(--gm-board-row) group-hover/row:bg-(--gm-board-row-hover)">
                                    <div class="absolute bottom-0 left-0 top-0 w-1.5" :style="{ backgroundColor: group.color }" />
                                    <input type="checkbox" class="size-4 rounded border border-(--gm-board-checkbox) bg-transparent accent-(--gm-focus) opacity-70 group-hover/row:opacity-100" :aria-label="`Select ${row.plate_no}`">
                                </div>
                                <div :style="{ width: `${PLATE_WIDTH}px`, left: `${CHECKBOX_WIDTH}px` }" class="sticky z-30 flex shrink-0 items-center border-l border-(--gm-board-border) bg-(--gm-board-row) pr-2 group-hover/row:bg-(--gm-board-row-hover)">
                                    <span
                                        class="flex-1 truncate pl-3 text-[13px] font-medium uppercase outline-none"
                                        spellcheck="false"
                                        :contenteditable="canWrite"
                                        @keydown.enter.prevent="commitEdit($event, row, 'plate_no', 'Plate')"
                                        @keydown.esc="($event.target as HTMLElement).blur()"
                                        @blur="revertEdit($event, row.plate_no)"
                                    >{{ row.plate_no }}</span>
                                    <NuxtLink :to="`/vehicles/${row.id}`" class="flex size-6 shrink-0 items-center justify-center text-(--gm-board-placeholder) opacity-0 transition hover:text-white group-hover/row:opacity-100" :title="`Open ${row.plate_no}`">
                                        <UIcon name="i-bx-arrow-out-up-right-square" class="size-[18px]" />
                                    </NuxtLink>
                                </div>

                                <template v-for="col in VEHICLE_COLUMNS" :key="col.key">
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
                                            {{ vehicleStatus(row.status)?.label ?? row.status }}
                                        </button>
                                    </div>

                                    <!-- Picker (class, condition, toll class) -->
                                    <div v-else-if="col.type === 'picker'" :style="{ width: `${col.width}px` }" class="shrink-0 border-l border-(--gm-board-border)">
                                        <button
                                            type="button"
                                            class="group/picker flex size-full items-center justify-center gap-1 px-2 text-[13px] hover:bg-(--gm-board-cell-hover)"
                                            :class="{ 'outline-2 -outline-offset-2 outline-(--gm-action) outline': pickerMenu.row === row && pickerMenu.key === col.key }"
                                            :disabled="!canWrite"
                                            @click="openPickerMenu(row, col.key, $event)"
                                        >
                                            <span class="truncate" :class="vehicleCell(row, col.key) ? 'text-(--gm-board-text)' : 'text-(--gm-board-placeholder)'">
                                                {{ vehicleCell(row, col.key) || 'Select' }}
                                            </span>
                                            <UIcon name="i-bx-chevron-down" class="size-4 text-(--gm-board-placeholder) opacity-0 group-hover/picker:opacity-100" />
                                        </button>
                                    </div>

                                    <!-- Open issues: red when one keeps it off the road; opens the issues list -->
                                    <div v-else-if="col.type === 'issues'" :style="{ width: `${col.width}px` }" class="flex shrink-0 items-center justify-center border-l border-(--gm-board-border) text-[13px]">
                                        <NuxtLink
                                            v-if="row.open_issues"
                                            :to="`/vehicles/${row.id}`"
                                            class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                            :class="row.blocked ? 'bg-(--gm-danger) text-white' : 'bg-(--gm-status-workshop) text-black'"
                                        >{{ row.open_issues }}{{ row.blocked ? ' · off the road' : '' }}</NuxtLink>
                                        <span v-else class="text-(--gm-board-placeholder)">-</span>
                                    </div>

                                    <!-- Document expiry -->
                                    <div v-else-if="col.type === 'expiry'" :style="{ width: `${col.width}px` }" class="flex shrink-0 cursor-default select-none items-center justify-center border-l border-(--gm-board-border) text-[13px]" title="From the vehicle's documents">
                                        <span :class="expiryClass(vehicleCell(row, col.key) || null)">{{ vehicleCell(row, col.key) ? formatDate(vehicleCell(row, col.key)) : '-' }}</span>
                                    </div>

                                    <!-- Read-only -->
                                    <div v-else-if="col.type === 'readonly'" :style="{ width: `${col.width}px` }" class="flex shrink-0 cursor-not-allowed select-none items-center justify-center border-l border-(--gm-board-border) text-[13px] text-(--gm-board-text-muted)" title="Filled automatically">
                                        <span class="truncate px-2">{{ vehicleCell(row, col.key) || '-' }}</span>
                                    </div>

                                    <!-- Editable text -->
                                    <div v-else :style="{ width: `${col.width}px` }" class="flex shrink-0 items-center justify-center border-l border-(--gm-board-border) text-[13px]">
                                        <span
                                            class="w-full truncate px-2 text-center outline-none"
                                            :contenteditable="canWrite"
                                            spellcheck="false"
                                            @keydown.enter.prevent="commitEdit($event, row, col.key, col.label)"
                                            @keydown.esc="($event.target as HTMLElement).blur()"
                                            @blur="revertEdit($event, vehicleCell(row, col.key))"
                                        >{{ vehicleCell(row, col.key) }}</span>
                                    </div>
                                </template>
                            </div>

                            <!-- Add row: sticky just above the sticky summary (44 px) -->
                            <div v-if="canWrite" class="group/add sticky z-[35] flex items-stretch bg-(--gm-board-row) shadow-[0_-1px_0_var(--gm-board-border-strong)]" style="height: 40px; bottom: 44px">
                                <div :style="{ width: `${CHECKBOX_WIDTH}px` }" class="sticky left-0 z-30 shrink-0 overflow-hidden rounded-bl-md bg-(--gm-board-row)">
                                    <div class="absolute bottom-0 left-0 top-0 w-1.5 opacity-40 transition group-hover/add:opacity-100" :style="{ backgroundColor: group.color }" />
                                </div>
                                <div :style="{ width: `${PLATE_WIDTH}px`, left: `${CHECKBOX_WIDTH}px` }" class="sticky z-30 flex shrink-0 items-center bg-(--gm-board-row)">
                                    <input
                                        v-model="newDrafts[group.type]"
                                        type="text"
                                        placeholder="+ Add vehicle"
                                        class="w-full bg-transparent px-3 text-[13px] uppercase placeholder-(--gm-board-placeholder) placeholder:normal-case outline-none"
                                        @keyup.enter="addVehicle(group.type)"
                                    >
                                </div>
                                <div class="flex-1" />
                            </div>
                        </div>

                        <!-- Summary: sticky at the bottom of the group's scroll box -->
                        <div class="sticky bottom-0 z-40 flex items-stretch" style="height: 44px">
                            <div :style="{ width: `${CHECKBOX_WIDTH + PLATE_WIDTH}px` }" class="sticky left-0 z-30 shrink-0 bg-zinc-900" />
                            <div class="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-b-md border-x border-b border-(--gm-board-border-group) bg-(--gm-board-row)">
                                <template v-for="col in VEHICLE_COLUMNS" :key="col.key">
                                    <div v-if="col.type === 'status'" :style="{ width: `${col.width}px` }" class="flex shrink-0 items-center px-3">
                                        <div class="flex h-[18px] w-full overflow-hidden rounded-sm" title="Status breakdown">
                                            <div v-for="(seg, i) in statusBreakdown(group.items)" :key="i" :style="{ width: `${seg.percent}%`, backgroundColor: seg.color }" />
                                        </div>
                                    </div>
                                    <div v-else-if="col.key === 'seats'" :style="{ width: `${col.width}px` }" class="flex shrink-0 flex-col items-center justify-center border-l border-(--gm-board-border) leading-tight" title="Total seats">
                                        <span class="text-[13px] font-medium">{{ sum(group.items, (r) => r.seats ?? 0) }}</span>
                                        <span class="text-[10px] text-(--gm-board-placeholder)">seats</span>
                                    </div>
                                    <div v-else-if="col.key === 'issues'" :style="{ width: `${col.width}px` }" class="flex shrink-0 flex-col items-center justify-center border-l border-(--gm-board-border) leading-tight" title="Open issues">
                                        <span class="text-[13px] font-medium">{{ sum(group.items, (r) => r.open_issues) }}</span>
                                        <span class="text-[10px] text-(--gm-board-placeholder)">{{ group.items.filter((r) => r.blocked).length }} off the road</span>
                                    </div>
                                    <div v-else-if="col.key === 'jobs'" :style="{ width: `${col.width}px` }" class="flex shrink-0 flex-col items-center justify-center border-l border-(--gm-board-border) leading-tight" title="Jobs in the last 30 days">
                                        <span class="text-[13px] font-medium">{{ sum(group.items, (r) => r.jobs_30d) }}</span>
                                        <span class="text-[10px] text-(--gm-board-placeholder)">jobs</span>
                                    </div>
                                    <div v-else :style="{ width: `${col.width}px` }" class="shrink-0 border-l border-(--gm-board-border)" />
                                </template>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Status and picker popovers: teleported, so the groups' scroll containers do not clip them -->
        <Teleport to="body">
            <template v-if="statusMenu.row">
                <div class="fixed inset-0 z-[100]" @click="statusMenu.row = null" />
                <div class="fixed z-[101] flex w-[220px] -translate-x-1/2 flex-col gap-2 rounded-lg bg-(--gm-board-popover) p-5 shadow-[0_8px_24px_var(--gm-board-shadow)]" :style="{ left: `${statusMenu.x}px`, top: `${statusMenu.y}px` }">
                    <div class="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-(--gm-board-popover)" />
                    <button
                        v-for="option in VEHICLE_STATUSES"
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
                <div class="fixed z-[101] flex w-[220px] -translate-x-1/2 flex-col gap-1.5 rounded-lg bg-(--gm-board-popover) p-3 shadow-[0_8px_24px_var(--gm-board-shadow)]" :style="{ left: `${pickerMenu.x}px`, top: `${pickerMenu.y}px` }">
                    <div class="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-(--gm-board-popover)" />
                    <div class="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
                        <button
                            v-for="option in pickerOptions"
                            :key="option.value"
                            type="button"
                            class="flex min-h-8 items-center rounded-sm bg-(--gm-board-chip) px-3 py-1 text-[14px] font-medium text-white transition hover:bg-(--gm-board-chip-hover)"
                            @click="setPicker(option.value)"
                        >
                            {{ option.label }}
                        </button>
                    </div>
                </div>
            </template>
        </Teleport>

        <OpsFormModal v-model:open="form.open" title="Add Vehicle" :saving="form.saving" :error="form.error" submit-label="Save Vehicle" @submit="save">
            <OpsFormField label="Plate" required :error="fieldError('plate_no')"><UInput v-model="form.data.plate_no" class="w-full uppercase" /></OpsFormField>
            <OpsFormField label="Type" required :error="fieldError('type')"><USelect v-model="form.data.type" :items="[{ label: 'MPV', value: 'mpv' }, { label: 'Van', value: 'van' }, { label: 'Car', value: 'car' }]" class="w-full" /></OpsFormField>
            <OpsFormField label="Class" required :error="fieldError('vehicle_class')"><USelect v-model="form.data.vehicle_class" :items="VEHICLE_CLASSES" class="w-full" /></OpsFormField>
            <OpsFormField label="Seats" :error="fieldError('seats')"><UInput v-model="form.data.seats" type="number" min="1" class="w-full" /></OpsFormField>
            <OpsFormField label="Make" :error="fieldError('make')"><UInput v-model="form.data.make" class="w-full" /></OpsFormField>
            <OpsFormField label="Model" :error="fieldError('model')"><UInput v-model="form.data.model" class="w-full" /></OpsFormField>
            <OpsFormField label="Year" :error="fieldError('year')"><UInput v-model="form.data.year" type="number" class="w-full" /></OpsFormField>
            <OpsFormField label="Colour" :error="fieldError('colour')"><UInput v-model="form.data.colour" class="w-full" /></OpsFormField>
            <OpsFormField label="Condition" :error="fieldError('condition_grade')">
                <USelect v-model="form.data.condition_grade" :items="[{ label: '—', value: undefined }, { label: 'New', value: 'new' }, { label: 'Good', value: 'good' }, { label: 'Fair', value: 'fair' }]" class="w-full" />
            </OpsFormField>
            <OpsFormField label="Toll class" :error="fieldError('toll_class')"><USelect v-model="form.data.toll_class" :items="['1', '2', '3', '4', '5']" class="w-full" /></OpsFormField>
        </OpsFormModal>
    </div>
</template>
