class ASOverviewQuery {
    constructor(asn) {
        this.asn = asn
        this.filter = ['as_name', 'website', 'country_of_origin', 'siblings_count', 'prefixes_count', 'peers_count', 'siblings_count']
        this.queries = {}
        this.generateQuery()
    }

    generateQuery() {
        this.filter.forEach((item) => {
            if(item == 'as_name') {
                let asNameQuery = 'MATCH (a:AS {asn: $asn})-[r:NAME]-(b) RETURN b.name AS name LIMIT (1)'
                this.queries.asNameQuery = asNameQuery
            } else if(item == 'website') {
                let asWebsiteQuery = 'MATCH (a:AS {asn: $asn})-[r:WEBSITE]-(b) RETURN b.url AS url LIMIT (1)'
                this.queries.asWebsiteQuery = asWebsiteQuery
            } else if(item == 'country_of_origin') {
                let asCountryQuery = 'MATCH (a:AS {asn: $asn})-[r:COUNTRY]-(b) RETURN b.country_code AS country LIMIT (1)'
                this.queries.asCountryQuery = asCountryQuery
            } else if(item == 'prefixes_count') {
                let asPrefixesCount = 'MATCH (a:AS {asn: $asn})-[r:DEPENDS_ON]-(b:Prefix) RETURN COUNT(b) AS prefixes_count'
                this.queries.asPrefixesCount = asPrefixesCount
            } else if(item == 'peers_count') {
                let asPeersCount = 'MATCH (a:AS {asn: $asn})-[r:PEERS_WITH]-(b) RETURN COUNT(b) AS peers_count'
                this.queries.asPeersCount = asPeersCount
            } else if(item == 'siblings_count') {
                let asSiblingsCount = 'MATCH (a:AS {asn: $asn})-[r:SIBLING_OF]-(b) RETURN COUNT(b) AS siblings_count'
                this.queries.asSiblingsCount = asSiblingsCount
            }
        })
    }
}

class CountryOverviewQuery {
    constructor(country_code, ref) {
        this.country_code = country_code
        this.ref = ref
        this.filter = ['as_count', 'prefixes_count', 'ixps_count', 'country']
        this.queries = {}
        this.generateQuery()
    }

    generateQuery() {
        this.filter.forEach((item) => {
            if(item == 'as_count') {
                let countryASQuery = 'MATCH (:Country {country_code: $cc})<-[:COUNTRY {reference_name: "nro.delegated_stats"}]-(b:AS) RETURN COUNT(DISTINCT b.asn) as as_count'
                this.queries.countryASQuery = countryASQuery
            } else if(item == 'ixps_count') {
                let countryIXPsQuery = 'MATCH (:Country {country_code: $cc})<-[:COUNTRY {reference_name: $ref}]-(b:IXP) RETURN COUNT(DISTINCT b) as ixps_count'
                this.queries.countryIXPsQuery = countryIXPsQuery
            } else if(item == 'prefixes_count') {
                let countryPrefixesQuery = 'MATCH (:Country {country_code: $cc})<-[:COUNTRY]-(b:Prefix) RETURN COUNT(DISTINCT b.prefix) as prefixes_count'
                this.queries.countryPrefixesQuery = countryPrefixesQuery
            } else if(item == 'country') {
                let countryQuery= 'MATCH (c:Country {country_code: $cc}) RETURN c.name as country'
                this.queries.countryQuery = countryQuery
            }
        })
    }
}

export {ASOverviewQuery, CountryOverviewQuery}