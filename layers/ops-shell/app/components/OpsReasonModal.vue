<script setup lang="ts">
// The reason popup for useReasonAction(): one text area, Cancel and the action's button.
const props = defineProps<{ action: ReturnType<typeof useReasonAction> }>()
const a = props.action
</script>

<template>
    <OpsFormModal v-model:open="a.form.open" :title="a.state.title" :saving="a.form.saving" :error="a.form.error" :submit-label="a.state.submitLabel" @submit="a.submit">
        <OpsFormField :label="a.state.label" :required="a.state.required" full :error="a.fieldError('reason') ?? a.fieldError('note') ?? a.fieldError('bank_reference')">
            <UTextarea v-model="a.form.data.reason" :rows="3" autoresize class="w-full" />
        </OpsFormField>
    </OpsFormModal>
</template>
