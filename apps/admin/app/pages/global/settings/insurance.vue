<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Travel protection (table `insurance_products`, doc 29): the group cover sold with tickets, its premium, TTKLIA's
// commission, where it is offered and whether it is pre-selected; and the declarations sent to the insurer.
// Permission: global.settings_insurance.read / write.
// TODO(pending: P8) see doc 30.
// TODO(pending: L4) see doc 30.
useHead({ title: 'Insurance' })

interface Row extends Record<string, unknown> {
    id: number
    code: string
    name: string
    group_policy_no: string
    applies_to: string
    channels: string
    premium_rm: number
    commission_bp: number
    default_selection: string
    valid_from: string
    valid_to: string | null
    status: string
}
interface Detail extends Row {
    insurer_organisation_id: number
    distributor_organisation_id: number | null
    max_age: number | null
    coverage_page_url: string
    wording_url: string
    summary_key: string
    tax_rm: number
}
interface Declaration extends Record<string, unknown> {
    id: number
    product_code: string
    period_from: string
    period_to: string
    cover_count: number
    premium_total_sen: number
    commission_sen: number
    sent_at: string | null
    acknowledged_at: string | null
    paid_at: string | null
}

const SELECTION = [
    { label: 'Pre-selected, can remove', value: 'opt_out' },
    { label: 'Not selected, can add', value: 'opt_in' },
    { label: 'Passenger must choose', value: 'must_choose' },
]

const { can } = useMe()
const api = useApi()
const toast = useToast()

const tab = ref<'products' | 'declarations'>('products')
const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/settings/insurance' })
const declarations = useApiList<Declaration>({ path: '/admin/settings/insurance/declarations' })
onMounted(() => list.load())
watch(tab, (t) => (t === 'declarations' ? declarations.load() : list.load()))

const orgs = useApiAll<{ id: number; name: string; type: string }>({ path: '/admin/finance/organisations' })
const orgItems = computed(() => orgs.rows.value.map((o) => ({ label: o.name, value: o.id })))

const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({
    code: '',
    name: '',
    insurer_organisation_id: undefined as number | undefined,
    distributor_organisation_id: undefined as number | undefined,
    group_policy_no: '',
    premium_rm: '2.50',
    tax_rm: '0',
    commission_pct: '',
    max_age: '',
    applies_to: ['bus'] as string[],
    channels: ['kiosk', 'counter', 'web', 'app'] as string[],
    default_selection: 'opt_out',
    coverage_page_url: '',
    wording_url: '',
    summary_key: '',
    valid_from: '',
    valid_to: '',
    status: 'active',
}))
async function open(row?: Row) {
    if (!orgs.rows.value.length) await orgs.load()
    editing.value = row ?? null
    if (!row) return show()
    try {
        const d = (await api.get<{ data: Detail }>(`/admin/settings/insurance/${row.id}`)).data
        show({
            code: d.code,
            name: d.name,
            insurer_organisation_id: d.insurer_organisation_id,
            distributor_organisation_id: d.distributor_organisation_id ?? undefined,
            group_policy_no: d.group_policy_no,
            premium_rm: String(d.premium_rm),
            tax_rm: String(d.tax_rm),
            commission_pct: String(d.commission_bp / 100),
            max_age: d.max_age === null ? '' : String(d.max_age),
            applies_to: d.applies_to.split(','),
            channels: d.channels.split(','),
            default_selection: d.default_selection,
            coverage_page_url: d.coverage_page_url,
            wording_url: d.wording_url,
            summary_key: d.summary_key,
            valid_from: d.valid_from?.slice(0, 10) ?? '',
            valid_to: d.valid_to?.slice(0, 10) ?? '',
            status: d.status,
        })
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to open it', color: 'error' })
    }
}
async function save() {
    const saved = await submit(async (d) => {
        const body = {
            name: d.name,
            insurer_organisation_id: d.insurer_organisation_id,
            distributor_organisation_id: d.distributor_organisation_id ?? null,
            group_policy_no: d.group_policy_no,
            premium_rm: rmInput(d.premium_rm), // ringgit (ADR 0003, amendment of 21 Nov 2026)
            tax_rm: rmInput(d.tax_rm) ?? 0,
            commission_bp: Math.round(Number(d.commission_pct || 0) * 100),
            max_age: d.max_age === '' ? null : Number(d.max_age),
            applies_to: d.applies_to.join(','),
            channels: d.channels.join(','),
            default_selection: d.default_selection,
            coverage_page_url: d.coverage_page_url,
            wording_url: d.wording_url,
            summary_key: d.summary_key,
            valid_from: d.valid_from,
            valid_to: d.valid_to || null,
            status: d.status,
        }
        if (editing.value) await api.patch(`/admin/settings/insurance/${editing.value.id}`, body)
        else await api.post('/admin/settings/insurance', { ...body, code: d.code })
    })
    if (saved) {
        toast.add({ title: `${form.data.name} saved`, color: 'success' })
        await list.load()
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'premium_rm', header: 'Premium (RM)', cell: ({ row }) => formatRm(row.original.premium_rm) },
    { accessorKey: 'commission_bp', header: 'Commission', cell: ({ row }) => `${row.original.commission_bp / 100}%` },
    { accessorKey: 'applies_to', header: 'For' },
    { accessorKey: 'channels', header: 'Sold at' },
    { accessorKey: 'default_selection', header: 'Default', cell: ({ row }) => SELECTION.find((s) => s.value === row.original.default_selection)?.label ?? '' },
    { accessorKey: 'status', header: 'Status' },
    actionsColumn<Row>((row) => (can('global.settings_insurance.write') ? [{ label: 'Edit', icon: 'i-bx-edit', onSelect: () => open(row) }] : [])),
]
const declarationColumns: TableColumn<Declaration>[] = [
    { accessorKey: 'product_code', header: 'Product' },
    { accessorKey: 'period_from', header: 'Period', cell: ({ row }) => `${formatDate(row.original.period_from)} – ${formatDate(row.original.period_to)}` },
    { accessorKey: 'cover_count', header: 'Covers' },
    { accessorKey: 'premium_total_sen', header: 'Premium (RM)', cell: ({ row }) => formatSen(row.original.premium_total_sen) },
    { accessorKey: 'commission_sen', header: 'Commission (RM)', cell: ({ row }) => formatSen(row.original.commission_sen) },
    { accessorKey: 'sent_at', header: 'Sent', cell: ({ row }) => formatDate(row.original.sent_at) },
    { accessorKey: 'paid_at', header: 'Paid', cell: ({ row }) => formatDate(row.original.paid_at) },
]
</script>

<template>
    <div class="mb-3 flex gap-2">
        <UButton label="Products" :variant="tab === 'products' ? 'solid' : 'outline'" color="neutral" @click="tab = 'products'" />
        <UButton label="Declarations" :variant="tab === 'declarations' ? 'solid' : 'outline'" color="neutral" @click="tab = 'declarations'" />
    </div>

    <OpsListPage
        v-if="tab === 'products'"
        v-model:search="search"
        title="Insurance"
        subject="insurance products"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        note="Waiting on: P8, L4 (doc 30). Check the pre-selected default with the insurer before launch (doc 29)."
        @page="list.load"
    >
        <template #actions>
            <UButton v-if="can('global.settings_insurance.write')" label="Create" icon="i-bx-plus" @click="open()" />
        </template>
    </OpsListPage>
    <OpsListPage
        v-else
        title="Declarations"
        subject="declarations to the insurer"
        :rows="declarations.rows.value"
        :columns="declarationColumns"
        :loading="declarations.pending.value"
        :pagination="declarations.pagination.value"
        @page="declarations.load"
    >
        <template #search><span /></template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? 'Edit Insurance Product' : 'New Insurance Product'" wide :saving="form.saving" :error="form.error" submit-label="Save Product" @submit="save">
        <OpsFormField label="Code" required :error="fieldError('code')"><UInput v-model="form.data.code" placeholder="ALLIANZ-GPA" :disabled="!!editing" class="w-full" /></OpsFormField>
        <OpsFormField label="Name" required :error="fieldError('name')"><UInput v-model="form.data.name" class="w-full" /></OpsFormField>
        <OpsFormField label="Insurer" required :error="fieldError('insurer_organisation_id')">
            <USelectMenu v-model="form.data.insurer_organisation_id" :items="orgItems" value-key="value" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Distributor" :error="fieldError('distributor_organisation_id')">
            <USelectMenu v-model="form.data.distributor_organisation_id" :items="orgItems" value-key="value" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Group policy no" required :error="fieldError('group_policy_no')"><UInput v-model="form.data.group_policy_no" class="w-full" /></OpsFormField>
        <OpsFormField label="Maximum age" :error="fieldError('max_age')"><UInput v-model="form.data.max_age" type="number" min="1" class="w-full" /></OpsFormField>
        <OpsFormField label="Premium per person (RM)" required :error="fieldError('premium_rm')"><UInput v-model="form.data.premium_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Tax (RM)" required :error="fieldError('tax_rm')"><UInput v-model="form.data.tax_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="TTKLIA commission (%)" required :error="fieldError('commission_bp')"><UInput v-model="form.data.commission_pct" type="number" min="0" max="100" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Default at checkout" required :error="fieldError('default_selection')"><USelect v-model="form.data.default_selection" :items="SELECTION" class="w-full" /></OpsFormField>
        <OpsFormField label="Sold with" required :error="fieldError('applies_to')">
            <USelectMenu v-model="form.data.applies_to" :items="[{ label: 'Bus', value: 'bus' }, { label: 'Taxi', value: 'taxi' }, { label: 'Fleet', value: 'fleet' }]" value-key="value" multiple class="w-full" />
        </OpsFormField>
        <OpsFormField label="Offered at" required :error="fieldError('channels')">
            <USelectMenu v-model="form.data.channels" :items="[{ label: 'Kiosk', value: 'kiosk' }, { label: 'Counter', value: 'counter' }, { label: 'Web', value: 'web' }, { label: 'App', value: 'app' }]" value-key="value" multiple class="w-full" />
        </OpsFormField>
        <OpsFormField label="Coverage page link" required :error="fieldError('coverage_page_url')"><UInput v-model="form.data.coverage_page_url" type="url" class="w-full" /></OpsFormField>
        <OpsFormField label="Policy wording link" required :error="fieldError('wording_url')"><UInput v-model="form.data.wording_url" type="url" class="w-full" /></OpsFormField>
        <OpsFormField label="Summary text key" required :error="fieldError('summary_key')"><UInput v-model="form.data.summary_key" placeholder="insurance.gpa.summary" class="w-full" /></OpsFormField>
        <OpsFormField label="Status" :error="fieldError('status')">
            <USelect v-model="form.data.status" :items="[{ label: 'Active', value: 'active' }, { label: 'Paused', value: 'paused' }, { label: 'Ended', value: 'ended' }]" class="w-full" />
        </OpsFormField>
        <OpsFormField label="From" required :error="fieldError('valid_from')"><UInput v-model="form.data.valid_from" type="date" class="w-full" /></OpsFormField>
        <OpsFormField label="Until" :error="fieldError('valid_to')"><UInput v-model="form.data.valid_to" type="date" class="w-full" /></OpsFormField>
    </OpsFormModal>
</template>
