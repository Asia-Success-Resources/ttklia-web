<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Rosters (today's AGENT LIST, doc 19): who usually runs each van route, at what times and on which days, from a date
// (and until one). Each night tomorrow's van trips are made from the rosters valid that day; staff adjust the day on
// the van board. `?route=` shows one route. GET/POST /fleet/van-rosters, PATCH/DELETE …/{id}. Permission:
// fleet.van_rosters.read / write (doc 27).
useHead({ title: 'Van rosters' })

interface Row extends Record<string, unknown> {
    id: number
    van_route_id: number
    driver_id: number
    vehicle_id: number | null
    route_code: string
    route_name: string
    driver_name: string | null
    driver_no: string | null
    plate_no: string | null
    pickup_time: string
    return_time: string
    days: string[]
    valid_from: string
    valid_to: string | null
}

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((d) => ({ label: statusLabel(d), value: d }))
const route = useRoute()
const api = useFleetApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('fleet.van_rosters.write'))
const options = useFleetOptions()

const search = ref('')
const current = ref(true)
const routeId = computed(() => (typeof route.query.route === 'string' ? Number(route.query.route) : undefined))
const list = useApiList<Row>({ search, path: '/fleet/van-rosters', workspaceScoped: true, query: () => ({ current: current.value ? 1 : undefined, van_route_id: routeId.value }) })
onMounted(() => list.load())
watch([current, routeId], () => list.load())
const reload = () => list.load(list.pagination.value?.current_page ?? 1)

const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({
    van_route_id: undefined as number | undefined, driver_id: undefined as number | undefined, vehicle_id: undefined as number | undefined,
    pickup_time: '06:00', return_time: '12:00', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as string[], valid_from: todayYmd(), valid_to: '',
}))
function open(row?: Row) {
    editing.value = row ?? null
    options.routes.load()
    options.drivers.load()
    options.vehicles.load()
    show(row ? {
        van_route_id: row.van_route_id, driver_id: row.driver_id, vehicle_id: row.vehicle_id ?? undefined, pickup_time: row.pickup_time, return_time: row.return_time,
        days: row.days, valid_from: row.valid_from, valid_to: row.valid_to ?? '',
    } : { van_route_id: routeId.value })
}
async function save() {
    const saved = await submit(async (d) => {
        const body = { ...d, vehicle_id: d.vehicle_id ?? null, valid_to: d.valid_to || null }
        if (editing.value) await api.patch(`/fleet/van-rosters/${editing.value.id}`, body)
        else await api.post('/fleet/van-rosters', body)
    })
    if (saved) {
        toast.add({ title: 'Roster saved', color: 'success' })
        await reload()
    }
}
async function remove(row: Row) {
    if (!confirm(`Remove ${row.driver_name} from ${row.route_name}? Trips already made stay.`)) return
    try {
        await api.del(`/fleet/van-rosters/${row.id}`)
        toast.add({ title: 'Roster line removed', color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: fleetError(e), color: 'error' })
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'route_name', header: 'Route', cell: ({ row }) => `${row.original.route_name} (${row.original.route_code})` },
    { accessorKey: 'driver_name', header: 'Driver', cell: ({ row }) => h(resolveComponent('NuxtLink'), { to: `/drivers/${row.original.driver_id}`, class: 'hover:underline' }, () => row.original.driver_name ?? '—') },
    { accessorKey: 'plate_no', header: 'Van' },
    { id: 'times', header: 'Pick up · Return', cell: ({ row }) => `${row.original.pickup_time} · ${row.original.return_time}` },
    { accessorKey: 'days', header: 'Days', cell: ({ row }) => (row.original.days.length === 7 ? 'Every day' : row.original.days.map(statusLabel).join(', ')) },
    { id: 'valid', header: 'Valid', cell: ({ row }) => `${formatDate(row.original.valid_from)} – ${row.original.valid_to ? formatDate(row.original.valid_to) : 'on'}` },
    actionsColumn<Row>((row) => (canWrite.value ? [
        { label: 'Edit', icon: 'i-bx-edit', onSelect: () => open(row) },
        { label: 'Remove', icon: 'i-bx-trash', color: 'error' as const, onSelect: () => remove(row) },
    ] : [])),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Van rosters"
        subject="roster lines"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        :note="routeId ? 'Showing one route.' : undefined"
        @page="list.load"
    >
        <template #actions>
            <USwitch v-model="current" label="Valid today only" />
            <UButton v-if="routeId" label="All routes" color="neutral" variant="outline" to="/van/rosters" />
            <UButton v-if="canWrite" label="Add to roster" icon="i-bx-plus" @click="open()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? 'Edit Roster Line' : 'Add to Roster'" :saving="form.saving" :error="form.error" submit-label="Save" @submit="save">
        <OpsFormField label="Route" required full :error="fieldError('van_route_id')"><USelectMenu v-model="form.data.van_route_id" :items="options.items.routes.value" value-key="value" class="w-full" /></OpsFormField>
        <OpsFormField label="Driver" required :error="fieldError('driver_id')"><USelectMenu v-model="form.data.driver_id" :items="options.items.drivers.value" value-key="value" class="w-full" /></OpsFormField>
        <OpsFormField label="Usual van" :error="fieldError('vehicle_id')"><USelectMenu v-model="form.data.vehicle_id" :items="[{ label: '—', value: undefined }, ...options.items.vehicles.value]" value-key="value" class="w-full" /></OpsFormField>
        <OpsFormField label="Pick up" required :error="fieldError('pickup_time')"><UInput v-model="form.data.pickup_time" type="time" class="w-full" /></OpsFormField>
        <OpsFormField label="Return" required :error="fieldError('return_time')"><UInput v-model="form.data.return_time" type="time" class="w-full" /></OpsFormField>
        <OpsFormField label="Days" required full :error="fieldError('days')"><UCheckboxGroup v-model="form.data.days" :items="DAYS" orientation="horizontal" /></OpsFormField>
        <OpsFormField label="From" required :error="fieldError('valid_from')"><UInput v-model="form.data.valid_from" type="date" class="w-full" /></OpsFormField>
        <OpsFormField label="Until (empty: no end)" :error="fieldError('valid_to')"><UInput v-model="form.data.valid_to" type="date" class="w-full" /></OpsFormField>
    </OpsFormModal>
</template>
