const cache = async (key, fetcher, options) => {
	if (!options) {
		options = defaultOptions
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
		localStorage.setItem(key, JSON.stringify(sessionObj))
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
	expiresAt: setDefaultExpireDate()
}

export default cache