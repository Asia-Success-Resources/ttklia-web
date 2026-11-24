<script setup lang="ts">
// klia-bus resources/views/frontend/auth/passwords/confirm.blade.php (Auth\ConfirmPasswordController@showConfirmForm).
import { trans } from 'laravel-vue-i18n'
import { notConnected } from '~/klia/auth'

const { route } = useKlia()
useKliaSeo({ title: 'Confirm Password - TTKLIA' })
</script>

<template>
    <AuthCardPage icon="shield-check" :title="trans('Confirm it is you')" :lead="trans('This is a sensitive area of your account. Enter your password to continue.')">
        <form method="POST" :action="route('password.confirm')" class="auth-form" @submit.prevent="notConnected">
            <div class="field">
                <label for="password" class="field__label">{{ $t('Password') }}</label>
                <PasswordInput id="password" name="password" required autocomplete="current-password" autofocus />
            </div>
            <button type="submit" class="btn btn-primary btn-lg">{{ $t('Continue') }}</button>
        </form>

        <p class="auth__foot"><a :href="route('password.request')">{{ $t('Forgot Your Password?') }}</a></p>
    </AuthCardPage>
</template>
