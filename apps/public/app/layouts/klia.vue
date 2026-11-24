<script setup lang="ts">
// klia-bus resources/views/frontend/layout.blade.php: the ttklia.com site copied from klia-bus (its frontend views),
// with its own stylesheet (Bootstrap 5.2.3 + frontend tokens), header, footer, cookie notice and Teeko chat button.
// Pages set their title and description with useKliaSeo(); the defaults are klia-bus's.
import { initSiteHeader } from '~/klia/scripts/site-header.js'
import { initTeekoFloat } from '~/klia/scripts/teeko-float.js'
import { initSearchToggle } from '~/klia/scripts/search-toggle.js'
import { initTabs } from '~/klia/scripts/explore-tabs.js'
import { initReveal } from '~/klia/scripts/reveal.js'
import { initPasswordToggles } from '~/klia/scripts/password-toggle.js'

const { route, locale, teekoWhatsapp } = useKlia()
const url = useRequestURL()
// Pages behind login stay out of the index (klia-bus $isPrivatePage).
const routeNow = useRoute()
const isPrivate = computed(() => /^\/(bookings\/(?!rentals$)|trips|profile)/.test(routeNow.path))

useHead({
    htmlAttrs: { lang: () => locale.value },
    bodyAttrs: { class: 'klia-site' },
    titleTemplate: null,
    meta: [
        { name: 'author', content: 'TTKLIA' },
        { name: 'robots', content: () => (isPrivate.value ? 'noindex, nofollow' : 'index, follow') },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'TTKLIA' },
        { property: 'og:image', content: `${url.origin}/images/og-default.jpg` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: `${url.origin}/images/og-default.jpg` },
        { name: 'facebook-domain-verification', content: 'kmfmxtc98yn1vv6auvjanxm0h8ys8z' },
    ],
    link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'canonical', href: () => `${url.origin}${routeNow.path}` },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap' },
    ],
    script: [{ innerHTML: "document.documentElement.classList.add('js');", tagPosition: 'head' }],
})

// Shown client-side, as in klia-bus (the guest homepage is cached there).
const cookieNotice = ref(false)
function acceptCookies() {
    document.cookie = 'cookie_notice=1; max-age=31536000; path=/; SameSite=Lax'
    cookieNotice.value = false
}

const nuxtApp = useNuxtApp()
const afterPage = () => nextTick(() => {
    initTabs()
    initReveal()
    initPasswordToggles()
})
onMounted(() => {
    cookieNotice.value = !/(?:^|;\s*)cookie_notice=1/.test(document.cookie)
    initSiteHeader()
    initTeekoFloat()
    initSearchToggle()
    afterPage()
})
nuxtApp.hook('page:finish', afterPage)
</script>

<template>
    <div>
        <a class="skip-link" href="#main">{{ $t('Skip to content') }}</a>
        <KliaTopbar />

        <main id="main" class="content">
            <div id="app">
                <slot />
            </div>
        </main>

        <KliaFooter />

        <div id="cookie-notice" class="cookie-notice" role="region" :aria-label="$t('Cookie notice')" :hidden="!cookieNotice">
            <p>{{ $t('We use cookies to keep you signed in, remember your language and improve our site. See our') }} <a :href="route('privacy')">{{ $t('Privacy Policy') }}</a>.</p>
            <button id="cookie-notice-accept" type="button" class="btn btn-sm btn-primary" @click="acceptCookies">{{ $t('Got it') }}</button>
        </div>

        <a
            v-if="teekoWhatsapp"
            id="teeko-ai-float"
            :href="`https://wa.me/${teekoWhatsapp}?text=Hello%20Teeko!`"
            target="_blank"
            rel="noopener"
            class="teeko-float"
            :aria-label="$t('Chat with Teeko on WhatsApp')"
        >
            <img src="/images/teeko-ai.png" alt="" width="56" height="56" />
            <span class="teeko-float__label">{{ $t('Chat with Teeko') }}</span>
        </a>
    </div>
</template>

<style src="@vuepic/vue-datepicker/dist/main.css"></style>
<style src="vue-multiselect/dist/vue-multiselect.css"></style>
<style lang="scss">
@import '../assets/klia/sass/frontend.scss';

/*
 * The base layer loads Tailwind and Nuxt UI for every app. Its reset (in @layer base) would change these Bootstrap
 * pages where Bootstrap's reboot sets nothing, so the browser defaults it relies on come back here, unlayered.
 */
/* Zero specificity (:where), so every klia-bus rule still wins, as it does over the browser defaults. */
:where(body.klia-site) {
    font-family: Roboto, system-ui, -apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    background-color: #f5f6f8;
    color: #374151;
}
:where(body.klia-site) :where(img, video, canvas, audio, iframe, embed, object) { display: revert; max-width: revert; }
:where(body.klia-site) :where(img, svg) { vertical-align: middle; }
:where(body.klia-site) :where(svg) { display: revert; }
:where(body.klia-site) :where(ol, ul, menu) { list-style: revert; margin: revert; padding: revert; }
:where(body.klia-site) :where(h1, h2, h3, h4, h5, h6, p, blockquote, figure, dl, dd, hr, pre) { margin: revert-layer; }
:where(body.klia-site) :where(button, input, select, textarea) { font: inherit; color: inherit; }
:where(body.klia-site) [hidden]:where(:not([hidden='until-found'])) { display: none !important; }

/*
 * Preflight's `img { height: auto }` also beats the height="" attribute, which klia-bus uses for logos and images.
 * Each height the copied markup uses is set back here with no specificity, so klia-bus's own rules still win, as they
 * do over the attribute. A new height="" in the copied markup goes in this list.
 */
@each $h in 22, 25, 26, 28, 56, 180, 350, 1200 {
    :where(body.klia-site img[height='#{$h}']) { height: #{$h}px; }
}
</style>
