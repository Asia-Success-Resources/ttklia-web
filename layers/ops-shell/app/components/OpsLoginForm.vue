<script setup lang="ts">
// The staff sign-in form, shared by the single login at auth.ttklia.com (apps/auth) and an app's own /login when
// NUXT_PUBLIC_AUTH_URL is not set (local development). Same layout as fleet-management's auth/login.vue: picture on
// the left, form on the right.
// POST /auth/login takes `email` or `phone_e164` plus `password` and returns { data: { access_token, … } }; the token
// is kept by useAuth in the 24-hour cookie, shared across the staff apps when NUXT_PUBLIC_AUTH_COOKIE_DOMAIN is set.
import cover from '../assets/img/login-cover.jpeg'

const props = withDefaults(defineProps<{ title?: string; subtitle?: string }>(), { title: 'Sign in', subtitle: undefined })
const emit = defineEmits<{ 'signed-in': [] }>()

const runtime = useRuntimeConfig().public
const api = useApi()
const { setToken, getToken } = useAuth()

const form = reactive({ login: '', password: '', remember: false })
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function submitLogin() {
    loading.value = true
    error.value = ''
    try {
        if (!runtime.apiBase) throw new ConfigMissing('NUXT_PUBLIC_API_BASE')
        // One field: an @ means an email address, otherwise a phone number in E.164 (+60…).
        const login = form.login.trim()
        const res = await api.post<{ data?: { access_token?: string } }>('/auth/login', {
            ...(login.includes('@') ? { email: login } : { phone_e164: login.replace(/[\s-]/g, '') }),
            password: form.password,
            remember: form.remember,
        })
        const token = res?.data?.access_token
        if (!token) throw new Error('No token in the login response')
        setToken(token)
        // Check the new token and load the user before leaving the page.
        if (!(await getToken({ redirect: false }))) throw new Error('Token rejected')
        emit('signed-in')
    } catch (err) {
        if (err instanceof ConfigMissing) error.value = `Sign-in is not configured (${err.setting}).`
        else error.value = toProblem(err)?.detail ?? 'Sign-in failed. Check your email or phone and password.'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="flex min-h-screen w-full overflow-hidden bg-(--ops-body)">
        <!-- Picture: left half on large screens -->
        <div class="relative hidden lg:block lg:w-1/2">
            <img :src="cover" alt="" class="absolute inset-0 h-full w-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-l from-black/40 to-transparent" />
            <div class="absolute bottom-12 left-12 text-white">
                <h1 class="text-4xl font-bold italic tracking-tighter">TTKLIA</h1>
                <p class="mt-2 font-mono text-sm opacity-80">Welcome back. Sign in to continue.</p>
            </div>
        </div>

        <!-- Form: right half -->
        <div class="flex min-h-screen w-full flex-col items-center bg-(--ops-card) lg:w-1/2">
            <main class="my-auto w-full max-w-[440px] px-4 py-16">
                <h1 class="text-center text-4xl font-extrabold tracking-tight text-gray-800 md:text-left dark:text-white/90" :class="props.subtitle ? 'mb-2' : 'mb-8'">
                    {{ props.title }}
                </h1>
                <p v-if="props.subtitle" class="mb-8 text-center text-sm text-gray-500 md:text-left dark:text-gray-400">{{ props.subtitle }}</p>
                <slot />

                <form class="space-y-4" @submit.prevent="submitLogin">
                    <UFormField label="Email address or phone" name="login" required>
                        <UInput v-model="form.login" type="text" autocomplete="username" required class="w-full" />
                    </UFormField>

                    <UFormField label="Password" name="password" required>
                        <UInput v-model="form.password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" required class="w-full" :ui="{ trailing: 'pe-1' }">
                            <template #trailing>
                                <UButton
                                    color="neutral" variant="link" size="sm"
                                    :icon="showPassword ? 'i-bx-hide' : 'i-bx-show'"
                                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                                    :aria-pressed="showPassword"
                                    @click="showPassword = !showPassword"
                                />
                            </template>
                        </UInput>
                    </UFormField>

                    <UCheckbox v-model="form.remember" label="Keep me logged in" class="pt-1" />

                    <UAlert v-if="error" :description="error" color="error" variant="subtle" />

                    <UButton type="submit" :loading="loading" :label="loading ? 'Signing in…' : 'Sign in'" block class="mt-6" />
                </form>
            </main>
        </div>
    </div>
</template>
