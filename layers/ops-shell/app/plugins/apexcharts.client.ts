import VueApexCharts from 'vue3-apexcharts'

// Charts on dashboards, as today's admin (doc 09, "Dashboard").
export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(VueApexCharts)
})
