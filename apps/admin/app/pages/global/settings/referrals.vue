<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Referrals: voucher amounts (table `referral_programs`). Permission: global.settings_referrals.read (doc 27).
// TODO(pending: R1) see doc 30.
// TODO(pending: R2) see doc 30.
// GET /api/v1/admin/settings/referrals (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Referrals' })

interface Row extends Record<string, unknown> {
    uuid: string
    name: string
    new_user_voucher_sen: number
    customer_referrer_voucher_sen: number | null
    referrer_reward_trigger: string
    applies_to: string
    min_spend_sen: number | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'new_user_voucher_sen', header: 'New user voucher (RM)', cell: ({ row }) => formatSen(row.original.new_user_voucher_sen as number | null) },
    { accessorKey: 'customer_referrer_voucher_sen', header: 'Customer referrer voucher (RM)', cell: ({ row }) => formatSen(row.original.customer_referrer_voucher_sen as number | null) },
    { accessorKey: 'referrer_reward_trigger', header: 'Referrer reward trigger' },
    { accessorKey: 'applies_to', header: 'Applies to' },
    { accessorKey: 'min_spend_sen', header: 'Min spend (RM)', cell: ({ row }) => formatSen(row.original.min_spend_sen as number | null) },
]

const search = ref('')
const list = useApiList<Row>({ path: '/admin/settings/referrals' })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Referrals"
        subject="referrals"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
        note="Waiting on: R1, R2 (doc 30)."
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
