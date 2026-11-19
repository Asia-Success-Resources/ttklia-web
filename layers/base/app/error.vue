<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const title = computed(() => (props.error.statusCode === 404 ? 'Not found' : 'Something went wrong'))
</script>

<template>
  <UApp>
    <div class="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p class="text-6xl font-semibold text-primary">{{ error.statusCode }}</p>
      <h1 class="text-xl font-medium">{{ title }}</h1>
      <p class="max-w-md text-sm text-muted">{{ error.message }}</p>
      <UButton label="Back" icon="i-bx-arrow-left" @click="clearError({ redirect: '/' })" />
    </div>
  </UApp>
</template>
