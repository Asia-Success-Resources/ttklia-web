<script setup lang="ts">
// Counters: create (table `locations`, type counter). Permission: bus.counters.write (doc 27).
// POST /api/ops/w/{workspace}/locations (ttklia-api, doc 04). A new active counter appears on
// Start Session for its kind straight away (doc 09, "Counter sessions").
useHead({ title: 'Create counter' })

interface Terminal { uuid: string; name: string }

const api = useApi()
const { slug } = useWorkspace()
const { resolveTo } = useOpsShell()

const terminals = useApiAll<Terminal>({ path: '/locations', workspaceScoped: true, query: { type: 'terminal' } })
onMounted(() => terminals.load())

const kinds = [
    { label: 'Booking (tickets, collections, tours, codes)', value: 'booking' },
    { label: 'Product (product till)', value: 'product' },
]

const state = reactive({
    code: '',
    name: '',
    counter_kind: 'booking' as 'booking' | 'product',
    parent_uuid: undefined as string | undefined,
    is_active: true,
})
const saving = ref(false)
const errors = ref<Record<string, string[]>>({})
const message = ref<string | null>(null)

const fieldError = (name: string) => errors.value[name]?.[0]

async function save() {
    message.value = null
    errors.value = {}
    if (!state.code.trim()) errors.value.code = ['Enter a code.']
    if (!state.name.trim()) errors.value.name = ['Enter a name.']
    if (Object.keys(errors.value).length) return
    if (!slug.value) return

    saving.value = true
    try {
        await api.post(api.workspacePath(slug.value, '/locations'), {
            type: 'counter',
            code: state.code.trim(),
            name: state.name.trim(),
            counter_kind: state.counter_kind,
            parent_uuid: state.parent_uuid ?? null,
            is_active: state.is_active,
        })
        await navigateTo(resolveTo('/counters'))
    } catch (e) {
        const problem = toProblem(e)
        errors.value = problem?.errors ?? {}
        message.value = problem?.detail ?? problem?.title ?? (e instanceof Error ? e.message : 'Unable to create the counter.')
    } finally {
        saving.value = false
    }
}
</script>

<template>
    <OpsFormPage title="Create counter" :saving="saving" :back-to="resolveTo('/counters')" @submit="save">
        <UFormField label="Code" name="code" required :error="fieldError('code')" help="Short and unique in this workspace, e.g. C01">
            <UInput v-model="state.code" maxlength="32" class="w-full" />
        </UFormField>
        <UFormField label="Name" name="name" required :error="fieldError('name')" help="Shown on Start Session, e.g. Counter 1">
            <UInput v-model="state.name" maxlength="120" class="w-full" />
        </UFormField>
        <UFormField label="Sells" name="counter_kind" required :error="fieldError('counter_kind')">
            <USelect v-model="state.counter_kind" :items="kinds" class="w-full" />
        </UFormField>
        <UFormField label="Terminal" name="parent_uuid" :error="fieldError('parent_uuid')">
            <USelectMenu
                v-model="state.parent_uuid"
                :items="terminals.rows.value"
                value-key="uuid"
                label-key="name"
                placeholder="None"
                class="w-full"
            />
        </UFormField>
        <UFormField name="is_active" :error="fieldError('is_active')" help="A disabled counter is not offered on Start Session">
            <UCheckbox v-model="state.is_active" label="Active" />
        </UFormField>

        <template #after>
            <UAlert v-if="message" color="error" variant="subtle" icon="i-bx-alert-circle" :title="message" />
        </template>
    </OpsFormPage>
</template>
