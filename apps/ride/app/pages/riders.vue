<script setup lang="ts">
    import type { TableColumn } from '@nuxt/ui'

    // Riders: list (table `users`). Permission: ride.riders.read (doc 27).
    // GET /api/ops/w/{workspace}/customers (ttklia-api). TODO(api): the endpoint may still be a stub returning no rows.
    useHead({ title: 'Riders' })

    interface Row extends Record<string, unknown> {
        uuid: string
        name: string
        email: string | null
        phone_e164: string | null
        locale: string
        status: string
    }

    const columns: TableColumn<Row>[] = [
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'phone_no', header: 'Phone No' },
        { accessorKey: 'locale', header: 'Locale' },
        { accessorKey: 'status', header: 'Status' },
    ]

    const search = ref('')
    const list = useApiList<Row>({ search, path: '/customers', workspaceScoped: true })
    onMounted(() => list.load())
</script>

<template>
    <OpsListPage
        v-model:search="search"
        title="Riders"
        subject="riders"
        :rows="list.rows.value"
        :columns="columns"
        :loading="list.pending.value"
        :pagination="list.pagination.value"
    
        @page="list.load"
    />
</template>
