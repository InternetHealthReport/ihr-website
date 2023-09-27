# IYP Views

## Overview

An overview is a component that provides a general description without more details. There are 4 overview components that will be reused in the 'Network Report' page:

- ASOverview.vue
- CountryOverview.vue
- IXPOverview.vue
- PrefixOverview.vue

## Tabs

If any expansion item is clicked, then the tabs will be rendered, where there will be three tab panels,

- Chart
- Data (a table)
- Cypher Query

![Originated Prefixes Chart](../../../assets/documentation/iyp/originated-prefixes-chart-AS2497.png)

The component that is responsible for rendering the tabs is `GenericTable.vue` (I know the name is misleading). [Slots](https://vuejs.org/guide/components/slots.html) are used to render a chart inside the `GenericTable.vue` component.

### Charts

At the time of writing this, there are 5 charts that are used in IYP Views:

- GenericPieChart.vue
- GenericBarChart.vue
- GenericHoverEventsChart.vue
- GenericIndicatorsChart.vue
- GenericTreemapChart.vue

All generic charts extend the `ReactiveChart.vue` (an implementation that is also used in the network report page) component, which is also responsive. In every chart component, there will be a method `formatChartData` that will turn the raw data into the desired format. The formatted data will be passed to `ReactiveChart.vue`, which uses Plotly to render a chart.
