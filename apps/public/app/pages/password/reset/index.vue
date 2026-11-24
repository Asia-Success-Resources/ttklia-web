<script setup lang="ts">
// klia-bus resources/views/frontend/auth/passwords/email.blade.php (Auth\ForgotPasswordController@showLinkRequestForm).
import { trans } from 'laravel-vue-i18n'
import { notConnected } from '~/klia/auth'

const { route } = useKlia()
useKliaSeo({ title: 'Forgot Password - TTKLIA' })
const email = ref(typeof useRoute().query.email === 'string' ? (useRoute().query.email as string) : '')
</script>

<template>
    <AuthCardPage icon="key" :title="trans('Forgot your password?')" :lead="trans('Enter the email on your account and we will send you a link to set a new one.')">
        <form method="POST" :action="route('password.email')" class="auth-form" @submit.prevent="notConnected">
            <div class="field">
                <label for="email" class="field__label">{{ $t('Email Address') }}</label>
                <input id="email" v-model="email" type="email" class="form-control" name="email" required autocomplete="email" autofocus placeholder="you@example.com">
            </div>
            <button type="submit" class="btn btn-primary btn-lg">{{ $t('Send reset link') }}</button>
        </form>

        <ul class="auth-tips">
            <li><XIcon name="mail" /> {{ $t('The link arrives within a few minutes. Check your spam folder if you do not see it.') }}</li>
            <li><XIcon name="device-mobile" /> {{ $t('Signed up with a phone number? Sign in with the one-time code instead.') }}</li>
        </ul>

        <p class="auth__foot"><a :href="route('login')"><XIcon name="arrow-left" class="icon icon-sm" /> {{ $t('Back to sign in') }}</a></p>
    </AuthCardPage>
</template>
