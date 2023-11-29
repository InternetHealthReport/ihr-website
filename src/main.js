import './styles/main.sass'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { Quasar } from 'quasar'
import '@quasar/extras/roboto-font/roboto-font.css'
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/fontawesome-v6/fontawesome-v6.css'
import 'quasar/src/css/index.sass'
import i18n from './i18n'

const app = createApp(App)

app.use(router)
app.use(Quasar, {
    plugins: {},
})
app.use(i18n)

app.mount('#app')
