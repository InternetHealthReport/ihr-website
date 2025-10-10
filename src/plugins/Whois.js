import axios from 'axios'
import cache from './cache.js'
import { get } from 'idb-keyval'

const IANA_ASN_BOOTSTRAP = "https://data.iana.org/rdap/asn.json";
const RDAP_ORG_PROXY = "https://rdap.org";

/// Default timeout before api call are considered failed
const DEFAULT_TIMEOUT = 180000

const Whois = {
  install: (app, options) => {

		const loadAsnBootstrap = async () => {
			const storageAllowed = JSON.parse(await get('storage-allowed'))
			const response = await cache(
				IANA_ASN_BOOTSTRAP,
				() => {return axios.get(IANA_ASN_BOOTSTRAP, {timeout: DEFAULT_TIMEOUT})},
				{storageAllowed: storageAllowed ? storageAllowed : false}
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

		const asn = async (asn) => {
			const storageAllowed = JSON.parse(await get('storage-allowed'))
			const baseUrls = await findRdapServersForAsn(asn)
			let response = null
			if (baseUrls?.length) {
				for (const base of baseUrls) {
					const url = base.replace(/\/+$/, "") + `/autnum/${asn}`
					response = await cache(
						url,
						() => {return axios.get(url, {timeout: DEFAULT_TIMEOUT})},
						{storageAllowed: storageAllowed ? storageAllowed : false}
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
					() => {return axios.get(url, {timeout: DEFAULT_TIMEOUT})},
					{storageAllowed: storageAllowed ? storageAllowed : false}
				)
			}
			return response
		}

    const whois = {
      asn
    }
    app.provide('whois', whois)
  }
}

export { Whois }