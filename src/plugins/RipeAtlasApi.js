import axios from 'axios';
import cache from './cache.js'

// Base URL for RIPE Atlas API
const RIPE_ATLAS_API_BASE = 'https://atlas.ripe.net/api/v2/';
const DEFAULT_TIMEOUT = 180000

const axios_base = axios.create({
  baseURL: RIPE_ATLAS_API_BASE,
  timeout: DEFAULT_TIMEOUT,
})

const AtlasApi = {
	install: (app, options) => {
		const getMeasurementById = async (measurementId) => {
			const storageAllowed = JSON.parse(localStorage.getItem('storage-allowed'))
			const url = `measurements/${measurementId}`
			return await cache(`${url}`, () => {
					return axios_base.get(url)
				}, {
					storageAllowed: storageAllowed ? storageAllowed : false
				})
		};

		const getMeasurementData = async (measurementId, params = {}) => {
			const storageAllowed = JSON.parse(localStorage.getItem('storage-allowed'))
			const url = `measurements/${measurementId}/results`
			return await cache(`${url}_${JSON.stringify(params)}`, () => {
					return axios_base.get(url, {
						params
					})
				}, {
					storageAllowed: storageAllowed ? storageAllowed : false
				})
		};

		const getProbeById = async (probeId) => {
			const storageAllowed = JSON.parse(localStorage.getItem('storage-allowed'))
			const url = `probes/${probeId}`
			return await cache(`${url}`, () => {
					return axios_base.get(url)
				}, {
					storageAllowed: storageAllowed ? storageAllowed : false
				})
		};

		const atlas_api = {
			getMeasurementById,
			getMeasurementData,
			getProbeById
		};

		app.provide('atlas_api', atlas_api);
	}
};

export {
	AtlasApi
};
