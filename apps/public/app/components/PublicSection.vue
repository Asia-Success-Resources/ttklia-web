<script setup lang="ts">
defineProps<{ title: string; lead?: string }>()
</script>

<template>
  <section>
    <h1 class="text-2xl font-semibold">{{ title }}</h1>
    <p v-if="lead" class="mt-1 text-muted">{{ lead }}</p>
    <div class="mt-6">
      <slot />
    </div>
  </section>
</template>
