import ASDependency from './ASDependency.vue'
import GlobalReport from './GlobalReport.vue'

export default [
    {
        name: 'asn',
        path:'/:asn/asn/',
        component: ASDependency,
    },
    {
        name: 'country',
        path:'/:cc/country/',
        component: ASDependency,
    },
    {
        name: 'index',
        path:'/',
        component: GlobalReport,
    }
]
