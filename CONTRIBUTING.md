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

## Component Descriptions

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
│   ├── App.vue
│   ├── assets
│   │   ├── docs
│   │   │   ├── global_report.md
│   │   │   └── iyp.md
│   │   ├── imgs
│   │   │   ├── AS-interdependece.png
│   │   │   ├── AS-page-AS2497.png
│   │   │   ├── DF-anomalies.png
│   │   │   ├── Net-disconnections.png
│   │   │   ├── aggregated-alarms-architecture.png
│   │   │   ├── disco_AS16322.png
│   │   │   ├── dns-anomaly-alarm-type-integration.png
│   │   │   ├── edgecast-logo.png
│   │   │   ├── forwarding_AS174.png
│   │   │   ├── global-banner.png
│   │   │   ├── gsoc-logo.png
│   │   │   ├── gsoc-logo.svg
│   │   │   ├── hegemony_AS2497.png
│   │   │   ├── ihr_logo.png
│   │   │   ├── ihr_logo.svg
│   │   │   ├── iij-logo.jpg
│   │   │   ├── isoc-logo.png
│   │   │   ├── linkdelay_AS7922.png
│   │   │   ├── manrs-logo.jpg
│   │   │   ├── netdelay_AS24482.png
│   │   │   ├── originated-prefixes-chart-AS2497.png
│   │   │   ├── ripe-logo.png
│   │   │   └── rv-logo.png
│   │   └── rir-country-map.json
│   ├── components
│   │   ├── DateTimePicker.vue
│   │   ├── Feedback.vue
│   │   ├── Footer.vue
│   │   ├── Header.vue
│   │   ├── LanguageSwitcher.vue
│   │   ├── LocalStorageBanner.vue
│   │   ├── MetisWidget.vue
│   │   ├── TracerouteMonitor.vue
│   │   ├── UserInfo.vue
│   │   ├── charts
│   │   │   ├── AsInterdependenciesChart.vue
│   │   │   ├── BGPLineChart.vue
│   │   │   ├── BGPPathsChart.vue
│   │   │   ├── CountryHegemonyChart.vue
│   │   │   ├── DelayAndForwardingChart.vue
│   │   │   ├── DelayChart.vue
│   │   │   ├── DiscoChart.vue
│   │   │   ├── IodaChart.vue
│   │   │   ├── IypGenericBarChart.vue
│   │   │   ├── IypGenericPieChart.vue
│   │   │   ├── IypGenericRadarChart.vue
│   │   │   ├── IypGenericTreemapChart.vue
│   │   │   ├── NetworkDelayAlarmsChart.vue
│   │   │   ├── NetworkDelayChart.vue
│   │   │   ├── NetworkTopologyChart.vue
│   │   │   ├── PrefixHegemonyChart.vue
│   │   │   ├── ReactiveChart.vue
│   │   │   ├── RirCountrySunburstChart.vue
│   │   │   ├── TimeSeriesAggregatedAlarmsChart.vue
│   │   │   ├── TracerouteChart.vue
│   │   │   ├── TracerouteRttChart.vue
│   │   │   ├── TreeMapAggregatedAlarmsChart.vue
│   │   │   └── WorldMapAggregatedAlarmsChart.vue
│   │   ├── controllers
│   │   │   ├── AggregatedAlarmsController.vue
│   │   │   └── GenericCardController.vue
│   │   ├── iyp
│   │   │   ├── as
│   │   │   │   ├── ASAuthoritativeNameservers.vue
│   │   │   │   ├── ASCoLocatedASes.vue
│   │   │   │   ├── ASConnectedASes.vue
│   │   │   │   ├── ASDownstreamsASes.vue
│   │   │   │   ├── ASIXPs.vue
│   │   │   │   ├── ASOriginatedPrefixes.vue
│   │   │   │   ├── ASPopularDomains.vue
│   │   │   │   ├── ASPopularHostNames.vue
│   │   │   │   ├── ASRPKIRouteOriginAuthorization.vue
│   │   │   │   ├── ASRankings.vue
│   │   │   │   ├── ASRipeAtlas.vue
│   │   │   │   ├── ASSiblingASes.vue
│   │   │   │   └── ASUpstreamASes.vue
│   │   │   ├── country
│   │   │   │   ├── CountryASRankings.vue
│   │   │   │   ├── CountryAutonomousSystems.vue
│   │   │   │   ├── CountryIPPrefixes.vue
│   │   │   │   ├── CountryInternetExchangePoints.vue
│   │   │   │   └── CountryRipeAtlas.vue
│   │   │   ├── hostName
│   │   │   │   ├── HostNameAuthoritativeNameservers.vue
│   │   │   │   ├── HostNameIPAddressesPrefixes.vue
│   │   │   │   ├── HostNameQueryingASes.vue
│   │   │   │   ├── HostNameQueryingCountries.vue
│   │   │   │   └── HostNameRankings.vue
│   │   │   ├── ixp
│   │   │   │   ├── IXPCoLocationFacilities.vue
│   │   │   │   ├── IXPMembers.vue
│   │   │   │   ├── IXPPeeringLANs.vue
│   │   │   │   └── IXPRPKIRouteOriginAuthorization.vue
│   │   │   ├── prefix
│   │   │   │   ├── PrefixAuthoritativeNameservers.vue
│   │   │   │   ├── PrefixLessSpecificPrefixes.vue
│   │   │   │   ├── PrefixMoreSpecificPrefixes.vue
│   │   │   │   ├── PrefixPopularDomains.vue
│   │   │   │   ├── PrefixPopularHostNames.vue
│   │   │   │   ├── PrefixRPKIRouteOriginAuthorization.vue
│   │   │   │   └── PrefixUpstreamASes.vue
│   │   │   ├── rank
│   │   │   │   ├── RankASRankings.vue
│   │   │   │   └── RankHostNameRankings.vue
│   │   │   └── tag
│   │   │       ├── TagAutonomousSystems.vue
│   │   │       ├── TagPopularHostNames.vue
│   │   │       └── TagPrefixes.vue
│   │   ├── maps
│   │   │   ├── DiscoMap.vue
│   │   │   ├── WorldMap.vue
│   │   │   └── WorldMapAggregatedAlarmsMap.vue
│   │   ├── networks
│   │   │   ├── AS.vue
│   │   │   ├── Country.vue
│   │   │   ├── HostName.vue
│   │   │   ├── IXP.vue
│   │   │   ├── Prefix.vue
│   │   │   ├── Rank.vue
│   │   │   ├── Tag.vue
│   │   │   ├── as
│   │   │   │   ├── ASCustom.vue
│   │   │   │   ├── ASDNS.vue
│   │   │   │   ├── ASMonitoring.vue
│   │   │   │   ├── ASOverview.vue
│   │   │   │   ├── ASPeering.vue
│   │   │   │   ├── ASRankings.vue
│   │   │   │   ├── ASRegistration.vue
│   │   │   │   └── ASRouting.vue
│   │   │   ├── country
│   │   │   │   ├── CountryCustom.vue
│   │   │   │   ├── CountryMonitoring.vue
│   │   │   │   ├── CountryOverview.vue
│   │   │   │   ├── CountryPeering.vue
│   │   │   │   ├── CountryRankings.vue
│   │   │   │   └── CountryRouting.vue
│   │   │   ├── hostName
│   │   │   │   ├── HostNameCustom.vue
│   │   │   │   ├── HostNameDNS.vue
│   │   │   │   ├── HostNameRankings.vue
│   │   │   │   └── HostNameRouting.vue
│   │   │   ├── ixp
│   │   │   │   ├── IXPCustom.vue
│   │   │   │   ├── IXPMonitoring.vue
│   │   │   │   ├── IXPOverview.vue
│   │   │   │   ├── IXPPeering.vue
│   │   │   │   └── IXPRouting.vue
│   │   │   ├── prefix
│   │   │   │   ├── PrefixCustom.vue
│   │   │   │   ├── PrefixDNS.vue
│   │   │   │   ├── PrefixOverview.vue
│   │   │   │   └── PrefixRouting.vue
│   │   │   ├── rank
│   │   │   │   └── RankCustom.vue
│   │   │   └── tag
│   │   │       ├── TagCustom.vue
│   │   │       └── TagOverview.vue
│   │   ├── ripe
│   │   │   ├── Bgplay.vue
│   │   │   ├── Latencymon.vue
│   │   │   ├── ReverseDnsIp.vue
│   │   │   └── Tracemon.vue
│   │   ├── search
│   │   │   ├── LocationSearchBar.vue
│   │   │   └── SearchBar.vue
│   │   └── tables
│   │       ├── AggregatedAlarmsTable.vue
│   │       ├── AsInterdependenciesTable.vue
│   │       ├── BGPMessagesTable.vue
│   │       ├── CountryHegemonyTable.vue
│   │       ├── DelayAlarmsTable.vue
│   │       ├── DiscoAlarmsTable.vue
│   │       ├── ForwardingAlarmsTable.vue
│   │       ├── IypGenericTable.vue
│   │       ├── MetisTable.vue
│   │       ├── NetworkDelayAlarmsTable.vue
│   │       ├── NetworkDelayTable.vue
│   │       ├── PrefixHegemonyTable.vue
│   │       ├── PrefixHegemonyTableStats.vue
│   │       ├── TracerouteDestinationsTable.vue
│   │       └── TracerouteProbesTable.vue
│   ├── i18n
│   │   ├── index.js
│   │   ├── locales
│   │   │   ├── en.json
│   │   │   └── jp.json
│   │   └── translation.js
│   ├── main.js
│   ├── plugins
│   │   ├── AsNames.js
│   │   ├── GripApi.js
│   │   ├── IhrApi.js
│   │   ├── IodaApi.js
│   │   ├── IypApi.js
│   │   ├── IypGenericTreemapChart.js
│   │   ├── LibraryDelayer.js
│   │   ├── RipeApi.js
│   │   ├── RipeAtlasApi.js
│   │   ├── cache.js
│   │   ├── commonTable.js
│   │   ├── countryName.js
│   │   ├── covid19
│   │   │   └── lockdowns.js
│   │   ├── delay.js
│   │   ├── disco.js
│   │   ├── layouts
│   │   │   └── layoutsChart.js
│   │   ├── metadata
│   │   │   └── AggregatedAlarmsMetadata.js
│   │   ├── models
│   │   │   ├── AggregatedAlarmsDataModel.js
│   │   │   ├── IodaChartDataModel.js
│   │   │   ├── TableAggregatedAlarmsDataModel.js
│   │   │   ├── TimeSeriesAggregatedAlarmsDataModel.js
│   │   │   ├── TreeMapAggregatedAlarmsDataModel.js
│   │   │   └── WorldMapAggregatedAlarmsDataModel.js
│   │   ├── networkName.js
│   │   ├── query
│   │   │   └── IhrQuery.js
│   │   ├── report.js
│   │   ├── tests
│   │   │   ├── AggregatedAlarmsDataModel.test.js
│   │   │   ├── AggregatedAlarmsUtils.test.js
│   │   │   ├── AsNames.test.js
│   │   │   ├── GripApi.test.js
│   │   │   ├── IodaApi.test.js
│   │   │   ├── IodaChartDataModel.test.js
│   │   │   ├── TableAggregatedAlarmsDataModel.test.js
│   │   │   ├── TimeSeriesAggregatedAlarmsDataModel.test.js
│   │   │   ├── TreeMapAggregatedAlarmsDataModel.test.js
│   │   │   ├── WorldMapAggregatedAlarmsDataModel.test.js
│   │   │   └── resources
│   │   │       └── data.js
│   │   ├── tracerouteFunctions.js
│   │   └── utils
│   │       └── AggregatedAlarmsUtils.js
│   ├── router
│   │   └── index.js
│   ├── styles
│   │   ├── chart.sass
│   │   ├── main.sass
│   │   └── quasar.variables.sass
│   └── views
│       ├── Api.vue
│       ├── BGPMonitor.vue
│       ├── Contact.vue
│       ├── Corona.vue
│       ├── Countries.vue
│       ├── Documentation.vue
│       ├── GlobalReport.vue
│       ├── Home.vue
│       ├── HostNames.vue
│       ├── MetisDeployment.vue
│       ├── MetisHome.vue
│       ├── MetisSelection.vue
│       ├── NetworkTopology.vue
│       ├── Networks.vue
│       ├── Observable.vue
│       ├── PageNotFound.vue
│       ├── ROV.vue
│       ├── Ranks.vue
│       ├── Tags.vue
│       └── TracerouteVisualizationTool.vue
└── vite.config.js
```

## Code Style


## Testing