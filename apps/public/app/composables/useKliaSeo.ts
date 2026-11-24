/**
 * klia-bus @section('title'), ('meta_description'), ('canonical'), ('og_title'), ('og_description') and the JSON-LD
 * schemas (frontend.seo.partials.schema). Defaults are klia-bus's layout.blade.php.
 */
export function useKliaSeo(opts: { title?: string; description?: string; canonical?: string; ogTitle?: string; ogDescription?: string; schemas?: object[] }) {
    const url = useRequestURL()
    const title = opts.title ?? 'ttklia - Official KLIA2 Transport Hub'
    const description = opts.description ?? 'Book express bus tickets, private taxi transfers and car charters from KLIA2 and Lalaport BBCC online.'
    useHead({
        title,
        meta: [
            { name: 'description', content: description },
            { property: 'og:title', content: opts.ogTitle ?? title },
            { property: 'og:description', content: opts.ogDescription ?? description },
            { property: 'og:url', content: opts.canonical ?? `${url.origin}${url.pathname}` },
            { name: 'twitter:title', content: opts.ogTitle ?? title },
            { name: 'twitter:description', content: opts.ogDescription ?? description },
        ],
        link: opts.canonical ? [{ rel: 'canonical', href: opts.canonical, key: 'canonical' }] : [],
        script: (opts.schemas ?? []).map((s) => ({ type: 'application/ld+json', innerHTML: JSON.stringify(s) })),
    })
}

/** App\Support\SeoSchema::faq */
export function faqSchema(faqs: { q: string; a: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    }
}
