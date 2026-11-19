<script setup lang="ts">
// Workspaces: settings, locations, domains (table `workspaces`). Permission: global.workspaces.read (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.

const route = useRoute()
const id = computed(() => String(route.params.id ?? route.params.uuid ?? ''))

// Empty until the API answers; never fake values.
const fields: { label: string; value: string | null }[] = [
    { label: 'Code', value: null },
    { label: 'Slug', value: null },
    { label: 'Name', value: null },
    { label: 'Type', value: null },
    { label: 'Timezone', value: null },
    { label: 'Is active', value: null },
    { label: 'Created at', value: null }
]
</script>

<template>
    <OpsDetailPage :title="`Workspaces ${id}`" :fields="fields">
        <template #actions>
            <UButton label="Edit" icon="i-bx-edit" color="success" variant="soft" disabled />
        </template>
    </OpsDetailPage>
</template>
