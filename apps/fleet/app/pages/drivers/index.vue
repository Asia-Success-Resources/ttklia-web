<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Drivers (doc 19): fleet-tier drivers and anyone who drove a fleet job in the last year, with their code, phone,
// languages (for "Chinese-speaking driver" requests), status and licence and PSV expiry (red when past, amber within
// 60 days). Add, edit, suspend, approve. GET/POST /drivers, PATCH /drivers/{id}, DELETE (suspend), POST …/approve.
// Permission: fleet.drivers.read / write (doc 27).
useHead({ title: 'Drivers' })

interface Row extends Record<string, unknown> {
    id: number
    name: string
    phone_e164: string | null
    email: string | null
    driver_no: string | null
    tier: string
    licence_class: string
    languages: string[]
    status: string
    organisation_name: string | null
    base_name: string | null
    licence_expires_on: string | null
    psv_expires_on: string | null
}

const LANGUAGES = ['malay', 'english', 'chinese', 'tamil'].map((l) => ({ label: statusLabel(l), value: l }))
const TIERS = ['ttklia_fleet', 'ttklia_taxi', 'partner', 'independent'].map((t) => ({ label: statusLabel(t.replace('ttklia_', 'TTKLIA ')), value: t }))
const api = useFleetApi()
const toast = useToast()
const { can } = useMe()
const canWrite = computed(() => can('fleet.drivers.write'))
const options = useFleetOptions()

const search = ref('')
const status = ref<string | undefined>('approved')
const list = useApiList<Row>({ search, path: '/drivers', workspaceScoped: true, query: () => ({ status: status.value }) })
onMounted(() => list.load())
watch(status, () => list.load())
const reload = () => list.load(list.pagination.value?.current_page ?? 1)

const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({
    name: '', phone_e164: '', email: '', driver_no: '', tier: 'ttklia_fleet', licence_class: '', languages: [] as string[], base_poi_id: undefined as number | undefined,
}))
function open(row?: Row) {
    editing.value = row ?? null
    options.places.load()
    show(row ? {
        name: row.name, phone_e164: row.phone_e164 ?? '', email: row.email ?? '', driver_no: row.driver_no ?? '', tier: row.tier,
        licence_class: row.licence_class, languages: row.languages, base_poi_id: (row.base_poi_id as number | null) ?? undefined,
    } : {})
}
async function save() {
    const saved = await submit(async (d) => {
        const body = { name: d.name, email: d.email || null, driver_no: d.driver_no || null, tier: d.tier, licence_class: d.licence_class || null, languages: d.languages, base_poi_id: d.base_poi_id ?? null }
        if (editing.value) await api.patch(`/drivers/${editing.value.id}`, body)
        else await api.post('/drivers', { ...body, phone_e164: d.phone_e164 })
    })
    if (saved) {
        toast.add({ title: `${form.data.name} saved`, color: 'success' })
        await reload()
    }
}
async function act(row: Row, what: 'approve' | 'suspend') {
    if (what === 'suspend' && !confirm(`Suspend ${row.name}? They are no longer offered jobs.`)) return
    try {
        if (what === 'approve') await api.post(`/drivers/${row.id}/approve`)
        else await api.del(`/drivers/${row.id}`)
        toast.add({ title: `${row.name} ${what === 'approve' ? 'approved' : 'suspended'}`, color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: fleetError(e), color: 'error' })
    }
}

const today = todayYmd()
const soon = ymd(new Date(Date.now() + 60 * 86400_000))
const expiry = (d: string | null) => (d ? h('span', { class: d < today ? 'text-error font-medium' : d <= soon ? 'text-warning' : '' }, formatDate(d)) : '—')
const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Driver', cell: ({ row }) => h(resolveComponent('NuxtLink'), { to: `/drivers/${row.original.id}`, class: 'font-medium hover:underline' }, () => row.original.name) },
    { accessorKey: 'driver_no', header: 'Code' },
    { accessorKey: 'phone_e164', header: 'Phone' },
    { accessorKey: 'tier', header: 'Tier', cell: ({ row }) => statusLabel(row.original.tier) },
    { accessorKey: 'languages', header: 'Languages', cell: ({ row }) => row.original.languages.join(', ') || '—' },
    { accessorKey: 'licence_expires_on', header: 'Licence', cell: ({ row }) => expiry(row.original.licence_expires_on) },
    { accessorKey: 'psv_expires_on', header: 'PSV', cell: ({ row }) => expiry(row.original.psv_expires_on) },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) => [
        { label: 'View', icon: 'i-bx-eye', onSelect: () => navigateTo(`/drivers/${row.id}`) },
        ...(canWrite.value ? [{ label: 'Edit', icon: 'i-bx-edit', onSelect: () => open(row) }] : []),
        ...(canWrite.value && row.status !== 'approved' ? [{ label: 'Approve', icon: 'i-bx-check', onSelect: () => act(row, 'approve') }] : []),
        ...(canWrite.value && row.status === 'approved' ? [{ label: 'Suspend', icon: 'i-bx-block', color: 'error' as const, onSelect: () => act(row, 'suspend') }] : []),
    ]),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Drivers"
        subject="drivers"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        @page="list.load"
    >
        <template #actions>
            <USelect v-model="status" :items="[{ label: 'Approved', value: 'approved' }, { label: 'Applied', value: 'applied' }, { label: 'Suspended', value: 'suspended' }, { label: 'All', value: undefined }]" class="w-36" />
            <UButton v-if="canWrite" label="Add driver" icon="i-bx-plus" @click="open()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? `Edit ${editing.name}` : 'Add Driver'" :saving="form.saving" :error="form.error" submit-label="Save Driver" @submit="save">
        <OpsFormField label="Name" required :error="fieldError('name')"><UInput v-model="form.data.name" class="w-full" /></OpsFormField>
        <OpsFormField label="Phone (+60…)" :required="!editing" :error="fieldError('phone_e164')"><UInput v-model="form.data.phone_e164" :disabled="!!editing" placeholder="+60123456789" class="w-full" /></OpsFormField>
        <OpsFormField label="Email" :error="fieldError('email')"><UInput v-model="form.data.email" type="email" class="w-full" /></OpsFormField>
        <OpsFormField label="Driver code" :error="fieldError('driver_no')"><UInput v-model="form.data.driver_no" class="w-full uppercase" /></OpsFormField>
        <OpsFormField label="Tier" :error="fieldError('tier')"><USelect v-model="form.data.tier" :items="TIERS" class="w-full" /></OpsFormField>
        <OpsFormField label="Licence class" :error="fieldError('licence_class')"><UInput v-model="form.data.licence_class" placeholder="D, E, GDL…" class="w-full" /></OpsFormField>
        <OpsFormField label="Base (for fuel distances)" full :error="fieldError('base_poi_id')">
            <USelectMenu v-model="form.data.base_poi_id" :items="[{ label: '—', value: undefined }, ...options.items.places.value]" value-key="value" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Languages" full :error="fieldError('languages')"><UCheckboxGroup v-model="form.data.languages" :items="LANGUAGES" orientation="horizontal" /></OpsFormField>
    </OpsFormModal>
</template>
