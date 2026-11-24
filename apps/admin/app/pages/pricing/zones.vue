<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Zones (table `zones`, doc 07): fare zones, bus destinations, service areas. The shape is GeoJSON; the H3 cells
// that price a trip come from the shape (tools/zone_cells.py, or the zone editor) and are set with "Set cells",
// which bumps the version. A zone in use by fares, routes, trips or bookings cannot be deleted.
// Permission: global.pricing_zones.read / write.
// TODO(api): the map editor that draws the shape and fills the cells in the browser (h3-js).
useHead({ title: 'Zones' })

interface Row extends Record<string, unknown> {
    id: number
    code: string
    name: string
    type: string
    location_type: string | null
    toll_rm: number
    show_in_kiosk: boolean
    sort: number
    h3_resolution: number
    polygon_geojson: unknown
    version: number
    workspace_code: string | null
}

const TYPES = [
    { label: 'Taxi fare', value: 'taxi_fare' },
    { label: 'Teeko fare', value: 'ride_fare' },
    { label: 'Bus destination', value: 'bus_destination' },
    { label: 'Service area', value: 'service_area' },
    { label: 'Surge', value: 'surge' },
]

const { can } = useMe()
const api = useApi()
const toast = useToast()

const workspaces = useApiAll<{ id: number; slug: string; code: string; name: string }>({ path: '/admin/workspaces' })
onMounted(() => workspaces.load())
const workspaceItems = computed(() => workspaces.rows.value.map((w) => ({ label: `${w.code} · ${w.name}`, value: w.slug })))

const search = ref('')
const workspace = ref<string | undefined>(undefined)
const type = ref<string | undefined>(undefined)
const list = useApiList<Row>({ search, path: '/admin/pricing/zones', query: () => ({ workspace: workspace.value, type: type.value }) })
onMounted(() => list.load())
watch([workspace, type], () => list.load())
const reload = () => list.load(list.pagination.value?.current_page ?? 1)

const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({
    workspace_id: undefined as number | undefined,
    code: '',
    name: '',
    type: 'taxi_fare',
    location_type: undefined as string | undefined,
    toll_rm: '0',
    show_in_kiosk: false,
    sort: '0',
    h3_resolution: '8',
    geojson: '',
}))
function open(row?: Row) {
    editing.value = row ?? null
    show(
        row
            ? {
                  code: row.code,
                  name: row.name,
                  type: row.type,
                  location_type: row.location_type ?? undefined,
                  toll_rm: String(row.toll_rm ?? 0),
                  show_in_kiosk: row.show_in_kiosk,
                  sort: String(row.sort),
                  h3_resolution: String(row.h3_resolution),
                  geojson: row.polygon_geojson ? JSON.stringify(row.polygon_geojson, null, 1) : '',
              }
            : {},
    )
}
async function save() {
    let shape: unknown = null
    if (form.data.geojson.trim()) {
        try {
            shape = JSON.parse(form.data.geojson)
        } catch {
            form.errors = { polygon_geojson: ['This is not valid GeoJSON'] }
            return
        }
    }
    const saved = await submit(async (d) => {
        const body = {
            code: d.code,
            name: d.name,
            type: d.type,
            location_type: d.location_type ?? null,
            toll_rm: rmInput(d.toll_rm) ?? 0, // ringgit (ADR 0003, amendment of 21 Nov 2026)
            show_in_kiosk: d.show_in_kiosk,
            sort: Number(d.sort || 0),
            h3_resolution: Number(d.h3_resolution),
            ...(shape ? { polygon_geojson: shape } : {}),
        }
        if (editing.value) await api.patch(`/admin/pricing/zones/${editing.value.id}`, body)
        else await api.post('/admin/pricing/zones', { ...body, workspace_id: d.workspace_id })
    })
    if (saved) {
        toast.add({ title: `${form.data.name} saved`, color: 'success' })
        await reload()
    }
}

// Set the zone's H3 cells (one hex index per line or comma).
const { form: cells, fieldError: cellsError, show: showCells, submit: submitCells } = useFormModal(() => ({ id: 0, name: '', resolution: 8, text: '' }))
async function saveCells() {
    const list = cells.data.text.split(/[\s,]+/).filter(Boolean)
    if (await submitCells((d) => api.put(`/admin/pricing/zones/${d.id}/cells`, { cells: list }))) {
        toast.add({ title: `${list.length} cells set on ${cells.data.name}`, color: 'success' })
        await reload()
    }
}

async function remove(row: Row) {
    if (!confirm(`Delete ${row.name}?`)) return
    try {
        await api.del(`/admin/pricing/zones/${row.id}`)
        toast.add({ title: `${row.name} deleted`, color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to delete it', color: 'error' })
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'workspace_code', header: 'Workspace' },
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => TYPES.find((t) => t.value === row.original.type)?.label ?? row.original.type },
    { accessorKey: 'toll_rm', header: 'Toll (RM)', cell: ({ row }) => formatRm(row.original.toll_rm) },
    { accessorKey: 'show_in_kiosk', header: 'Kiosk', cell: ({ row }) => (row.original.show_in_kiosk ? 'Shown' : '') },
    { accessorKey: 'version', header: 'Version' },
    actionsColumn<Row>((row) =>
        can('global.pricing_zones.write')
            ? [
                  { label: 'Edit', icon: 'i-bx-edit', onSelect: () => open(row) },
                  { label: 'Set H3 cells', icon: 'i-bx-grid', onSelect: () => showCells({ id: row.id, name: row.name, resolution: row.h3_resolution }) },
                  { label: 'Delete', icon: 'i-bx-trash', color: 'error' as const, onSelect: () => remove(row) },
              ]
            : [],
    ),
]
const wsIds = computed(() => workspaces.rows.value.map((w) => ({ label: `${w.code} · ${w.name}`, value: w.id })))
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Zones"
        subject="zones"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    >
        <template #actions>
            <USelectMenu v-model="workspace" :items="[{ label: 'All workspaces', value: undefined }, ...workspaceItems]" value-key="value" class="w-44" />
            <USelect v-model="type" :items="[{ label: 'All types', value: undefined }, ...TYPES]" class="w-40" />
            <UButton v-if="can('global.pricing_zones.write')" label="Create" icon="i-bx-plus" @click="open()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? 'Edit Zone' : 'New Zone'" wide :saving="form.saving" :error="form.error" submit-label="Save Zone" @submit="save">
        <OpsFormField v-if="!editing" label="Workspace" required :error="fieldError('workspace_id')">
            <USelectMenu v-model="form.data.workspace_id" :items="wsIds" value-key="value" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Type" required :error="fieldError('type')"><USelect v-model="form.data.type" :items="TYPES" class="w-full" /></OpsFormField>
        <OpsFormField label="Code" required :error="fieldError('code')"><UInput v-model="form.data.code" class="w-full" /></OpsFormField>
        <OpsFormField label="Name" required :error="fieldError('name')"><UInput v-model="form.data.name" class="w-full" /></OpsFormField>
        <OpsFormField label="Local or outstation" :error="fieldError('location_type')">
            <USelect v-model="form.data.location_type" :items="[{ label: '—', value: undefined }, { label: 'Local', value: 'local' }, { label: 'Outstation', value: 'outstation' }]" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Toll (RM)" :error="fieldError('toll_rm')"><UInput v-model="form.data.toll_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Sort" :error="fieldError('sort')"><UInput v-model="form.data.sort" type="number" min="0" class="w-full" /></OpsFormField>
        <OpsFormField label="H3 resolution" :error="fieldError('h3_resolution')"><UInput v-model="form.data.h3_resolution" type="number" min="5" max="10" class="w-full" /></OpsFormField>
        <OpsFormField label="Kiosk" :error="fieldError('show_in_kiosk')">
            <OpsStatusToggle v-model="form.data.show_in_kiosk" active-label="Shown on kiosks" inactive-label="Hidden from kiosks" />
        </OpsFormField>
        <OpsFormField label="Shape (GeoJSON)" :required="!editing" full :error="fieldError('polygon_geojson') ?? fieldError('polygon_geojson.type')">
            <UTextarea v-model="form.data.geojson" :rows="6" class="w-full font-mono text-xs" placeholder='{"type":"Polygon","coordinates":[[[101.6,3.1],…]]}' />
        </OpsFormField>
    </OpsFormModal>

    <OpsFormModal v-model:open="cells.open" :title="`H3 Cells: ${cells.data.name}`" :saving="cells.saving" :error="cells.error" submit-label="Replace Cells" @submit="saveCells">
        <OpsFormField :label="`Cells at resolution ${cells.data.resolution}, one per line`" required full :error="cellsError('cells') ?? cellsError('cells.0')">
            <UTextarea v-model="cells.data.text" :rows="10" class="w-full font-mono text-xs" placeholder="88651a0b5bfffff" />
        </OpsFormField>
        <p class="text-xs text-gray-500 sm:col-span-2">Make them from the shape with tools/zone_cells.py (doc 07). Saving replaces every cell and bumps the version.</p>
    </OpsFormModal>
</template>
