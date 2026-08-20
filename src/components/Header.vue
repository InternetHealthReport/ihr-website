<script setup>
import { RouterLink } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref } from 'vue'
import SearchBar from '@/components/search/SearchBar.vue'
import LanguageSwitcher from './LanguageSwitcher.vue'

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

const closeMenu = () => {
  simpleMenu.value.forEach((item) => {
    if (item.menu !== undefined) {
      item.menu = false
    }
  })
}
</script>

<template>
  <q-header elevated class="ihr-header">
    <q-toolbar class="ihr-toolbar">
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
            <q-btn
              v-if="!item.options"
              flat
              no-caps
              :label="$t(item.entryName)"
              :to="Tr.i18nRoute({ name: item.routeName })"
              class="ihr-nav__btn"
            />
            <q-btn-dropdown
              v-else
              v-model="item.menu"
              flat
              no-caps
              :label="$t(item.entryName)"
              class="ihr-nav__btn"
              menu-anchor="bottom left"
              menu-self="top left"
            >
              <q-list class="ihr-dropdown" separator padding>
                <q-item
                  v-for="option in item.options"
                  :key="option.entryName"
                  v-close-popup
                  clickable
                  :to="Tr.i18nRoute({ name: option.routeName })"
                  active-class="ihr-nav--active"
                  @click="closeMenu"
                >
                  <q-item-section>
                    <q-badge
                      v-if="option.experimental"
                      color="red"
                      label="Experimental"
                      style="width: fit-content"
                    />
                    <q-item-label class="text-bold">{{ $t(option.entryName) }}</q-item-label>
                    <q-item-label class="text-grey-5" caption lines="2">{{
                      $t(option.summary)
                    }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </template>
          <!-- <LanguageSwitcher /> -->
        </nav>

        <!-- Mobile hamburger -->
        <q-btn
          class="ihr-hamburger lt-md"
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />
      </div>
    </q-toolbar>

    <!-- Mobile drawer -->
    <q-drawer v-model="leftDrawerOpen" bordered class="ihr-drawer">
      <q-list class="q-pt-md">
        <template v-for="(item, index) in simpleMenu" :key="index">
          <q-item
            v-if="!item.options"
            clickable
            :to="Tr.i18nRoute({ name: item.routeName })"
            @click="leftDrawerOpen = false"
          >
            <q-item-section>
              <q-item-label class="text-white text-weight-medium" style="font-size: 16px">{{
                $t(item.entryName)
              }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-expansion-item
            v-else
            :label="$t(item.entryName)"
            expand-icon="arrow_drop_down"
            expand-icon-class="text-white"
            style="font-size: 16px"
            header-class="text-white text-uppercase text-weight-medium q-py-md"
          >
            <q-list padding>
              <q-item
                v-for="option in item.options"
                :key="option.entryName"
                clickable
                :to="Tr.i18nRoute({ name: option.routeName })"
                active-class="ihr-nav--active"
                @click="leftDrawerOpen = false"
                style="padding: 12px 24px"
              >
                <q-item-section>
                  <q-badge
                    v-if="option.experimental"
                    color="red"
                    label="Experimental"
                    style="width: fit-content"
                  />
                  <q-item-label class="text-weight-medium text-white q-pb-xs">{{
                    $t(option.entryName)
                  }}</q-item-label>
                  <q-item-label class="text-grey text-caption" lines="2">{{
                    $t(option.summary)
                  }}</q-item-label>
                </q-item-section>
              </q-item>
              <!-- <LanguageSwitcher /> -->
            </q-list>
          </q-expansion-item>
        </template>
      </q-list>
    </q-drawer>
  </q-header>
</template>

<style>
/* Header shell */
.ihr-header {
  background: #263238 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

/* Toolbar — use q-toolbar but override its defaults */
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
  color: #fff;
  border-radius: 8px;
}
.q-menu {
  background: rgba(38, 50, 56, 0.96) !important;
  border: none !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
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
