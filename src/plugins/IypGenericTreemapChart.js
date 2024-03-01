import * as ipAddress from 'ip-address'
import Tr from '@/i18n/translation'
import { isoCountries } from '@/plugins/countryName'

const Address4 = ipAddress.Address4
const Address6 = ipAddress.Address6

export default function treemapClicked(event) {
  // console.log(event)
  if (event.points && event.points.length) {
    const network = event.points[0].label
    if (typeof network === 'string') {
      let prefixMatch
      try {
        prefixMatch = (new Address4(network)).isCorrect()
      } catch (e) {
        prefixMatch = null
      }
      if (!prefixMatch) {
        try {
          prefixMatch = (new Address6(network)).isCorrect()
        } catch (e) {
          prefixMatch = null
        }
      }
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/
      const domainMatch = domainRegex.exec(network)
      if (prefixMatch) {
        const [host, prefixLength] = network.split('/')
        if (prefixLength) {
          event.router.push(Tr.i18nRoute({
            name: 'networks',
            params: { id: host, length: prefixLength },
          }))
        }
      } else if (network.split(' ')[0] in isoCountries) {
        event.router.push(Tr.i18nRoute({
          name: 'countries',
          params: { cc: network.split(' ')[0] },
        }))
      } else if (domainMatch) {
        event.router.push(Tr.i18nRoute({
          name: 'hostnames',
          params: { hostName: network },
        }))
      } else if (Number(network.replace('AS', ''))) {
        event.router.push(Tr.i18nRoute({
          name: 'networks',
          params: { id: network },
        }))
      }
    } else if (typeof network === 'object') {
      if ('low' in network) {
        const asId = `AS${network.low}`
        event.router.push(Tr.i18nRoute({
          name: 'networks',
          params: { id: asId },
        }))
      }
    }
  }
}