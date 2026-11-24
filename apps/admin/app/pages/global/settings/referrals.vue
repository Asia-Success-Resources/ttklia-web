<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Referral vouchers (table `referral_programs`, doc 31 "Vouchers from the settings"): the voucher for the new user,
// the voucher for the customer whose code was used, when the referrer earns it, where vouchers can be spent.
// A change starts a new programme row from now and ends the old one, so past vouchers keep their amounts.
// Permission: global.settings_referrals.read / write.
// TODO(pending: R1) see doc 30.
// TODO(pending: R2) see doc 30.
useHead({ title: 'Referral vouchers' })

interface Row extends Record<string, unknown> {
    id: number
    name: string
    new_user_voucher_rm: number
    customer_referrer_voucher_rm: number | null
    referrer_reward_trigger: string
    applies_to: string
    min_spend_rm: number | null
    voucher_valid_days: number
    valid_from: string
    valid_to: string | null
    is_active: boolean
}

const SERVICES = [
    { label: 'Taxi', value: 'taxi' },
    { label: 'Teeko (e-hailing)', value: 'ride' },
    { label: 'Bus tickets', value: 'bus' },
]

const { can } = useMe()
const api = useApi()
const toast = useToast()

const search = ref('')
const list = useApiList<Row>({ search, path: '/admin/settings/referrals' })
onMounted(() => list.load())
const live = computed(() => list.rows.value.find((r) => r.is_active) ?? null)

// Voucher amounts are ringgit (ADR 0003, amendment of 21 Nov 2026).
const rm = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v))
const { form, fieldError, show, submit } = useFormModal(() => ({
    new_user_rm: '',
    referrer_rm: '',
    trigger: 'on_first_paid_order',
    applies_to: ['taxi', 'ride', 'bus'] as string[],
    min_spend_rm: '',
    valid_days: '30',
    is_active: true,
}))
function openEdit() {
    const r = live.value
    show(
        r
            ? {
                  new_user_rm: rm(r.new_user_voucher_rm),
                  referrer_rm: rm(r.customer_referrer_voucher_rm),
                  trigger: r.referrer_reward_trigger,
                  applies_to: r.applies_to ? r.applies_to.split(',') : [],
                  min_spend_rm: rm(r.min_spend_rm),
                  valid_days: String(r.voucher_valid_days),
                  is_active: r.is_active,
              }
            : {},
    )
}
const sen = (value: string) => rmInput(value) ?? 0
async function save() {
    const saved = await submit((d) =>
        api.patch('/admin/settings/referrals', {
            new_user_voucher_rm: sen(d.new_user_rm),
            customer_referrer_voucher_rm: sen(d.referrer_rm),
            referrer_reward_trigger: d.trigger,
            applies_to: d.applies_to,
            min_spend_rm: d.min_spend_rm === '' ? null : sen(d.min_spend_rm),
            voucher_valid_days: Number(d.valid_days),
            is_active: d.is_active,
        }),
    )
    if (saved) {
        toast.add({ title: 'Referral vouchers changed from now', color: 'success' })
        await list.load()
    }
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'valid_from', header: 'From' },
    { accessorKey: 'valid_to', header: 'Until', cell: ({ row }) => (row.original.valid_to ? formatDateTime(row.original.valid_to) : 'Now') },
    { accessorKey: 'new_user_voucher_rm', header: 'New user (RM)', cell: ({ row }) => formatRm(row.original.new_user_voucher_rm) },
    { accessorKey: 'customer_referrer_voucher_rm', header: 'Referrer (RM)', cell: ({ row }) => formatRm(row.original.customer_referrer_voucher_rm) },
    { accessorKey: 'referrer_reward_trigger', header: 'Referrer earns', cell: ({ row }) => (row.original.referrer_reward_trigger === 'on_registration' ? 'On sign-up' : 'On first paid order') },
    { accessorKey: 'applies_to', header: 'Spend on', cell: ({ row }) => row.original.applies_to.split(',').map((s) => SERVICES.find((x) => x.value === s)?.label ?? s).join(', ') },
    { accessorKey: 'min_spend_rm', header: 'Min spend (RM)', cell: ({ row }) => (row.original.min_spend_rm === null ? '—' : formatRm(row.original.min_spend_rm)) },
    { accessorKey: 'voucher_valid_days', header: 'Valid (days)' },
    { accessorKey: 'is_active', header: 'Status', cell: ({ row }) => h(resolveComponent('OpsStatusCell'), { status: row.original.is_active ? 'active' : 'ended' }) },
]
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Referral vouchers"
        subject="referral programme"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :can-export="false"
        note="Waiting on: R1, R2 (doc 30)."
        @page="list.load"
    >
        <template #actions>
            <UButton v-if="can('global.settings_referrals.write')" label="Change vouchers" icon="i-bx-edit" @click="openEdit" />
        </template>
    </OpsListPage>

    <OpsFormModal v-model:open="form.open" title="Change Referral Vouchers" :saving="form.saving" :error="form.error" submit-label="Save From Now" @submit="save">
        <OpsFormField label="New user voucher (RM)" required :error="fieldError('new_user_voucher_rm')"><UInput v-model="form.data.new_user_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Customer referrer voucher (RM)" :error="fieldError('customer_referrer_voucher_rm')"><UInput v-model="form.data.referrer_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Referrer earns it" required :error="fieldError('referrer_reward_trigger')">
            <USelect v-model="form.data.trigger" :items="[{ label: 'On first paid order', value: 'on_first_paid_order' }, { label: 'On sign-up', value: 'on_registration' }]" class="w-full" />
        </OpsFormField>
        <OpsFormField label="Vouchers valid for (days)" required :error="fieldError('voucher_valid_days')"><UInput v-model="form.data.valid_days" type="number" min="1" class="w-full" /></OpsFormField>
        <OpsFormField label="Can be spent on" required :error="fieldError('applies_to')">
            <USelectMenu v-model="form.data.applies_to" :items="SERVICES" value-key="value" multiple class="w-full" />
        </OpsFormField>
        <OpsFormField label="Minimum spend (RM, optional)" :error="fieldError('min_spend_rm')"><UInput v-model="form.data.min_spend_rm" type="number" min="0" step="0.01" class="w-full" /></OpsFormField>
        <OpsFormField label="Programme" :error="fieldError('is_active')">
            <OpsStatusToggle v-model="form.data.is_active" active-label="Running" inactive-label="Stopped" />
        </OpsFormField>
    </OpsFormModal>
</template>
