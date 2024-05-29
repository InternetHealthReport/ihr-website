import axios from 'axios';

// Base URL for RIPE Atlas API
const RIPE_ATLAS_API_BASE = 'https://atlas.ripe.net/api/v2/';
// Default timeout before api calls are considered failed
const DEFAULT_TIMEOUT = 180000;

const AtlasApi = {
	install: (app, options) => {
		const axios_base = axios.create({
			baseURL: RIPE_ATLAS_API_BASE,
			timeout: DEFAULT_TIMEOUT,
		});

		const getMeasurementById = async (measurementId) => {
			let response = await axios_base.get(`measurements/${measurementId}`);
			return response.data;
		};

		const getMeasurementDataById = async (measurementId) => {
			let response = await axios_base.get(`measurements/${measurementId}/results`);
			return response.data;
		};

		const getProbeById = async (probeId) => {
			let response = await axios_base.get(`probes/${probeId}`);
			return response.data;
		};

		const atlas_api = {
			getMeasurementById,
			getMeasurementDataById,
			getProbeById
		};

		app.provide('atlas_api', atlas_api);
	}
};

export {
	AtlasApi
};
