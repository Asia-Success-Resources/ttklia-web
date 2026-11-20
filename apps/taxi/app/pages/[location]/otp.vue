<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Otp: generate OTP (no table). Permission: taxi.otp.read (doc 27).
// TODO(pending: doc 09 gap) no table for this screen yet in tools/schema.py (sitemap "*").
// TODO(api): ttklia-api has no list route for this screen yet; the list stays empty until it does.
useHead({ title: 'OTP' })

interface Row extends Record<string, unknown> {
    uuid: string
    name: string
    status: string
    updated_at: string
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'updated_at', header: 'Updated at' },
]

const search = ref('')
const list = useApiList<Row>({ path: null, workspaceScoped: true })
onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Otp"
        subject="otp"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :has-more="list.nextCursor.value !== null"
        note="No table for this screen yet in the data model (doc 09, gap list)."
        @more="list.load(list.nextCursor.value ?? undefined)"
    />
</template>
