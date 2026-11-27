<script setup lang="ts">
// An app's own /login. With NUXT_PUBLIC_AUTH_URL set (staging, production) everyone signs in at the single login,
// auth.ttklia.com/{workspace} (apps/auth, doc 16 "Login"), so this page only sends them there. Without it (local
// development) it shows the sign-in form here.
definePageMeta({ layout: 'blank' })
useHead({ title: 'Sign in' })

const route = useRoute()
const runtime = useRuntimeConfig().public
const { loginLocation } = useAuth()

/** Only paths in this app, never another site. */
function returnPath(): string {
    const back = route.query.return
    return typeof back === 'string' && back.startsWith('/') && !back.startsWith('//') ? back : '/'
}

if (runtime.authUrl && import.meta.client) {
    const target = loginLocation(returnPath())
    await navigateTo(target.url, { external: true, replace: true })
}

async function signedIn() {
    await navigateTo(returnPath())
}
</script>

<template>
    <OpsLoginForm v-if="!runtime.authUrl" @signed-in="signedIn" />
</template>
