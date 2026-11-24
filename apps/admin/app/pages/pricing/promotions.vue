<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Promotions: discount codes (table `promotions`). A percent discount is in basis points, a fixed one in sen.
// Once a code has been used its discount cannot change (only its end date and limits); deleting a used code ends it.
// Permission: global.pricing_promotions.read / write.
useHead({ title: 'Promotions' })

interface Row extends Record<string, unknown> {
    id: number
    code: string
    product: string | null
    type: 'percent' | 'fixed'
    value: number
    max_discount_rm: number | null
    commission_bp: number | null
    max_uses: number | null
    max_uses_per_user: number | null
    used_count: number
    valid_from: string
    valid_to: string
}

const PRODUCTS = [
    { label: 'Any product', value: undefined },
    { label: 'Bus ticket', value: 'bus_ticket' },
    { label: 'Taxi coupon', value: 'taxi_coupon' },
    { label: 'Teeko ride', value: 'ride' },
    { label: 'Limo', value: 'limo' },
    { label: 'Van trip', value: 'van_trip' },
    { label: 'Rental', value: 'rental' },
    { label: 'Tour', value: 'tour' },
]

const { can } = useMe()
const api = useApi()
const toast = useToast()

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/pricing/promotions' })
onMounted(() => list.load())
const reload = () => list.load(list.pagination.value?.current_page ?? 1)

// Percent: 10 = 10%; fixed: ringgit (ADR 0003, amendment of 21 Nov 2026).
const discount = (r: Row) => (r.type === 'percent' ? `${r.value}%${r.max_discount_rm ? `, max ${formatRm(r.max_discount_rm)}` : ''}` : formatRm(r.value))

const editing = ref<Row | null>(null)
const { form, fieldError, show, submit } = useFormModal(() => ({
    code: '',
    product: undefined as string | undefined,
    type: 'percent',
    amount: '',
    max_discount_rm: '',
    commission_pct: '',
    max_uses: '',
    max_uses_per_user: '',
    valid_from: '',
    valid_to: '',
}))
function open(row?: Row) {
    editing.value = row ?? null
    show(
        row
            ? {
                  code: row.code,
                  product: row.product ?? undefined,
                  type: row.type,
                  amount: String(row.value),
                  max_discount_rm: row.max_discount_rm === null ? '' : String(row.max_discount_rm),
                  commission_pct: row.commission_bp === null ? '' : String(row.commission_bp / 100),
                  max_uses: row.max_uses === null ? '' : String(row.max_uses),
                  max_uses_per_user: row.max_uses_per_user === null ? '' : String(row.max_uses_per_user),
                  valid_from: row.valid_from.slice(0, 10),
                  valid_to: row.valid_to.slice(0, 10),
              }
            : { valid_from: new Date().toISOString().slice(0, 10) },
    )
}
const used = computed(() => (editing.value?.used_count ?? 0) > 0)
const num = (v: string, scale = 1) => (v === '' ? null : Math.round(Number(v) * scale))
async function save() {
    const saved = await submit(async (d) => {
        const limits = { max_uses: num(d.max_uses), max_uses_per_user: num(d.max_uses_per_user), valid_to: d.valid_to }
        // A used code only takes new limits and end date (the discount stays as sold).
        const body = used.value
            ? limits
            : {
                  ...limits,
                  code: d.code,
                  product: d.product ?? null,
                  type: d.type,
                  value: rmInput(d.amount),
                  max_discount_rm: rmInput(d.max_discount_rm),
                  commission_bp: num(d.commission_pct, 100),
                  valid_from: d.valid_from,
              }
        if (editing.value) await api.patch(`/admin/pricing/promotions/${editing.value.id}`, body)
        else await api.post('/admin/pricing/promotions', body)
    })
    if (saved) {
        toast.add({ title: `${form.data.code.toUpperCase()} saved`, color: 'success' })
        await reload()
    }
}
async function remove(row: Row) {
    if (!confirm(row.used_count ? `${row.code} has been used, so it will be ended now. Continue?` : `Delete ${row.code}?`)) return
    try {
        const res = await api.del<{ message: string }>(`/admin/pricing/promotions/${row.id}`)
        toast.add({ title: res?.message === 'ended' ? `${row.code} ended` : `${row.code} deleted`, color: 'success' })
        await reload()
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to remove it', color: 'error' })
    }
}

const live = (r: Row) => new Date(r.valid_from) <= new Date() && new Date(r.valid_to) > new Date() && (!r.max_uses || r.used_count < r.max_uses)
const columns: TableColumn<Row>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'product', header: 'Product', cell: ({ row }) => PRODUCTS.find((p) => p.value === (row.original.product ?? undefined))?.label ?? row.original.product },
    { id: 'discount', header: 'Discount', cell: ({ row }) => discount(row.original) },
    { accessorKey: 'used_count', header: 'Used', cell: ({ row }) => `${row.original.used_count}${row.original.max_uses ? ` / ${row.original.max_uses}` : ''}` },
    { accessorKey: 'valid_from', header: 'From', cell: ({ row }) => formatDate(row.original.valid_from) },
    { accessorKey: 'valid_to', header: 'Until', cell: ({ row }) => formatDate(row.original.valid_to) },
    { id: 'state', header: 'Status', cell: ({ row }) => h(resolveComponent('OpsStatusCell'), { status: live(row.original) ? 'active' : new Date(row.original.valid_from) > new Date() ? 'scheduled' : 'ended' }) },
    actionsColumn<Row>((row) =>
        can('global.pricing_promotions.write')
            ? [
                  { label: 'Edit', icon: 'i-bx-edit', onSelect: () => open(row) },
                  ...(new Date(row.valid_to) > new Date() ? [{ label: row.used_count ? 'End now' : 'Delete', icon: 'i-bx-trash', color: 'error' as const, onSelect: () => remove(row) }] : []),
              ]
            : [],
    ),
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Promotions"
        subject="promotion codes"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        @page="list.load"
    >
        <template #actions>
            <UButton v-if="can('global.pricing_promotions.write')" label="Create" icon="i-bx-plus" @click="open()" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" :title="editing ? `Edit ${editing.code}` : 'New Promotion'" :saving="form.saving" :error="form.error" submit-label="Save Promotion" @submit="save">
        <p v-if="used" class="text-xs text-gray-500 sm:col-span-2">Used {{ editing?.used_count }} times: only the limits and end date can change.</p>
        <OpsFormField label="Code" required :error="fieldError('code')"><UInput v-model="form.data.code" :disabled="used" class="w-full uppercase" /></OpsFormField>
        <OpsFormField label="Product" :error="fieldError('product')"><USelect v-model="form.data.product" :items="PRODUCTS" :disabled="used" class="w-full" /></OpsFormField>
        <OpsFormField label="Discount type" required :error="fieldError('type')">
            <USelect v-model="form.data.type" :items="[{ label: 'Percent', value: 'percent' }, { label: 'Fixed amount', value: 'fixed' }]" :disabled="used" class="w-full" />
        </OpsFormField>
        <OpsFormField :label="form.data.type === 'percent' ? 'Discount (%)' : 'Discount (RM)'" required :error="fieldError('value')">
            <UInput v-model="form.data.amount" type="number" min="0" step="0.01" :disabled="used" class="w-full" />
        </OpsFormField>
        <OpsFormField v-if="form.data.type === 'percent'" label="Maximum discount (RM)" :error="fieldError('max_discount_rm')">
            <UInput v-model="form.data.max_discount_rm" type="number" min="0" step="0.01" :disabled="used" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Staff commission (%)" :error="fieldError('commission_bp')">
            <UInput v-model="form.data.commission_pct" type="number" min="0" max="100" step="0.01" :disabled="used" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Total uses (empty = no limit)" :error="fieldError('max_uses')"><UInput v-model="form.data.max_uses" type="number" min="1" class="w-full" /></OpsFormField>
        <OpsFormField label="Uses per person" :error="fieldError('max_uses_per_user')"><UInput v-model="form.data.max_uses_per_user" type="number" min="1" class="w-full" /></OpsFormField>
        <OpsFormField label="From" required :error="fieldError('valid_from')"><UInput v-model="form.data.valid_from" type="date" :disabled="used" class="w-full" /></OpsFormField>
        <OpsFormField label="Until" required :error="fieldError('valid_to')"><UInput v-model="form.data.valid_to" type="date" class="w-full" /></OpsFormField>
    </OpsFormModal>
</template>
