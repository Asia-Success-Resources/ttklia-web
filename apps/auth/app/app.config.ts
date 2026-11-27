// The single login has no menu: it shows only the sign-in form and the list of the user's workspaces.
export default defineAppConfig({
    ops: {
        app: 'auth',
        title: 'Sign in',
        badgeIcon: 'i-bx-lock-alt',
        locationInPath: false,
        menu: [],
    },
})
