<script setup lang="ts">
// Date field with Today and Tomorrow shortcuts, as in today's booking and collection forms.
// Shows DD/MM/YYYY (doc 09, "Dates and times"); the model is YYYY-MM-DD for the API.
const date = defineModel<string>({ default: '' })
</script>

<template>
    <UFormField label="Date">
        <AppDateInput v-model="date" size="lg" />
        <div class="mt-2 flex gap-2">
            <UButton label="Today" size="xs" :variant="date === isoDateKL(0) ? 'solid' : 'outline'" @click="date = isoDateKL(0)" />
            <UButton label="Tomorrow" size="xs" :variant="date === isoDateKL(1) ? 'solid' : 'outline'" @click="date = isoDateKL(1)" />
        </div>
    </UFormField>
</template>
