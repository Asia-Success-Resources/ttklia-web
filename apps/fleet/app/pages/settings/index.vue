<script setup lang="ts">
// Settings: form (no table). Permission: fleet.settings.write (doc 27).
// TODO(api): doc 04 has no endpoint for this screen yet; the list stays empty until it does.
useHead({ title: 'Settings' })

const state = reactive<Record<string, string>>({

})
const saving = ref(false)

async function save() {
    // TODO(api): no write endpoint for this form in doc 04 yet.
}
</script>

<template>
    <OpsFormPage title="Settings" :saving="saving" @submit="save">
            <p class="text-sm text-gray-500">No settings defined in the data model yet.</p>
    </OpsFormPage>
</template>
