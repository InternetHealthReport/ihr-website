import ASDependency from './ASDependency.vue'

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
    }
]
