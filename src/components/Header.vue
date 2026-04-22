<script setup>
import { RouterLink } from 'vue-router'
import {
  QHeader,
  QToolbar,
  QItem,
  QBtn,
  QBtnGroup,
  QBtnDropdown,
  QList,
  QItemSection,
  QItemLabel,
  QDrawer,
  QExpansionItem,
  QBadge,
  QIcon,
  QDialog,
  debounce
} from 'quasar'
import Tr from '@/i18n/translation'
import { onMounted, ref, watch } from 'vue'
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
      {
        entryName: 'header.tagReport.name',
        routeName: 'tag',
        summary: 'header.tagReport.summary'
      },
      {
        entryName: 'header.rankReport.name',
        routeName: 'rank',
        summary: 'header.rankReport.summary'
      },
      {
        entryName: 'header.rovReport.name',
        routeName: 'rov',
        summary: 'header.rovReport.summary'
      },
      {
        entryName: 'header.covid19.name',
        routeName: 'covid19',
        summary: 'header.covid19.summary'
      }
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
  {
    entryName: 'header.documentation',
    routeName: 'documentation'
  },
  {
    entryName: 'header.API',
    routeName: 'api'
  },
  {
    entryName: 'header.contact',
    routeName: 'contact'
  }
]

const simpleMenu = ref(SIMPLE_MENU)
const leftDrawerOpen = ref(false)
const searchOpen = ref(false)

const debounceFunc = () => {
  debounce(() => {
    checkMenu()
  }, 200)
}

const toggleValue = (_index, _type, _value) => {
  if (_type == 1) {
    simpleMenu.value[_index].menuOver = _value
  } else if (_type == 2) {
    simpleMenu.value[_index].listOver = _value
  }
}

const closeMenu = () => {
  for (let i = 0; i < simpleMenu.value.length; i++) {
    if (simpleMenu.value[i].menu != undefined) {
      simpleMenu.value[i].menuOver = false
      simpleMenu.value[i].listOver = false
      simpleMenu.value[i].menu = false
    }
  }
}

const checkMenu = () => {
  for (let i = 0; i < simpleMenu.value.length; i++) {
    if (simpleMenu.value[i].menu != undefined) {
      if (simpleMenu.value[i].menuOver || simpleMenu.value[i].listOver) {
        simpleMenu.value[i].menu = true
      } else {
        simpleMenu.value[i].menu = false
      }
    }
  }
}

watch(simpleMenu, () => {
  debounceFunc()
})
</script>

<template>
  <QHeader elevated class="IHR_header">
    <QToolbar class="q-py-none q-px-lg row IHR_toolbar">
      <div class="col-12 row no-wrap items-center">
        <!-- Logo + Wordmark -->
        <QItem id="IHR_home-button" role="button" class="q-pa-none">
          <RouterLink
            :to="Tr.i18nRoute({ name: 'home' })"
            class="row items-center no-wrap"
            style="text-decoration: none"
          >
            <QBtn
              round
              dense
              flat
              :ripple="false"
              no-caps
              size="20px"
              aria-label="IHR Logo - Go to Home"
            >
              <img src="/imgs/ihr_logo.svg" style="width: 38px" alt="IHR Logo" />
            </QBtn>
            <span class="IHR_wordmark gt-xs q-ml-sm">IHR</span>
          </RouterLink>
        </QItem>

        <!-- Desktop Nav -->
        <div
          class="IHR_menu-entries text-body2 text-weight-bold row items-center no-wrap gt-sm q-ml-auto"
        >
          <QBtnGroup v-for="(item, index) in simpleMenu" :key="item.entryName" flat>
            <QBtn
              v-if="item.options == null"
              flat
              :label="$t(item.entryName)"
              :to="Tr.i18nRoute({ name: item.routeName })"
            />
            <QBtnDropdown
              v-else
              v-model="item.menu"
              flat
              :label="$t(item.entryName)"
              menu-anchor="bottom left"
              menu-self="top left"
              @mouseover.enter="toggleValue(index, 1, true)"
              @mouseout.enter="toggleValue(index, 1, false)"
            >
              <QList
                class="rounded-borders text-white IHR_dropdown-list"
                bordered
                separator
                padding
                @mouseover.enter="toggleValue(index, 2, true)"
                @mouseout.enter="toggleValue(index, 2, false)"
              >
                <QItem
                  v-for="option in item.options"
                  :key="option.entryName"
                  v-close-popup
                  clickable
                  :to="Tr.i18nRoute({ name: option.routeName })"
                  active-class="IHR_active-route"
                  @click="closeMenu"
                >
                  <QItemSection>
                    <QBadge
                      v-if="option.experimental"
                      color="red"
                      label="Experimental"
                      style="width: fit-content"
                    />
                    <QItemLabel class="text-bold">
                      {{ $t(option.entryName) }}
                    </QItemLabel>
                    <QItemLabel class="text-grey-5" caption lines="2">
                      {{ $t(option.summary) }}
                    </QItemLabel>
                  </QItemSection>
                </QItem>
              </QList>
            </QBtnDropdown>
          </QBtnGroup>
        </div>

        <!-- Search Icon (Desktop) -->
        <QBtn
          flat
          round
          dense
          icon="fas fa-search"
          class="gt-sm q-ml-sm"
          @click="searchOpen = true"
          aria-label="Search"
        />

        <!-- Mobile Hamburger -->
        <div class="lt-md q-ml-auto">
          <q-btn
            flat
            dense
            round
            icon="menu"
            aria-label="Menu"
            @click="leftDrawerOpen = !leftDrawerOpen"
          />
        </div>
      </div>
    </QToolbar>

    <!-- Search Dialog -->
    <QDialog v-model="searchOpen" position="top" seamless>
      <div class="IHR_search-overlay q-pa-md">
        <div class="row items-center" style="max-width: 700px; margin: 0 auto">
          <SearchBar class="col" />
          <QBtn
            flat
            round
            dense
            icon="close"
            class="q-ml-sm text-white"
            @click="searchOpen = false"
          />
        </div>
      </div>
    </QDialog>

    <!-- Mobile Drawer -->
    <QDrawer v-model="leftDrawerOpen" bordered class="IHR_drawer">
      <QList class="q-pt-md">
        <template v-for="(item, index) in simpleMenu" :key="index">
          <QItem v-if="!item.options" flat class="q-pa-none">
            <QBtn
              class="full-width"
              flat
              :label="$t(item.entryName)"
              :to="Tr.i18nRoute({ name: item.routeName })"
              @click="leftDrawerOpen = false"
              align="left"
              style="min-height: 48px; padding: 12px 16px; font-size: 16px"
            />
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
                active-class="IHR_active-route"
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
                  <QItemLabel class="text-weight-medium text-white q-pb-xs">
                    {{ $t(option.entryName) }}
                  </QItemLabel>
                  <QItemLabel class="text-grey text-caption" lines="2">
                    {{ $t(option.summary) }}
                  </QItemLabel>
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
/* Header base */
.IHR_header {
  background: rgba(20, 20, 30, 0.92) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.IHR_toolbar {
  min-height: 56px;
  max-height: 56px;
}

/* Wordmark */
.IHR_wordmark {
  color: #fff;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-decoration: none;
}

/* Nav entries */
.IHR_menu-entries a,
.IHR_menu-entries button {
  font-size: 0.875rem;
  color: #fff;
  text-decoration: none;
  text-transform: capitalize;
  font-weight: 600;
  letter-spacing: 0.01em;
}
.IHR_menu-entries button {
  box-shadow: none;
}

/* Dropdown */
.IHR_dropdown-list {
  background: rgba(20, 20, 30, 0.96) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* Active route */
.IHR_active-route {
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 4px;
}

/* Search overlay */
.IHR_search-overlay {
  width: 100vw;
  background: rgba(20, 20, 30, 0.97);
  backdrop-filter: blur(12px);
}

/* Drawer */
.IHR_drawer {
  background: rgba(20, 20, 30, 0.98) !important;
}
.IHR_drawer .q-btn {
  color: #fff;
  text-transform: capitalize;
}

/* Home button */
#IHR_home-button {
  padding: 0px 4px 0px 0px;
  min-width: auto;
}

/* Legacy compat */
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

@media screen and (max-width: 1024px) {
  .col-12.row.no-wrap.items-center {
    justify-content: space-between;
  }
}
</style>
