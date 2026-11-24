<script setup lang="ts">
// The brand panel on the left of frontend/auth/login.blade.php and register.blade.php.
// numbered: steps (1, 2, 3) instead of ticks, as on the exchange ticket page.
defineProps<{ title: string; text: string; items: string[]; numbered?: boolean }>()
</script>

<template>
    <aside class="auth-brand" aria-hidden="true">
        <div>
            <img src="/logo.svg" alt="" class="auth-brand__logo">
            <h2 class="auth-brand__title">{{ title }}</h2>
            <p class="auth-brand__text">{{ text }}</p>
            <ul class="auth-brand__list">
                <li v-for="(item, i) in items" :key="item"><span class="auth-brand__check"><template v-if="numbered">{{ i + 1 }}</template><XIcon v-else name="check" /></span> {{ item }}</li>
            </ul>
        </div>
        <p class="auth-brand__foot">{{ $t('Official land transport platform of KLIA2') }}</p>
    </aside>
</template>
