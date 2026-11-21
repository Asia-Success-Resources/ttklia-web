<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Document expiry: drivers' licences and PSV, and vehicles' insurance, road tax and permits, soonest first, with
// those already expired at the top (red) and those within the window in amber. Renew sets the new expiry.
// GET /documents?owner&expiring_within, PATCH /documents/{id}. Permission: fleet.drivers_expiry.read (doc 27).
useHead({ title: 'Documents expiry' })

interface Row extends Record<string, unknown> {
    id: number
    owner: 'driver' | 'vehicle'
    owner_id: number
    owner_name: string | null
    owner_phone: string | null
    type: string
    number: string | null
    expires_on: string | null
    days_left: number | null
    status: string
}

const api = useFleetApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('fleet.drivers.write') || can('fleet.vehicles.write'))

const search = ref('')
const owner = ref<string | undefined>(undefined)
const within = ref('60')
const list = useApiList<Row>({ search, path: '/documents', workspaceScoped: true, query: () => ({ owner: owner.value, expiring_within: within.value }) })
onMounted(() => list.load())
watch([owner, within], () => list.load())

const { form, fieldError, show, submit } = useFormModal(() => ({ id: 0, label: '', number: '', expires_on: '' }))
async function save() {
    if (await submit((d) => api.patch(`/documents/${d.id}`, { number: d.number || null, expires_on: d.expires_on || null }))) {
        toast.add({ title: 'Expiry saved', color: 'success' })
        await list.load(list.pagination.value?.current_page ?? 1)
    }
}

const columns: TableColumn<Row>[] = [
    {
        accessorKey: 'owner_name',
        header: 'Driver or vehicle',
        cell: ({ row }) => h(resolveComponent('NuxtLink'), { to: row.original.owner === 'driver' ? `/drivers/${row.original.owner_id}` : `/vehicles/${row.original.owner_id}`, class: 'font-medium hover:underline' }, () => row.original.owner_name ?? '—'),
    },
    { accessorKey: 'owner', header: 'Kind', cell: ({ row }) => statusLabel(row.original.owner) },
    { accessorKey: 'type', header: 'Document', cell: ({ row }) => statusLabel(row.original.type) },
    { accessorKey: 'number', header: 'Number' },
    { accessorKey: 'expires_on', header: 'Expires', cell: ({ row }) => formatDate(row.original.expires_on) },
    {
        accessorKey: 'days_left',
        header: 'Days left',
        cell: ({ row }) => {
            const d = row.original.days_left
            if (d === null) return '—'
            return h('span', { class: d < 0 ? 'font-medium text-error' : d <= 30 ? 'text-warning' : '' }, d < 0 ? `${-d} days ago` : `${d} days`)
        },
    },
    actionsColumn<Row>((row) => (canWrite.value ? [{ label: 'Renew', icon: 'i-bx-refresh-cw', onSelect: () => show({ id: row.id, label: `${statusLabel(row.type)}: ${row.owner_name}`, number: row.number ?? '', expires_on: '' }) }] : [])),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Documents expiry"
        subject="documents"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        @page="list.load"
    >
        <template #actions>
            <USelect v-model="owner" :items="[{ label: 'Drivers and vehicles', value: undefined }, { label: 'Drivers', value: 'driver' }, { label: 'Vehicles', value: 'vehicle' }]" class="w-48" />
            <USelect v-model="within" :items="[{ label: 'Expired or within 30 days', value: '30' }, { label: 'Within 60 days', value: '60' }, { label: 'Within 90 days', value: '90' }, { label: 'Within a year', value: '365' }]" class="w-52" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="`Renew ${form.data.label}`" :saving="form.saving" :error="form.error" submit-label="Save" @submit="save">
        <OpsFormField label="New number" :error="fieldError('number')"><UInput v-model="form.data.number" class="w-full" /></OpsFormField>
        <OpsFormField label="New expiry" required :error="fieldError('expires_on')"><UInput v-model="form.data.expires_on" type="date" class="w-full" /></OpsFormField>
    </OpsFormModal>
</template>
