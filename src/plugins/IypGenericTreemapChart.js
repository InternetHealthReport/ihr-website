import * as ipAddress from 'ip-address'
import Tr from '@/i18n/translation'
import { isoCountries } from '@/plugins/countryName'

const Address4 = ipAddress.Address4
const Address6 = ipAddress.Address6

function isLeafNode(nodeLabel, data) {
  for (let i=0; i<data.labels.length; i++) {
    if (data.parents[i].includes(nodeLabel)) {
      return false
    }
  }
  return true
}

export default function treemapClicked(event) {
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
      if (prefixMatch && isLeafNode(network, event.points[0].data)) {
        const [host, prefixLength] = network.split('/')
        if (prefixLength) {
          event.router.push(Tr.i18nRoute({
            name: 'prefix',
            params: { ip: host, length: prefixLength },
          }))
        }
      } else if (network.split(' ')[0] in isoCountries && isLeafNode(network.split(' ')[0], event.points[0].data)) {
        event.router.push(Tr.i18nRoute({
          name: 'country',
          params: { cc: network.split(' ')[0] },
        }))
      } else if (domainMatch && isLeafNode(network, event.points[0].data)) {
        event.router.push(Tr.i18nRoute({
          name: 'hostname',
          params: { hostname: network },
        }))
      } else if (Number(network.replace('AS', '')) && isLeafNode(network, event.points[0].data)) {
        event.router.push(Tr.i18nRoute({
          name: 'network',
          params: { id: network },
        }))
      }
    } else if (typeof network === 'object') {
      if ('low' in network && isLeafNode(network.low, event.points[0].data)) {
        const asId = `AS${network.low}`
        event.router.push(Tr.i18nRoute({
          name: 'network',
          params: { id: asId },
        }))
      }
    } else if (typeof network === 'number' && isLeafNode(network, event.points[0].data)) {
      const asId = `AS${network}`
      event.router.push(Tr.i18nRoute({
        name: 'network',
        params: { id: asId },
      }))
    }
  }
}