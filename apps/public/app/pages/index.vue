<script setup lang="ts">
// Home: search a bus trip (Sitemap 1). Trips from GET /bus/trips?route&date (doc 04).
// TODO(api): the from/to lists come from the routes the API returns; nothing is hard-coded here.
const form = reactive({ from: '', to: '', date: '' })

async function search() {
  await navigateTo({ path: '/', query: { ...form } })
}
</script>

<template>
  <PublicSection title="Book a bus ticket" lead="Search departures from KLIA2 and Lalaport.">
    <form class="grid gap-4 rounded-2xl border border-default p-6 md:grid-cols-4" @submit.prevent="search">
      <UFormField label="From" name="from"><UInput v-model="form.from" class="w-full" /></UFormField>
      <UFormField label="To" name="to"><UInput v-model="form.to" class="w-full" /></UFormField>
      <UFormField label="Date" name="date"><UInput v-model="form.date" type="date" class="w-full" /></UFormField>
      <div class="flex items-end"><UButton type="submit" label="Search" icon="i-bx-search" block /></div>
    </form>
  </PublicSection>
</template>
