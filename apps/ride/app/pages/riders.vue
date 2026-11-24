<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

// Riders (table `users`): everyone who has asked for a Teeko ride, with how many requests and the last one. Email and
// phone show only with ride.riders.pii.read. GET /ops/w/{workspace}/customers. Permission: ride.riders.read (doc 27).
useHead({ title: 'Riders' })

interface Row extends Record<string, unknown> {
    uuid: string
    name: string
    email: string | null
    phone_e164: string | null
    locale: string
    status: string
    created_at: string
    rides_count: number
    last_ride_at: string | null
}

const columns: TableColumn<Row>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'phone_e164', header: 'Phone', cell: ({ row }) => row.original.phone_e164 ?? '—' },
    { accessorKey: 'email', header: 'Email', cell: ({ row }) => row.original.email ?? '—' },
    { accessorKey: 'rides_count', header: 'Requests' },
    { accessorKey: 'last_ride_at', header: 'Last request' },
    { accessorKey: 'locale', header: 'Language', cell: ({ row }) => ({ en: 'English', ms: 'Malay', zh: 'Chinese' })[row.original.locale] ?? row.original.locale },
    { accessorKey: 'created_at', header: 'Joined' },
    { accessorKey: 'status', header: 'Status' },
]

const search = ref('')
const status = ref<string | undefined>(undefined)
const list = useApiList<Row>({ search, path: '/customers', workspaceScoped: true, query: () => ({ status: status.value }) })
onMounted(() => list.load())
watch(status, () => list.load())
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
        :can-export="false"
        @page="list.load"
    >
        <template #actions>
            <USelect v-model="status" :items="[{ label: 'All', value: undefined }, { label: 'Active', value: 'active' }, { label: 'Suspended', value: 'suspended' }, { label: 'Closed', value: 'closed' }]" class="w-32" />
        </template>
    </OpsListPage>
</template>
