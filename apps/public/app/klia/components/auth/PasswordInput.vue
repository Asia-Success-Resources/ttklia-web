<script setup lang="ts">
// The .password-field markup of klia-bus passwords/*.blade.php, with the show / hide toggle of
// resources/js/web/password-toggle.js done in Vue (same markup, aria-pressed and labels).
import { trans } from 'laravel-vue-i18n'

defineOptions({ inheritAttrs: false })
const show = ref(false)
const input = ref<HTMLInputElement | null>(null)
const toggle = () => {
    show.value = !show.value
    input.value?.focus({ preventScroll: true })
}
</script>

<template>
    <div class="password-field" data-password-field>
        <input ref="input" :type="show ? 'text' : 'password'" class="form-control" v-bind="$attrs">
        <button type="button" class="password-field__toggle" :aria-label="trans(show ? 'Hide password' : 'Show password')" :aria-pressed="show ? 'true' : 'false'" @click="toggle">
            <XIcon :name="show ? 'eye-off' : 'eye'" class="icon icon-sm" />
        </button>
    </div>
</template>
