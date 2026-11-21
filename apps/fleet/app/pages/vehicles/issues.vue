<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Vehicle issues (today's VAN PROBLEM sheet, doc 19): defects reported on vehicles, open first. One that keeps the
// vehicle off the road stops it being assigned until fixed. Fix it, optionally with the service that fixed it.
// `?vehicle=` opens the report form for that vehicle. GET/POST /fleet/vehicle-issues, PATCH …/{id}, POST …/{id}/resolve.
// Permission: fleet.vehicles_issues.read / write (doc 27).
useHead({ title: 'Vehicle issues' })

interface Row extends Record<string, unknown> {
    id: number
    vehicle_id: number
    plate_no: string
    vehicle_type: string
    reported_at: string
    reported_by_name: string | null
    description: string
    blocks_use: boolean
    status: string
    fixed_on: string | null
}

const route = useRoute()
const api = useFleetApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('fleet.vehicles_issues.write'))
const options = useFleetOptions()

const search = ref('')
const status = ref<string | undefined>('open')
const list = useApiList<Row>({ search, path: '/fleet/vehicle-issues', workspaceScoped: true, query: () => ({ status: status.value }) })
onMounted(() => {
    list.load()
    if (typeof route.query.vehicle === 'string') open(undefined, Number(route.query.vehicle))
})
watch(status, () => list.load())
const reload = () => list.load(list.pagination.value?.current_page ?? 1)

const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({ vehicle_id: undefined as number | undefined, description: '', blocks_use: false }))
function open(row?: Row, vehicle?: number) {
    editing.value = row ?? null
    options.vehicles.load()
    show(row ? { vehicle_id: row.vehicle_id, description: row.description, blocks_use: row.blocks_use } : { vehicle_id: vehicle })
}
async function save() {
    const saved = await submit(async (d) => {
        if (editing.value) await api.patch(`/fleet/vehicle-issues/${editing.value.id}`, { description: d.description, blocks_use: d.blocks_use })
        else await api.post('/fleet/vehicle-issues', d)
    })
    if (saved) {
        toast.add({ title: 'Issue saved', color: 'success' })
        await reload()
    }
}
async function fix(row: Row) {
    if (!confirm(`Mark the issue on ${row.plate_no} fixed?`)) return
    try {
        await api.post(`/fleet/vehicle-issues/${row.id}/resolve`)
        toast.add({ title: `${row.plate_no} fixed`, color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: fleetError(e), color: 'error' })
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'reported_at', header: 'Reported' },
    { accessorKey: 'plate_no', header: 'Vehicle', cell: ({ row }) => h(resolveComponent('NuxtLink'), { to: `/vehicles/${row.original.vehicle_id}`, class: 'font-medium hover:underline' }, () => row.original.plate_no) },
    { accessorKey: 'description', header: 'Problem' },
    { accessorKey: 'blocks_use', header: 'Off the road', cell: ({ row }) => (row.original.blocks_use ? h('span', { class: 'font-medium text-error' }, 'Yes') : 'No') },
    { accessorKey: 'reported_by_name', header: 'Reported by' },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) => (canWrite.value && row.status === 'open' ? [
        { label: 'Edit', icon: 'i-bx-edit', onSelect: () => open(row) },
        { label: 'Fixed', icon: 'i-bx-check', onSelect: () => fix(row) },
    ] : [])),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Vehicle issues"
        subject="issues"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        @page="list.load"
    >
        <template #actions>
            <USelect v-model="status" :items="[{ label: 'Open', value: 'open' }, { label: 'Fixed', value: 'fixed' }, { label: 'All', value: undefined }]" class="w-28" />
            <UButton v-if="canWrite" label="Report issue" icon="i-bx-plus" @click="open()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? `Issue on ${editing.plate_no}` : 'Report Issue'" :saving="form.saving" :error="form.error" submit-label="Save Issue" @submit="save">
        <OpsFormField label="Vehicle" required full :error="fieldError('vehicle_id')">
            <USelectMenu v-model="form.data.vehicle_id" :items="options.items.vehicles.value" value-key="value" :disabled="!!editing" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Problem" required full :error="fieldError('description')"><UTextarea v-model="form.data.description" :rows="3" class="w-full" /></OpsFormField>
        <OpsFormField label="Off the road" full :error="fieldError('blocks_use')">
            <OpsStatusToggle v-model="form.data.blocks_use" active-label="Not to be assigned until fixed" inactive-label="Can still be used" />
        </OpsFormField>
    </OpsFormModal>
</template>
