import Vue from 'vue'
import VueResource from 'vue-resource'
import VueRouter from 'vue-router'
import Routes from './routes'
import NetworkReport from './NetworkReport.vue'
import GlobalReport from './GlobalReport.vue'
import DetailLink from './DetailLink.vue'
import DetailForwarding from './DetailForwarding.vue'
import DetailDependentNetwork from './DetailDependentNetwork.vue'

window.$ = window.jQuery = require('jquery')

import './static/ihr/css/main.css'
import 'semantic-ui-less/semantic.less'
//require('semantic-ui-css/semantic.css')
//require('semantic-ui-css/semantic.js')

Vue.use(VueResource);
Vue.use(VueRouter)
//Vuetable requires detail rows to be globally registered
Vue.component("detail-link", DetailLink)
Vue.component("detail-forwarding", DetailForwarding)
Vue.component("detail-dependent-network", DetailDependentNetwork)

const router = new VueRouter({
    routes: Routes,
    mode: 'history'
});
new Vue({
    el: '#ihr-chart',
    router: router,
})


