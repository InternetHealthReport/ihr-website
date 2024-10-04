import Tr from '@/i18n/translation'

function isLeafNode(nodeLabel, data) {
  for (let i = 0; i < data.labels.length; i++) {
    if (data.parents[i].includes(nodeLabel)) {
      return false
    }
  }
  return true
}

export default function treemapClicked(event) {
  if (event.points && event.points.length) {
    const network = event.points[0].label
    if (
      typeof network === 'string' &&
      event.leafKey === 'nameserver' &&
      isLeafNode(network, event.points[0].data)
    ) {
    } else if (
      typeof network === 'number' &&
      event.leafKey === 'asn' &&
      isLeafNode(network, event.points[0].data)
    ) {
      const asId = `AS${network}`
      event.router.push(
        Tr.i18nRoute({
          name: 'network',
          params: { id: asId }
        })
      )
    } else if (
      typeof network === 'string' &&
      event.leafKey === 'ixpName' &&
      isLeafNode(network, event.points[0].data)
    ) {
    } else if (
      typeof network === 'string' &&
      event.leafKey === 'prefix' &&
      isLeafNode(network, event.points[0].data)
    ) {
      const [host, prefixLength] = network.split('/')
      if (prefixLength) {
        event.router.push(
          Tr.i18nRoute({
            name: 'prefix',
            params: { ip: host, length: prefixLength }
          })
        )
      }
    } else if (
      typeof network === 'string' &&
      (event.leafKey === 'hostname') & isLeafNode(network, event.points[0].data)
    ) {
      event.router.push(
        Tr.i18nRoute({
          name: 'hostname',
          params: { hostname: network }
        })
      )
    } else if (
      typeof network === 'number' &&
      event.leafKey === 'atlasId' &&
      isLeafNode(network, event.points[0].data)
    ) {
    } else if (
      typeof network === 'string' &&
      event.leafKey === 'rankName' &&
      isLeafNode(network, event.points[0].data)
    ) {
      event.router.push(
        Tr.i18nRoute({
          name: 'rank',
          params: { rank: network }
        })
      )
    } else if (
      typeof network === 'string' &&
      event.leafKey === 'asn' &&
      isLeafNode(network.split(' ')[0], event.points[0].data)
    ) {
      event.router.push(
        Tr.i18nRoute({
          name: 'network',
          params: { id: network }
        })
      )
    } else if (
      typeof network === 'string' &&
      event.leafKey === 'ip' &&
      isLeafNode(network, event.points[0].data)
    ) {
    } else if (
      typeof network === 'string' &&
      event.leafKey === 'country' &&
      isLeafNode(network, event.points[0].data)
    ) {
      event.router.push(
        Tr.i18nRoute({
          name: 'country',
          params: { cc: network }
        })
      )
    }
  }
}
