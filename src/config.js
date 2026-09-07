let config = null

const validateConfig = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('config.json must contain a JSON object')
  }

  const requiredStrings = ['DEFAULT_LOCALE', 'FALLBACK_LOCALE', 'BASE_URL']
  for (const key of requiredStrings) {
    if (typeof value[key] !== 'string' || value[key].length === 0) {
      throw new Error(`config.json property ${key} must be a non-empty string`)
    }
  }

  if (
    !Array.isArray(value.SUPPORTED_LOCALES) ||
    value.SUPPORTED_LOCALES.length === 0 ||
    value.SUPPORTED_LOCALES.some((locale) => typeof locale !== 'string' || locale.length === 0)
  ) {
    throw new Error('config.json property SUPPORTED_LOCALES must be a non-empty array of strings')
  }

  if (
    value.CARTO_BASEMAPS_API_KEY !== undefined &&
    typeof value.CARTO_BASEMAPS_API_KEY !== 'string'
  ) {
    throw new Error('config.json property CARTO_BASEMAPS_API_KEY must be a string')
  }

  return Object.freeze({
    ...value,
    CARTO_BASEMAPS_API_KEY: value.CARTO_BASEMAPS_API_KEY ?? ''
  })
}

export async function loadConfig() {
  let response
  try {
    response = await fetch('/config.json', { cache: 'no-store' })
  } catch (error) {
    throw new Error('Unable to request /config.json', { cause: error })
  }

  if (!response.ok) {
    throw new Error(`Unable to load /config.json (HTTP ${response.status})`)
  }

  let value
  try {
    value = await response.json()
  } catch (error) {
    throw new Error('/config.json is not valid JSON', { cause: error })
  }

  config = validateConfig(value)
  return config
}

export function getConfig() {
  if (!config) {
    throw new Error('Runtime configuration has not been loaded')
  }

  return config
}
