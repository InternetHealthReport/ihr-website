import Vue from 'vue'
import VueResource from 'vue-resource'
import VueRouter from 'vue-router'
import Routes from './routes'
import VueTables from 'vue-tables-2'
import ReactiveChart from './ReactiveChart.vue'
import ASDependency from './ASDependency.vue'
import GlobalReport from './GlobalReport.vue'
//import InternalDelayForwarding from './components/InternalDelayForwarding.vue'
//import DelayExplorer from './DelayExplorer.vue'

window.$ = window.jQuery = require('jquery')

import './static/ihr/css/main.css'

require('semantic-ui-css/semantic.css')
require('semantic-ui-css/semantic.js')

Vue.use(VueResource);
Vue.use(VueRouter)
Vue.use(VueTables.ClientTable);
Vue.component("reactive-chart", ReactiveChart)
Vue.component("as-dependency", ASDependency)
//Vue.component("in-delay-forwarding", ASDependency)
//Vue.component("delay-explorer", DelayExplorer)

const router = new VueRouter({
    routes: Routes,
    mode: 'history'
});
new Vue({
    el: '#ihr-chart',
    router: router,
})


$('.ui.search')
  .search({
    type          : 'category',
    minCharacters : 3,
    apiSettings   : {
      onResponse: function(apiResponse) {
        var
          response = {
            results : {}
          }
        ;
        // translate API response to work with search
        $.each(apiResponse.results, function(index, item) {
          var
            asn   = item.number,
            category = 'AS',
            maxResults = 8
          ;
          if(asn<0){
            category = 'IX';
            asn = -asn;
          }
          if(index >= maxResults) {
            return false;
          }
          // create new category
          if(response.results[category] === undefined) {
            response.results[category] = {
              name    : category,
              results : []
            };
          }
          // add result to category
          response.results[category].results.push({
            title       : item.name,
            description : category+asn,
            url         : '/ihr/'+item.number+'/asn/'
          });
        });
        return response;
      },
        url: 'https://ihr.iijlab.net/ihr/api/network/?search={query}&ordering=number',
    }
  })
;
