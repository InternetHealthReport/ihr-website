import neo4j from 'neo4j-driver'

const IypApi = {
  install: Vue => {
    let driver

    let init = () => {
      connect('neo4j', 'iyp.iijlab.net', '7687')
    }

    let connect = (protocol, host, port) => {
      try {
        const connectionString = `${protocol}://${host}:${port}`
        driver = neo4j.driver(connectionString)
      } catch (e) {
        console.error(e)
      }
    }

    // let connect = (protocol, host, port) => {
    //   return new Promise((resolve, reject) => {
    //     try {
    //       const connectionString = `${protocol}://${host}:${port}`
    //       driver = neo4j.driver(connectionString)
    //       resolve(driver)
    //     } catch (e) {
    //       reject(e)
    //     }
    //   })
    // }

    let getDriver = () => {
      if (!driver) {
        throw new Error('A connection has not been made to Neo4j.')
      }
      return driver
    }

    let getSession = (options = { defaultAccessMode: neo4j.session.READ }) => {
      if (!driver) {
        throw new Error('A connection has not been made to Neo4j.')
      }

      return driver.session(options)
    }

    let run = (query, params, options = { defaultAccessMode: neo4j.session.READ }) => {
      const session = getSession(options)

      return session.run(query, params).then(
        results => {
          session.close()
          return results
        },
        err => {
          session.close()
          throw err
        }
      )
    }

    async function runMany(queries) {
      // This method will execute multiple queries by creating multiple sessions which will reduce loading time
      // query object contains cypherQuery, params, mapping, data
      // const session = this.getSession()
      try {
        const response = await Promise.all(queries.map((query) => executeQuery(query)))
        let resultToBeReturn = {}
        for(let i = 0; i < response.length; i++) {
          let res = this.formatResponse(response[i], queries[i].mapping)
          resultToBeReturn[queries[i].data] = res
        }
        return resultToBeReturn
      } catch(e) {
        console.error(e)
        return {}
      } finally {
        // session.close()
      }
    }

    let executeQuery = ({ cypherQuery, params }) => {
      return getSession().run(cypherQuery, params)
    }

    let formatResponse = (results, mapping) => {
      let formattedResults = []
      for (let record of results.records) {
        let formattedRecord = {}
        for (let key in mapping) {
          let field = ''
          if(mapping[key] instanceof Array) {
            field = mapping[key][0]
            formattedRecord[key] = record.get(field)[mapping[key][1]]
          } else {
            field =  mapping[key]
            formattedRecord[key] = record.get(field)
          }
        }
        formattedResults.push(formattedRecord)
      }
      return formattedResults;
    }

    let getASOverview = async (query) => {
      let queries = Object.entries(query.queries)
      let result = {}
      for(let [key, value] of queries) {
        let res = await run(value, { asn: query.asn })
        if(key == 'asNameQuery') {
          result.name = res.records[0].get('name')
        } else if(key == 'asWebsiteQuery') {
          result.website = res.records[0].get('url')
        } else if(key == 'asCountryQuery') {
          result.country = res.records[0].get('country')
        } else if(key == 'asPrefixesCount') {
          result.prefixesCount = res.records[0].get('prefixes_count')
        } else if(key == 'asPeersCount') {
          result.peersCount =  res.records[0].get('peers_count')
        } else if(key == 'asSiblingsCount') {
          result.siblingsCount =  res.records[0].get('siblings_count')
        }
      }
      return result
    }

    let getCountryOverview = async (query) => {
      let queries = Object.entries(query.queries)
      let result = {}
      for(let [key, value] of queries) {
        let res = await run(value, { cc: query.country_code, ref: query.ref})
        if(key == 'countryASQuery') {
          result.asCount = res.records[0].get('as_count').low
        } else if(key == 'countryPrefixesQuery') {
          result.prefixesCount = res.records[0].get('prefixes_count').low
        } else if(key == 'countryIXPsQuery') {
          result.ixpsCount = res.records[0].get('ixps_count').low
        }
      }
      return result
    }

    Vue.$iyp_api = Vue.prototype.$iyp_api = {
      connect,
      getDriver,
      getSession,
      run,
      runMany,
      formatResponse,
      getASOverview,
      getCountryOverview
    }

    init()
  },
}

// Tried to implement IypApi using existing implementation adopted for IhrApi

// const IypApi = {
//   install(Vue) {
//     let iyp_api = new Vue({
//       data() {
//         return {
//           driver: this.connect('neo4j', 'iyp.iijlab.net', '7687')
//             .then(driver => this.driver = driver)
//             .catch(e => e),
//         }
//       },
//       methods: {
//         connect(protocol, host, port) {
//           return new Promise((resolve, reject) => {
//             try {
//               const connectionString = `${protocol}://${host}:${port}`;
//               driver = neo4j.driver(connectionString)
//               console.log(driver)
//               resolve(driver)
//             } catch (e) {
//               reject(e)
//             }
//           })
//         },

//         /**
//          * Get the last instantiated driver instance
//          *
//          * @return {driver}
//          */
//         getDriver() {
//           if (!this.driver) {
//             throw new Error('A connection has not been made to Neo4j.')
//           }
//           return this.driver
//         },

//         /**
//          * Create a new driver session
//          * @param  {Object} params   Object of parameters
//          *
//          * @return {driver}
//          */
//         getSession(options = {}) {
//           if (!this.driver) {
//             throw new Error('A connection has not been made to Neo4j.')
//           }

//           return driver.session(options)
//         },

//         /**
//          * Run a query on the current driver
//          *
//          * @param  {String} cypher   Cypher Query
//          * @param  {Object} params   Object of parameters
//          * @param  {Object} options  Session options
//          * @return {Promise}
//          * @resolves                 Neo4j Result Set
//          */
//         run(query, params, options = {}) {
//           const session = this.getSession(options)

//           return session.run(query, params).then(
//             results => {
//               session.close()

//               return results
//             },
//             err => {
//               session.close()
//               throw err
//             }
//           )
//         },
//       },
//     })

//     Vue.mixin({
//       beforeCreate() {
//         this.$iyp_api = iyp_api
//       },
//     })
//   },
// }

export default IypApi
