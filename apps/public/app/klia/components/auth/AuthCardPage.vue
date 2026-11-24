<script setup lang="ts">
// The single-card layout of klia-bus frontend/auth/passwords/*.blade.php: logo, icon, title, lead, slot, footer.
defineProps<{ icon: string; title: string; lead: string }>()
const { route } = useKlia()
</script>

<template>
    <div class="auth-page mobile-padding">
        <div class="container auth">
            <div class="auth__card">
                <a :href="route('index')" class="auth__logo-link"><img src="/logo.svg" alt="TTKLIA" class="auth__logo"></a>
                <span class="auth__icon"><XIcon :name="icon" /></span>
                <h1 class="auth__title">{{ title }}</h1>
                <p class="auth__lead">{{ lead }}</p>
                <slot />
            </div>
        </div>
    </div>
</template>
