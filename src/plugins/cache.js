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
		item =  await fetcher()
		const sessionObj = {
			...options,
			data: item
		}
		if (options.storageAllowed){
			localStorage.setItem(key, JSON.stringify(sessionObj))
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
	expireAt.setDate(expireAt.getDate() + 1)
	return expireAt.getTime()
}

const defaultOptions = {
	expiresAt: setDefaultExpireDate(),
	storageAllowed: true
}

export default cache