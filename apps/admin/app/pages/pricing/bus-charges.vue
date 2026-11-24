<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Bus charges: the TBS structure's five charge lines per terminal (doc 23, decided 20 Nov 2026), with the amount,
// valid_from and the grade cap beside each. Permission: global.pricing_bus_charges.read (doc 27). Admin app (Sitemap 4).
// GET /api/admin/pricing/bus-charges?workspace={slug}: the charge rules; POST adds one, ending the rule live for the
// same band when it starts (ttklia-api). The five lines' amounts come from the terminal settings (doc 23).
// A change is a new row (a new valid_from) or a new settings version, never an edit to a past one.
// TODO(pending: B7) the phase 2 ticket charge tiers and RM5 partner charge, loaded with valid_from 1 Dec 2026.
useHead({ title: 'Bus charges' })

interface ChargeLine extends Record<string, unknown> {
    line: string
    paid_by: string
    amount: string
    valid_from: string | null
    cap: string | null
}

interface ChargeRule extends Record<string, unknown> {
    id: number
    channel_group: 'own' | 'partner'
    price_from_rm: number
    price_to_rm: number | null
    fee_rm: number | null
    percent_bp: number | null
    max_rm: number | null
    payer: string
    collected_by: string
    valid_from: string
    valid_to: string | null
    note: string | null
}


/** The bus terminals the user can see: their `bus_terminal` workspaces from /me (doc 27), never a fixed list. */
const { me } = useMe()
const terminals = computed(() =>
    (me.value?.workspaces ?? []).filter((w) => w.type === 'bus_terminal').map((w) => ({ label: w.name, value: w.slug })),
)
const terminal = ref('')
watch(terminals, (list) => { if (!terminal.value && list[0]) terminal.value = list[0].value }, { immediate: true })

const api = useApi()
const toast = useToast()
const { can } = useMe()
const rules = useApiList<ChargeRule>({ path: '/admin/pricing/bus-charges', query: () => ({ workspace: terminal.value || undefined }) })
const loading = computed(() => rules.pending.value)
const load = () => (terminal.value ? rules.load() : undefined)
watch(terminal, load)
onMounted(load)

// Add a rule (fleet-style popup). It starts at "From" (default now) and ends the rule live for the same band.
const { form, fieldError, show, submit } = useFormModal(() => ({
    channel_group: 'own',
    price_from_rm: '0',
    price_to_rm: '',
    charge_kind: 'fee',
    fee_rm: '',
    percent: '',
    max_rm: '',
    payer: 'operator',
    collected_by: 'deduct_from_payout',
    valid_from: '',
    note: '',
}))
// Charges are ringgit (ADR 0003, amendment of 21 Nov 2026).
const sen = (v: string) => rmInput(v)
async function save() {
    // The terminal goes as ?workspace=slug; the API turns it into the rule's workspace.
    const saved = await submit((d) =>
        api.post(`/admin/pricing/bus-charges?workspace=${encodeURIComponent(terminal.value)}`, {
            channel_group: d.channel_group,
            price_from_rm: sen(d.price_from_rm) ?? 0,
            price_to_rm: sen(d.price_to_rm),
            fee_rm: d.charge_kind === 'fee' ? sen(d.fee_rm) : null,
            percent_bp: d.charge_kind === 'percent' ? Math.round(Number(d.percent || 0) * 100) : null,
            max_rm: d.charge_kind === 'percent' ? sen(d.max_rm) : null,
            payer: d.payer,
            collected_by: d.collected_by,
            valid_from: d.valid_from || null,
            note: d.note || null,
        }),
    )
    if (saved) {
        toast.add({ title: 'Charge rule added', color: 'success' })
        await rules.load()
    }
}

/** The five lines and who pays them (doc 23); the amounts live in the terminal settings. */
const emptyLines: ChargeLine[] = [
    { line: 'Facility charge (APAD)', paid_by: 'Passenger, per ticket', amount: '—', valid_from: null, cap: null },
    { line: 'Boarding pass fee', paid_by: 'Passenger, collections only', amount: '—', valid_from: null, cap: null },
    { line: 'Ticket charge', paid_by: 'Operator, from the payout', amount: '—', valid_from: null, cap: null },
    { line: 'Commercial charge, other platforms', paid_by: 'Partner, or the operator', amount: '—', valid_from: null, cap: null },
    { line: 'Bus entry charge', paid_by: 'Operator, once per service', amount: '—', valid_from: null, cap: null },
]
const lines = computed(() => emptyLines)

const lineColumns: TableColumn<ChargeLine>[] = [
    { accessorKey: 'line', header: 'Charge' },
    { accessorKey: 'paid_by', header: 'Paid by' },
    { accessorKey: 'amount', header: 'Amount' },
    { accessorKey: 'valid_from', header: 'Valid from', cell: ({ row }) => formatDate(row.original.valid_from) },
    { accessorKey: 'cap', header: 'Grade cap', cell: ({ row }) => row.original.cap ?? '—' },
]

const ruleColumns: TableColumn<ChargeRule>[] = [
    { accessorKey: 'channel_group', header: 'Channels', cell: ({ row }) => (row.original.channel_group === 'own' ? 'Ticket charge (own channels)' : 'Commercial charge (partners)') },
    {
        id: 'band',
        header: 'Ticket price',
        cell: ({ row }) => `${formatRm(row.original.price_from_rm)} – ${row.original.price_to_rm === null ? 'no limit' : formatRm(row.original.price_to_rm)}`,
    },
    {
        id: 'charge',
        header: 'Charge',
        cell: ({ row }) => {
            const r = row.original
            if (r.fee_rm !== null) return formatRm(r.fee_rm)
            const pct = r.percent_bp !== null ? `${r.percent_bp / 100}%` : '—'
            return r.max_rm !== null ? `${pct}, max ${formatRm(r.max_rm)}` : pct
        },
    },
    { accessorKey: 'payer', header: 'Payer' },
    { accessorKey: 'collected_by', header: 'Collected by' },
    { accessorKey: 'valid_from', header: 'Valid from', cell: ({ row }) => formatDate(row.original.valid_from) },
    { accessorKey: 'valid_to', header: 'Valid to', cell: ({ row }) => formatDate(row.original.valid_to) },
    { accessorKey: 'note', header: 'Note' },
]
</script>

<template>
    <div class="space-y-6">
        <OpsBreadcrumb title="Bus charges" />
        <div class="rounded-xl border border-(--ops-border) bg-(--ops-card)">
            <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                    <h3 class="text-base font-medium text-gray-800 dark:text-white/90">Bus charges</h3>
                    <p class="text-sm text-gray-500">Fare plus five charge lines, as at TBS. The fare is the same on every channel.</p>
                </div>
                <USelect v-model="terminal" :items="terminals" class="w-44" />
            </div>
            <div class="border-t border-gray-100 dark:border-gray-800">
                <UTable :data="lines" :columns="lineColumns" :loading="loading" />
            </div>
        </div>

        <div class="rounded-xl border border-(--ops-border) bg-(--ops-card)">
            <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                    <h3 class="text-base font-medium text-gray-800 dark:text-white/90">Ticket and commercial charge rules</h3>
                    <p class="text-sm text-gray-500">Each change is a new row. Tickets keep the rule they were sold with.</p>
                </div>
                <UButton v-if="can('global.pricing_bus_charges.write')" label="Add rule" icon="i-bx-plus" @click="show()" />
            </div>
            <UAlert
                class="mx-5 mb-3"
                color="warning"
                variant="subtle"
                description="Phase 2 tiers (from 1 Dec 2026) switch on only when TMAS confirms them (doc 30, B7)."
            />
            <div class="border-t border-gray-100 dark:border-gray-800">
                <UTable :data="rules.rows.value" :columns="ruleColumns" :loading="loading" empty="No charge rules yet" />
            </div>
            <OpsPagination v-if="rules.pagination.value && rules.pagination.value.total > 0" :meta="rules.pagination.value" :loading="loading" @page="rules.load" />
            <div>
            </div>
        </div>
    </div>

    <OpsFormModal v-model:open="form.open" title="Add Charge Rule" :saving="form.saving" :error="form.error" submit-label="Add Rule" @submit="save">
        <OpsFormField label="Channels" required :error="fieldError('channel_group')">
            <USelect v-model="form.data.channel_group" :items="[{ label: 'Ticket charge (own channels)', value: 'own' }, { label: 'Commercial charge (partners)', value: 'partner' }]" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Charged as" required>
            <USelect v-model="form.data.charge_kind" :items="[{ label: 'Flat fee', value: 'fee' }, { label: 'Percentage with a cap', value: 'percent' }]" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Ticket price from (RM)" :error="fieldError('price_from_rm')"><UInput v-model="form.data.price_from_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Ticket price to (RM, empty = no limit)" :error="fieldError('price_to_rm')"><UInput v-model="form.data.price_to_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField v-if="form.data.charge_kind === 'fee'" label="Fee (RM)" required :error="fieldError('fee_rm')"><UInput v-model="form.data.fee_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <template v-else>
            <OpsFormField label="Percentage (%)" required :error="fieldError('percent_bp')"><UInput v-model="form.data.percent" type="number" min="0" max="100" step="0.01" class="w-full" /></OpsFormField>
            <OpsFormField label="Cap (RM)" :error="fieldError('max_rm')"><UInput v-model="form.data.max_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        </template>
        <OpsFormField label="Paid by" required :error="fieldError('payer')">
            <USelect v-model="form.data.payer" :items="[{ label: 'Operator', value: 'operator' }, { label: 'Partner', value: 'partner' }]" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Collected by" required :error="fieldError('collected_by')">
            <USelect v-model="form.data.collected_by" :items="[{ label: 'Deducted from the payout', value: 'deduct_from_payout' }, { label: 'Invoiced', value: 'invoice' }]" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Starts (empty = now)" :error="fieldError('valid_from')"><UInput v-model="form.data.valid_from" type="date" class="w-full" /></OpsFormField>
        <OpsFormField label="Note" :error="fieldError('note')"><UInput v-model="form.data.note" class="w-full" /></OpsFormField>
    </OpsFormModal>
</template>
