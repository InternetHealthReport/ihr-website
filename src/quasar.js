import Vue from "vue";

import "./styles/quasar.styl";
import "quasar/dist/quasar.ie.polyfills";
import iconSet from "quasar/icon-set/fontawesome-v5.js";
import "@quasar/extras/roboto-font/roboto-font.css";
import "@quasar/extras/fontawesome-v5/fontawesome-v5.css";
import {
  Quasar,
  QLayout,
  QHeader,
  QDrawer,
  QPageContainer,
  QPage,
  QToolbar,
  QToolbarTitle,
  QBtn,
  QIcon,
  QList,
  QItem,
  QItemSection,
  QItemLabel,
  QSelect,
  QMenu,
  QSeparator,
  QAvatar,
  QSpace,
  QSpinner,
  QBtnDropdown,
  ClosePopup,
  QCard,
  QCardSection,
  QCardActions,
  QTabPanels,
  QTabPanel,
  QTabs,
  QTab,
  QRouteTab,
  QImg,

  //non component
  Cookies
} from "quasar";

Vue.use(Quasar, {
  config: {
    brand: {
      primary: "#263238",
      secondary: "#1976d2",
      accent: "#6eaaff",

      positive: "#21BA45",
      negative: "#d61e1e",
      info: "#4f5b62",
      warning: "#ffee58"
    }
  },
  components: {
    QLayout,
    QHeader,
    QDrawer,
    QPageContainer,
    QPage,
    QToolbar,
    QToolbarTitle,
    QBtn,
    QIcon,
    QList,
    QItem,
    QItemSection,
    QItemLabel,
    QSelect,
    QMenu,
    QSeparator,
    QAvatar,
    QSpace,
    QSpinner,
    QBtnDropdown,
    QCard,
    QCardSection,
    QCardActions,
    QTabPanels,
    QTabPanel,
    QTabs,
    QTab,
    QRouteTab,
    QImg
  },
  directives: { ClosePopup },
  extras: ["material-icons", "fontawesome-v5"],
  plugins: { Cookies },
  iconSet: iconSet
});
