<script setup lang="ts">
// klia-bus frontend/seo/partials/faq.blade.php.
defineProps<{ faqs: { q: string; a: string }[] }>()
</script>

<template>
    <section class="content-card faq" aria-labelledby="faq-title">
        <h2 id="faq-title">{{ $t('Frequently asked questions') }}</h2>
        <div id="faqAccordion" class="accordion accordion-flush">
            <div v-for="(faq, i) in faqs" :key="i" class="accordion-item">
                <h3 class="accordion-header">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                            :data-bs-target="`#faq${i + 1}`" aria-expanded="false" :aria-controls="`faq${i + 1}`">
                        {{ faq.q }}
                    </button>
                </h3>
                <div :id="`faq${i + 1}`" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div class="accordion-body">{{ faq.a }}</div>
                </div>
            </div>
        </div>
    </section>
</template>
