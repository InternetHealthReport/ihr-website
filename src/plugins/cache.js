import { get, set, del, clear, keys, getMany, delMany } from 'idb-keyval'

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
      let sessionObj = {}

      if (options?.isManyRequests === true) {
        sessionObj = {
          ...options,
          data: item.reduce((result, response) => {
            response.data.forEach((probeResult) => {
              result.push(probeResult)
            })

            return result
          }, [])
        }
      } else {
        sessionObj = {
          ...options,
          data: item
        }
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
        await deleteExpiredItemsAndReduceSpace()
        item = await cache(key, fetcher, options)
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

const deleteExpiredItemsAndReduceSpace = async () => {
  const allKeys = await keys()
  const allItems = await getMany(allKeys)
  const keysToDel = []
  const sortedKeys = []
  allItems.forEach((item, index) => {
    const parsedItem = JSON.parse(item)
    if (parsedItem.expiresAt !== undefined) {
      const getKey = allKeys.at(index)
      if (parsedItem.expiresAt < new Date().getTime()) {
        keysToDel.push(getKey)
      } else {
        sortedKeys.push([getKey, parsedItem.expiresAt])
      }
    }
  })
  if (keysToDel.length) {
    await delMany(keysToDel)
  }
  if (sortedKeys.length) {
    sortedKeys.sort(([, valueA], [, valueB]) => valueA - valueB)
    const howManyToDel = Math.floor(sortedKeys.length * 0.5)
    const sortedKeysToDel = sortedKeys.map(([key]) => key).slice(0, howManyToDel)
    if (sortedKeysToDel.length) {
      await delMany(sortedKeysToDel)
    }
  }
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
