// // connector for new neo4j api
// import axios from 'axios'
// import cache from './cache.js'
// import { get } from 'idb-keyval'

// /// Base url for api
// const IYP_API_BASE = 'https://iyp.iijlab.net/iyp/db/neo4j/query/v2'
// /// Default timeout before api call are considered failed
// const DEFAULT_TIMEOUT = 180000

// const IypApi = {
//   install: (app, options) => {
//     const axios_base = axios.create({
//       baseURL: IYP_API_BASE,
//       timeout: DEFAULT_TIMEOUT
//     })

//     const run = async (queries) => {
//       const storageAllowed = JSON.parse(await get('storage-allowed'))
//       let response = await Promise.all(queries.map(query => {
//         return cache(
//           JSON.stringify(query),
//           () => {
//             return axios_base.post('', query)
//           },
//           {
//             storageAllowed: storageAllowed ? storageAllowed : false
//           }
//         )
//       }))
//       return response.map(res => {
//         return formatResponse(res.data.data)
//       })
//     }

//     const formatResponse = (results) => {
//       const list = []
//       const keys = results.fields
//       let countElementsInRow = 0
//       let obj = {}
//       results.values.forEach(res => {
//         if (countElementsInRow === 0) {
//           obj = {}
//         }
//         if (typeof res === 'object') {
//           if (res?.properties) {
//             obj[keys[countElementsInRow]] = res.properties
//           } else {
//             obj[keys[countElementsInRow]] = res?.map(val => {
//               if (val?.properties !== undefined) {
//                 return val.properties
//               }
//               return val
//             })
//           }
//         } else {
//           obj[keys[countElementsInRow]] = res
//         }
//         countElementsInRow += 1
//         if (countElementsInRow === keys.length) {
//           countElementsInRow = 0
//           list.push(obj)
//         }
//       })
//       return list
//     }

//     const iyp_api = {
//       run
//     }
//     app.provide('iyp_api', iyp_api)
//   }
// }

// export { IypApi }

// connector for old neo4j api
import axios from 'axios'
import cache from './cache.js'
import { get } from 'idb-keyval'

/// Base url for api
//const IYP_API_BASE = 'https://iyp.iijlab.net/iyp/db/neo4j/tx/'
const IYP_API_BASE = 'http://iyp-bolt.ihr.live:7474/db/neo4j/tx/'
/// Default timeout before api call are considered failed
const DEFAULT_TIMEOUT = 180000

const IypApi = {
  install: (app, options) => {
    const axios_base = axios.create({
      baseURL: IYP_API_BASE,
      timeout: DEFAULT_TIMEOUT
    })

    const run = async (queries) => {
      const storageAllowed = JSON.parse(await get('storage-allowed'))
      let response = await cache(
        JSON.stringify(queries),
        () => {
          return axios_base.post('', {
            statements: queries
          })
        },
        {
          storageAllowed: storageAllowed ? storageAllowed : false
        }
      )
      const rows = response.data.results
      const res = []
      for (let i = 0; i < rows.length; i++) {
        res.push(formatResponse(rows[i]))
      }
      return res
    }

    const formatResponse = (results) => {
      const list = []
      const keys = results.columns
      for (let i = 0; i < results.data.length; i++) {
        const obj = {}
        for (let j = 0; j < keys.length; j++) {
          obj[keys[j]] = results.data[i].row[j]
        }
        list.push(obj)
      }
      return list
    }

    const iyp_api = {
      run
    }
    app.provide('iyp_api', iyp_api)
  }
}

export { IypApi }
