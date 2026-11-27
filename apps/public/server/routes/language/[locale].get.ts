/**
 * klia-bus `GET /language/{locale}`: remembers the visitor's language for a year and goes back to the page they were on.
 * TODO(api): also save it on the signed-in customer (users.locale) once the public site signs in through ttklia-api.
 */
const LOCALES = ['en', 'ms', 'zh', 'th']

export default defineEventHandler((event) => {
    const locale = getRouterParam(event, 'locale') ?? ''
    if (!LOCALES.includes(locale)) throw createError({ statusCode: 400 })
    setCookie(event, 'locale', locale, { maxAge: 60 * 60 * 24 * 365, path: '/', sameSite: 'lax' })
    // Back to the same site only.
    const back = getRequestHeader(event, 'referer')
    const host = getRequestHost(event)
    let to = '/'
    try {
        const url = back ? new URL(back) : null
        if (url && url.host === host) to = url.pathname + url.search + url.hash
    } catch { /* keep / */ }
    return sendRedirect(event, to, 302)
})
