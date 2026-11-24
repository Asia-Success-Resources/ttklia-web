<script setup lang="ts">
// klia-bus resources/views/frontend/footer.blade.php.
const { route, locale, carCharterEnabled } = useKlia()
const languages: Record<string, string> = { en: 'English', zh: '简体中文', ms: 'Bahasa Melayu' }
const year = new Date().getFullYear()
</script>

<template>
    <footer class="site-footer">
        <div class="container">
            <div class="site-footer__grid">
                <div class="site-footer__brand">
                    <img src="/images/logo.png" height="25" alt="TTKLIA" loading="lazy" />
                    <p>{{ $t('Official platform for bus tickets, taxis and land transport at Kuala Lumpur International Airport.') }}</p>
                </div>
                <nav class="site-footer__col" aria-labelledby="footer-services">
                    <h2 id="footer-services">{{ $t('Services') }}</h2>
                    <ul>
                        <li><a :href="route('seo.destinations')">{{ $t('Bus Tickets') }}</a></li>
                        <li><a :href="route('seo.taxi.locations')">{{ $t('Airport Taxi') }}</a></li>
                        <li v-if="carCharterEnabled"><a :href="route('index') + '#car-charter'">{{ $t('Car Charter') }}</a></li>
                        <li><a :href="route('tours.index')">{{ $t('Tours') }}</a></li>
                        <li><a :href="route('rentals.index')">{{ $t('Car Rentals') }}</a></li>
                        <li><a :href="route('genting.index')">{{ $t('Van to Genting') }}</a></li>
                        <li><a :href="route('collect')">{{ $t('Collect Ticket') }}</a></li>
                    </ul>
                </nav>
                <nav class="site-footer__col" aria-labelledby="footer-explore">
                    <h2 id="footer-explore">{{ $t('Explore') }}</h2>
                    <ul>
                        <li><a :href="route('seo.destinations')">{{ $t('Bus destinations from KLIA2') }}</a></li>
                        <li><a :href="route('seo.lalaport.destinations')">{{ $t('Bus destinations from Lalaport') }}</a></li>
                        <li><a :href="route('seo.taxi.locations')">{{ $t('Taxi locations') }}</a></li>
                        <li><a :href="route('seo.guide.klia2.index')">{{ $t('Travel guides') }}</a></li>
                    </ul>
                </nav>
                <nav class="site-footer__col" aria-labelledby="footer-company">
                    <h2 id="footer-company">{{ $t('Company') }}</h2>
                    <ul>
                        <li><a :href="route('contact-us')">{{ $t('Contact') }}</a></li>
                        <li><a :href="route('terms')">{{ $t('Terms') }}</a></li>
                        <li><a :href="route('privacy')">{{ $t('Privacy') }}</a></li>
                    </ul>
                </nav>
                <nav class="site-footer__col" aria-labelledby="footer-language">
                    <h2 id="footer-language">{{ $t('Language') }}</h2>
                    <ul>
                        <li v-for="(name, code) in languages" :key="code"><a :href="`/language/${code}`" :lang="code" :aria-current="locale === code ? 'true' : undefined">{{ name }}</a></li>
                    </ul>
                </nav>
            </div>
            <div class="site-footer__legal">
                <p>&copy; {{ year }} Asia Success Resources Sdn Bhd (803432-K)</p>
            </div>
        </div>
    </footer>
</template>
