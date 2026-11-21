<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Places (doc 19): GHR, KLIA, hotels and van pickup points, with the short codes staff key on the limo sheet (GHR, FWH,
// CF…). A place used by van routes, tolls or bookings is retired, not deleted. GET/POST /places, PATCH/DELETE
// /places/{id}. Permission: fleet.places.read / write (doc 27).
useHead({ title: 'Places' })

interface Row extends Record<string, unknown> {
    id: number
    name: string
    short_code: string | null
    aliases: string[] | null
    category: string
    address_text: string | null
    lat: string
    lng: string
    is_pickup_point: boolean
    is_dropoff_point: boolean
    status: string
}

const api = useFleetApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('fleet.places.write'))

const search = ref('')
const status = ref<string | undefined>(undefined)
const list = useApiList<Row>({ search, path: '/places', workspaceScoped: true, query: () => ({ status: status.value }) })
onMounted(() => list.load())
watch(status, () => list.load())
const reload = () => list.load(list.pagination.value?.current_page ?? 1)

const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({
    name: '', short_code: '', aliases: '', category: 'hotel', address_text: '', lat: '', lng: '', is_pickup_point: true, is_dropoff_point: true, status: 'draft',
}))
function open(row?: Row) {
    editing.value = row ?? null
    show(row ? {
        name: row.name, short_code: row.short_code ?? '', aliases: (row.aliases ?? []).join(', '), category: row.category, address_text: row.address_text ?? '',
        lat: row.lat, lng: row.lng, is_pickup_point: row.is_pickup_point, is_dropoff_point: row.is_dropoff_point, status: row.status,
    } : {})
}
async function save() {
    const saved = await submit(async (d) => {
        const body = {
            name: d.name, short_code: d.short_code ? d.short_code.toUpperCase() : null, aliases: d.aliases ? d.aliases.split(',').map((a) => a.trim()).filter(Boolean) : null,
            category: d.category, address_text: d.address_text || null, lat: Number(d.lat || 0), lng: Number(d.lng || 0),
            is_pickup_point: d.is_pickup_point, is_dropoff_point: d.is_dropoff_point, status: d.status,
        }
        if (editing.value) await api.patch(`/places/${editing.value.id}`, body)
        else await api.post('/places', body)
    })
    if (saved) {
        toast.add({ title: `${form.data.name} saved`, color: 'success' })
        await reload()
    }
}
async function remove(row: Row) {
    if (!confirm(`Remove ${row.name}?`)) return
    try {
        const res = await api.del<{ message: string }>(`/places/${row.id}`)
        toast.add({ title: res?.message === 'retired' ? `${row.name} is in use, so it was retired` : `${row.name} deleted`, color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: fleetError(e), color: 'error' })
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'short_code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'category', header: 'Category', cell: ({ row }) => statusLabel(row.original.category) },
    { accessorKey: 'address_text', header: 'Address' },
    { id: 'use', header: 'Used for', cell: ({ row }) => [row.original.is_pickup_point && 'Pick-up', row.original.is_dropoff_point && 'Drop-off'].filter(Boolean).join(', ') || '—' },
    { id: 'pin', header: 'Pin', cell: ({ row }) => (Number(row.original.lat) === 0 && Number(row.original.lng) === 0 ? 'Not set' : `${Number(row.original.lat).toFixed(5)}, ${Number(row.original.lng).toFixed(5)}`) },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) => (canWrite.value ? [
        { label: 'Edit', icon: 'i-bx-edit', onSelect: () => open(row) },
        ...(row.status !== 'retired' ? [{ label: 'Remove', icon: 'i-bx-trash', color: 'error' as const, onSelect: () => remove(row) }] : []),
    ] : [])),
]
</script>

<template>
    <OpsListPage v-model:search="search" title="Places" subject="places" :rows="list.rows.value" :columns="columns" :loading="list.pending.value" :pagination="list.pagination.value" :can-export="false" @page="list.load">
        <template #actions>
            <USelect v-model="status" :items="[{ label: 'All', value: undefined }, { label: 'Draft', value: 'draft' }, { label: 'Active', value: 'active' }, { label: 'Retired', value: 'retired' }]" class="w-32" />
            <UButton v-if="canWrite" label="Add place" icon="i-bx-plus" @click="open()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? `Edit ${editing.name}` : 'Add Place'" :saving="form.saving" :error="form.error" submit-label="Save Place" @submit="save">
        <OpsFormField label="Name" required full :error="fieldError('name')"><UInput v-model="form.data.name" class="w-full" /></OpsFormField>
        <OpsFormField label="Short code (as keyed)" :error="fieldError('short_code')"><UInput v-model="form.data.short_code" placeholder="GHR, FWH, CF" class="w-full uppercase" /></OpsFormField>
        <OpsFormField label="Category" required :error="fieldError('category')"><UInput v-model="form.data.category" placeholder="hotel, terminal, pickup_point…" class="w-full" /></OpsFormField>
        <OpsFormField label="Other names (comma separated)" full :error="fieldError('aliases')"><UInput v-model="form.data.aliases" class="w-full" /></OpsFormField>
        <OpsFormField label="Address" full :error="fieldError('address_text')"><UInput v-model="form.data.address_text" class="w-full" /></OpsFormField>
        <OpsFormField label="Latitude" :error="fieldError('lat')"><UInput v-model="form.data.lat" type="number" step="0.000001" class="w-full" /></OpsFormField>
        <OpsFormField label="Longitude" :error="fieldError('lng')"><UInput v-model="form.data.lng" type="number" step="0.000001" class="w-full" /></OpsFormField>
        <OpsFormField label="Pick-up point" :error="fieldError('is_pickup_point')"><OpsStatusToggle v-model="form.data.is_pickup_point" active-label="Yes" inactive-label="No" /></OpsFormField>
        <OpsFormField label="Drop-off point" :error="fieldError('is_dropoff_point')"><OpsStatusToggle v-model="form.data.is_dropoff_point" active-label="Yes" inactive-label="No" /></OpsFormField>
        <OpsFormField label="Status" full :error="fieldError('status')">
            <USelect v-model="form.data.status" :items="[{ label: 'Draft', value: 'draft' }, { label: 'Active (verified)', value: 'active' }, { label: 'Retired', value: 'retired' }]" class="w-full" />
        </OpsFormField>
    </OpsFormModal>
</template>
