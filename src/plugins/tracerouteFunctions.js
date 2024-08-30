const convertUnixTimestamp = (unixTimestamp) => {
  const date = new Date(unixTimestamp * 1000)

  const year = String(date.getFullYear())
  const day = String(date.getDate()).padStart(2, "0")
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const month = monthNames[date.getMonth()]
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${year} - ${day} ${month}, ${hours}:${minutes}`
}

const isPrivateIP = (ip) => {
  const privateRangesIPv4 = [
    { start: "10.0.0.0", end: "10.255.255.255" },
    { start: "172.16.0.0", end: "172.31.255.255" },
    { start: "192.168.0.0", end: "192.168.255.255" },
  ]

  const privateRangesIPv6 = [
    { start: "fc00::", end: "fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff" },
    { start: "fe80::", end: "febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff" },
  ]

  const ipToLong = (ip) => {
    return ip.split(".").reduce((ipInt, octet) => (ipInt << 8) + parseInt(octet, 10), 0) >>> 0
  }

  const ipToBigInt = (ip) => {
    return BigInt(`0x${ip.split(":").map(part => part.padStart(4, "0")).join("")}`)
  }

  const ipLong = ip.includes(":") ? ipToBigInt(ip) : ipToLong(ip)

  const isPrivateIPv4 = privateRangesIPv4.some(range => {
    const start = ipToLong(range.start)
    const end = ipToLong(range.end)
    return ipLong >= start && ipLong <= end
  })

  const isPrivateIPv6 = privateRangesIPv6.some(range => {
    const start = ipToBigInt(range.start)
    const end = ipToBigInt(range.end)
    return ipLong >= start && ipLong <= end
  })

  return isPrivateIPv4 || isPrivateIPv6
}

const calculateMedian = (values) => {
	if (!values || !values.length) return null
	const sorted = [...values].sort((a, b) => a - b)
	const mid = Math.floor(sorted.length / 2)
	return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export {
  convertUnixTimestamp,
  isPrivateIP,
  calculateMedian
}