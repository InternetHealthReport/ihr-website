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
        experimental: true
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

onMounted(() => {
  document.title = 'Internet Health Report'
})

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
  <QHeader elevated primary>
    <QToolbar class="q-py-sm q-px-lg row">
      <div class="col-12 row no-wrap items-center">
        <QItem id="IHR_home-button">
          <RouterLink :to="Tr.i18nRoute({ name: 'home' })">
            <QBtn round dense flat :ripple="false" no-caps size="22px">
              <img src="/imgs/ihr_logo.svg" style="width: 45px" />
            </QBtn>
          </RouterLink>
        </QItem>
        <SearchBar class="IHR_search-box col-4" />
        <div
          class="IHR_menu-entries text-body2 text-weight-bold row items-center no-wrap gt-sm q-ml-auto q-mr-md"
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
                class="rounded-borders text-white bg-primary"
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
                    <QBadge v-if="option.experimental" color="red" label="Experimental" style="width: fit-content;" />
                    <QItemLabel class="text-bold">
                      {{ $t(option.entryName) }}
                    </QItemLabel>
                    <QItemLabel class="text-grey" caption lines="2">
                      {{ $t(option.summary) }}
                    </QItemLabel>
                  </QItemSection>
                </QItem>
              </QList>
            </QBtnDropdown>
          </QBtnGroup>
          <!-- <LanguageSwitcher /> -->
        </div>
        <div class="lt-md">
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
      <!--Log in /Log out stuff here-->
    </QToolbar>
    <QDrawer v-model="leftDrawerOpen" bordered class="bg-primary">
      <QList class="q-pt-md">
        <!-- <QItemLabel header>Essential Links</QItemLabel> -->
        <template v-for="(item, index) in simpleMenu" :key="index">
          <QItem v-if="!item.options" flat class="q-pa-none">
            <QBtn
              class="full-width"
              flat
              :label="$t(item.entryName)"
              :to="Tr.i18nRoute({ name: item.routeName })"
              @click="leftDrawerOpen = false"
              align="left"
              style="min-height: 48px; padding: 12px 16px; font-size: 16px;"
            />
          </QItem>

          <QExpansionItem
            v-else
            :label="$t(item.entryName)"
            expand-icon="arrow_drop_down"
            expand-icon-class="text-white"
            style="font-size: 16px;"
            header-class="text-white text-uppercase text-weight-medium q-py-md"
          >
            <!-- Submenu items -->  
            <QList padding>
              <QItem
                v-for="option in item.options"
                :key="option.entryName"
                clickable
                :to="Tr.i18nRoute({ name: option.routeName })"
                active-class="IHR_active-route"
                @click="leftDrawerOpen = false"
                style="padding: 12px 24px;"
              >
                <QItemSection>
                  <QBadge v-if="option.experimental" color="red" label="Experimental" style="width: fit-content;" />
                  <QItemLabel class="text-weight-medium text-white q-pb-xs">
                    {{ $t(option.entryName) }}
                  </QItemLabel>
                  <QItemLabel class="text-grey text-caption" lines="2">
                    {{ $t(option.summary) }}
                  </QItemLabel>
                </QItemSection>
              </QItem>
              <!-- <LanguageSwitcher /> -->
            </QList>
          </QExpansionItem>
        </template>
      </QList>
    </QDrawer>
  </QHeader>
</template>

<style>
.IHR_minimum-width {
  min-width: 640px !important;
}
.IHR_menu-entries a,
.IHR_menu-entries button {
  font-size: 1rem;
  color: #fff;
  text-decoration: none;
  text-transform: capitalize;
  margin-right: 10px;
  font-weight: 700;
}
.IHR_menu-entries button {
  box-shadow: none;
}
.IHR_dropdown-menu {
  background-color: #263238;
}
.IHR_dropdown-menu a {
  font-size: 1rem;
  color: #fff;
  text-decoration: none;
  text-transform: capitalize;
  margin-right: 10px;
  font-weight: 700;
}
#IHR_home-button {
  padding: 0px 13px 0px 2px;
}
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
.IHR_active-route {
  background: #ffffff26 !important;
  border-radius: 4px;
}

@media screen and (max-width: 1024px) {
  .col-12.row.no-wrap.items-center {
    justify-content: space-around;
  }

  .IHR_search-box.col-4 {
    flex-grow: 1;
  }
}
</style>
