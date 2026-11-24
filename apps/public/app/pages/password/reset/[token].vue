<script setup lang="ts">
// klia-bus resources/views/frontend/auth/passwords/reset.blade.php (Auth\ResetPasswordController@showResetForm).
import { trans } from 'laravel-vue-i18n'
import { notConnected } from '~/klia/auth'

const { route } = useKlia()
const page = useRoute()
useKliaSeo({ title: 'Reset Password - TTKLIA' })
const email = typeof page.query.email === 'string' ? page.query.email : ''
</script>

<template>
    <AuthCardPage icon="lock" :title="trans('Set a new password')" :lead="trans('Choose a strong password you have not used on TTKLIA before.')">
        <form method="POST" :action="route('password.update')" class="auth-form" @submit.prevent="notConnected">
            <input type="hidden" name="token" :value="String(page.params.token)">

            <div class="field">
                <label for="email" class="field__label">{{ $t('Email Address') }}</label>
                <input id="email" type="email" class="form-control" name="email" :value="email" required autocomplete="email" readonly>
            </div>

            <div class="field">
                <label for="password" class="field__label">{{ $t('New password') }}</label>
                <PasswordInput id="password" name="password" required autocomplete="new-password" autofocus minlength="8" />
                <p class="field__hint">{{ $t('At least 8 characters.') }}</p>
            </div>

            <div class="field">
                <label for="password-confirm" class="field__label">{{ $t('Confirm new password') }}</label>
                <PasswordInput id="password-confirm" name="password_confirmation" required autocomplete="new-password" minlength="8" />
            </div>

            <button type="submit" class="btn btn-primary btn-lg">{{ $t('Save new password') }}</button>
        </form>

        <p class="auth__foot"><a :href="route('login')"><XIcon name="arrow-left" class="icon icon-sm" /> {{ $t('Back to sign in') }}</a></p>
    </AuthCardPage>
</template>
