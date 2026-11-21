<script setup lang="ts">
// Account settings, in the layout of Sneat's "Account settings" pages (themeselection.com, pages-account-settings-*):
// pill tabs (Account, Security) above cards. Every app has it (/profile, or /{location}/profile).
// - Account: "Profile Details" with the round picture (Upload new photo / Reset; JPG, GIF or PNG, 800K at most), the
//   details form (name, email, phone, language; Save changes / Cancel). Roles, workspaces and closing an account are
//   handled by an admin on Global > Users, not here.
// - Security: "Change Password" with its requirements, "Two-steps verification" (TOTP, doc 05), "Recent Devices".
// API: GET/PATCH /me, /me/account, /me/avatar, /me/password, /me/two-factor, /me/sessions.

interface Account {
    uuid: string
    name: string
    email: string | null
    phone_e164: string | null
    locale: string
    status: string
    email_verified: boolean
    phone_verified: boolean
    avatar_url: string | null
    two_factor_enabled: boolean
    last_login_at: string | null
    created_at: string | null
}
interface Session {
    id: number
    device: string
    last_used_at: string | null
    created_at: string
    current: boolean
}
const api = useApi()
const toast = useToast()
const route = useRoute()
const router = useRouter()
const { me, load: loadMe } = useMe()
const { slug } = useWorkspace()

const TABS = [
    { key: 'account', label: 'Account', icon: 'i-bx-user' },
    { key: 'security', label: 'Security', icon: 'i-bx-lock' },
] as const
type Tab = (typeof TABS)[number]['key']
const tab = computed<Tab>(() => (TABS.some((t) => t.key === route.query.tab) ? (route.query.tab as Tab) : 'account'))
const setTab = (key: Tab) => router.replace({ query: { ...route.query, tab: key === 'account' ? undefined : key } })

const account = ref<Account | null>(null)
const refreshMe = () => loadMe(slug.value ?? null)

// ---------------------------------------------------------------- Account
const details = reactive({ saving: false, errors: {} as Record<string, string[]>, data: { name: '', email: '', phone_e164: '', locale: 'en' } })
const fieldError = (key: string) => details.errors[key]?.[0] ?? null
function fillDetails(a: Account) {
    details.data = { name: a.name, email: a.email ?? '', phone_e164: a.phone_e164 ?? '', locale: a.locale || 'en' }
    details.errors = {}
}
async function loadAccount() {
    try {
        account.value = (await api.get<{ data: Account }>('/me/account')).data
        fillDetails(account.value)
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to load your account', color: 'error' })
    }
}
onMounted(loadAccount)

async function saveDetails() {
    details.saving = true
    details.errors = {}
    try {
        account.value = (
            await api.patch<{ data: Account }>('/me', {
                name: details.data.name,
                email: details.data.email || null,
                phone_e164: details.data.phone_e164 || null,
                locale: details.data.locale,
            })
        ).data
        fillDetails(account.value)
        await refreshMe()
        toast.add({ title: 'Changes saved', color: 'success' })
    } catch (e) {
        details.errors = (e as { data?: { errors?: Record<string, string[]> } })?.data?.errors ?? {}
        if (!Object.keys(details.errors).length) toast.add({ title: toProblem(e)?.detail ?? 'Unable to save', color: 'error' })
    } finally {
        details.saving = false
    }
}

const initials = computed(() =>
    (account.value?.name ?? me.value?.name ?? '?')
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join(''),
)
const photoInput = ref<HTMLInputElement | null>(null)
const photoError = ref<string | null>(null)
const photoBusy = ref(false)
async function uploadPhoto(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    photoError.value = null
    if (file.size > 800 * 1024) {
        photoError.value = 'Max size of 800K'
        return
    }
    const body = new FormData()
    body.append('avatar', file)
    photoBusy.value = true
    try {
        account.value = (await api.post<{ data: Account }>('/me/avatar', body)).data
        await refreshMe()
    } catch (e) {
        photoError.value = (e as { data?: { errors?: Record<string, string[]> } })?.data?.errors?.avatar?.[0] ?? toProblem(e)?.detail ?? 'Unable to upload'
    } finally {
        photoBusy.value = false
        if (photoInput.value) photoInput.value.value = ''
    }
}
async function resetPhoto() {
    photoBusy.value = true
    try {
        account.value = (await api.del<{ data: Account }>('/me/avatar')).data
        await refreshMe()
    } finally {
        photoBusy.value = false
    }
}

// ---------------------------------------------------------------- Security
const pwd = reactive({ saving: false, errors: {} as Record<string, string[]>, data: { current_password: '', password: '', password_confirmation: '' }, show: false })
const pwdError = (key: string) => pwd.errors[key]?.[0] ?? null
const rules = computed(() => [
    { ok: pwd.data.password.length >= 8, label: 'At least 8 characters' },
    { ok: /[a-z]/i.test(pwd.data.password), label: 'At least one letter' },
    { ok: /\d/.test(pwd.data.password), label: 'At least one number' },
])
function resetPassword() {
    pwd.data = { current_password: '', password: '', password_confirmation: '' }
    pwd.errors = {}
}
async function savePassword() {
    pwd.saving = true
    pwd.errors = {}
    try {
        await api.put('/me/password', pwd.data)
        resetPassword()
        toast.add({ title: 'Password changed. Your other devices were signed out.', color: 'success' })
        await loadSessions()
    } catch (e) {
        pwd.errors = (e as { data?: { errors?: Record<string, string[]> } })?.data?.errors ?? {}
        if (!Object.keys(pwd.errors).length) toast.add({ title: toProblem(e)?.detail ?? 'Unable to change the password', color: 'error' })
    } finally {
        pwd.saving = false
    }
}

// Two-steps verification: start → scan or type the key → confirm with a code. Turning it off needs the password.
const twoFactor = reactive({ open: false, saving: false, step: 'setup' as 'setup' | 'off', secret: '', url: '', code: '', password: '', error: null as string | null })
async function startTwoFactor() {
    Object.assign(twoFactor, { open: true, step: 'setup', code: '', error: null, secret: '', url: '' })
    try {
        const res = await api.post<{ data: { secret: string; otpauth_url: string } }>('/me/two-factor')
        twoFactor.secret = res.data.secret
        twoFactor.url = res.data.otpauth_url
    } catch (e) {
        twoFactor.error = toProblem(e)?.detail ?? 'Unable to start'
    }
}
function stopTwoFactor() {
    Object.assign(twoFactor, { open: true, step: 'off', password: '', error: null })
}
async function submitTwoFactor() {
    twoFactor.saving = true
    twoFactor.error = null
    try {
        account.value =
            twoFactor.step === 'setup'
                ? (await api.post<{ data: Account }>('/me/two-factor/confirm', { code: twoFactor.code })).data
                : (await api.del<{ data: Account }>('/me/two-factor', { password: twoFactor.password })).data
        twoFactor.open = false
        toast.add({ title: account.value.two_factor_enabled ? 'Two-steps verification is on' : 'Two-steps verification is off', color: 'success' })
    } catch (e) {
        const errors = (e as { data?: { errors?: Record<string, string[]> } })?.data?.errors
        twoFactor.error = errors?.code?.[0] ?? errors?.password?.[0] ?? toProblem(e)?.detail ?? 'Unable to save'
    } finally {
        twoFactor.saving = false
    }
}
const groupedSecret = computed(() => twoFactor.secret.replace(/(.{4})/g, '$1 ').trim())

const sessions = ref<Session[]>([])
async function loadSessions() {
    try {
        sessions.value = (await api.get<{ data: Session[] }>('/me/sessions')).data
    } catch {
        sessions.value = []
    }
}
async function endSession(s: Session) {
    try {
        await api.del(`/me/sessions/${s.id}`)
        await loadSessions()
    } catch (e) {
        toast.add({ title: toProblem(e)?.detail ?? 'Unable to sign it out', color: 'error' })
    }
}
watch(tab, (t) => t === 'security' && loadSessions(), { immediate: true })

const LOCALES = [
    { label: 'English', value: 'en' },
    { label: 'Bahasa Malaysia', value: 'ms' },
    { label: '中文', value: 'zh' },
]
const card = 'rounded-xl border border-(--ops-border) bg-(--ops-card)'
const cardHead = 'border-b border-(--ops-border) px-6 py-4 text-lg font-medium text-gray-800 dark:text-white/90'
</script>

<template>
    <div class="space-y-6">
        <OpsBreadcrumb title="Account Settings" />

        <!-- Pill tabs, as Sneat's nav-pills -->
        <div class="flex flex-wrap gap-2">
            <button
                v-for="t in TABS"
                :key="t.key"
                type="button"
                class="flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-colors"
                :class="tab === t.key ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-(--ops-nav-hover-bg) dark:text-gray-300'"
                @click="setTab(t.key)"
            >
                <UIcon :name="t.icon" class="size-5" />
                {{ t.label }}
            </button>
        </div>

        <!-- ======================= Account ======================= -->
        <template v-if="tab === 'account'">
            <div :class="card">
                <h5 :class="cardHead">Profile Details</h5>
                <div class="flex flex-col items-start gap-6 px-6 py-6 sm:flex-row sm:items-center">
                    <img v-if="account?.avatar_url" :src="account.avatar_url" alt="Profile picture" class="size-25 rounded-lg object-cover" />
                    <div v-else class="flex size-25 items-center justify-center rounded-lg bg-primary/15 text-3xl font-semibold text-primary">{{ initials }}</div>
                    <div>
                        <div class="flex flex-wrap gap-3">
                            <UButton label="Upload new photo" icon="i-bx-image-plus" :loading="photoBusy" @click="photoInput?.click()" />
                            <UButton label="Reset" icon="i-bx-undo" color="neutral" variant="outline" :disabled="!account?.avatar_url || photoBusy" @click="resetPhoto" />
                            <input ref="photoInput" type="file" accept="image/png,image/jpeg,image/gif" class="hidden" @change="uploadPhoto" />
                        </div>
                        <p class="mt-3 text-sm text-gray-500">Allowed JPG, GIF or PNG. Max size of 800K</p>
                        <p v-if="photoError" class="mt-1 text-xs text-error">{{ photoError }}</p>
                    </div>
                </div>
                <hr class="border-(--ops-border)" />
                <form class="px-6 py-6" @submit.prevent="saveDetails">
                    <div class="grid grid-cols-1 gap-5 text-sm md:grid-cols-2">
                        <OpsFormField label="Full Name" required :error="fieldError('name')"><UInput v-model="details.data.name" class="w-full" /></OpsFormField>
                        <OpsFormField label="E-mail" :error="fieldError('email')">
                            <UInput v-model="details.data.email" type="email" class="w-full" />
                        </OpsFormField>
                        <OpsFormField label="Phone Number" :error="fieldError('phone_e164')">
                            <UInput v-model="details.data.phone_e164" placeholder="+60123456789" class="w-full" />
                        </OpsFormField>
                        <OpsFormField label="Language" :error="fieldError('locale')">
                            <USelect v-model="details.data.locale" :items="LOCALES" class="w-full" />
                        </OpsFormField>
                    </div>
                    <p v-if="account && (!account.email_verified || !account.phone_verified)" class="mt-4 text-xs text-gray-500">
                        A changed email or phone number has to be verified again before it can be used to sign in.
                    </p>
                    <div class="mt-6 flex gap-3">
                        <UButton type="submit" label="Save changes" :loading="details.saving" />
                        <UButton label="Cancel" color="neutral" variant="outline" :disabled="details.saving" @click="account && fillDetails(account)" />
                    </div>
                </form>
            </div>
        </template>

        <!-- ======================= Security ======================= -->
        <template v-else-if="tab === 'security'">
            <div :class="card">
                <h5 :class="cardHead">Change Password</h5>
                <form class="px-6 py-6" @submit.prevent="savePassword">
                    <div class="grid grid-cols-1 gap-5 text-sm md:grid-cols-2">
                        <OpsFormField label="Current Password" required :error="pwdError('current_password')">
                            <UInput v-model="pwd.data.current_password" :type="pwd.show ? 'text' : 'password'" autocomplete="current-password" class="w-full" />
                        </OpsFormField>
                        <div class="hidden md:block" />
                        <OpsFormField label="New Password" required :error="pwdError('password')">
                            <UInput v-model="pwd.data.password" :type="pwd.show ? 'text' : 'password'" autocomplete="new-password" class="w-full" />
                        </OpsFormField>
                        <OpsFormField label="Confirm New Password" required :error="pwdError('password_confirmation')">
                            <UInput v-model="pwd.data.password_confirmation" :type="pwd.show ? 'text' : 'password'" autocomplete="new-password" class="w-full" />
                        </OpsFormField>
                    </div>
                    <UCheckbox v-model="pwd.show" label="Show passwords" class="mt-4" />
                    <p class="mt-5 text-sm font-medium text-gray-700 dark:text-gray-200">Password Requirements:</p>
                    <ul class="mt-2 space-y-1 text-sm">
                        <li v-for="r in rules" :key="r.label" class="flex items-center gap-2" :class="r.ok ? 'text-success' : 'text-gray-500'">
                            <UIcon :name="r.ok ? 'i-bx-check-circle' : 'i-bx-circle'" class="size-4" />{{ r.label }}
                        </li>
                    </ul>
                    <div class="mt-6 flex gap-3">
                        <UButton type="submit" label="Save changes" :loading="pwd.saving" />
                        <UButton label="Reset" color="neutral" variant="outline" :disabled="pwd.saving" @click="resetPassword" />
                    </div>
                </form>
            </div>

            <div :class="card">
                <h5 :class="cardHead">Two-steps verification</h5>
                <div class="space-y-3 px-6 py-6 text-sm">
                    <p class="font-medium text-gray-800 dark:text-white/90">
                        {{ account?.two_factor_enabled ? 'Two factor authentication is on.' : 'Two factor authentication is not enabled yet.' }}
                    </p>
                    <p class="text-gray-500">
                        Two-factor authentication adds an additional layer of security to your account by requiring a code from your authenticator app
                        (Google Authenticator, Microsoft Authenticator…) when you sign in. Staff roles need it (doc 05).
                    </p>
                    <UButton v-if="!account?.two_factor_enabled" label="Enable two-factor authentication" @click="startTwoFactor" />
                    <UButton v-else label="Turn off two-factor authentication" color="error" variant="outline" @click="stopTwoFactor" />
                </div>
            </div>

            <div :class="card">
                <h5 :class="cardHead">Recent Devices</h5>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-(--app-icon-bg) text-left text-xs uppercase text-gray-500">
                            <tr>
                                <th class="px-6 py-3">Device</th>
                                <th class="px-6 py-3">Signed in</th>
                                <th class="px-6 py-3">Recent activity</th>
                                <th class="px-6 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="s in sessions" :key="s.id" class="border-t border-(--ops-border)">
                                <td class="px-6 py-3">
                                    <span class="flex items-center gap-2"><UIcon name="i-bx-desktop" class="size-5 text-primary" />{{ s.device }}</span>
                                </td>
                                <td class="px-6 py-3">{{ formatDateTime(s.created_at) }}</td>
                                <td class="px-6 py-3">{{ s.last_used_at ? formatDateTime(s.last_used_at) : '—' }}</td>
                                <td class="px-6 py-3 text-right">
                                    <UBadge v-if="s.current" label="This device" variant="soft" />
                                    <UButton v-else label="Sign out" size="xs" color="neutral" variant="outline" @click="endSession(s)" />
                                </td>
                            </tr>
                            <tr v-if="!sessions.length"><td colspan="4" class="px-6 py-4 text-center text-gray-500">No devices</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </template>

        <!-- Two-steps verification popup (fleet style) -->
        <OpsFormModal
            v-model:open="twoFactor.open"
            :title="twoFactor.step === 'setup' ? 'Enable Two-Steps Verification' : 'Turn Off Two-Steps Verification'"
            :saving="twoFactor.saving"
            :error="twoFactor.error"
            :submit-label="twoFactor.step === 'setup' ? 'Verify' : 'Turn Off'"
            @submit="submitTwoFactor"
        >
            <template v-if="twoFactor.step === 'setup'">
                <div class="space-y-2 sm:col-span-2">
                    <p>1. In your authenticator app, add an account with this setup key:</p>
                    <p class="rounded-lg bg-(--app-icon-bg) px-3 py-3 text-center font-mono text-base tracking-wider">{{ groupedSecret || '…' }}</p>
                    <p class="text-xs text-gray-500">
                        On a phone you can <a :href="twoFactor.url" class="text-primary underline">open it in the app</a> instead.
                    </p>
                    <p>2. Enter the 6-digit code it shows:</p>
                </div>
                <OpsFormField label="Code" required full><UInput v-model="twoFactor.code" inputmode="numeric" maxlength="6" placeholder="123456" class="w-full font-mono" /></OpsFormField>
            </template>
            <OpsFormField v-else label="Your password" required full>
                <UInput v-model="twoFactor.password" type="password" autocomplete="current-password" class="w-full" />
            </OpsFormField>
        </OpsFormModal>
    </div>
</template>
