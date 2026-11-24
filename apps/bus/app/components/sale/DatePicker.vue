<script setup lang="ts">
// Date field with Today and Tomorrow shortcuts, as in ttklia-v2's sale forms (from today onwards,
// today picked when the form opens). Shows DD/MM/YYYY (doc 09); the model is YYYY-MM-DD for the API.
const date = defineModel<string>({ default: '' })
const today = isoDateKL(0)
const tomorrow = isoDateKL(1)
onMounted(() => {
    if (!date.value) date.value = today
})
</script>

<template>
    <UFormField label="Date">
        <AppDateInput v-model="date" size="lg" :min="today" />
        <div class="mt-2 flex gap-2">
            <UButton label="Today" size="xs" :variant="date === today ? 'solid' : 'outline'" @click="date = today" />
            <UButton label="Tomorrow" size="xs" :variant="date === tomorrow ? 'solid' : 'outline'" @click="date = tomorrow" />
        </div>
    </UFormField>
</template>
