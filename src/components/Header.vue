<script setup>
import { RouterLink } from 'vue-router'
import {
  QHeader,
  QToolbar,
  QBtn,
  QBtnDropdown,
  QList,
  QItem,
  QItemSection,
  QItemLabel,
  QDrawer,
  QExpansionItem,
  QBadge,
  debounce
} from 'quasar'
import Tr from '@/i18n/translation'
import { ref, watch } from 'vue'
import SearchBar from '@/components/search/SearchBar.vue'

const SIMPLE_MENU = [
  {
    entryName: 'header.home',
    routeName: 'home'
  },
  {
    entryName: 'header.reports',
    menuOver: false,
    listOver: false,
    menu: false,
    options: [
      {
        entryName: 'header.globalReport.name',
        routeName: 'global-report',
        summary: 'header.globalReport.summary'
      },
      {
        entryName: 'header.countryReport.name',
        routeName: 'country',
        summary: 'header.countryReport.summary'
      },
      {
        entryName: 'header.networkReport.name',
        routeName: 'network',
        summary: 'header.networkReport.summary'
      },
      {
        entryName: 'header.hostNameReport.name',
        routeName: 'hostname',
        summary: 'header.hostNameReport.summary'
      },
      { entryName: 'header.tagReport.name', routeName: 'tag', summary: 'header.tagReport.summary' },
      {
        entryName: 'header.rankReport.name',
        routeName: 'rank',
        summary: 'header.rankReport.summary'
      },
      { entryName: 'header.rovReport.name', routeName: 'rov', summary: 'header.rovReport.summary' },
      { entryName: 'header.covid19.name', routeName: 'covid19', summary: 'header.covid19.summary' }
    ]
  },
  {
    entryName: 'header.tools',
    menuOver: false,
    listOver: false,
    menu: false,
    options: [
      {
        entryName: 'header.metis.name',
        routeName: 'metis',
        summary: 'header.metis.summary',
        experimental: false
      },
      {
        entryName: 'header.observable.name',
        routeName: 'observable',
        summary: 'header.observable.summary',
        experimental: false
      },
      {
        entryName: 'header.networkTopology.name',
        routeName: 'upstream-topology',
        summary: 'header.networkTopology.summary',
        experimental: false
      },
      {
        entryName: 'header.bgpMonitor.name',
        routeName: 'bgp-monitor',
        summary: 'header.bgpMonitor.summary',
        experimental: false
      },
      {
        entryName: 'header.tracerouteVisualization.name',
        routeName: 'traceroute-monitor',
        summary: 'header.tracerouteVisualization.summary',
        experimental: false
      }
    ]
  },
  { entryName: 'header.documentation', routeName: 'documentation' },
  { entryName: 'header.API', routeName: 'api' },
  { entryName: 'header.contact', routeName: 'contact' }
]

const simpleMenu = ref(SIMPLE_MENU)
const leftDrawerOpen = ref(false)

const toggleValue = (index, type, value) => {
  if (type === 1) simpleMenu.value[index].menuOver = value
  else if (type === 2) simpleMenu.value[index].listOver = value
}

const closeMenu = () => {
  simpleMenu.value.forEach((item) => {
    if (item.menu !== undefined) {
      item.menuOver = false
      item.listOver = false
      item.menu = false
    }
  })
}

const checkMenu = () => {
  simpleMenu.value.forEach((item) => {
    if (item.menu !== undefined) {
      item.menu = item.menuOver || item.listOver
    }
  })
}

watch(simpleMenu, debounce(checkMenu, 200), { deep: true })
</script>

<template>
  <QHeader elevated class="ihr-header">
    <QToolbar class="ihr-toolbar">
      <div class="ihr-toolbar__inner content-width">
        <!-- Logo -->
        <RouterLink :to="Tr.i18nRoute({ name: 'home' })" class="ihr-logo">
          <img src="/imgs/ihr_logo.svg" alt="IHR Logo" />
          <span class="ihr-logo__text gt-xs">Internet Health Report</span>
        </RouterLink>

        <!-- Search (desktop) -->
        <div class="ihr-search gt-sm">
          <SearchBar />
        </div>

        <!-- Desktop nav -->
        <nav class="ihr-nav gt-sm">
          <template v-for="(item, index) in simpleMenu" :key="item.entryName">
            <QBtn
              v-if="!item.options"
              flat
              no-caps
              :label="$t(item.entryName)"
              :to="Tr.i18nRoute({ name: item.routeName })"
              class="ihr-nav__btn"
            />
            <QBtnDropdown
              v-else
              v-model="item.menu"
              flat
              no-caps
              :label="$t(item.entryName)"
              class="ihr-nav__btn"
              menu-anchor="bottom left"
              menu-self="top left"
              @mouseover="toggleValue(index, 1, true)"
              @mouseleave="toggleValue(index, 1, false)"
            >
              <QList
                class="ihr-dropdown"
                bordered
                separator
                padding
                @mouseover="toggleValue(index, 2, true)"
                @mouseleave="toggleValue(index, 2, false)"
              >
                <QItem
                  v-for="option in item.options"
                  :key="option.entryName"
                  v-close-popup
                  clickable
                  :to="Tr.i18nRoute({ name: option.routeName })"
                  active-class="ihr-nav--active"
                  @click="closeMenu"
                >
                  <QItemSection>
                    <QBadge
                      v-if="option.experimental"
                      color="red"
                      label="Experimental"
                      style="width: fit-content"
                    />
                    <QItemLabel class="text-bold">{{ $t(option.entryName) }}</QItemLabel>
                    <QItemLabel class="text-grey-5" caption lines="2">{{
                      $t(option.summary)
                    }}</QItemLabel>
                  </QItemSection>
                </QItem>
              </QList>
            </QBtnDropdown>
          </template>
        </nav>

        <!-- Mobile hamburger -->
        <QBtn
          class="ihr-hamburger lt-md"
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />
      </div>
    </QToolbar>

    <!-- Mobile drawer -->
    <QDrawer v-model="leftDrawerOpen" bordered class="ihr-drawer">
      <QList class="q-pt-md">
        <template v-for="(item, index) in simpleMenu" :key="index">
          <QItem
            v-if="!item.options"
            clickable
            :to="Tr.i18nRoute({ name: item.routeName })"
            @click="leftDrawerOpen = false"
          >
            <QItemSection>
              <QItemLabel class="text-white text-weight-medium" style="font-size: 16px">{{
                $t(item.entryName)
              }}</QItemLabel>
            </QItemSection>
          </QItem>
          <QExpansionItem
            v-else
            :label="$t(item.entryName)"
            expand-icon="arrow_drop_down"
            expand-icon-class="text-white"
            style="font-size: 16px"
            header-class="text-white text-uppercase text-weight-medium q-py-md"
          >
            <QList padding>
              <QItem
                v-for="option in item.options"
                :key="option.entryName"
                clickable
                :to="Tr.i18nRoute({ name: option.routeName })"
                active-class="ihr-nav--active"
                @click="leftDrawerOpen = false"
                style="padding: 12px 24px"
              >
                <QItemSection>
                  <QBadge
                    v-if="option.experimental"
                    color="red"
                    label="Experimental"
                    style="width: fit-content"
                  />
                  <QItemLabel class="text-weight-medium text-white q-pb-xs">{{
                    $t(option.entryName)
                  }}</QItemLabel>
                  <QItemLabel class="text-grey text-caption" lines="2">{{
                    $t(option.summary)
                  }}</QItemLabel>
                </QItemSection>
              </QItem>
            </QList>
          </QExpansionItem>
        </template>
      </QList>
    </QDrawer>
  </QHeader>
</template>

<style>
/* Header shell */
.ihr-header {
  background: #263238 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

/* Toolbar — use QToolbar but override its defaults */
.ihr-toolbar.q-toolbar {
  min-height: 64px;
  height: 64px;
  padding: 0 2rem;
  overflow: visible;
}

/* Inner wrapper — centers content via content-width */
.ihr-toolbar__inner {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 1rem;
  width: 100%;
}

/* Logo */
.ihr-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
  padding: 4px;
}
.ihr-logo img {
  width: 38px;
  display: block;
}
.ihr-logo__text {
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  white-space: nowrap;
  margin-top: 2px;
}

/* Search */
.ihr-search {
  flex: 0 1 420px;
  min-width: 200px;
}

/* Desktop nav */
.ihr-nav {
  display: flex;
  align-items: center;
  margin-left: auto;
  flex-shrink: 0;
}
.ihr-nav__btn.q-btn {
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  text-transform: capitalize;
  letter-spacing: 0.01em;
  box-shadow: none;
}

/* Hamburger */
.ihr-hamburger.q-btn {
  margin-left: auto;
  color: #fff;
}

/* Dropdown menu */
.ihr-dropdown {
  background: rgba(38, 50, 56, 0.96) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #fff;
}

/* Active route highlight */
.ihr-nav--active {
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 4px;
}

/* Drawer */
.ihr-drawer {
  background: #263238 !important;
}
.ihr-drawer .q-item {
  color: #fff;
}

/* Legacy compat (used by App.vue / other components) */
#IHR_forgotten-password {
  white-space: nowrap;
}
#IHR_user-menu {
  padding: 0.25rem;
  font-size: 1rem;
}
#IHR_user-menu *:first-letter {
  text-transform: capitalize;
}
#IHR_last-element {
  height: 50px;
}
</style>
