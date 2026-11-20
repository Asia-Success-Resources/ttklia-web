<script setup lang="ts">
// Clients statement: monthly trips and charges (table `organisations`). Permission: fleet.clients_statement.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.
useHead({ title: 'Client statement' })

const route = useRoute()
const id = computed(() => String(route.params.id ?? route.params.uuid ?? ''))

// Empty until the API answers; never fake values.
const fields: { label: string; value: string | null }[] = [
    { label: 'Type', value: null },
    { label: 'Name', value: null },
    { label: 'Ssm no', value: null },
    { label: 'Tin', value: null },
    { label: 'Sst no', value: null },
    { label: 'Contact email', value: null },
    { label: 'Contact phone', value: null },
    { label: 'Credit limit sen', value: null },
    { label: 'Status', value: null },
    { label: 'Created at', value: null }
]
</script>

<template>
    <OpsDetailPage :title="`Clients statement ${id}`" :fields="fields">
        <template #actions>
            <UButton label="Edit" icon="i-bx-edit" color="success" variant="soft" disabled />
        </template>
    </OpsDetailPage>
</template>
