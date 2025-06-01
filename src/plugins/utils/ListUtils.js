// Split a large array into array of smaller size chunks
const splitListToChunks = (list) => {
  const CHUNK_SIZE = 10
  const chunksList = []

  list.sort((a, b) => +a - +b)

  for (let i = 0; i < list.length; i += CHUNK_SIZE) {
    chunksList.push((list.slice(i, i+CHUNK_SIZE)))
  }
  return chunksList
}