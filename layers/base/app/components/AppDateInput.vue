<script setup lang="ts">
import { CalendarDate, parseDate } from '@internationalized/date'

// Date field that always shows DD/MM/YYYY (doc 09, "Dates and times"), whatever the browser's language.
// The model stays YYYY-MM-DD, the API's date format (doc 04). A native <input type="date"> follows the
// browser locale instead, so it is not used for dates staff type or read.
const model = defineModel<string>({ default: '' })
const props = defineProps<{ size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }>()

const value = computed<CalendarDate | undefined>({
    get: () => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(model.value)) return undefined
        try {
            return parseDate(model.value)
        } catch {
            return undefined
        }
    },
    set: (v) => {
        model.value = v ? v.toString() : ''
    },
})
</script>

<template>
    <UInputDate v-model="value" locale="en-GB" :size="props.size" class="w-full" />
</template>
