<script setup lang="ts">
// Till: sale screen (POS 1, doc 32). Permission: vendor.pos.sell.
// Left: search or scan, category tabs, product tiles. Right: basket and Pay.
// Prices, options and SST come only from GET /vendor-portal/o/{outlet}/pos/catalogue (ETag; polled every 30 s
// and on Reverb `catalogue.changed`); the till never types a price. Orders: POST …/orders, POST …/orders/{uuid}/pay.
// Keys: F2 search, F4 hold, F12 pay, Esc closes a sheet (doc 32, "Keyboard").
// TODO(api): catalogue, tiles and the options sheet once the generated client exists.
definePageMeta({ layout: 'counter' })

const search = ref<{ inputRef?: HTMLInputElement } | null>(null)
const basket = useBasketStore()

function onKey(event: KeyboardEvent) {
  if (event.key === 'F2') {
    event.preventDefault()
    search.value?.inputRef?.focus()
  }
  // TODO(api): F4 holds the basket (POST …/orders/{uuid}/hold); F12 opens Pay.
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-3">
    <div class="rounded-2xl border border-(--app-border) bg-(--app-card) p-4 lg:col-span-2">
      <UInput ref="search" icon="i-bx-search" placeholder="Search or scan (F2)…" autofocus size="xl" class="w-full" />
      <div class="mt-4 flex flex-wrap gap-2">
        <UButton label="Favourites" icon="i-bx-star" size="lg" />
      </div>
      <p class="mt-6 text-sm text-gray-500">No products yet.</p>
    </div>
    <div class="flex flex-col gap-4">
      <CounterBasket />
      <CounterPayment />
      <UButton block size="xl" icon="i-bx-pause" label="Hold (F4)" color="neutral" variant="outline" :disabled="basket.lines.length === 0" />
    </div>
  </div>
</template>
