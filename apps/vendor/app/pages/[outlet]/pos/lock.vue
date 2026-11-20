<script setup lang="ts">
// Till: lock and switch cashier (POS 2, screen 6; doc 32). Cashier tiles, then a 6-digit PIN.
// Five wrong PINs lock that cashier for 5 minutes; the till locks itself after 2 minutes idle (outlet setting).
// API: POST /vendor-portal/o/{outlet}/pos/unlock returns a short cashier session. Permission: vendor.pos.sell.
// TODO(api): cashier tiles from vendor_staff, and the unlock call, once the generated client exists.
useHead({ title: 'Till locked' })
definePageMeta({ layout: 'counter' })

const pin = ref('')
const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back']

function press(key: string) {
    if (key === 'clear') pin.value = ''
    else if (key === 'back') pin.value = pin.value.slice(0, -1)
    else if (pin.value.length < 6) pin.value += key
}
</script>

<template>
    <div class="mx-auto flex max-w-sm flex-col items-center gap-6 py-10">
        <h2 class="text-xl font-semibold">Who is selling?</h2>
        <p class="text-sm text-gray-500">No cashiers yet.</p>
        <div class="text-3xl tracking-[0.5em]" aria-label="PIN">{{ '•'.repeat(pin.length).padEnd(6, '–') }}</div>
        <div class="grid grid-cols-3 gap-3">
            <UButton
                v-for="key in keys"
                :key="key"
                :label="key === 'clear' ? 'Clear' : key === 'back' ? undefined : key"
                :icon="key === 'back' ? 'i-bx-arrow-left' : undefined"
                size="xl"
                color="neutral"
                variant="outline"
                class="size-16 justify-center text-xl"
                @click="press(key)"
            />
        </div>
    </div>
</template>
