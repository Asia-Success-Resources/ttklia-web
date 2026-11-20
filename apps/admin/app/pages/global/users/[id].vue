<script setup lang="ts">
// Users: roles per workspace (table `users`). Permission: global.users.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.
useHead({ title: 'User' })

const route = useRoute()
const id = computed(() => String(route.params.id ?? route.params.uuid ?? ''))

// Empty until the API answers; never fake values.
const fields: { label: string; value: string | null }[] = [
    { label: 'Uuid', value: null },
    { label: 'Name', value: null },
    { label: 'Email', value: null },
    { label: 'Phone No', value: null },
    { label: 'Locale', value: null },
    { label: 'Status', value: null },
    { label: 'Phone verified at', value: null },
    { label: 'Email verified at', value: null },
    { label: 'Last login at', value: null },
    { label: 'Created at', value: null }
]
</script>

<template>
    <OpsDetailPage :title="`Users ${id}`" :fields="fields">
        <template #actions>
            <UButton label="Edit" icon="i-bx-edit" color="success" variant="soft" disabled />
        </template>
    </OpsDetailPage>
</template>
