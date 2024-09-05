# Contributing to Internet Health Report

First off, thanks for taking the time to contribute! 🎉🎉

When contributing to this repository, please first discuss the change you wish to make via issue with the maintainers of this repository before making a change. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Code of Conduct

This project and everyone participating in it is governed by the [IHR Code of Conduct](CODE_OF_CONDUCT.md), please follow it in all your interaction with the project. By participating, you are expected to uphold this code. Please report unacceptable behavior to [admin@ihr.live](mailto:admin@ihr.live)

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a
   build. Add only relevant files to commit and ignore the rest to keep the repo clean.
2. Update the [README.md](README.md) with details of changes to the interface, this includes new environment
   variables, exposed ports, useful file locations and container parameters.
3. You should request review from the maintainers once you submit the Pull Request.

## Instructions

- Git Workflow

```bash
## Step 1: Fork Repository

## Step 2: Git Set Up & Download
# Clone the repo
$ git clone git@github.com:<User-Name>/<Repo-Name>.git
# Add upstream remote
$ git remote add upstream git@github.com:InternetHealthReport/ihr-website.git 
# Fetch and merge with upstream/dev
$ git fetch upstream
$ git merge upstream/dev

## Step 2: Create and Publish Working Branch
$ git checkout -b <type>/<issue|issue-number>/{<additional-fixes>}
$ git push origin <type>/<issue|issue-number>/{<additional-fixes>}

## Types:
# wip - Work in Progress; long term work; mainstream changes;
# feat - New Feature; future planned; non-mainstream changes;
# bug - Bug Fixes
# exp - Experimental; random experimental features;
```

- On Task Completion:

```bash
## Committing and pushing your work
# Ensure branch
$ git branch
# Fetch and merge with upstream/dev
$ git fetch upstream
$ git merge upstream/dev
# Add untracked files
$ git add .
# Commit all changes with appropriate commit message and description
$ git commit -m "your-commit-message" -m "your-commit-description"
# Fetch and merge with upstream/dev again
$ git fetch upstream
$ git merge upstream/dev
# Push changes to your forked repository
$ git push origin <type>/<issue|issue-number>/{<additional-fixes>}

## Creating the PR using GitHub Website
# Create Pull Request from <type>/<issue|issue-number>/{<additional-fixes>} branch in your forked repository to the dev branch in the upstream repository
# After creating PR, add a Reviewer (Any Admin) and yourself as the assignee
# Link Pull Request to appropriate Issue, or Project+Milestone (if no issue created)
# IMPORTANT: Do Not Merge the PR unless specifically asked to by an admin.
```

- After PR Merge

```bash
# Delete branch from forked repo
$ git branch -d <type>/<issue|issue-number>/{<additional-fixes>}
$ git push --delete origin <type>/<issue|issue-number>/{<additional-fixes>}
# Fetch and merge with upstream/dev
$ git checkout dev
$ git pull upstream
$ git push origin
```

- Always follow [commit message standards](https://chris.beams.io/posts/git-commit/)
- About the [fork-and-branch workflow](https://blog.scottlowe.org/2015/01/27/using-fork-branch-git-workflow/)

## Libraries Overview

Our website uses the following libraries:

- [@intlify/unplugin-vue-i18n](https://www.npmjs.com/package/@intlify/unplugin-vue-i18n): This is a plugin for Vue.js that helps with internationalization (i18n)
- [@quasar/extras](https://www.npmjs.com/package/@quasar/extras): This includes icons, fonts, and other assets that enhance the UI
- [axios](https://www.npmjs.com/package/axios): This is a library used to make HTTP requests
- [dagre](https://www.npmjs.com/package/dagre): This is a library for laying out directed graphs
- [grid-layout-plus](https://www.npmjs.com/package/grid-layout-plus): This is an extension of grid layout systems, allowing for more flexible and responsive grid designs in web applications
- [ip-address](https://www.npmjs.com/package/ip-address): This provides utilities for working with IP addresses
- [plotly.js-dist](https://www.npmjs.com/package/plotly.js-dist): This is a library for creating interactive charts and visualizations
- [quasar](https://www.npmjs.com/package/quasar): It provides a rich set of UI components and tools
- [swagger-ui](https://www.npmjs.com/package/swagger-ui): It generates interactive API documentation from OpenAPI specifications, making it easier for developers to understand and test API endpoints
- [v-network-graph](https://www.npmjs.com/package/v-network-graph): This is used for creating network graphs in Vue.js applications
- [vue](https://www.npmjs.com/package/vue): This is a progressive JavaScript framework for building user interfaces
- [vue-i18n](https://www.npmjs.com/package/vue-i18n): This is an internationalization plugin for Vue.js
- [vue-router](https://www.npmjs.com/package/vue-router): Vue Router is the official routing library for Vue.js

## Project tree

```
.
├── CODE_OF_CONDUCT.md: A document outlining the expected behavior and guidelines for participants in the project, promoting a respectful and inclusive environment
├── CONTRIBUTING.md: Guidelines for contributing to the project, including how to report issues, submit code, and adhere to project standards
├── Dockerfile: A script containing instructions to build a Docker image for the application, specifying the environment and dependencies required to run it
├── LICENSE: The legal document that specifies the terms under which the project's code can be used, modified, and distributed
├── README.md: An overview of the project, including its purpose, features, installation instructions, and usage examples
├── SECURITY.md: A document detailing the security practices of the project, including how to report vulnerabilities and security issues
├── babel.config.cjs: Configuration file for Babel, a JavaScript compiler, specifying how to transform modern JavaScript code into a backward-compatible version
├── default.conf: Nginx configuration file, specifying settings such as ports, routes, and other parameters
├── index.html: The main HTML file that serves as the entry point for the web application, containing the structure and layout of the webpage
├── package.json: A file that contains metadata about the project, including dependencies, scripts, and project configuration for Node.js applications
├── public
│   ├── data
│   │   └── asnames.txt: A text file containing a list of AS names
│   └── favicon.png: The favicon image
├── src
│   ├── App.vue: The root Vue component for the application, serving as the main entry point for the Vue.js application
│   ├── assets
│   │   ├── docs
│   │   │   └── global_report.md: A document explaining how to maintaine the Global Report page
│   │   ├── imgs
│   │   │   ├── AS-interdependece.png: An image
│   │   │   ├── AS-page-AS2497.png: An image
│   │   │   ├── DF-anomalies.png: An image
│   │   │   ├── Net-disconnections.png: An image
│   │   │   ├── aggregated-alarms-architecture.png: An image
│   │   │   ├── disco_AS16322.png: An image
│   │   │   ├── dns-anomaly-alarm-type-integration.png: An image
│   │   │   ├── edgecast-logo.png: An image
│   │   │   ├── forwarding_AS174.png: An image
│   │   │   ├── global-banner.png: An image
│   │   │   ├── gsoc-logo.png: An image
│   │   │   ├── gsoc-logo.svg: An image
│   │   │   ├── hegemony_AS2497.png: An image
│   │   │   ├── ihr_logo.png: An image
│   │   │   ├── ihr_logo.svg: An image
│   │   │   ├── iij-logo.jpg: An image
│   │   │   ├── isoc-logo.png: An image
│   │   │   ├── linkdelay_AS7922.png: An image
│   │   │   ├── manrs-logo.jpg: An image
│   │   │   ├── netdelay_AS24482.png: An image
│   │   │   ├── originated-prefixes-chart-AS2497.png: An image
│   │   │   ├── ripe-logo.png: An image
│   │   │   └── rv-logo.png: An image
│   │   └── rir-country-map.json: A JSON file containing data for a country map related to the Regional Internet Registry (RIR)
│   ├── components
│   │   ├── DateTimePicker.vue: A component that allows users to select a date and time
│   │   ├── Feedback.vue: A component for collecting user feedback (the red feedback button on the right of the report pages)
│   │   ├── Footer.vue: The footer component that contains copyright information, links, or additional navigation options at the bottom of the website
│   │   ├── Header.vue: The header component that includes the website title, logo, and main navigation links at the top of the website
│   │   ├── LanguageSwitcher.vue: A component that allows users to switch between different languages (currently not in used)
│   │   ├── LocalStorageBanner.vue: A component that inform users about the use of local storage (currently not in used)
│   │   ├── MetisWidget.vue: A component related to the Metis paper (https://tma.ifip.org/2022/wp-content/uploads/sites/11/2022/06/tma2022-paper18.pdf)
│   │   ├── TracerouteMonitor.vue: A component that monitors and displays traceroute data, which shows the path packets take to reach a destination on the network
│   │   ├── UserInfo.vue: A component that displays user information, such as IP address, prefix and AS
│   │   ├── charts
│   │   │   ├── AsInterdependenciesChart.vue: A component that visualizes the interdependencies between AS
│   │   │   ├── BGPLineChart.vue: A component that displays the BGP announcements and withdraws using a stack line chart
│   │   │   ├── BGPPathsChart.vue: A component that visualizes the AS paths taken by BGP routes
│   │   │   ├── CountryHegemonyChart.vue: A component that visualizes the country hegemony
│   │   │   ├── DelayAndForwardingChart.vue: A component that visualizes the delay and forwarding of ASes, IXPs, Atlas probes, and cities
│   │   │   ├── DelayChart.vue: A component that visualizes the delay of ASes, IXPs, Atlas probes, and cities
│   │   │   ├── DiscoChart.vue: A component that visualizes the network disconnections
│   │   │   ├── IodaChart.vue: A component that visualizes the Internet outages
│   │   │   ├── IypGenericBarChart.vue: A component that creates bar chart for IYP data
│   │   │   ├── IypGenericPieChart.vue: A component that creates pie chart for IYP data
│   │   │   ├── IypGenericRadarChart.vue: A component that creates radar chart for IYP data
│   │   │   ├── IypGenericTreemapChart.vue: A component that creates treemap chart for IYP data
│   │   │   ├── NetworkDelayAlarmsChart.vue: A component that visualizes the alarms according tyo network delays
│   │   │   ├── NetworkDelayChart.vue: A component that visualizes the network delay 
│   │   │   ├── NetworkTopologyChart.vue: A component that visualizes the network topology
│   │   │   ├── PrefixHegemonyChart.vue: A component that visualizes the prefix hegemony
│   │   │   ├── ReactiveChart.vue: A component for rendering the charts using Plotly.js
│   │   │   ├── RirCountrySunburstChart.vue: A component that visualizes the RIR data by country
│   │   │   ├── TimeSeriesAggregatedAlarmsChart.vue: A component that visualizes aggregated alarms over time
│   │   │   ├── TracerouteChart.vue: A component that visualizes the traceroute path of an ATLAS measurment
│   │   │   ├── TracerouteRttChart.vue: A component that visualizes the RTT over time of an ATLAS measurment
│   │   │   ├── TreeMapAggregatedAlarmsChart.vue: A component that visualizes aggregated alarms in a treemap chart
│   │   │   └── WorldMapAggregatedAlarmsChart.vue: A component that visualizes aggregated alarms in a world map
│   │   ├── controllers
│   │   │   ├── AggregatedAlarmsController.vue: A component that controls all the components related to the aggregated alarms (global report page)
│   │   │   └── GenericCardController.vue: A component that creates the widget window. This widget window includes either the chart or the tables components. The window provides sharing and info about the incudeded chart or table.
│   │   ├── iyp
│   │   │   ├── as
│   │   │   │   ├── ASAuthoritativeNameservers.vue: An IYP component that visualizes the AS Authoritative Nameservers
│   │   │   │   ├── ASCoLocatedASes.vue: An IYP component that visualizes the Co-Located ASes
│   │   │   │   ├── ASConnectedASes.vue: An IYP component that visualizes the Connected ASes
│   │   │   │   ├── ASDownstreamsASes.vue: An IYP component that visualizes the Downstreams ASes
│   │   │   │   ├── ASIXPs.vue: An IYP component that visualizes the ASes' IXPs
│   │   │   │   ├── ASOriginatedPrefixes.vue: An IYP component that visualizes the AS Originated Prefixes
│   │   │   │   ├── ASPopularDomains.vue: An IYP component that visualizes the AS Popular Domains
│   │   │   │   ├── ASPopularHostNames.vue: An IYP component that visualizes the AS Popular Hostnames
│   │   │   │   ├── ASRPKIRouteOriginAuthorization.vue: An IYP component that visualizes the AS RPKI Route Origin Authorization
│   │   │   │   ├── ASRankings.vue: An IYP component that visualizes the AS Rankings
│   │   │   │   ├── ASRipeAtlas.vue: An IYP component that visualizes the AS Ripe Atlas probes
│   │   │   │   ├── ASSiblingASes.vue: An IYP component that visualizes the Sibling ASes
│   │   │   │   └── ASUpstreamASes.vue: An IYP component that visualizes the UpstreamASes
│   │   │   ├── country
│   │   │   │   ├── CountryASRankings.vue: An IYP component that visualizes the Country AS Rankings
│   │   │   │   ├── CountryAutonomousSystems.vue: An IYP component that visualizes the Country Autonomous Systems
│   │   │   │   ├── CountryIPPrefixes.vue: An IYP component that visualizes the Country IP Prefixes
│   │   │   │   ├── CountryInternetExchangePoints.vue: An IYP component that visualizes the Country IXPs
│   │   │   │   └── CountryRipeAtlas.vue: An IYP component that visualizes the Country Ripe Atlas probes
│   │   │   ├── hostName
│   │   │   │   ├── HostNameAuthoritativeNameservers.vue: An IYP component that visualizes the Hostname Authoritative Nameservers 
│   │   │   │   ├── HostNameIPAddressesPrefixes.vue: An IYP component that visualizes the Hostname IP Addresses Prefixes
│   │   │   │   ├── HostNameQueryingASes.vue: An IYP component that visualizes Hostnames Querying ASes
│   │   │   │   ├── HostNameQueryingCountries.vue: An IYP component that visualizes the Hostnames Querying Countries
│   │   │   │   └── HostNameRankings.vue: An IYP component that visualizes the Hostname Rankings
│   │   │   ├── ixp
│   │   │   │   ├── IXPCoLocationFacilities.vue: An IYP component that visualizes the IXP CoLocation Facilities
│   │   │   │   ├── IXPMembers.vue: An IYP component that visualizes the IXP members
│   │   │   │   ├── IXPPeeringLANs.vue: An IYP component that visualizes the IXP Peering LANs
│   │   │   │   └── IXPRPKIRouteOriginAuthorization.vue: An IYP component that visualizes the IXP RPKI Route Origin Authorization
│   │   │   ├── prefix
│   │   │   │   ├── PrefixAuthoritativeNameservers.vue: An IYP component that visualizes the Prefix Authoritative Nameserves
│   │   │   │   ├── PrefixLessSpecificPrefixes.vue: An IYP component that visualizes the Prefix Less Specific Prefixes
│   │   │   │   ├── PrefixMoreSpecificPrefixes.vue: An IYP component that visualizes the Prefix More Specific Prefixes
│   │   │   │   ├── PrefixPopularDomains.vue: An IYP component that visualizes the Prefix Populat Domains
│   │   │   │   ├── PrefixPopularHostNames.vue: An IYP component that visualizes the Prefix Popular Hostnames
│   │   │   │   ├── PrefixRPKIRouteOriginAuthorization.vue: An IYP component that visualizes the Prefix RPKI Route Origin Authorization
│   │   │   │   └── PrefixUpstreamASes.vue: An IYP component that visualizes the Prefix Upstream ASes
│   │   │   ├── rank
│   │   │   │   ├── RankASRankings.vue: An IYP component that visualizes the Rank AS Rankings
│   │   │   │   └── RankHostNameRankings.vue: An IYP component that visualizes the Rank Hostname Ranknings
│   │   │   └── tag
│   │   │       ├── TagAutonomousSystems.vue: An IYP component that visualizes the Tag ASes
│   │   │       ├── TagPopularHostNames.vue: An IYP component that visualizes the Tag Popular Hostnames
│   │   │       └── TagPrefixes.vue: An IYP component that visualizes the Tag Prefixes
│   │   ├── maps
│   │   │   ├── DiscoMap.vue: A component that creates the network disconnections map
│   │   │   ├── WorldMap.vue: A component that creates the world map for the global report page
│   │   │   └── WorldMapAggregatedAlarmsMap.vue: A component that creates the world aggregated alarms map for the global report page 
│   │   ├── networks
│   │   │   ├── AS.vue: A component that creates the AS report page
│   │   │   ├── Country.vue: A component that creates the Country report page
│   │   │   ├── HostName.vue: A component that creates the Hostname report page
│   │   │   ├── IXP.vue: A component that creates the IXP report page
│   │   │   ├── Prefix.vue: A component that creates the Prefix report page
│   │   │   ├── Rank.vue: A component that creates the Rank report page
│   │   │   ├── Tag.vue: A componoent that creates the Tag report page
│   │   │   ├── as
│   │   │   │   ├── ASCustom.vue: A component that allows users to create a custom AS report page
│   │   │   │   ├── ASDNS.vue: A component that includes all the visualizations and tables related to AS DNS on the AS report page
│   │   │   │   ├── ASMonitoring.vue: A component that includes all the visualizations and tables related to AS Monitoring on the AS report page
│   │   │   │   ├── ASOverview.vue: A component that includes all the visualizations and tables related to AS Overview on the AS report page
│   │   │   │   ├── ASPeering.vue: A component that includes all the visualizations and tables related to AS Peering on the AS report page
│   │   │   │   ├── ASRankings.vue: A component that includes all the visualizations and tables related to AS Rankning on the AS report page
│   │   │   │   ├── ASRegistration.vue: A component includes all the visualizations and tables related to AS Registration on the AS report page
│   │   │   │   └── ASRouting.vue: A component includes all the visualizations and tables related to AS Routing on te AS report page
│   │   │   ├── country
│   │   │   │   ├── CountryCustom.vue: A component that allows users to create a custom Country report page
│   │   │   │   ├── CountryMonitoring.vue: A component that includes all the visualizations and tables related to Country Monitoring on the Country report page
│   │   │   │   ├── CountryOverview.vue: A component that includes all the visualizations and tables related to Country Overview on the Country report page
│   │   │   │   ├── CountryPeering.vue: A component that includes all the visualizations and tables related to Country Peering on the Country report page
│   │   │   │   ├── CountryRankings.vue: A component thet includes all the visualizations and tables related to Country Ranknings on the Country report page
│   │   │   │   └── CountryRouting.vue: A component that includes all the visualizations and tables related to Country Routing on the Country report page
│   │   │   ├── hostName
│   │   │   │   ├── HostNameCustom.vue: A component that allows users to create a custom Hostname report page
│   │   │   │   ├── HostNameDNS.vue: A component that includes all the visualizations and tables related to Hostname DNS on the Hostname report page
│   │   │   │   ├── HostNameRankings.vue: A component that includes all the visualizations and tables related to Hostname Ranknings on the Hostname report page
│   │   │   │   └── HostNameRouting.vue: A component that includes all the visualizations and tables related to Hostname Routing on the Hostname report page
│   │   │   ├── ixp
│   │   │   │   ├── IXPCustom.vue: A component that allows users to create a custom IXP report page
│   │   │   │   ├── IXPMonitoring.vue: A component that includes all the visualizations and tables related to IXP Monitoring on the IXP report page
│   │   │   │   ├── IXPOverview.vue: A component that includes all the visualizations and tables related to IXP overview on the IXP report page
│   │   │   │   ├── IXPPeering.vue: A component that includes all the visualizations and tables related to IXP Peering on the IXP report page
│   │   │   │   └── IXPRouting.vue: A component that includes all the visualizations and tables related to IXP Routing on the IXP report page
│   │   │   ├── prefix
│   │   │   │   ├── PrefixCustom.vue: A component that allows users to create custom Prefix report page
│   │   │   │   ├── PrefixDNS.vue: A component that includes all the visualizations and tables related to Prefix DNS on the Prefix report page
│   │   │   │   ├── PrefixOverview.vue: A component that includes all the visualizations and tables related to Prefix Overview on the Prefix report page
│   │   │   │   └── PrefixRouting.vue: A component that includes all the visualizations and tables related to Prefix Routing on the Prefix report page
│   │   │   ├── rank
│   │   │   │   └── RankCustom.vue: A component that allows users to create a custom Rank report page
│   │   │   └── tag
│   │   │       ├── TagCustom.vue: A component that allows users to create a custom Tag report page
│   │   │       └── TagOverview.vue: A component that includes all the visualizations and tables related to Tag Overview on the Tag report page
│   │   ├── ripe
│   │   │   ├── Bgplay.vue: A component that integrates RIPE's BGPlay (https://stat.ripe.net/special/bgplay)
│   │   │   ├── Latencymon.vue: A component that integrates RIPE's LatencyMon (https://labs.ripe.net/author/massimo_candela/new-ripe-atlas-tool-latencymon/)
│   │   │   ├── ReverseDnsIp.vue: A component that integrates RIPE's Reverse DNS IP (https://stat.ripe.net/widget/reverse-dns-ip)
│   │   │   └── Tracemon.vue: A component that integrates RIPE's TraceMON (https://labs.ripe.net/author/massimo_candela/tracemon-network-debugging-made-easy/)
│   │   ├── search
│   │   │   ├── LocationSearchBar.vue: A component that allows searching by location using a world map (the map icon in the search bar)
│   │   │   └── SearchBar.vue: A component for the search bar
│   │   └── tables
│   │       ├── AggregatedAlarmsTable.vue: A component that includes the table with the aggregated alarms on the global report page
│   │       ├── AsInterdependenciesTable.vue: A component that includes the table with information about the interdependencies between AS
│   │       ├── BGPMessagesTable.vue: A component that includes the table with the BGP messages
│   │       ├── CountryHegemonyTable.vue: A component that includes the table with the country hegemony values
│   │       ├── DelayAlarmsTable.vue: A component that includes the table with the delay alarms values
│   │       ├── DiscoAlarmsTable.vue: A component that includes the table with the network disconnections information 
│   │       ├── ForwardingAlarmsTable.vue: A component that includes the table with the forwarding alarms values
│   │       ├── IypGenericTable.vue: A component that includes the table for displaying IYP data
│   │       ├── MetisTable.vue: A component that includes the table for displaying data for the Metis project
│   │       ├── NetworkDelayAlarmsTable.vue: A component that includes the table with the network delay alarms
│   │       ├── NetworkDelayTable.vue: A component that includes the table with the network delay data
│   │       ├── PrefixHegemonyTable.vue: A component that includes the table with the prefix hegemony data
│   │       ├── PrefixHegemonyTableStats.vue: A component that includes the table with the statistics of the prefix hegemony
│   │       ├── TracerouteDestinationsTable.vue: A component that includes the table with the traceroute destinations
│   │       └── TracerouteProbesTable.vue: A component that includes the table with the traceroute probes
│   ├── i18n
│   │   ├── index.js: Exports the i18n object
│   │   ├── locales
│   │   │   ├── en.json: Contains the English text for the website
│   │   │   └── jp.json: Contains the Japanese text for the website (currently is a copy of the English text)
│   │   └── translation.js: Contains all the functions related to the i18n
│   ├── main.js: Initializes the Vue.js application
│   ├── plugins
│   │   ├── AsNames.js: Contains functions to parse and get AS names from `./public/data/asnames.txt`
│   │   ├── GripApi.js: Contains functions for getting data from https://ihr.iijlab.net/proxy/grip/events (for global report page)
│   │   ├── IhrApi.js: Contains functions for IHR API calls
│   │   ├── IodaApi.js: Contains functions for IODA API calls
│   │   ├── IypApi.js: Contains functions for IYP API calls
│   │   ├── IypGenericTreemapChart.js: Contains functions for the IYP treemap chart, i.e. handling click on the chart
│   │   ├── LibraryDelayer.js: Contains functions for handling CDN based tools
│   │   ├── RipeApi.js: Contains functions for RIPE API calls
│   │   ├── RipeAtlasApi.js: Contains functions for RIPE Atlas API calls
│   │   ├── cache.js: Contains functions for caching the data retrieved from API calls
│   │   ├── commonTable.js: Contains functions for table displaying and searching
│   │   ├── countryName.js: Contains functions for getting a country name
│   │   ├── covid19
│   │   │   └── lockdowns.js: Contains data about the COVID19 report page
│   │   ├── delay.js: Contains constants about the delay components
│   │   ├── disco.js: Contains constants about the network disconnections components
│   │   ├── layouts
│   │   │   └── layoutsChart.js: Contains charts layouts
│   │   ├── metadata
│   │   │   └── AggregatedAlarmsMetadata.js: Contains the table structures for the global report page
│   │   ├── models
│   │   │   ├── AggregatedAlarmsDataModel.js: Contains functions for parsing and transforming aggregated alarms data for global report page
│   │   │   ├── IodaChartDataModel.js: Contains functions for parsing and transforming IODA data for global report page
│   │   │   ├── TableAggregatedAlarmsDataModel.js: Contains functions for parsing and transforming aggregated alarms data for tables on the global report page
│   │   │   ├── TimeSeriesAggregatedAlarmsDataModel.js: Contains functions for parsing and transforming aggregated alarms data for the time series chart on the global report page
│   │   │   ├── TreeMapAggregatedAlarmsDataModel.js: Contains functions for parsing and transforming aggregated alarms data for the treemap chart on the global report page
│   │   │   └── WorldMapAggregatedAlarmsDataModel.js: Contains functions for parsing and transforming aggregated alarms data for the world map chart on the global report page
│   │   ├── networkName.js: [Deprecated] Contains functions for returning the name of an AS or IXP
│   │   ├── query
│   │   │   └── IhrQuery.js: Creates the queries for the IHR API call
│   │   ├── report.js: Contains functions for handling the dates
│   │   ├── tests
│   │   │   ├── AggregatedAlarmsDataModel.test.js: Contains unit tests for AggregatedAlarmsDataModel.js
│   │   │   ├── AggregatedAlarmsUtils.test.js: Contains unit tests for AggregatedAlarmsUtils.js
│   │   │   ├── AsNames.test.js: Contains unit tests for AsNames.js
│   │   │   ├── GripApi.test.js: Contains unit tests for GripApi.js
│   │   │   ├── IodaApi.test.js: Contains unit tests for IodaApi.js
│   │   │   ├── IodaChartDataModel.test.js: Contains unit tests for IodaChartDataModel.js
│   │   │   ├── TableAggregatedAlarmsDataModel.test.js: Contains unit tests for TableAggregatedAlarmsDataModel.js
│   │   │   ├── TimeSeriesAggregatedAlarmsDataModel.test.js: Contains unit tests for TimeSeriesAggregatedAlarmsDataModel.js
│   │   │   ├── TreeMapAggregatedAlarmsDataModel.test.js: Contains unit tests for TreeMapAggregatedAlarmsDataModel.js
│   │   │   ├── WorldMapAggregatedAlarmsDataModel.test.js: Contains unit tests for WorldMapAggregatedAlarmsDataModel.js
│   │   │   └── resources
│   │   │       └── data.js: Contains data for the unit tests
│   │   ├── tracerouteFunctions.js: Contains helper functions for the traceroute components
│   │   └── utils
│   │       └── AggregatedAlarmsUtils.js: Contains helper functions for the global report page's aggregated alarms
│   ├── router
│   │   └── index.js: Contains the Vue routing 
│   ├── styles
│   │   ├── chart.sass: Contains CSS classes for the charts
│   │   ├── main.sass: Contains CSS classes for the webpage
│   │   └── quasar.variables.sass: Contains CSS variables for the quasar library
│   └── views
│       ├── Api.vue: A component that creates the API page. It provides a UI for making calls to IHR API.
│       ├── BGPMonitor.vue: A component that creates the BGP monitor tool page
│       ├── Contact.vue: A component that creates the contact page
│       ├── Corona.vue: A component that creates the COVID19 report page
│       ├── Countries.vue: A component that creates the country report page
│       ├── Documentation.vue: A component that creates the documentation page
│       ├── GlobalReport.vue: A component that creates the global report page
│       ├── Home.vue: A component that creates the home page
│       ├── HostNames.vue: A component that creates the hostname report page
│       ├── MetisDeployment.vue: A component that creates the metis probe deployment page
│       ├── MetisHome.vue: A component that creates the metis page
│       ├── MetisSelection.vue: A component that creates the metis probe selection page
│       ├── NetworkTopology.vue: A component that creates the network topology tool page
│       ├── Networks.vue: A component that creates the network report page
│       ├── Observable.vue: A component that creates the observable tool page
│       ├── PageNotFound.vue: A component that creates the not found page
│       ├── ROV.vue: A component that creates the Route Origin Validation (ROV) page
│       ├── Ranks.vue: A component that creates the ranks report page
│       ├── Tags.vue: A component that creates the tags report page
│       └── TracerouteVisualizationTool.vue: A component that creates the traceroute visualization tool page
└── vite.config.js: Contains the vite configuarion
```

## Code Style

run the following command:

```
npm run format
```

## Testing