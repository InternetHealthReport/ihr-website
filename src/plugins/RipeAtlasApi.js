import axios from 'axios';

// Base URL for RIPE Atlas API
const RIPE_ATLAS_API_BASE = 'https://atlas.ripe.net/api/v2/';
// Default timeout before API calls are considered failed
const DEFAULT_TIMEOUT = 180000;

// Utility function to get data with caching
const getCachedData = async (url, params) => {
	const axios_base = axios.create({
		baseURL: RIPE_ATLAS_API_BASE,
		timeout: DEFAULT_TIMEOUT,
	});

	const key = `${url}_${JSON.stringify(params)}`;
	const cachedData = localStorage.getItem(key);

	if (cachedData) {
		return JSON.parse(cachedData);
	}

	const response = await axios_base.get(url, { params });
	try {
		localStorage.setItem(key, JSON.stringify(response.data));
	} catch (error) {
		if (error instanceof DOMException && (
            error.code === 22 || 
            error.code === 1014 || 
            error.name === 'QuotaExceededError' || 
            error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
        )) {
			return { error: 'LOCAL_STORAGE_FULL' };
        }
	}
	return response.data;
};

const AtlasApi = {
	install: (app, options) => {
		const getMeasurementById = async (measurementId) => {
			const url = `measurements/${measurementId}`;
			return await getCachedData(url, {});
		};

		const getMeasurementData = async (measurementId, params = {}) => {
			const url = `measurements/${measurementId}/results`;
			return await getCachedData(url, params);
		};

		const getProbeById = async (probeId) => {
			const url = `probes/${probeId}`;
			return await getCachedData(url, {});
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
