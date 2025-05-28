import { runIyp } from './IypApi'

export function getASNamesCountryMappings() {
  const cypher = `
    MATCH (a:AS)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
    OPTIONAL MATCH (a)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]-(cc:Country)
    RETURN DISTINCT a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS name, cc.country_code AS country_code
  `
  const request = () => {
    return new Promise((resolve, reject) => {
      runIyp([{ statement: cypher }])
        .then((response) => {
          resolve(response[0])
        })
        .catch((error) => reject(error))
    })
  }
  return request()
}
