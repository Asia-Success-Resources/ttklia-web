<script setup lang="ts">
// Staff sign-in, the same layout as fleet-management's auth/login.vue, mirrored: picture on the
// left, form on the right. Used while there is no NUXT_PUBLIC_AUTH_URL (the single login at
// auth.ttklia.com, doc 16, "Login"); with it set, ops-auth sends users there instead.
// POST /auth/login (ttklia-api app/Http/Controllers/AuthController.php, from backend-fleet) takes
// `email` or `phone_e164` plus `password` (users.username was dropped on 20 Nov 2026, doc 03), and returns { data: { access_token, token_type, user } }.
// The token is kept by useAuth (fleet-management's flow) in a 24-hour cookie.
// TODO(api): the /auth/login route in routes/public.php is still a comment.
import cover from '../assets/img/login-cover.jpeg'

definePageMeta({ layout: 'blank' })
useHead({ title: 'Sign in' })

const route = useRoute()
const runtime = useRuntimeConfig().public
const api = useApi()
const { setToken, getToken } = useAuth()

const form = reactive({ login: '', password: '', remember: false })
const loading = ref(false)
const error = ref('')

/** Only paths in this app, never another site. */
function returnPath(): string {
    const back = route.query.return
    return typeof back === 'string' && back.startsWith('/') && !back.startsWith('//') ? back : '/'
}

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
        await navigateTo(returnPath())
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
                <h1 class="mb-8 text-center text-4xl font-extrabold tracking-tight text-gray-800 md:text-left dark:text-white/90">
                    Sign in
                </h1>

                <form class="space-y-4" @submit.prevent="submitLogin">
                    <UFormField label="Email address or phone" name="login" required>
                        <UInput v-model="form.login" type="text" autocomplete="username" required class="w-full" />
                    </UFormField>

                    <UFormField label="Password" name="password" required>
                        <UInput v-model="form.password" type="password" autocomplete="current-password" required class="w-full" />
                    </UFormField>

                    <UCheckbox v-model="form.remember" label="Keep me logged in" class="pt-1" />

                    <UAlert v-if="error" :description="error" color="error" variant="subtle" />

                    <UButton type="submit" :loading="loading" :label="loading ? 'Signing in…' : 'Sign in'" block class="mt-6" />
                </form>
            </main>
        </div>
    </div>
</template>
