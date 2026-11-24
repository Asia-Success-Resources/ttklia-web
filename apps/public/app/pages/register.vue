<script setup lang="ts">
// klia-bus resources/views/frontend/auth/register.blade.php (Auth\RegisterController@showRegistrationForm).
// www.ttklia.com only: teeko.ai signs up through its phone OTP sign-in.
import { trans } from 'laravel-vue-i18n'
import { COUNTRIES, notConnected } from '~/klia/auth'

const { isTeeko } = useBrand()
if (isTeeko.value) await navigateTo('/login', { redirectCode: 302 })

const { route } = useKlia()
const origin = useRequestURL().origin
useKliaSeo({ title: 'Sign Up - TTKLIA' })
</script>

<template>
    <div class="auth-page mobile-padding">
        <div class="container auth">
            <div class="auth-split auth-split--wide">
                <AuthBrand
                    :title="trans('Create your free TTKLIA account.')"
                    :text="trans('It takes a minute, and every booking after that is faster.')"
                    :items="[trans('Points on every booking, redeemable for rewards'), trans('Boarding passes and receipts in one place'), trans('Exclusive member promotions')]"
                />

                <div class="auth-card">
                    <h1 class="auth__title">{{ $t('Sign Up') }}</h1>
                    <p class="auth__lead">{{ $t('Create an account to earn points, keep your boarding passes and book faster.') }}</p>

                    <form method="POST" :action="route('register')" @submit.prevent="notConnected">
                        <ClientOnly>
                            <RegisterForm
                                :mobile="false"
                                :countries="COUNTRIES"
                                :terms-url="origin + route('terms')"
                                :privacy-url="origin + route('privacy')"
                                :errors="{}"
                            />
                        </ClientOnly>
                    </form>

                    <p class="auth__foot">{{ $t('Already have an account?') }} <a :href="route('login')">{{ $t('Sign In') }}</a></p>
                </div>
            </div>
        </div>
    </div>
</template>
