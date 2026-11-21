<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Places: TTKLIA's own verified POI catalogue (table `pois`, doc 07) and what Google search costs. Nothing from Google
// is copied in. A place needs its pin and H3 cell before it can be active; making it active marks it verified by you.
// A place used by routes, bookings or rides is retired, not deleted. Permission: global.places.read / write.
// TODO(api): pick the pin on a map and work out the H3 cell in the browser (h3-js); for now the r10 cell is typed in.
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
    popularity: number
    status: string
}
interface Cost {
    sessions: number
    catalogue_share_bp: number
    cost_usd: number
}

const { can } = useMe()
const api = useApi()
const toast = useToast()

const search = ref('')
const status = ref<string | undefined>(undefined)
const list = useApiList<Row>({ search, path: '/admin/places', query: () => ({ status: status.value }) })
onMounted(() => list.load())
watch(status, () => list.load())
const reload = () => list.load(list.pagination.value?.current_page ?? 1)

const cost = ref<Cost | null>(null)
onMounted(async () => {
    try {
        cost.value = (await api.get<{ data: Cost }>('/admin/places/search-cost')).data
    } catch {
        cost.value = null
    }
})

const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({
    name: '',
    short_code: '',
    aliases: '',
    category: '',
    address_text: '',
    lat: '',
    lng: '',
    h3_r10: '',
    is_pickup_point: false,
    is_dropoff_point: false,
    status: 'draft',
}))
async function open(row?: Row) {
    editing.value = row ?? null
    if (!row) return show()
    let h3 = ''
    try {
        h3 = (await api.get<{ data: { h3_r10: string | null } }>(`/admin/places/${row.id}`)).data.h3_r10 ?? ''
    } catch {
        h3 = ''
    }
    show({
        name: row.name,
        short_code: row.short_code ?? '',
        aliases: (row.aliases ?? []).join(', '),
        category: row.category,
        address_text: row.address_text ?? '',
        lat: row.lat,
        lng: row.lng,
        h3_r10: h3,
        is_pickup_point: row.is_pickup_point,
        is_dropoff_point: row.is_dropoff_point,
        status: row.status,
    })
}
async function save() {
    const saved = await submit(async (d) => {
        const body = {
            name: d.name,
            short_code: d.short_code || null,
            aliases: d.aliases ? d.aliases.split(',').map((a) => a.trim()).filter(Boolean) : null,
            category: d.category,
            address_text: d.address_text || null,
            lat: Number(d.lat),
            lng: Number(d.lng),
            ...(d.h3_r10 ? { h3_r10: d.h3_r10 } : {}),
            is_pickup_point: d.is_pickup_point,
            is_dropoff_point: d.is_dropoff_point,
            status: d.status,
        }
        if (editing.value) await api.patch(`/admin/places/${editing.value.id}`, body)
        else await api.post('/admin/places', body)
    })
    if (saved) {
        toast.add({ title: `${form.data.name} saved`, color: 'success' })
        await reload()
    }
}
async function remove(row: Row) {
    if (!confirm(`Remove ${row.name}?`)) return
    try {
        const res = await api.del<{ message: string }>(`/admin/places/${row.id}`)
        toast.add({ title: res?.message === 'retired' ? `${row.name} is in use, so it was retired` : `${row.name} deleted`, color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to remove it', color: 'error' })
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'short_code', header: 'Short code' },
    { accessorKey: 'category', header: 'Category', cell: ({ row }) => statusLabel(row.original.category) },
    { accessorKey: 'address_text', header: 'Address' },
    { id: 'use', header: 'Used for', cell: ({ row }) => [row.original.is_pickup_point && 'Pick-up', row.original.is_dropoff_point && 'Drop-off'].filter(Boolean).join(', ') || '—' },
    { id: 'pin', header: 'Pin', cell: ({ row }) => (Number(row.original.lat) === 0 && Number(row.original.lng) === 0 ? 'Not set' : `${Number(row.original.lat).toFixed(5)}, ${Number(row.original.lng).toFixed(5)}`) },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) =>
        can('global.places.write')
            ? [
                  { label: 'Edit', icon: 'i-bx-edit', onSelect: () => open(row) },
                  ...(row.status !== 'retired' ? [{ label: 'Remove', icon: 'i-bx-trash', color: 'error' as const, onSelect: () => remove(row) }] : []),
              ]
            : [],
    ),
]
</script>

<template>
    <div v-if="cost" class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <OpsMetricCard label="Searches, last 30 days" :value="cost.sessions" icon="i-bx-search" />
        <div class="rounded-xl border border-(--ops-border) bg-(--ops-card) p-5">
            <p class="text-sm text-gray-500">Answered by our catalogue</p>
            <p class="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90">{{ (cost.catalogue_share_bp / 100).toFixed(1) }}%</p>
        </div>
        <div class="rounded-xl border border-(--ops-border) bg-(--ops-card) p-5">
            <p class="text-sm text-gray-500">Google cost, last 30 days</p>
            <p class="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90">US${{ cost.cost_usd.toFixed(2) }}</p>
        </div>
    </div>

    <OpsListPage
        v-model:search="search"
        title="Places"
        subject="places"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    >
        <template #actions>
            <USelect v-model="status" :items="[{ label: 'All', value: undefined }, { label: 'Draft', value: 'draft' }, { label: 'Active', value: 'active' }, { label: 'Retired', value: 'retired' }]" class="w-32" />
            <UButton v-if="can('global.places.write')" label="Create" icon="i-bx-plus" @click="open()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? 'Edit Place' : 'New Place'" :saving="form.saving" :error="form.error" submit-label="Save Place" @submit="save">
        <OpsFormField label="Name" required full :error="fieldError('name')"><UInput v-model="form.data.name" class="w-full" /></OpsFormField>
        <OpsFormField label="Category" required :error="fieldError('category')"><UInput v-model="form.data.category" placeholder="hotel, mall, terminal…" class="w-full" /></OpsFormField>
        <OpsFormField label="Short code" :error="fieldError('short_code')"><UInput v-model="form.data.short_code" class="w-full uppercase" /></OpsFormField>
        <OpsFormField label="Other names (comma separated)" full :error="fieldError('aliases')"><UInput v-model="form.data.aliases" class="w-full" /></OpsFormField>
        <OpsFormField label="Address" full :error="fieldError('address_text')"><UInput v-model="form.data.address_text" class="w-full" /></OpsFormField>

        <p class="pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:col-span-2">Pin</p>
        <OpsFormField label="Latitude" required :error="fieldError('lat')"><UInput v-model="form.data.lat" type="number" step="0.000001" class="w-full" /></OpsFormField>
        <OpsFormField label="Longitude" required :error="fieldError('lng')"><UInput v-model="form.data.lng" type="number" step="0.000001" class="w-full" /></OpsFormField>
        <OpsFormField label="H3 cell (resolution 10)" full :error="fieldError('h3_r10')"><UInput v-model="form.data.h3_r10" placeholder="8a2a1072b59ffff" class="w-full font-mono" /></OpsFormField>

        <OpsFormField label="Pick-up point" :error="fieldError('is_pickup_point')"><OpsStatusToggle v-model="form.data.is_pickup_point" active-label="Yes" inactive-label="No" /></OpsFormField>
        <OpsFormField label="Drop-off point" :error="fieldError('is_dropoff_point')"><OpsStatusToggle v-model="form.data.is_dropoff_point" active-label="Yes" inactive-label="No" /></OpsFormField>
        <OpsFormField label="Status" full :error="fieldError('status')">
            <USelect v-model="form.data.status" :items="[{ label: 'Draft', value: 'draft' }, { label: 'Active (verified)', value: 'active' }, { label: 'Retired', value: 'retired' }]" class="w-full" />
        </OpsFormField>
    </OpsFormModal>
</template>
