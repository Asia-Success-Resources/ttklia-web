<script setup lang="ts">
// The locations this user can open (doc 16, "Login": with no role at the page they came from,
// they see the locations they can open).
definePageMeta({ layout: false })
const { me } = useMe()
const locations = computed(() => (me.value?.workspaces ?? []).filter((w) => w.type === 'bus_terminal'))
</script>

<template>
  <UApp>
    <div class="flex min-h-screen items-center justify-center p-6">
      <div class="w-full max-w-md rounded-2xl border border-(--app-border) bg-(--app-card) p-6">
        <h1 class="mb-4 text-lg font-semibold">Choose a location</h1>
        <p v-if="locations.length === 0" class="text-sm text-gray-500">No locations available.</p>
        <ul class="flex flex-col gap-2">
          <li v-for="w in locations" :key="w.slug">
            <UButton :to="`/${w.slug}`" :label="w.name" block color="neutral" variant="outline" />
          </li>
        </ul>
      </div>
    </div>
  </UApp>
</template>
