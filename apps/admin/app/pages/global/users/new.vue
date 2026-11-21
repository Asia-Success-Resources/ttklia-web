<script setup lang="ts">
import type { Assignment } from '~/components/AssignmentEditor.vue'

// New staff user (v2 Admin\UserController@create): details and role assignments. Leave the password empty to have
// one made up; it is shown once after saving. Permission: global.users.write (doc 27).
useHead({ title: 'New user' })

const api = useApi()
const form = reactive({ name: '', email: '', phone_e164: '', locale: 'en', password: '' })
const assignments = ref<Assignment[]>([{ role_id: null, workspace_id: null, scope_organisation_id: null }])
const saving = ref(false)
const error = ref<string | null>(null)
const created = ref<{ uuid: string; temporary_password: string | null } | null>(null)

async function save() {
    saving.value = true
    error.value = null
    try {
        const res = await api.post<{ data: { uuid: string; temporary_password: string | null } }>('/admin/users', {
            ...form,
            phone_e164: form.phone_e164 || undefined,
            password: form.password || undefined,
            assignments: assignments.value.filter((a) => a.role_id),
        })
        created.value = res.data
    } catch (e) {
        const problem = toProblem(e) as { detail?: string; title?: string; message?: string } | null
        error.value = problem?.message ?? problem?.detail ?? problem?.title ?? 'Unable to create the user.'
    } finally {
        saving.value = false
    }
}
</script>

<template>
    <div v-if="created">
        <OpsBreadcrumb title="New user" />
        <UAlert color="success" variant="soft" icon="i-bx-check-circle" title="User created">
            <template #description>
                <p v-if="created.temporary_password">Temporary password: <code class="font-mono font-semibold">{{ created.temporary_password }}</code>. Give it to the user; it is not shown again.</p>
                <UButton class="mt-3" label="Open user" :to="`/global/users/${created.uuid}`" />
            </template>
        </UAlert>
    </div>
    <OpsFormPage v-else title="New user" :saving="saving" back-to="/global/users" @submit="save">
        <UFormField label="Name" required><UInput v-model="form.name" class="w-full" /></UFormField>
        <UFormField label="Email" required><UInput v-model="form.email" type="email" class="w-full" /></UFormField>
        <UFormField label="Phone (+60…)"><UInput v-model="form.phone_e164" placeholder="+60123456789" class="w-full" /></UFormField>
        <UFormField label="Language">
            <USelect v-model="form.locale" :items="[{ label: 'English', value: 'en' }, { label: 'Bahasa Melayu', value: 'ms' }, { label: '中文', value: 'zh' }]" class="w-full" />
        </UFormField>
        <UFormField label="Password" help="Leave empty to make one up">
            <UInput v-model="form.password" type="password" autocomplete="new-password" class="w-full" />
        </UFormField>
        <div class="md:col-span-2">
            <h3 class="mb-2 text-sm font-semibold text-gray-800 dark:text-white">Roles</h3>
            <AssignmentEditor v-model="assignments" />
        </div>
        <UAlert v-if="error" class="md:col-span-2" color="error" variant="soft" icon="i-bx-alert-circle" :title="error" />
    </OpsFormPage>
</template>
