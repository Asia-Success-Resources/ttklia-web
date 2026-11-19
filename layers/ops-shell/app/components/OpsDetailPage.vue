<script setup lang="ts">
import type { OpsField } from '../types/ops'

// Action strip of tinted buttons, then an "Information" card with a two-column dl;
// optional body and right-hand box (doc 09, "Detail page"). Slots: #actions, #body, #aside.
const props = defineProps<{ title: string; fields: OpsField[] }>()
const slots = defineSlots<{ actions?: () => unknown; body?: () => unknown; aside?: () => unknown }>()
</script>

<template>
  <div>
    <OpsBreadcrumb :title="props.title" />
    <div v-if="slots.actions" class="mb-4 flex flex-wrap gap-2">
      <slot name="actions" />
    </div>
    <div class="grid gap-6" :class="slots.aside ? 'xl:grid-cols-3' : ''">
      <div class="flex flex-col gap-6" :class="slots.aside ? 'xl:col-span-2' : ''">
        <div class="rounded-2xl border border-(--ops-border) bg-(--ops-card) p-5">
          <h4 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Information</h4>
          <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div v-for="field in props.fields" :key="field.label">
              <dt class="text-xs text-gray-500">{{ field.label }}</dt>
              <dd class="text-sm font-medium text-gray-800 dark:text-white/90">{{ field.value ?? '—' }}</dd>
            </div>
          </dl>
        </div>
        <slot name="body" />
      </div>
      <div v-if="slots.aside">
        <slot name="aside" />
      </div>
    </div>
  </div>
</template>
