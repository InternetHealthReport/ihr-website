const cache = async (key, fetcher, options) => {
	if (!options) {
		options = defaultOptions
	} else {
		options = Object.assign(defaultOptions, options)
	}
	let item = getItem(key)
	if (item) {
		item = JSON.parse(item).data
	} else {
		try {
			item =  await fetcher()
			const sessionObj = {
				...options,
				data: item
			}
			if (options.storageAllowed){
				localStorage.setItem(key, JSON.stringify(sessionObj))
			}
		} catch (error) {
			if (error instanceof DOMException && (
				error.code === 22 || 
				error.code === 1014 || 
				error.name === 'QuotaExceededError' || 
				error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )) {
        const storageAllowed = getItem("storage-allowed")
        const userLocale = getItem("user-locale")
				localStorage.clear()
        if (storageAllowed) {
          localStorage.setItem("storage-allowed", storageAllowed)
        }
        if (userLocale) {
          localStorage.setItem("user-locale", userLocale)
        }
      }
		}
	}
	return item
}

const getItem = (key) => {
	let item = localStorage.getItem(key)
	if (item) {
		if (JSON.parse(item).expiresAt < new Date().getTime()) {
			localStorage.removeItem(key)
			item = null
		}
	}
	return item
}

const setDefaultExpireDate = () => {
	const expireAt = new Date()
	return (new Date(expireAt.getFullYear(), expireAt.getMonth(), expireAt.getDate(), 23, 59, 59)).getTime()
}

const defaultOptions = {
	expiresAt: setDefaultExpireDate(),
	storageAllowed: true
}

export default cache