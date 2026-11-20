<script setup lang="ts">
import type { PaymentMethod, SaleStat } from '~/types/sale'

// Product Sale Dashboard: the counter's product till, laid out like today's ttklia-v2
// `admin/bus/product-sales/dashboard` (ProductSalesForm.vue): products on the left (7/12);
// cart, customer info, payment method and Confirm Order on the right (5/12).
// With no open product session it shows Start New Session instead: pick a product counter
// (doc 09, "Counter sessions"). The product till takes card and e-wallet only, so there is no float.
// Permission: bus.product_sales.read (doc 27). KL2 only today (doc 32).
// Products: GET /api/v1/ops/w/{workspace}/catalog-items?type=product (ttklia-api).
// TODO(api): the order goes to POST /orders and POST /orders/{uuid}/pay (doc 04) once the client exists.
useHead({ title: 'Product Sale Dashboard' })

const { resolveTo } = useOpsShell()

interface Product extends Record<string, unknown> {
    uuid: string
    name: string
    price_sen: number
    image_url?: string | null
    is_active: boolean
}
interface CartLine { uuid: string; name: string; price_sen: number; quantity: number }

const products = useApiList<Product>({ path: '/catalog-items', workspaceScoped: true, query: { type: 'product' } })
onMounted(() => products.load())

const search = ref('')
const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    return products.rows.value.filter((p) => p.is_active !== false && (!q || p.name.toLowerCase().includes(q)))
})

const cart = ref<CartLine[]>([])
const total = computed(() => cart.value.reduce((sum, l) => sum + l.price_sen * l.quantity, 0))
const qtyOf = (uuid: string) => cart.value.find((l) => l.uuid === uuid)?.quantity ?? 0

function add(p: Product) {
    const line = cart.value.find((l) => l.uuid === p.uuid)
    if (line) line.quantity++
    else cart.value.push({ uuid: p.uuid, name: p.name, price_sen: p.price_sen, quantity: 1 })
}
function decrease(i: number) {
    const line = cart.value[i]!
    if (line.quantity > 1) line.quantity--
    else cart.value.splice(i, 1)
}
function validate(i: number) {
    const line = cart.value[i]!
    if (!Number.isInteger(line.quantity) || line.quantity < 1) line.quantity = 1
}

const form = reactive({ customer_name: '', customer_phone: '', customer_email: '' })
const payment = ref<PaymentMethod | null>(null)
const submitting = ref(false)
const successMessage = ref<string | null>(null)
const errorMessage = ref<string | null>(null)
const canSubmit = computed(() => cart.value.length > 0 && form.customer_name.trim() !== '' && payment.value !== null)

async function submitOrder() {
    // TODO(api): POST /orders with the cart and customer, then POST /orders/{uuid}/pay.
    errorMessage.value = 'Product orders are not wired yet (TODO api).'
}

function resetForm() {
    cart.value = []
    Object.assign(form, { customer_name: '', customer_phone: '', customer_email: '' })
    payment.value = null
    successMessage.value = null
    errorMessage.value = null
}

// The open cash session (doc 09, "Counter sessions"; doc 04).
const counter = useCounterSession('product')
const session = counter.mine
const showWithoutSession = ref(false)
onMounted(() => counter.load())
const infoOpen = ref(false)
const endOpen = ref(false)

async function endSession() {
    // Card and e-wallet only: nothing to count in the drawer.
    if (await counter.end(0)) endOpen.value = false
}
const counts = computed<SaleStat[]>(() => [
    { label: 'Total Orders', value: session.value?.total_orders ?? null },
    { label: 'Total Cancelled', value: session.value?.total_cancelled ?? null },
])
const money = computed<SaleStat[]>(() => [
    { label: 'Total Sales', value: session.value?.total_sales_sen ?? null, money: true, highlight: true },
    { label: 'Card Sales', value: session.value?.card_sales_sen ?? null, money: true },
    { label: 'E-Wallet Sales', value: session.value?.ewallet_sales_sen ?? null, money: true },
])
</script>

<template>
    <div v-if="!counter.loaded.value" class="flex justify-center py-20">
        <UIcon name="i-bx-loader-alt" class="size-8 animate-spin text-gray-400" />
    </div>
    <SaleStartSession
        v-else-if="!session && !showWithoutSession"
        title="Product Sale Dashboard"
        :counters="counter.counters.value"
        :other="counter.other.value"
        :ask-opening-cash="false"
        :busy="counter.busy.value"
        :error="counter.error.value"
        :preview="counter.preview.value"
        @start="(uuid, float) => counter.start(uuid, float)"
        @end-other="navigateTo(resolveTo('/sales'))"
        @preview="showWithoutSession = true"
    />
    <div v-else>
        <SalePageHeader
            title="Product Sale Dashboard"
            description="Manage product sales."
            @info="infoOpen = true"
            @end="endOpen = true"
        />

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <!-- Left: product selection -->
            <div class="space-y-4 lg:col-span-7">
                <div class="rounded-2xl border border-(--ops-border) bg-(--ops-card)">
                    <div class="border-b border-(--ops-border) px-6 py-4">
                        <h3 class="flex items-center gap-2 text-base font-medium text-gray-800 dark:text-white/90">
                            <UIcon name="i-bx-box" class="text-primary" /> Select Products
                        </h3>
                    </div>
                    <div class="p-6">
                        <UInput v-model="search" placeholder="Search products..." icon="i-bx-search" size="lg" class="mb-4 w-full" />
                        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <button
                                v-for="p in filtered"
                                :key="p.uuid"
                                type="button"
                                class="relative overflow-hidden rounded-xl border text-left transition hover:shadow-md"
                                :class="qtyOf(p.uuid) ? 'border-primary ring-2 ring-primary/20' : 'border-(--ops-border) hover:border-primary/60'"
                                @click="add(p)"
                            >
                                <div v-if="p.image_url" class="max-h-[200px] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    <img :src="p.image_url" :alt="p.name" class="mx-auto block max-h-[200px] max-w-[200px] object-cover">
                                </div>
                                <div v-else class="flex h-[120px] w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                                    <UIcon name="i-bx-box" class="size-8 text-gray-400" />
                                </div>
                                <div class="p-3">
                                    <p class="text-sm leading-snug font-medium text-gray-900 dark:text-white">{{ p.name }}</p>
                                    <p class="mt-1 text-sm font-bold text-primary">{{ formatSen(p.price_sen) }}</p>
                                </div>
                                <span
                                    v-if="qtyOf(p.uuid)"
                                    class="absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow"
                                >
                                    {{ qtyOf(p.uuid) }}
                                </span>
                            </button>
                        </div>
                        <div v-if="filtered.length === 0" class="py-10 text-center">
                            <p class="text-sm text-gray-400 dark:text-gray-500">{{ products.pending.value ? 'Loading...' : 'No products found' }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: cart, customer and payment -->
            <div class="space-y-4 lg:col-span-5">
                <div class="rounded-2xl border border-(--ops-border) bg-(--ops-card)">
                    <div class="border-b border-(--ops-border) px-6 py-4">
                        <h3 class="flex items-center gap-2 text-base font-medium text-gray-800 dark:text-white/90">
                            <UIcon name="i-bx-cart" class="text-primary" /> Cart
                            <span v-if="cart.length" class="ml-auto text-xs text-gray-500 dark:text-gray-400">{{ cart.length }} item(s)</span>
                        </h3>
                    </div>
                    <div class="p-6">
                        <div v-if="cart.length === 0" class="py-8 text-center">
                            <UIcon name="i-bx-cart" class="size-8 text-gray-300 dark:text-gray-600" />
                            <p class="mt-2 text-sm text-gray-400 dark:text-gray-500">No items in cart</p>
                        </div>
                        <div v-else class="space-y-3">
                            <div v-for="(line, i) in cart" :key="line.uuid" class="flex items-center gap-3 rounded-lg border border-(--ops-border) p-3">
                                <div class="min-w-0 flex-1">
                                    <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ line.name }}</p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatSen(line.price_sen) }} each</p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <UButton icon="i-bx-minus" color="neutral" variant="outline" size="xs" @click="decrease(i)" />
                                    <UInput v-model.number="line.quantity" type="number" min="1" size="xs" class="w-12" :ui="{ base: 'text-center' }" @change="validate(i)" />
                                    <UButton icon="i-bx-plus" color="neutral" variant="outline" size="xs" @click="line.quantity++" />
                                </div>
                                <p class="w-20 text-right text-sm font-semibold text-gray-900 dark:text-white">{{ formatSen(line.price_sen * line.quantity) }}</p>
                                <UButton icon="i-bx-trash" color="error" variant="ghost" size="xs" @click="cart.splice(i, 1)" />
                            </div>
                            <div class="flex items-center justify-between border-t border-(--ops-border) pt-3">
                                <span class="text-sm font-semibold text-gray-900 dark:text-white">Total</span>
                                <span class="text-lg font-bold text-primary">{{ formatSen(total) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="rounded-2xl border border-(--ops-border) bg-(--ops-card)">
                    <div class="border-b border-(--ops-border) px-6 py-4">
                        <h3 class="flex items-center gap-2 text-base font-medium text-gray-800 dark:text-white/90">
                            <UIcon name="i-bx-user" class="text-primary" /> Customer Info
                        </h3>
                    </div>
                    <div class="space-y-4 p-6">
                        <UFormField label="Customer Name" required>
                            <UInput v-model="form.customer_name" placeholder="Full name" size="lg" class="w-full" />
                        </UFormField>
                        <UFormField label="Phone Number">
                            <UInput v-model="form.customer_phone" placeholder="Optional" size="lg" class="w-full" />
                        </UFormField>
                        <UFormField label="Email">
                            <UInput v-model="form.customer_email" type="email" placeholder="Optional" size="lg" class="w-full" />
                        </UFormField>
                    </div>
                </div>

                <div class="rounded-2xl border border-(--ops-border) bg-(--ops-card)">
                    <div class="border-b border-(--ops-border) px-6 py-4">
                        <h3 class="flex items-center gap-2 text-base font-medium text-gray-800 dark:text-white/90">
                            <UIcon name="i-bx-credit-card" class="text-primary" /> Payment Method <span class="text-error">*</span>
                        </h3>
                    </div>
                    <div class="grid grid-cols-2 gap-3 p-6">
                        <button
                            v-for="m in ([{ value: 'card', label: 'Card', icon: 'i-bx-credit-card' }, { value: 'wallet', label: 'E-Wallet', icon: 'i-bx-wallet' }] as const)"
                            :key="m.value"
                            type="button"
                            class="flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition"
                            :class="payment === m.value ? 'border-primary bg-primary/10' : 'border-(--ops-border) hover:border-gray-300 dark:hover:border-gray-600'"
                            @click="payment = m.value"
                        >
                            <UIcon :name="m.icon" class="size-6" :class="payment === m.value ? 'text-primary' : 'text-gray-400'" />
                            <span class="text-sm font-medium" :class="payment === m.value ? 'text-primary' : 'text-gray-600 dark:text-gray-400'">{{ m.label }}</span>
                        </button>
                    </div>
                </div>

                <UButton
                    v-if="!successMessage"
                    block
                    size="xl"
                    :icon="submitting ? undefined : 'i-bx-check'"
                    :loading="submitting"
                    :label="submitting ? 'Processing...' : 'Confirm Order'"
                    :disabled="!canSubmit || submitting"
                    @click="submitOrder"
                />

                <UAlert v-if="successMessage" color="success" variant="soft" icon="i-bx-check-circle" :title="successMessage">
                    <template #description>
                        <UButton label="New Order" icon="i-bx-plus" variant="link" size="sm" class="mt-2 px-0" @click="resetForm" />
                    </template>
                </UAlert>
                <UAlert v-if="errorMessage" color="error" variant="soft" icon="i-bx-error-circle" :title="errorMessage" />
            </div>
        </div>

        <UModal v-model:open="infoOpen" title="Session Info" :ui="{ overlay: 'bg-black/50', content: 'sm:max-w-2xl' }">
            <template #body>
                <SaleSessionInfo :session="session" :counts="counts" :money="money" />
            </template>
            <template #footer>
                <div class="flex w-full justify-end">
                    <UButton label="Close" color="neutral" variant="outline" @click="infoOpen = false" />
                </div>
            </template>
        </UModal>

        <UModal v-model:open="endOpen" title="End Session" :ui="{ overlay: 'bg-black/50', content: 'sm:max-w-2xl' }">
            <template #body>
                <SaleSessionInfo :session="session" :counts="counts" :money="money" />
            </template>
            <template #footer>
                <div class="flex w-full flex-wrap items-center justify-end gap-3">
                    <span v-if="counter.error.value" class="mr-auto text-sm text-error">{{ counter.error.value }}</span>
                    <UButton label="Cancel" color="neutral" variant="outline" @click="endOpen = false" />
                    <UButton label="End Session" color="error" :loading="counter.busy.value" :disabled="!session" @click="endSession" />
                </div>
            </template>
        </UModal>
    </div>
</template>
