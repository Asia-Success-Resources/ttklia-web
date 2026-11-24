<script setup lang="ts">
// klia-bus resources/views/frontend/topbar.blade.php: utility bar, main bar with the service nav, and the mobile sheet.
const { route, is, user, initials, locale, carCharterEnabled, cashbacksEnabled } = useKlia()

const serviceLinks = computed(() => [
    { label: 'Bus', icon: 'bus', href: route('seo.destinations'), active: is('bus/*', 'trips', 'trips/*') },
    { label: 'Taxi', icon: 'taxi', href: route('seo.taxi.locations'), active: is('taxi/*', 'bookings/taxi*') },
    ...(carCharterEnabled ? [{ label: 'Car Charter', icon: 'car-charter', href: route('index') + '#car-charter', active: is('car-charter*') }] : []),
    { label: 'Genting', icon: 'van', href: route('genting.index'), active: is('genting*') },
    { label: 'Car Rental', icon: 'car-rental', href: route('rentals.index'), active: is('bookings/rentals*', 'rentals*') },
    { label: 'Tours', icon: 'tour', href: route('tours.index'), active: is('tours', 'tours/*') },
])
const moreLinks = computed(() => {
    const links = [
        { label: 'Promotions', icon: 'discount', href: route('offers.index'), active: is('promotions*') },
        { label: 'Shop', icon: 'shopping-bag', href: route('products.index'), active: is('shop*') },
        { label: 'Exchange ticket', icon: 'arrows-exchange', href: route('collect'), active: is('collect-ticket') },
        { label: 'Help', icon: 'headset', href: route('contact-us'), active: is('contact-us') },
    ]
    if (cashbacksEnabled) links.splice(1, 0, { label: 'Cashbacks', icon: 'percentage', href: route('cashbacks.index'), active: is('cashbacks*') })
    return links
})
// The sheet lists "Exchange ticket" first (klia-bus partitions on route('collect')).
const sheetFirst = computed(() => moreLinks.value.filter((l) => l.href === route('collect')))
const sheetRest = computed(() => moreLinks.value.filter((l) => l.href !== route('collect')))
const languages: Record<string, [string, string]> = { en: ['English', 'EN'], zh: ['简体中文', '中文'], ms: ['Bahasa Melayu', 'BM'] }
const firstName = computed(() => user.value?.name.trim().split(' ')[0] ?? '')
const points = computed(() => Math.round(user.value?.points ?? 0).toLocaleString('en-US'))

// TODO(api): sign out of ttklia-api (POST /auth/logout) once the public site signs in through it.
function logout() {
    user.value = null
    navigateTo(route('index'))
}
</script>

<template>
    <header class="site-header" data-site-header>
        <div class="main-bar">
            <div class="container main-bar__inner">
                <a class="main-bar__logo" :href="route('index')">
                    <img src="/images/logo.png" height="26" alt="TTKLIA" />
                </a>

                <nav class="service-nav" :aria-label="$t('Book')">
                    <a v-for="link in serviceLinks" :key="link.icon" :href="link.href" class="service-nav__link" :aria-current="link.active ? 'page' : undefined">
                        <XIcon :name="'service/' + link.icon" class="icon service-nav__icon" />
                        <span>{{ $t(link.label) }}</span>
                    </a>
                </nav>

                <div class="main-bar__actions">
                    <KliaThemeToggle />
                    <div class="dropdown">
                        <button class="main-bar__lang dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false" :aria-label="`${$t('Language')}: ${languages[locale]?.[0] ?? 'English'}`">
                            <XIcon name="world" class="icon icon-sm" /> {{ languages[locale]?.[1] ?? 'EN' }}
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li v-for="(names, code) in languages" :key="code">
                                <a class="dropdown-item" :href="`/language/${code}`" :lang="code" :aria-current="locale === code ? 'true' : undefined">
                                    {{ names[0] }} <XIcon v-if="locale === code" name="check" class="icon ms-auto" />
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div v-if="user" class="dropdown">
                        <button class="account-button" type="button" data-bs-toggle="dropdown" aria-expanded="false" :aria-label="$t('Account')">
                            <span class="account-button__avatar" aria-hidden="true">{{ initials }}</span>
                            <span class="account-button__name">{{ firstName }}</span>
                            <XIcon name="chevron-down" class="icon icon-sm" />
                        </button>
                        <div class="dropdown-menu dropdown-menu-end account-menu">
                            <div class="account-menu__head">
                                <p class="account-menu__name">{{ user.name }}</p>
                                <p class="account-menu__meta">{{ points }} {{ $t('points') }}</p>
                            </div>
                            <a :href="route('profile.edit')" class="dropdown-item"><XIcon name="home" /> {{ $t('Overview') }}</a>
                            <a :href="route('profile.bookings.index')" class="dropdown-item"><XIcon name="ticket" /> {{ $t('My bookings') }}</a>
                            <a :href="route('profile.codes.index')" class="dropdown-item"><XIcon name="cash" /> {{ $t('Points and codes') }}</a>
                            <a :href="route('profile.rewards.index')" class="dropdown-item"><XIcon name="gift" /> {{ $t('Rewards') }}</a>
                            <div class="dropdown-divider"></div>
                            <form @submit.prevent="logout">
                                <button type="submit" class="dropdown-item"><XIcon name="logout" /> {{ $t('Logout') }}</button>
                            </form>
                        </div>
                    </div>
                    <!-- One button for both (klia-bus had Sign in and Create account): it opens the sign-in page, which links to sign-up. -->
                    <a v-else :href="route('login')" class="btn btn-primary main-bar__register"><XIcon name="user-circle" class="icon" /> {{ $t('Sign in') }}</a>
                </div>

                <div class="main-bar__mobile">
                    <a :href="user ? route('profile.edit') : route('login')" class="icon-button" :aria-label="user ? $t('Account') : $t('Sign in')">
                        <span v-if="user" class="account-button__avatar account-button__avatar--sm" aria-hidden="true">{{ initials }}</span>
                        <XIcon v-else name="user-circle" class="icon icon-lg" />
                    </a>
                    <button class="icon-button" type="button" aria-controls="nav-sheet" aria-expanded="false" data-sheet-open>
                        <XIcon name="menu-2" class="icon icon-lg" />
                        <span class="visually-hidden">{{ $t('Open menu') }}</span>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <div id="nav-sheet" class="nav-sheet" role="dialog" aria-modal="true" :aria-label="$t('Menu')" hidden>
        <div class="nav-sheet__backdrop" data-sheet-close></div>
        <div class="nav-sheet__panel">
            <div class="nav-sheet__head">
                <img src="/images/logo.png" height="22" alt="TTKLIA" />
                <button type="button" class="icon-button" data-sheet-close>
                    <XIcon name="x" class="icon icon-lg" />
                    <span class="visually-hidden">{{ $t('Close menu') }}</span>
                </button>
            </div>

            <a v-if="user" :href="route('profile.edit')" class="sheet-account">
                <span class="account-button__avatar" aria-hidden="true">{{ initials }}</span>
                <span>
                    <span class="sheet-account__name">{{ user.name }}</span>
                    <span class="sheet-account__meta">{{ points }} {{ $t('points') }}</span>
                </span>
                <XIcon name="chevron-right" class="icon ms-auto" />
            </a>
            <div v-else class="sheet-auth">
                <a :href="route('login')" class="btn btn-primary"><XIcon name="user-circle" class="icon" /> {{ $t('Sign in') }} / {{ $t('Sign Up') }}</a>
            </div>

            <p class="nav-sheet__label">{{ $t('Book') }}</p>
            <nav class="sheet-services" :aria-label="$t('Book')">
                <a v-for="link in serviceLinks" :key="link.icon" :href="link.href" class="sheet-service" :aria-current="link.active ? 'page' : undefined">
                    <XIcon :name="'service/' + link.icon" class="icon" />
                    <span>{{ $t(link.label) }}</span>
                </a>
            </nav>

            <p class="nav-sheet__label">{{ $t('More') }}</p>
            <nav :aria-label="$t('More')">
                <a v-for="link in sheetFirst" :key="link.href" :href="link.href" class="nav-sheet__row" :aria-current="link.active ? 'page' : undefined"><XIcon :name="link.icon" /> {{ $t(link.label) }}</a>
                <a v-if="user" :href="route('profile.bookings.index')" class="nav-sheet__row"><XIcon name="ticket" /> {{ $t('My bookings') }}</a>
                <a v-for="link in sheetRest" :key="link.href" :href="link.href" class="nav-sheet__row" :aria-current="link.active ? 'page' : undefined"><XIcon :name="link.icon" /> {{ $t(link.label) }}</a>
                <form v-if="user" @submit.prevent="logout">
                    <button type="submit" class="nav-sheet__row"><XIcon name="logout" /> {{ $t('Logout') }}</button>
                </form>
            </nav>

            <p class="nav-sheet__label">{{ $t('Language') }}</p>
            <div class="sheet-lang">
                <a v-for="(names, code) in languages" :key="code" :href="`/language/${code}`" :lang="code" :aria-current="locale === code ? 'true' : undefined">{{ names[0] }}</a>
            </div>

            <p class="nav-sheet__label">{{ $t('Theme') }}</p>
            <KliaThemeToggle variant="sheet" />
        </div>
    </div>
</template>
