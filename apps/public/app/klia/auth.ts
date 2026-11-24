// Shared bits of the klia-bus sign-in, sign-up and password pages.
import countryList from './data/countries.json'

// klia-bus countries() (rinvex/countries): name, ISO code, calling code and flag, sorted by name.
export const COUNTRIES = countryList as { name: string; iso_3166_1_alpha2: string; calling_code: string; emoji: string }[]

// TODO(api): passenger sign-in, sign-up and password reset. ttklia-api has only phone OTP (/auth/otp/request,
// /auth/otp/verify) and the staff email login; klia-bus signs passengers in with email or phone plus a password.
// Until those endpoints exist the forms stop here instead of posting to a route that is not there.
export const notConnected = () => {
    const swal = (globalThis as { Swal?: { fire: (o: object) => unknown } }).Swal
    const text = 'Signing in to TTKLIA is not available on this site yet.'
    if (swal) swal.fire({ icon: 'info', title: 'Coming soon', text })
    else alert(text)
}
