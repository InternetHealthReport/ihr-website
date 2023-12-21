import neo4j from 'neo4j-driver'

const IYP_API_BASE = 'neo4j+s://iyp-bolt.iijlab.net:443'

const IypApi = {
  install: (app, options) => {
    const driver = neo4j.driver(IYP_API_BASE)

    const _getSession = (options = { defaultAccessMode: neo4j.session.READ }) => {
      if (!driver) {
        throw new Error('A connection has not been made to Neo4j.')
      }

      return driver.session(options)
    }

    const run = (query, params, options = { defaultAccessMode: neo4j.session.READ }) => {
      const session = _getSession(options)
      return session.run(query, params)
        .then(results => {
          session.close()
          return results
        })
        .catch(error => {
          session.close()
          console.error(error)
        })
    }

    const runManyInOneSession = async (queries, options = { defaultAccessMode: neo4j.session.READ }) => {
      // This method will execute multiple queries by creating one session which will reduce loading time
      // But the execution is not parallel
      // console.log('Executing queries in a single session...')

      let session = _getSession(options)
      let transaction = await session.beginTransaction()

      let result = []
      queries.forEach(async q => {
        try {
          let res = await transaction.run(q.cypherQuery, q.params)
          result.push(res)
        } catch (e) {
          console.error(e)
        }
      })

      await transaction.close()
      return result
    }

    const formatResponse = (results, mapping) => {
      let formattedResults = []
      for (let record of results.records) {
        let formattedRecord = {}
        for (let key in mapping) {
          let field = ''
          if (mapping[key] instanceof Array) {
            field = mapping[key][0]
            formattedRecord[key] = record.get(field)[mapping[key][1]]
          } else {
            field = mapping[key]
            formattedRecord[key] = record.get(field)
          }
        }
        formattedResults.push(formattedRecord)
      }
      return formattedResults
    }

    const searchIYPInOneSession = async (queries) => {
      let response = await runManyInOneSession(queries)
      // console.log(response)
      let searchResults = []
      for (let i = 0; i < response.length; i++) {
        let res = formatResponse(response[i], queries[i].mapping)
        searchResults = [...searchResults, ...res]
      }
      return searchResults
    }

    const iyp_api = {
      run,
      runManyInOneSession,
      formatResponse,
      searchIYPInOneSession
    }
    app.provide('iyp_api', iyp_api)
  }
}

export {
  IypApi
}