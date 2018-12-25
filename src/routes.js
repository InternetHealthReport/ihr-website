import GlobalReport from './GlobalReport.vue'
import NetworkReport from './NetworkReport.vue'

export default [
    {
        name: 'asn',
        path:'/:asn/asn/',
        component: NetworkReport,
    },
    {
        name: 'country',
        path:'/:cc/country/',
        component: NetworkReport,
    },
    {
        name: 'index',
        path:'/',
        component: GlobalReport,
    }
]
