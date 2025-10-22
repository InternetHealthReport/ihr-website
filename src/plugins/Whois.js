import axios from 'axios'
import cache from './cache.js'
import { get } from 'idb-keyval'
import { runIyp } from './IypApi.js'

const IANA_ASN_BOOTSTRAP = 'https://data.iana.org/rdap/asn.json'
const RDAP_ORG_PROXY = 'https://rdap.org'
const RDAP_DOMAIN_SERVER = 'https://rdap.verisign.com/com/v1/domain'

/// Default timeout before api call are considered failed
const DEFAULT_TIMEOUT = 180000

const Whois = {
  install: (app, options) => {
    const loadAsnBootstrap = async () => {
      const storageAllowed = JSON.parse(await get('storage-allowed'))
      const response = await cache(
        IANA_ASN_BOOTSTRAP,
        () => {
          return axios.get(IANA_ASN_BOOTSTRAP, { timeout: DEFAULT_TIMEOUT })
        },
        { storageAllowed: storageAllowed ? storageAllowed : false }
      )
      return response
    }

    const findRdapServersForAsn = async (asn) => {
      const asnBootstrap = (await loadAsnBootstrap())?.data
      let best = []
      for (const record of asnBootstrap.services) {
        const [asnRanges, baseUrls] = record
        for (const range of asnRanges) {
          const [firstAS, lastAS] = range.split('-')
          if (Number(firstAS) <= asn && asn <= Number(lastAS)) {
            return baseUrls
          }
        }
      }
      return null
    }

    const wrapText = (labelIndent, text) => {
      const maxWidth = 100
      if (!text) return ''
      const urlRegex = /(https?:\/\/\S+)/g
      // Split the text into chunks but preserve URLs intact
      const parts = []
      let lastIndex = 0
      let match
      while ((match = urlRegex.exec(text)) !== null) {
        if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
        parts.push(match[0])
        lastIndex = urlRegex.lastIndex
      }
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex))
      }

      // Wrap each non-URL part
      const indent = ' '.repeat(labelIndent + 2)
      let lines = []
      for (const part of parts) {
        if (part.match(/^https?:\/\//)) {
          // URLs never wrap
          if (lines.length && lines[lines.length - 1].length + part.length + 1 < maxWidth) {
            lines[lines.length - 1] += ' ' + part
          } else {
            lines.push(part)
          }
        } else {
          // Normal text wrapping
          const words = part.split(/\s+/)
          let current = ''
          for (const w of words) {
            if (!w) {
              continue
            }
            if ((current + ' ' + w).trim().length > maxWidth - labelIndent) {
              lines.push(current.trim())
              current = w
            } else {
              current += ' ' + w
            }
          }
          if (current.trim()) {
            lines.push(current.trim())
          }
        }
      }

      // Apply indentation
      return lines.map((l, i) => (i === 0 ? l : indent + l)).join('\n')
    }

    const addToArray = (array, label, value) => {
      const labelPad = 40
      if (value === undefined || value === null || value === '') {
        return array
      }
      const prefix = `${label.padEnd(labelPad)}: `
      const wrapped = wrapText(labelPad, String(value))
      const lines = wrapped.split('\n')
      array.push(prefix + lines[0])
      for (let i = 1; i < lines.length; i++) {
        array.push(lines[i])
      }
      return array
    }

    const addSection = (array, title) => {
      if (array.length && array[array.length - 1] !== '') {
        array.push('')
      }
      array.push(`# ${title}`)
      return array
    }

    const formatAsn = (rdapObj) => {
      let out = []
      out = addToArray(out, 'ASNumber', rdapObj.handle?.replace(/^AS/i, 'AS'))
      out = addToArray(out, 'ASName', rdapObj.name)
      out = addToArray(out, 'Country', rdapObj.country)
      out = addToArray(out, 'Status', rdapObj.status?.join(', '))
      out = addToArray(out, 'Source', rdapObj.port43)

      if (rdapObj.events?.length) {
        out = addSection(out, 'Events')
        rdapObj.events?.forEach((ev) => {
          if (ev.eventAction === 'registration') {
            out = addToArray(out, 'RegDate', ev.eventDate)
          }
          if (ev.eventAction === 'last changed') {
            out = addToArray(out, 'Updated', ev.eventDate)
          }
        })
      }

      const org = rdapObj.entities?.find((e) =>
        e.roles?.some((r) => r === 'registrant' || r === 'organization')
      )
      if (org) {
        out = addSection(out, 'Organization')
        const vcard = org.vcardArray?.[1] || []
        const getField = (k) => vcard.find((f) => f[0] === k)?.[3]
        out = addToArray(out, 'OrgName', getField('fn'))
        out = addToArray(out, 'OrgId', org.handle)
        const adr = vcard.find((f) => f[0] === 'adr')?.[3] || []
        if (Array.isArray(adr)) {
          adr.forEach((line, i) => (out = addToArray(out, i === 0 ? 'Address' : '', line)))
        }
        out = addToArray(out, 'Country', getField('country'))
      }

      if (rdapObj.entities?.length) {
        out = addSection(out, 'Entities')
        rdapObj.entities.forEach((e) => {
          const roles = e.roles?.join(', ')
          out = addToArray(out, 'Handle', e.handle)
          out = addToArray(out, 'Roles', roles)
          const vcard = e.vcardArray?.[1] || []
          vcard.forEach((f) => {
            const [k, , , v] = f
            if (k === 'fn') {
              out = addToArray(out, 'Name', v)
            }
            if (k === 'email') {
              out = addToArray(out, 'Email', v)
            }
            if (k === 'tel') {
              out = addToArray(out, 'Phone', v)
            }
            if (k === 'adr' && f[1]?.label) {
              out = addToArray(out, 'Address', f[1].label.replace(/\n/g, ', '))
            }
          })
          if (e.links) {
            e.links.forEach((l) => (out = addToArray(out, 'Link', l.href)))
          }
          out.push('')
        })
      }

      if (rdapObj.remarks?.length) {
        out = addSection(out, 'Remarks')
        rdapObj.remarks.forEach((r) => {
          out = addToArray(out, r.title || 'Remark', r.description?.join(' '))
        })
      }

      if (rdapObj.notices?.length) {
        out = addSection(out, 'Notices')
        rdapObj.notices.forEach((n) => {
          if (n.description) {
            let linksArray = []
            if (n.links) {
              linksArray = n.links.map((l) => l.href)
            }
            out = addToArray(out, n.title, n.description.concat(linksArray).join(' '))
          }
        })
      }

      return out.join('\n')
    }

    const formatPrefix = (rdapObj) => {
      let out = []
      out = addToArray(
        out,
        'NetRange',
        rdapObj.startAddress && rdapObj.endAddress
          ? `${rdapObj.startAddress} - ${rdapObj.endAddress}`
          : rdapObj.startAddress || ''
      )
      const cidr = rdapObj.cidr0_cidrs?.map((c) => `${c.v4prefix || c.v6prefix}/${c.length}`)
      out = addToArray(out, 'CIDR', cidr?.join(', '))
      out = addToArray(out, 'NetName', rdapObj.name)
      out = addToArray(out, 'NetHandle', rdapObj.handle)
      out = addToArray(out, 'Country', rdapObj.country)
      out = addToArray(out, 'Status', rdapObj.status?.join(', '))
      out = addToArray(out, 'Source', rdapObj.port43)

      if (rdapObj.entities?.length) {
        out = addSection(out, 'Entities')
        rdapObj.entities.forEach((e) => {
          out = addToArray(out, 'Handle', e.handle)
          out = addToArray(out, 'Roles', e.roles?.join(', '))
          const vcard = e.vcardArray?.[1] || []
          vcard.forEach((f) => {
            const [k, , , v] = f
            if (k === 'fn') {
              out = addToArray(out, 'Name', v)
            }
            if (k === 'email') {
              out = addToArray(out, 'Email', v)
            }
            if (k === 'tel') {
              out = addToArray(out, 'Phone', v)
            }
            if (k === 'adr' && f[1]?.label) {
              out = addToArray(out, 'Address', f[1].label.replace(/\n/g, ', '))
            }
          })
          if (e.links) {
            e.links.forEach((l) => (out = addToArray(out, 'Link', l.href)))
          }
          out.push('')
        })
      }

      if (rdapObj.remarks?.length) {
        out = addSection(out, 'Remarks')
        rdapObj.remarks.forEach(
          (r) => (out = addToArray(out, r.title || 'Remark', r.description?.join(' ')))
        )
      }

      if (rdapObj.notices?.length) {
        out = addSection(out, 'Notices')
        rdapObj.notices.forEach((n) => {
          if (n.description) {
            let linksArray = []
            if (n.links) {
              linksArray = n.links.map((l) => l.href)
            }
            out = addToArray(out, n.title, n.description.concat(linksArray).join(' '))
          }
        })
      }

      rdapObj.events?.forEach((e) => (out = addToArray(out, e.eventAction, e.eventDate)))

      return out.join('\n')
    }

    const formatDomain = (rdapObj) => {
      let out = []
      out = addToArray(out, 'Domain Name', rdapObj.ldhName)
      const registrar = rdapObj.entities?.find((e) => e.roles?.includes('registrar'))
      if (registrar) {
        const fn = registrar.vcardArray?.[1]?.find((f) => f[0] === 'fn')?.[3] || ''
        const id = registrar.publicIds?.[0]?.identifier || ''
        out = addToArray(out, 'Registrar', fn)
        out = addToArray(out, 'Registrar IANA ID', id)
      }

      out = addToArray(out, 
        'Domain Status',
        rdapObj.status?.map((s) => s.toUpperCase().replaceAll('_', ' '))
      )

      const created = rdapObj.events?.find((e) => e.eventAction === 'registration')?.eventDate
      const updated = rdapObj.events?.find((e) => e.eventAction === 'last changed')?.eventDate
      const exp = rdapObj.events?.find((e) => e.eventAction === 'expiration')?.eventDate

      out = addToArray(out, 'RegDate', created)
      out = addToArray(out, 'Updated', updated)
      out = addToArray(out, 'RegDate Expiry', exp)

      if (rdapObj.nameservers?.length)
        out = addToArray(out, 'Name Server', rdapObj.nameservers.map((n) => n.ldhName).join(', '))

      const abuse = registrar?.entities?.find((e) => e.roles?.includes('abuse'))
      if (abuse) {
        const vcard = abuse.vcardArray?.[1] || []
        const tel = vcard.find((f) => f[0] === 'tel')?.[3]?.replace('tel:', '')
        const email = vcard.find((f) => f[0] === 'email')?.[3]
        out = addToArray(out, 'Abuse Contact Email', email)
        out = addToArray(out, 'Abuse Contact Phone', tel)
      }

      out = addToArray(out, 'DNSSEC', rdapObj.secureDNS?.delegationSigned ? 'signedDelegation' : 'unsigned')

      if (rdapObj.notices?.length) {
        out = addSection(out, 'Notices')
        rdapObj.notices.forEach((n) => {
          if (n.description) {
            let linksArray = []
            if (n.links) {
              linksArray = n.links.map((l) => l.href)
            }
            out = addToArray(out, n.title, n.description.concat(linksArray).join(' '))
          }
        })
      }

      if (rdapObj.links?.length) {
        out = addSection(out, 'Source')
        rdapObj.links.forEach((l) => out = addToArray(out, 'Link', l.href))
      }

      return out.join('\n')
    }

    const asn = async (asn) => {
      const storageAllowed = JSON.parse(await get('storage-allowed'))
      const baseUrls = await findRdapServersForAsn(asn)
      let response = null
      if (baseUrls?.length) {
        for (const base of baseUrls) {
          const url = base.replace(/\/+$/, '') + `/autnum/${asn}`
          response = await cache(
            url,
            () => {
              return axios.get(url, { timeout: DEFAULT_TIMEOUT })
            },
            { storageAllowed: storageAllowed ? storageAllowed : false }
          )
          if (response) {
            break
          }
        }
      }
      if (!response) {
        const url = RDAP_ORG_PROXY + `/autnum/${asn}`
        response = await cache(
          url,
          () => {
            return axios.get(url, { timeout: DEFAULT_TIMEOUT })
          },
          { storageAllowed: storageAllowed ? storageAllowed : false }
        )
      }
      return response
    }

    const prefix = async (prefix) => {
      const storageAllowed = JSON.parse(await get('storage-allowed'))
      const iyp_query = `MATCH (p:BGPPrefix {prefix: $prefix})<-[o:ORIGINATE]-(a:AS)
      	RETURN DISTINCT a.asn AS asn`
      const asnList = (await runIyp([{ statement: iyp_query, parameters: { prefix: prefix } }]))[0]
      let response = null
      if (asnList?.length) {
        for (const asn of asnList) {
          const baseUrls = await findRdapServersForAsn(asn.asn)
          if (baseUrls?.length) {
            for (const base of baseUrls) {
              const url = base.replace(/\/+$/, '') + `/ip/${prefix}`
              response = await cache(
                url,
                () => {
                  return axios.get(url, { timeout: DEFAULT_TIMEOUT })
                },
                { storageAllowed: storageAllowed ? storageAllowed : false }
              )
              if (response) {
                break
              }
            }
          }
          if (response) {
            break
          }
        }
      }
      if (!response) {
        const url = RDAP_ORG_PROXY + `/ip/${prefix}`
        response = await cache(
          url,
          () => {
            return axios.get(url, { timeout: DEFAULT_TIMEOUT })
          },
          { storageAllowed: storageAllowed ? storageAllowed : false }
        )
      }
      return response
    }

    const domain = async (hostname) => {
      const storageAllowed = JSON.parse(await get('storage-allowed'))
      const url = RDAP_DOMAIN_SERVER + `/${hostname.toUpperCase()}`
      let response = await cache(
        url,
        () => {
          return axios.get(url, { timeout: DEFAULT_TIMEOUT })
        },
        { storageAllowed: storageAllowed ? storageAllowed : false }
      )
      return response
    }

    const whois = {
      asn,
      prefix,
      domain,
      formatAsn,
      formatPrefix,
      formatDomain
    }
    app.provide('whois', whois)
  }
}

export { Whois }
