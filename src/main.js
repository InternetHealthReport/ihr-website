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

require('semantic-ui-css/semantic.css')
require('semantic-ui-css/semantic.js')

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
