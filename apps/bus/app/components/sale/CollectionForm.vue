<script setup lang="ts">
// "Ticket Collection" tab, laid out like today's CollectionForm.vue: date, operator, reference
// and location on the left with trips and seats (or the manual override), Summary on the right.
// TODO(api): ticket lookup at the operator, trips and seats, and the collection itself have no
// endpoint in doc 04 yet.
const emit = defineEmits<{ created: [] }>()

interface Zone { uuid: string; name: string }
interface Company { uuid: string; name?: string; operator_code: string; label?: string }
interface TicketDetails { passenger: string | null; trip: string | null; seat: string | null }

const zones = useApiList<Zone>({ path: '/zones', workspaceScoped: true })
const companies = useApiList<Company>({ path: '/bus/companies', workspaceScoped: true })
onMounted(() => {
    zones.load()
    companies.load()
})

const date = ref('')
const operator = ref<Company | undefined>()
const reference = ref('')
const location = ref<Zone | undefined>()
const override = ref(false)
const manualTripNo = ref('')
const manualSeatNo = ref('')
const manualTime = ref('')
const details = ref<TicketDetails | null>(null)
const fetching = ref(false)
const totalSen = ref(0)

const operatorItems = computed<Company[]>(() => companies.rows.value.map((c) => ({ ...c, label: c.name ?? c.operator_code })))

async function fetchDetails() {
    // TODO(api): look the reference up at the operator's system.
}

async function createCollection() {
    // TODO(api): create the collection and print the ticket.
    emit('created')
}
</script>

<template>
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div class="lg:col-span-7">
            <SalePanel title="Collection Details">
                <div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <SaleDatePicker v-model="date" />
                    <UFormField label="Operator">
                        <USelectMenu v-model="operator" :items="operatorItems" placeholder="Search Operator" size="lg" class="w-full" />
                    </UFormField>
                    <UFormField label="Reference">
                        <UInput v-model="reference" placeholder="Reference" size="lg" class="w-full" />
                    </UFormField>
                    <UFormField label="Location">
                        <USelectMenu v-model="location" :items="zones.rows.value" label-key="name" placeholder="Search Location" size="lg" class="w-full" />
                    </UFormField>
                </div>

                <div v-if="operator" class="mb-6">
                    <UCheckbox v-model="override" label="Override (Manual Trip/Seat Selection)" />
                </div>

                <div v-if="override" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <UFormField label="Trip No">
                        <UInput v-model="manualTripNo" placeholder="Enter trip number" size="lg" class="w-full" />
                    </UFormField>
                    <UFormField label="Seat No (1 Seat)">
                        <UInput v-model="manualSeatNo" placeholder="Enter seat number" size="lg" class="w-full" />
                    </UFormField>
                    <UFormField label="Time">
                        <UInput v-model="manualTime" type="time" size="lg" class="w-full" />
                    </UFormField>
                </div>

                <UButton
                    class="mt-6"
                    label="Fetch Details"
                    icon="i-bx-search"
                    :loading="fetching"
                    :disabled="reference.length < 1 || !operator"
                    @click="fetchDetails"
                />
            </SalePanel>
        </div>

        <div class="lg:col-span-5">
            <SalePanel title="Summary">
                <dl class="mb-6 space-y-3">
                    <div class="flex justify-between">
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Operator</dt>
                        <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ operator ? (operator.name ?? operator.operator_code) : '-' }}</dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Reference</dt>
                        <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ reference || '-' }}</dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Passenger</dt>
                        <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ details?.passenger ?? '-' }}</dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Trip</dt>
                        <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ details?.trip ?? (manualTripNo || '-') }}</dd>
                    </div>
                    <div class="flex justify-between">
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">Seat</dt>
                        <dd class="text-sm font-medium text-gray-900 dark:text-white">{{ details?.seat ?? (manualSeatNo || '-') }}</dd>
                    </div>
                    <div class="flex justify-between border-t border-(--ops-border) pt-3">
                        <dt class="text-base font-medium text-gray-500 dark:text-gray-400">Terminal Fee</dt>
                        <dd class="text-xl font-bold text-gray-900 dark:text-white">{{ formatSen(totalSen) }}</dd>
                    </div>
                </dl>
                <p v-if="override" class="mb-4 text-xs text-gray-500">
                    Override Mode: only seats unavailable on the operator's system (with no local booking) can be selected.
                </p>
                <UButton
                    block
                    size="xl"
                    color="success"
                    label="Confirm Collection"
                    :disabled="override ? !manualTripNo || !manualSeatNo : !details"
                    @click="createCollection"
                />
            </SalePanel>
        </div>
    </div>
</template>
