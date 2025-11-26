import './styles/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { Quasar, Notify } from 'quasar'
import '@quasar/extras/roboto-font/roboto-font.css'
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/fontawesome-v6/fontawesome-v6.css'
import 'quasar/dist/quasar.css'
import i18n from './i18n'
import { IhrApi } from '@/plugins/IhrApi'
import { LibraryDelayer } from '@/plugins/LibraryDelayer'
import { IypApi } from '@/plugins/IypApi'
import { AtlasApi } from '@/plugins/RipeAtlasApi'
import { RipeApi } from '@/plugins/RipeApi'
import { RpkiApi } from './plugins/RpkiApi'
import VNetworkGraph from 'v-network-graph'
import 'v-network-graph/lib/style.css'
import { Whois } from '@/plugins/Whois'

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
app.use(VNetworkGraph)
app.use(Whois)

app.mount('#app')
