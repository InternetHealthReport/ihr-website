import Vue from 'vue'
import VueResource from 'vue-resource'
import ReactiveChart from './ReactiveChart.vue'
import ASDependency from './ASDependency.vue'
import DelayExplorer from './DelayExplorer.vue'
window.$ = window.jQuery = require('jquery')

require('semantic-ui-css/semantic.css')
require('semantic-ui-css/semantic.js')

Vue.use(VueResource);
Vue.component("reactive-chart", ReactiveChart)
Vue.component("delay-explorer", DelayExplorer)
Vue.component("as-dependency", ASDependency)

new Vue({
    el: '#ihr-chart',
})
