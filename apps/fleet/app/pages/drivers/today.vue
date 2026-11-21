<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Drivers today (doc 19, "Driver board"): every fleet driver with their status for the day, replacing the colour marks
// on the sheet: available, on van duty (GUEST VAN), off, leave (CUTI), stationed at Genting (GHR), no vehicle (XDE
// KERETA), standby; with their usual vehicle and their jobs that day. Assigning only offers drivers who are free.
// GET /fleet/drivers/today?date, PUT /fleet/drivers/{id}/day-status. Permission: fleet.drivers_today.read / write.
useHead({ title: 'Drivers today' })

interface Row extends Record<string, unknown> {
    id: number
    name: string
    driver_no: string | null
    phone_e164: string | null
    tier: string
    languages: string[]
    day_status: string
    day_note: string | null
    jobs_count: number
    first_job_at: string | null
    usual_vehicle: string | null
}

const STATUSES = ['available', 'on_van_duty', 'off', 'leave', 'stationed_at_genting', 'no_vehicle', 'standby']
const api = useFleetApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('fleet.drivers_today.write'))

const search = ref('')
const date = ref(todayYmd())
const status = ref<string | undefined>(undefined)
const list = useApiList<Row>({ search, path: '/fleet/drivers/today', workspaceScoped: true, query: () => ({ date: date.value, status: status.value }) })
onMounted(() => list.load())
watch([date, status], () => list.load())
// The status cell (with its picker) reads `status`: the driver's status that day.
const rows = computed(() => list.rows.value.map((r) => ({ ...r, status: r.day_status })))

async function setStatus(row: Row, next: string, note?: string) {
    try {
        await api.put(`/fleet/drivers/${row.id}/day-status`, { status: next, date: date.value, note: note ?? null })
        toast.add({ title: `${row.name}: ${statusLabel(next)}`, color: 'success' })
        await list.load(list.pagination.value?.current_page ?? 1)
    } catch (e) {
        toast.add({ title: fleetError(e), color: 'error' })
    }
}
const noteAction = useReasonAction()
function withNote(row: Row) {
    noteAction.ask({ title: `Note for ${row.name}`, label: 'Note', submitLabel: 'Save note', required: false, run: (note) => setStatus(row, row.day_status, note) })
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Driver', cell: ({ row }) => h(resolveComponent('NuxtLink'), { to: `/drivers/${row.original.id}`, class: 'font-medium hover:underline' }, () => row.original.name) },
    { accessorKey: 'phone_e164', header: 'Phone' },
    { accessorKey: 'usual_vehicle', header: 'Usual vehicle' },
    { accessorKey: 'status', header: 'Status today' },
    { accessorKey: 'day_note', header: 'Note' },
    { accessorKey: 'jobs_count', header: 'Jobs', cell: ({ row }) => (row.original.jobs_count ? `${row.original.jobs_count} · from ${formatTime(row.original.first_job_at)}` : '—') },
    { accessorKey: 'languages', header: 'Languages', cell: ({ row }) => row.original.languages.join(', ') || '—' },
    actionsColumn<Row>((row) => (canWrite.value ? [{ label: 'Note', icon: 'i-bx-note', onSelect: () => withNote(row) }] : [])),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Drivers today"
        subject="drivers"
        :rows="rows"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :status-options="canWrite ? STATUSES : []"
        :can-export="false"
        @page="list.load"
        @status="(row: Row, s: string) => setStatus(row, s)"
    >
        <template #actions>
            <UInput v-model="date" type="date" class="w-40" />
            <USelect v-model="status" :items="[{ label: 'Everyone', value: undefined }, ...STATUSES.map((s) => ({ label: statusLabel(s), value: s }))]" class="w-44" />
        </template>
    </OpsListPage>
    <OpsReasonModal :action="noteAction" />
</template>
