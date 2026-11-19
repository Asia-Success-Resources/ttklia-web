import type Echo from 'laravel-echo'

/**
 * Reverb over the Pusher protocol (doc 09, doc 10). Host from runtimeConfig (NUXT_PUBLIC_REVERB_HOST);
 * the public app key from `/bootstrap`. Connects on first use, client side only.
 */
export function useRealtime() {
  const echo = useState<Echo<'reverb'> | null>('ttklia-echo', () => null)

  async function connect(): Promise<Echo<'reverb'> | null> {
    if (import.meta.server) return null
    if (echo.value) return echo.value
    const config = useRuntimeConfig().public
    const { bootstrap } = useBootstrap()
    const key = bootstrap.value?.reverb_key
    if (!config.reverbHost || !key) return null
    const [{ default: EchoClass }, { default: Pusher }] = await Promise.all([import('laravel-echo'), import('pusher-js')])
    ;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher
    echo.value = new EchoClass({
      broadcaster: 'reverb',
      key,
      wsHost: config.reverbHost,
      wssPort: 443,
      forceTLS: true,
      enabledTransports: ['ws', 'wss'],
    }) as Echo<'reverb'>
    return echo.value
  }

  return { echo, connect }
}
