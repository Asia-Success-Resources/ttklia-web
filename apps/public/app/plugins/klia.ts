/**
 * The klia-bus public site's runtime (its resources/js/web/app.js and bootstrap.js), for the ttklia.com pages copied
 * from klia-bus: translations through laravel-vue-i18n with the same en/ms/zh files (`$t`, `trans`), and on the
 * client the globals the copied components use (jQuery, Bootstrap's JS for dropdowns, SweetAlert2 with the site's
 * tt-swal look, moment, axios), plus the date picker, multiselect and wheel components.
 */
import { i18nVue } from 'laravel-vue-i18n'
import { defineAsyncComponent } from 'vue'

const langs = import.meta.glob('../assets/klia/lang/*.json', { eager: true, import: 'default' }) as Record<string, Record<string, string>>

/** klia-bus Localize middleware: the `locale` cookie wins, else the browser's Accept-Language, else English. */
const LOCALES = ['en', 'ms', 'zh', 'th']
function preferred(header: string | undefined): string {
    for (const part of (header ?? '').split(',')) {
        const code = part.split(';')[0]!.trim().toLowerCase().split('-')[0]!
        if (LOCALES.includes(code)) return code
    }
    return 'en'
}

export default defineNuxtPlugin(async (nuxtApp) => {
    const cookie = useCookie<string | null>('locale')
    const locale = useState('klia-locale', () =>
        cookie.value && LOCALES.includes(cookie.value) ? cookie.value : preferred(import.meta.server ? useRequestHeaders(['accept-language'])['accept-language'] : navigator.language))
    nuxtApp.vueApp.use(i18nVue, {
        lang: locale.value,
        resolve: (lang: string) => langs[`../assets/klia/lang/${lang}.json`] ?? {},
    })
    nuxtApp.vueApp.component('VueDatePicker', defineAsyncComponent(() => import('@vuepic/vue-datepicker')))
    nuxtApp.vueApp.component('multi-select', defineAsyncComponent(() => import('vue-multiselect')))
    nuxtApp.vueApp.component('roulette', defineAsyncComponent(() => import('vue3-roulette').then((m) => m.Roulette)))

    if (import.meta.server) return
    const w = window as unknown as Record<string, unknown>
    const [{ default: $ }, bootstrap, { default: BaseSwal }, { default: moment }, { default: axios }, { default: _ }] = await Promise.all([
        import('jquery'), import('bootstrap'), import('sweetalert2'), import('moment'), import('axios'), import('lodash'),
    ])
    w.jQuery = w.$ = $
    w.bootstrap = bootstrap
    w.moment = moment
    w._ = _
    axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
    // TODO(api): the copied components call klia-bus's Laravel routes (/bookings, /trips/{id}, /otp/send, …); they are
    // wired to ttklia-api one flow at a time.
    w.axios = axios
    // Every popup shares one look: tt-swal classes are styled in frontend/_dialog.scss (klia-bus app.js).
    w.Swal = BaseSwal.mixin({
        buttonsStyling: false,
        reverseButtons: true,
        customClass: {
            popup: 'tt-swal', title: 'tt-swal__title', htmlContainer: 'tt-swal__text', actions: 'tt-swal__actions',
            confirmButton: 'btn btn-primary', denyButton: 'btn btn-outline-dark', cancelButton: 'btn btn-outline-dark', input: 'form-control',
        },
        showClass: { popup: 'swal2-show', backdrop: 'swal2-backdrop-show' },
        hideClass: { popup: 'swal2-hide', backdrop: 'swal2-backdrop-hide' },
    })
})
