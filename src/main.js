import './styles/main.css'

import { createApp } from 'vue'
import { Quasar, Notify } from 'quasar'
import '@quasar/extras/roboto-font/roboto-font.css'
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/fontawesome-v6/fontawesome-v6.css'
import 'quasar/dist/quasar.css'
import { IhrApi } from '@/plugins/IhrApi'
import { LibraryDelayer } from '@/plugins/LibraryDelayer'
import { IypApi } from '@/plugins/IypApi'
import { AtlasApi } from '@/plugins/RipeAtlasApi'
import { RipeApi } from '@/plugins/RipeApi'
import { RpkiApi } from './plugins/RpkiApi'
import { GithubApi } from './plugins/GithubApi'
import VNetworkGraph from 'v-network-graph'
import 'v-network-graph/lib/style.css'
import { Whois } from '@/plugins/Whois'
import { SubmarineCableMapApi } from '@/plugins/SubmarineCableMapApi'
import { loadConfig } from './config'

const bootstrap = async () => {
  try {
    await loadConfig()

    // These modules may read runtime configuration while they are evaluated.
    // Import them only after /config.json has been loaded and validated.
    const [{ default: App }, { default: router }, { default: i18n }] = await Promise.all([
      import('./App.vue'),
      import('./router'),
      import('./i18n')
    ])

    const app = createApp(App)

    app.use(router)
    app.use(Quasar, {
      plugins: {
        Notify
      },
      config: {
        brand: {
          primary: '#263238',
          secondary: '#1976d2',
          accent: '#405057',
          positive: '#21ba45',
          negative: '#c10015',
          info: '#4f5b62',
          warning: '#ffee58'
        }
      }
    })
    app.use(i18n)
    app.use(IhrApi)
    app.use(LibraryDelayer, {
      libraries: {
        bgplay_api:
          'https://cdn.jsdelivr.net/gh/InternetHealthReport/bgplay/widget/bgplayjs-main-widget.js',
        ripe_widget_api: 'https://stat.ripe.net/widget-api/widget_api.js',
        latencymon_widget: [
          'https://www-static.ripe.net/static/rnd-ui/atlas/static/measurements/widgets/latencymon/dev/libs/require.min.js',
          'https://atlas.ripe.net/resource/latencymon/latencymon-widget-main.js'
        ],
        tracemon_widget: [
          'https://www-static.ripe.net/static/rnd-ui/atlas/static/measurements/widgets/tracemon/dev/libs/require.min.js',
          // 'https://atlas.ripe.net/resource/tracemon/tracemon-widget-main.js',
          'https://www-static.ripe.net/static/rnd-ui/atlas/static/measurements/widgets/tracemon/tracemon-widget-main.js'
        ]
      }
    })
    app.use(IypApi)
    app.use(AtlasApi)
    app.use(RipeApi)
    app.use(RpkiApi)
    app.use(GithubApi)
    app.use(VNetworkGraph)
    app.use(Whois)
    app.use(SubmarineCableMapApi)

    app.mount('#app')
  } catch (error) {
    console.error('Failed to initialize IHR website:', error)
    const message = document.createElement('p')
    message.setAttribute('role', 'alert')
    message.textContent = 'The website could not start because its configuration is unavailable.'
    document.querySelector('#app')?.replaceChildren(message)
  }
}

void bootstrap()
