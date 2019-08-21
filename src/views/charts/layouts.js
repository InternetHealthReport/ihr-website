import i18n from "@/locales/i18n";

const COMMON_FEATURE = {
  hovermode: "closest",
  margin: { t: 0, b: 40, l: 100, r: 0 },
  height: 350
};

const COMMON_WITH_LEGEND = {
  ...COMMON_FEATURE,
  showlegend: true,
  legend: {
    x: 0,
    y: 1.2,
    orientation: "h"
  }
};

var DISCO_LAYOUT = {
  ...COMMON_WITH_LEGEND,
  yaxis: {
    title: "",
    autorange: "reversed",
    automargin: true
  }
};

var DELAY_CHART_LAYOUT = {
  ...COMMON_WITH_LEGEND,
  yaxis: {
    title: i18n.t("charts.delays.yaxis"),
    autorange: true,
    automargin: true
  }
};

var DELAY_AND_FORWARDING_LAYOUT = {
  ...COMMON_FEATURE,
  yaxis: {
    title: i18n.t("charts.delayAndForwarding.yaxis"),
    domain: [0.55, 1],
    autorange: true,
    automargin: true
  },
  yaxis2: {
    title: i18n.t("charts.delayAndForwarding.yaxis2"),
    domain: [0, 0.45],
    autorange: true,
    automargin: true
  }
};

var AS_INTERDEPENDENCIES_LAYOUT = {
  ...COMMON_WITH_LEGEND,
  yaxis: {
    title: "",
    domain: [0.55, 1],
    range: [0, 1.1],
    automargin: true
  },
  yaxis2: {
    domain: [0, 0.45],
    autorange: true,
    automargin: true
  }
};

export {
  DISCO_LAYOUT,
  DELAY_AND_FORWARDING_LAYOUT,
  AS_INTERDEPENDENCIES_LAYOUT,
  DELAY_CHART_LAYOUT
};
