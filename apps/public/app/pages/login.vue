<script setup lang="ts">
// www.ttklia.com: klia-bus resources/views/frontend/auth/login.blade.php (Auth\LoginController@showLoginForm).
// teeko.ai: phone OTP sign-in with optional referral code (Sitemap 1, doc 31).
// TODO(api): POST /auth/otp/request then /auth/otp/verify (doc 04), WhatsApp first, SMS fallback.
import { trans } from 'laravel-vue-i18n'
import { COUNTRIES, notConnected } from '~/klia/auth'

const { isTeeko } = useBrand()
const { route } = useKlia()
const query = useRoute().query
const str = (k: string) => (typeof query[k] === 'string' ? (query[k] as string) : undefined)

if (isTeeko.value) useHead({ title: 'Sign in' })
else useKliaSeo({ title: 'Sign In - TTKLIA' })

const phone = ref('')
const code = ref('')
const referral = ref('')
</script>

<template>
    <PublicSection v-if="isTeeko" title="Sign in">
        <form class="flex max-w-sm flex-col gap-4" @submit.prevent>
            <UFormField label="Phone" name="phone"><UInput v-model="phone" type="tel" class="w-full" /></UFormField>
            <UFormField label="Code" name="code"><UInput v-model="code" inputmode="numeric" class="w-full" /></UFormField>
            <UFormField label="Referral code (optional)" name="referral"><UInput v-model="referral" class="w-full" /></UFormField>
            <UButton type="submit" label="Continue" disabled />
        </form>
    </PublicSection>

    <div v-else class="auth-page mobile-padding">
        <div class="container auth">
            <div class="auth-split">
                <AuthBrand
                    :title="trans('Your KLIA2 journeys, all in one place.')"
                    :text="trans('Sign in to keep every boarding pass on hand, collect points and rebook in a tap.')"
                    :items="[trans('Boarding passes saved to your account'), trans('Earn points on bus, taxi and tour bookings'), trans('Faster checkout with saved details')]"
                />

                <div class="auth-card">
                    <h1 class="auth__title">{{ $t('Sign In') }}</h1>
                    <p class="auth__lead">{{ $t('Welcome back. Sign in to manage your bookings and rewards.') }}</p>

                    <form method="POST" :action="route('login')" @submit.prevent="notConnected">
                        <ClientOnly>
                            <LoginForm
                                :errors="{}"
                                :countries="COUNTRIES"
                                :password-request-url="route('password.request')"
                                :email="str('email')"
                                :phone="str('phone_number')"
                                :form-type="str('form-type')"
                            />
                        </ClientOnly>
                        <button class="btn btn-primary btn-lg auth-submit" type="submit">{{ $t('Log In') }}</button>
                    </form>

                    <p class="auth__foot">{{ $t('No account yet?') }} <a :href="route('register')">{{ $t('Sign Up') }}</a></p>
                </div>
            </div>
        </div>
    </div>
</template>
