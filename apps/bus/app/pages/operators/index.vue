<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Operators, as ttklia-v2's admin/bus/companies index (Company $indexFields): ID, Name, Code, Credit Balance
// (only with bus.operator_credit.approve, v2 bus:update-company-credit), System Provider, Actions. Search: name, code.
// GET /api/ops/w/{workspace}/bus/companies (ttklia-api). Permission: bus.operators.read (doc 27).
// TODO: v2's Create Company and edit form come with the form pages.
useHead({ title: 'Operators' })

interface Row extends Record<string, unknown> {
    id: number
    name: string | null
    operator_code: string
    credit_balance_sen: number | null
    system_provider: string | null
    sales_open: boolean
}

const { resolveTo } = useOpsShell()
const { can } = useMe()
const showCredit = computed(() => can('bus.operator_credit.approve'))

const columns = computed<TableColumn<Row>[]>(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => row.original.name ?? '-' },
    { accessorKey: 'operator_code', header: 'Code' },
    ...(showCredit.value
        ? [{
            accessorKey: 'credit_balance_sen',
            header: 'Credit Balance',
            cell: ({ row }) => (row.original.credit_balance_sen === null ? '-' : formatSen(row.original.credit_balance_sen)),
        } as TableColumn<Row>]
        : []),
    { accessorKey: 'system_provider', header: 'System Provider', cell: ({ row }) => row.original.system_provider ?? '-' },
    // The switch on the company page (bus.operators.write).
    {
        accessorKey: 'sales_open',
        header: 'Ticket Sales',
        cell: ({ row }) => h(resolveComponent('UBadge'), row.original.sales_open
            ? { label: 'On sale', color: 'success', variant: 'soft' }
            : { label: 'Paused', color: 'warning', variant: 'soft' }),
    },
])

const search = ref('')
const list = useApiList<Row>({ search, path: '/bus/companies', workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Companies"
        subject="company"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
        :show-to="(row) => resolveTo(`/operators/${row.id}`)"
        @page="list.load"
    />
</template>
