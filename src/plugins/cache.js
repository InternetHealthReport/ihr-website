import { get, set, del, clear } from 'idb-keyval'

const cache = async (key, fetcher, options) => {
  if (!options) {
    options = defaultOptions
  } else {
    options = Object.assign(defaultOptions, options)
  }
  let item = await getItem(key)
  if (item) {
    item = JSON.parse(item).data
  } else {
    try {
      item = await fetcher()
      const sessionObj = {
        ...options,
        data: item
      }
      if (options.storageAllowed) {
        await set(key, JSON.stringify(sessionObj))
      }
    } catch (error) {
      if (
        error instanceof DOMException &&
        (error.code === 22 ||
          error.code === 1014 ||
          error.name === 'QuotaExceededError' ||
          error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
      ) {
        const storageAllowed = await get('storage-allowed')
        const userLocale = await get('user-locale')
        await clear()
        if (storageAllowed) {
          await set('storage-allowed', storageAllowed)
        }
        if (userLocale) {
          await set('user-locale', userLocale)
        }
      }
    }
  }
  return item
}

const getItem = async (key) => {
  let item = await get(key)
  if (item) {
    if (JSON.parse(item).expiresAt < new Date().getTime()) {
      await del(key)
      item = null
    }
  }
  return item
}

const setDefaultExpireDate = () => {
  const expireAt = new Date()
  return new Date(
    expireAt.getFullYear(),
    expireAt.getMonth(),
    expireAt.getDate(),
    23,
    59,
    59
  ).getTime()
}

const defaultOptions = {
  expiresAt: setDefaultExpireDate(),
  storageAllowed: true
}

export default cache
