<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Fares (table `fare_rules`, versioned: doc 03). Changing a fare already in use ends it and starts a new version, so
// every sale keeps the price it was made at; a fare not started yet is edited in place. Removing a fare in use ends it.
// Permission: global.pricing_fares.read / write.
useHead({ title: 'Fares' })

interface Row extends Record<string, unknown> {
    id: number
    product: string
    vehicle_class: string | null
    ticket_type: string | null
    trip_direction: string | null
    flat_sen: number | null
    night_flat_sen: number | null
    base_sen: number | null
    per_km_sen: number | null
    per_min_sen: number | null
    min_fare_sen: number | null
    valid_from: string
    valid_to: string | null
    version: number
    workspace_code: string | null
    origin_zone_name: string | null
    dest_zone_name: string | null
}
interface Detail extends Row {
    workspace_id: number
    origin_zone_id: number | null
    dest_zone_id: number | null
    sst_rate_bp: number
    commission_bp: number
    online_surcharge_sen: number | null
    per_hour_sen: number | null
}

const PRODUCTS = [
    { label: 'Bus ticket', value: 'bus_ticket' },
    { label: 'Taxi coupon', value: 'taxi_coupon' },
    { label: 'Teeko ride', value: 'ride' },
    { label: 'Limo', value: 'limo' },
    { label: 'Van trip', value: 'van_trip' },
    { label: 'Van seat', value: 'van_seat' },
    { label: 'Rental', value: 'rental' },
    { label: 'Gate entry', value: 'gate_entry' },
]
const productName = (p: string) => PRODUCTS.find((x) => x.value === p)?.label ?? p

const { can } = useMe()
const api = useApi()
const toast = useToast()

const workspaces = useApiAll<{ id: number; slug: string; code: string; name: string }>({ path: '/admin/workspaces' })
onMounted(() => workspaces.load())

const search = ref('')
const workspace = ref<string | undefined>(undefined)
const product = ref<string | undefined>(undefined)
const current = ref(true)
const list = useApiList<Row>({ search, path: '/admin/pricing/fares', query: () => ({ workspace: workspace.value, product: product.value }) })
onMounted(() => list.load())
watch([workspace, product], () => list.load())
const rows = computed(() => (current.value ? list.rows.value.filter((r) => !r.valid_to || new Date(r.valid_to) > new Date()) : list.rows.value))
const reload = () => list.load(list.pagination.value?.current_page ?? 1)

// Zones of the chosen workspace, for origin and destination.
const zones = ref<{ label: string; value: number | undefined }[]>([])
async function loadZones(workspaceId?: number) {
    zones.value = []
    const ws = workspaces.rows.value.find((w) => w.id === workspaceId)
    if (!ws) return
    try {
        const res = await api.get<{ data: { id: number; code: string; name: string }[] }>('/admin/pricing/zones', { workspace: ws.slug, limit: 100 })
        zones.value = [{ label: '—', value: undefined }, ...res.data.map((z) => ({ label: `${z.code} · ${z.name}`, value: z.id }))]
    } catch {
        zones.value = []
    }
}

const editing = ref<Detail | null>(null)
const rm = (sen: number | null | undefined) => (sen === null || sen === undefined ? '' : String(sen / 100))
const { form, fieldError, show, submit } = useFormModal(() => ({
    workspace_id: undefined as number | undefined,
    product: 'taxi_coupon',
    origin_zone_id: undefined as number | undefined,
    dest_zone_id: undefined as number | undefined,
    vehicle_class: '',
    ticket_type: '',
    trip_direction: undefined as string | undefined,
    flat: '',
    night_flat: '',
    online_surcharge: '',
    base: '',
    per_km: '',
    per_min: '',
    per_hour: '',
    min_fare: '',
    sst_pct: '0',
    commission_pct: '0',
    valid_from: '',
}))
watch(() => form.data.workspace_id, (ws) => loadZones(ws))
async function open(row?: Row) {
    if (!workspaces.rows.value.length) await workspaces.load()
    editing.value = null
    if (!row) return show()
    try {
        const d = (await api.get<{ data: Detail }>(`/admin/pricing/fares/${row.id}`)).data
        editing.value = d
        show({
            workspace_id: d.workspace_id,
            product: d.product,
            vehicle_class: d.vehicle_class ?? '',
            ticket_type: d.ticket_type ?? '',
            trip_direction: d.trip_direction ?? undefined,
            flat: rm(d.flat_sen),
            night_flat: rm(d.night_flat_sen),
            online_surcharge: rm(d.online_surcharge_sen),
            base: rm(d.base_sen),
            per_km: rm(d.per_km_sen),
            per_min: rm(d.per_min_sen),
            per_hour: rm(d.per_hour_sen),
            min_fare: rm(d.min_fare_sen),
            sst_pct: String(d.sst_rate_bp / 100),
            commission_pct: String(d.commission_bp / 100),
        })
        await loadZones(d.workspace_id)
        form.data.origin_zone_id = d.origin_zone_id ?? undefined
        form.data.dest_zone_id = d.dest_zone_id ?? undefined
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to open it', color: 'error' })
    }
}
const sen = (v: string) => (v === '' ? null : Math.round(Number(v) * 100))
async function save() {
    let newVersion = false
    const saved = await submit(async (d) => {
        const body = {
            product: d.product,
            origin_zone_id: d.origin_zone_id ?? null,
            dest_zone_id: d.dest_zone_id ?? null,
            vehicle_class: d.vehicle_class || null,
            ticket_type: d.ticket_type || null,
            trip_direction: d.trip_direction ?? null,
            flat_sen: sen(d.flat),
            night_flat_sen: sen(d.night_flat),
            online_surcharge_sen: sen(d.online_surcharge),
            base_sen: sen(d.base),
            per_km_sen: sen(d.per_km),
            per_min_sen: sen(d.per_min),
            per_hour_sen: sen(d.per_hour),
            min_fare_sen: sen(d.min_fare),
            sst_rate_bp: Math.round(Number(d.sst_pct || 0) * 100),
            commission_bp: Math.round(Number(d.commission_pct || 0) * 100),
            valid_from: d.valid_from || null,
        }
        if (editing.value) {
            const res = await api.patch<{ data: { id: number } }>(`/admin/pricing/fares/${editing.value.id}`, body)
            newVersion = res.data.id !== editing.value.id
        } else {
            await api.post('/admin/pricing/fares', { ...body, workspace_id: d.workspace_id })
        }
    })
    if (saved) {
        toast.add({ title: newVersion ? 'New fare version saved; the old one ended' : 'Fare saved', color: 'success' })
        await reload()
    }
}
async function remove(row: Row) {
    if (!confirm('Remove this fare? A fare in use is ended now; sales keep their price.')) return
    try {
        const res = await api.del<{ message: string }>(`/admin/pricing/fares/${row.id}`)
        toast.add({ title: res?.message === 'ended' ? 'Fare ended' : 'Fare deleted', color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to remove it', color: 'error' })
    }
}

const price = (r: Row) => {
    if (r.flat_sen !== null) return `RM${formatSen(r.flat_sen)}${r.night_flat_sen ? ` (night RM${formatSen(r.night_flat_sen)})` : ''}`
    const parts = [r.base_sen !== null && `RM${formatSen(r.base_sen)} base`, r.per_km_sen && `RM${formatSen(r.per_km_sen)}/km`, r.per_min_sen && `RM${formatSen(r.per_min_sen)}/min`]
    return parts.filter(Boolean).join(' + ') || '—'
}
const workspaceItems = computed(() => workspaces.rows.value.map((w) => ({ label: `${w.code} · ${w.name}`, value: w.slug })))
const wsIds = computed(() => workspaces.rows.value.map((w) => ({ label: `${w.code} · ${w.name}`, value: w.id })))
const columns: TableColumn<Row>[] = [
    { accessorKey: 'workspace_code', header: 'Workspace' },
    { accessorKey: 'product', header: 'Product', cell: ({ row }) => productName(row.original.product) },
    { id: 'route', header: 'From → to', cell: ({ row }) => `${row.original.origin_zone_name ?? '—'} → ${row.original.dest_zone_name ?? '—'}` },
    { id: 'class', header: 'Class / type', cell: ({ row }) => [row.original.vehicle_class, row.original.ticket_type].filter(Boolean).join(' · ') || '—' },
    { id: 'price', header: 'Price', cell: ({ row }) => price(row.original) },
    { accessorKey: 'valid_from', header: 'From', cell: ({ row }) => formatDate(row.original.valid_from) },
    { accessorKey: 'valid_to', header: 'Until', cell: ({ row }) => (row.original.valid_to ? formatDate(row.original.valid_to) : '—') },
    { accessorKey: 'version', header: 'Version' },
    actionsColumn<Row>((row) =>
        can('global.pricing_fares.write') && (!row.valid_to || new Date(row.valid_to) > new Date())
            ? [
                  { label: 'Change price', icon: 'i-bx-edit', onSelect: () => open(row) },
                  { label: 'Remove', icon: 'i-bx-trash', color: 'error' as const, onSelect: () => remove(row) },
              ]
            : [],
    ),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Fares"
        subject="fares"
        :rows="rows"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    >
        <template #actions>
            <USelectMenu v-model="workspace" :items="[{ label: 'All workspaces', value: undefined }, ...workspaceItems]" value-key="value" class="w-44" />
            <USelect v-model="product" :items="[{ label: 'All products', value: undefined }, ...PRODUCTS]" class="w-36" />
            <OpsStatusToggle v-model="current" active-label="In use only" inactive-label="All versions" />
            <UButton v-if="can('global.pricing_fares.write')" label="Create" icon="i-bx-plus" @click="open()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? `Change Fare (version ${editing.version})` : 'New Fare'" wide :saving="form.saving" :error="form.error" submit-label="Save Fare" @submit="save">
        <p v-if="editing" class="text-xs text-gray-500 sm:col-span-2">If this fare is already in use, saving ends it and starts version {{ editing.version + 1 }} from the date below (or now).</p>
        <OpsFormField v-if="!editing" label="Workspace" required :error="fieldError('workspace_id')">
            <USelectMenu v-model="form.data.workspace_id" :items="wsIds" value-key="value" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Product" required :error="fieldError('product')"><USelect v-model="form.data.product" :items="PRODUCTS" class="w-full" /></OpsFormField>
        <OpsFormField label="From zone" :error="fieldError('origin_zone_id')"><USelectMenu v-model="form.data.origin_zone_id" :items="zones" value-key="value" class="w-full" /></OpsFormField>
        <OpsFormField label="To zone" :error="fieldError('dest_zone_id')"><USelectMenu v-model="form.data.dest_zone_id" :items="zones" value-key="value" class="w-full" /></OpsFormField>
        <OpsFormField label="Vehicle class" :error="fieldError('vehicle_class')"><UInput v-model="form.data.vehicle_class" placeholder="budget, executive…" class="w-full" /></OpsFormField>
        <OpsFormField label="Ticket type" :error="fieldError('ticket_type')"><UInput v-model="form.data.ticket_type" placeholder="adult, child…" class="w-full" /></OpsFormField>
        <OpsFormField label="Direction" :error="fieldError('trip_direction')">
            <USelect v-model="form.data.trip_direction" :items="[{ label: 'Either', value: undefined }, { label: 'From the terminal', value: 'from_terminal' }, { label: 'To the terminal', value: 'to_terminal' }]" class="w-full" />
        </OpsFormField>

        <p class="pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:col-span-2">Flat price</p>
        <OpsFormField label="Fare (RM)" :error="fieldError('flat_sen')"><UInput v-model="form.data.flat" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Night fare (RM)" :error="fieldError('night_flat_sen')"><UInput v-model="form.data.night_flat" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Online surcharge (RM)" :error="fieldError('online_surcharge_sen')"><UInput v-model="form.data.online_surcharge" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>

        <p class="pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:col-span-2">Metered price</p>
        <OpsFormField label="Base (RM)" :error="fieldError('base_sen')"><UInput v-model="form.data.base" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Per km (RM)" :error="fieldError('per_km_sen')"><UInput v-model="form.data.per_km" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Per minute (RM)" :error="fieldError('per_min_sen')"><UInput v-model="form.data.per_min" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Per hour (RM)" :error="fieldError('per_hour_sen')"><UInput v-model="form.data.per_hour" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Minimum fare (RM)" :error="fieldError('min_fare_sen')"><UInput v-model="form.data.min_fare" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>

        <p class="pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:col-span-2">Tax and start</p>
        <OpsFormField label="SST (%)" :error="fieldError('sst_rate_bp')"><UInput v-model="form.data.sst_pct" type="number" min="0" max="100" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Commission (%)" :error="fieldError('commission_bp')"><UInput v-model="form.data.commission_pct" type="number" min="0" max="100" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Starts (empty = now)" :error="fieldError('valid_from')"><UInput v-model="form.data.valid_from" type="datetime-local" class="w-full" /></OpsFormField>
    </OpsFormModal>
</template>
