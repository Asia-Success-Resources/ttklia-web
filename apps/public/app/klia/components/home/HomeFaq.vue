<script setup lang="ts">
// klia-bus frontend/home/faq.blade.php.
defineProps<{ faqs: { q: string; a: string }[] }>()
const { route } = useKlia()
</script>

<template>
    <section class="section home-faq" aria-labelledby="home-faq-title">
        <div class="container">
            <div class="home-faq__grid">
                <div>
                    <h2 id="home-faq-title" class="section-title">{{ $t('Good to know') }}</h2>
                    <p class="section-lead">{{ $t('Quick answers before you travel.') }}</p>
                    <a :href="route('contact-us')" class="text-link">{{ $t('More help') }} <XIcon name="arrow-right" class="icon icon-sm" /></a>
                </div>
                <div id="homeFaq" class="accordion faq">
                    <div v-for="(faq, i) in faqs" :key="i" class="accordion-item">
                        <h3 class="accordion-header">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                    :data-bs-target="`#home-faq-${i + 1}`" aria-expanded="false" :aria-controls="`home-faq-${i + 1}`">
                                {{ faq.q }}
                            </button>
                        </h3>
                        <div :id="`home-faq-${i + 1}`" class="accordion-collapse collapse" data-bs-parent="#homeFaq">
                            <div class="accordion-body">{{ faq.a }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
