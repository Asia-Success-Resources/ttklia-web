<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Insurance: Allianz group cover, declarations (table `insurance_products`). Permission: global.settings_insurance.read (doc 27).
// TODO(pending: P8) see doc 30.
// TODO(pending: L4) see doc 30.
// GET /api/v1/admin/settings/insurance (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
useHead({ title: 'Insurance' })

interface Row extends Record<string, unknown> {
    uuid: string
    group_policy_no: string | null
    code: string
    name: string
    max_age: number | null
    coverage_page_url: string
    applies_to: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'group_policy_no', header: 'Group policy no' },
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'max_age', header: 'Max age' },
    { accessorKey: 'coverage_page_url', header: 'Coverage page url' },
    { accessorKey: 'applies_to', header: 'Applies to' },
]

const search = ref('')
const list = useApiList<Row>({ path: '/admin/settings/insurance' })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Insurance"
        subject="insurance"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
        note="Waiting on: P8, L4 (doc 30)."
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
