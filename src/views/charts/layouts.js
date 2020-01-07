import i18n from "@/locales/i18n";

const COMMON_FEATURE = {
  hovermode: "closest",
  margin: { t: 10, b: 10, l: 80, r: 80 },
};

const COMMON_WITH_LEGEND = {
  ...COMMON_FEATURE,
  showlegend: true,
  legend: {
    x: 0,
    y: 1.2,
    orientation: "h"
  },
  yaxis: {
    automargin: true
  },
  xaxis: {
    autorange: true,
    automargin: true
  },
};

var NET_DELAY_LAYOUT = {
  ...COMMON_WITH_LEGEND,
  yaxis: {
    title: i18n.t("charts.networkDelay.yaxis"),
    autorange: true,
  },
};

var DISCO_LAYOUT = {
  ...COMMON_WITH_LEGEND,
  yaxis: {
    title: "",
    autorange: "reversed",
  }
};

var DELAY_CHART_LAYOUT = {
  ...COMMON_WITH_LEGEND,
  yaxis: {
    title: i18n.t("charts.linkDelays.yaxis"),
    autorange: true,
  }
};

var DELAY_AND_FORWARDING_LAYOUT = {
  ...COMMON_FEATURE,
  yaxis: {
    title: i18n.t("charts.delayAndForwarding.yaxis"),
    domain: [0.55, 1],
    autorange: true,
  },
  yaxis2: {
    title: i18n.t("charts.delayAndForwarding.yaxis2"),
    domain: [0, 0.45],
    autorange: true,
  }
};

var AS_INTERDEPENDENCIES_LAYOUT = {
  ...COMMON_WITH_LEGEND,
  yaxis: {
    title: "",
    domain: [0.55, 1],
    range: [0, 1.1],
  },
  yaxis2: {
    domain: [0, 0.45],
    autorange: true,
  }
};

export {
  DISCO_LAYOUT,
  DELAY_AND_FORWARDING_LAYOUT,
  AS_INTERDEPENDENCIES_LAYOUT,
  DELAY_CHART_LAYOUT,
  NET_DELAY_LAYOUT 
};
