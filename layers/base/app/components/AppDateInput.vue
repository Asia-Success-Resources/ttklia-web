<script setup lang="ts">
import { CalendarDate, parseDate } from '@internationalized/date'

// Date field that always shows DD/MM/YYYY as one value (doc 09, "Dates and times"), whatever the
// browser's language. Like the flatpickr fields in ttklia-v2 it is read-only text: clicking it (or the
// calendar icon) opens a month picker. The model stays YYYY-MM-DD, the API's date format (doc 04).
// `min` / `max` (YYYY-MM-DD) limit the dates that can be picked.
const model = defineModel<string>({ default: '' })
const props = defineProps<{ size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; min?: string; max?: string; placeholder?: string }>()
const open = ref(false)

const toDate = (s?: string) => {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined
    try {
        return parseDate(s)
    } catch {
        return undefined
    }
}

const value = computed(() => toDate(model.value))
const minValue = computed(() => toDate(props.min))
const maxValue = computed(() => toDate(props.max))
const display = computed(() => {
    const [y, m, d] = (value.value ? model.value : '').split('-')
    return y ? `${d}/${m}/${y}` : ''
})

function pick(v: unknown) {
    model.value = v ? (v as CalendarDate).toString() : ''
    open.value = false
}
</script>

<template>
    <UPopover v-model:open="open" :content="{ align: 'start' }">
        <!-- The trigger is a plain div: on the UInput itself it would turn the <input> into type="button" (centred text). -->
        <div class="w-full">
            <UInput
                :model-value="display"
                readonly
                :size="props.size"
                :placeholder="props.placeholder ?? 'DD/MM/YYYY'"
                trailing-icon="i-bx-calendar"
                class="w-full"
                :ui="{ base: 'cursor-pointer' }"
            />
        </div>
        <template #content>
            <UCalendar
                :model-value="value"
                locale="en-GB"
                :min-value="minValue"
                :max-value="maxValue"
                class="p-2"
                @update:model-value="pick"
            />
        </template>
    </UPopover>
</template>
