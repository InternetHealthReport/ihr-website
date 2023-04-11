<template>
  <q-header elevated primary>
    <q-toolbar class="q-py-sm q-px-lg row">
      <div class="col-12 row no-wrap items-center">
        <q-item id="IHR_home-button">
          <router-link :to="{ name: 'home' }">
            <q-btn round dense flat :ripple="false" no-caps size="22px">
              <img src="@/assets/imgs/ihr_logo.svg" style="width: 45px" />
            </q-btn>
          </router-link>
        </q-item>
        <network-search-bar class="col-4" />
        <div class="IHR_menu-entries text-body2 text-weight-bold row items-center no-wrap gt-sm q-ml-auto q-mr-md">
          <q-btn-group flat :key="item.entryName" v-for="item in simple_menu">
            <q-btn flat v-if="item.options == null" :label="$t(item.entryName)" :to="{ name: item.routeName }" />
            <q-btn-dropdown flat :label="$t(item.entryName)" v-else menu-anchor="bottom left" menu-self="top left">
              <q-list class="rounded-borders text-white bg-primary" bordered separator padding>
                <q-item
                  clickable
                  v-close-popup
                  :key="option.entryName"
                  v-for="option in item.options"
                  :to="{ name: option.routeName }"
                  active-class="text-grey"
                >
                  <q-item-section>
                    <q-item-label class="text-bold">{{ $t(option.entryName) }}</q-item-label>
                    <q-item-label class="text-grey" caption lines="2">{{ $t(option.summary) }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </q-btn-group>
        </div>
        <div class="lt-md">
          <q-btn flat dense round @click="leftDrawerOpen = !leftDrawerOpen" icon="menu" aria-label="Menu"></q-btn>
        </div>
      </div>
      <!--Log in /Log out stuff here-->
    </q-toolbar>
    <q-drawer v-model="leftDrawerOpen" bordered content-class="bg-primary">
      <q-list>
        <q-item-label header>Essential Links</q-item-label>
        <q-item flat :key="item.entryName" v-for="item in simple_menu">
          <q-btn flat v-if="item.options == null" :label="$t(item.entryName)" :to="{ name: item.routeName }" />
          <q-btn-dropdown flat :label="$t(item.entryName)" v-else menu-anchor="bottom left" menu-self="top left">
            <q-list class="rounded-borders text-white bg-primary" bordered separator padding>
              <q-item
                clickable
                v-close-popup
                :key="option.entryName"
                v-for="option in item.options"
                :to="{ name: option.routeName }"
                active-class="text-grey"
              >
                <q-item-section>
                  <q-item-label class="text-bold">{{ $t(option.entryName) }}</q-item-label>
                  <q-item-label class="text-grey" caption lines="2">{{ $t(option.summary) }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </q-item>
      </q-list>
    </q-drawer>
  </q-header>
</template>

<script>
import NetworkSearchBar from '@/components/search_bar/NetworkSearchBar'

const simple_menu = [
  {
    entryName: 'header.home',
    routeName: 'home',
  },
  {
    entryName: 'header.reports',
    routeName: 'global_report',
    options: [
      {
        entryName: 'header.globalReport',
        routeName: 'global_report',
        summary: 'Alarms reported across all networks',
      },
      {
        entryName: 'header.countryReport',
        routeName: 'countries',
        summary: 'Overview of Internet resources per country',
      },
      {
        entryName: 'header.networkReport',
        routeName: 'networks',
        summary: 'Details for a single network (AS or IXP)',
      },
      {
        entryName: 'header.rovReport',
        routeName: 'rov',
        summary: 'Route Origin Validation of resources seen on BGP',
      },
      {
        entryName: 'header.covid19',
        routeName: 'covid19',
        summary: 'RTT analysis during national lockdowns',
      },
    ],
  },
  {
    entryName: 'header.tools',
    routeName: 'global_report',
    options: [
      {
        entryName: 'header.metis',
        routeName: 'metis',
        summary: 'Atlas probe selection and deployment',
      },
    ],
  },
  {
    entryName: 'header.documentation',
    routeName: 'documentation',
  },
  {
    entryName: 'header.API',
    routeName: 'api',
  },
  {
    entryName: 'header.contact',
    routeName: 'contact',
  },
]

// subset of router, see router.js
export default {
  name: 'AppHeader',
  components: {
    NetworkSearchBar,
  },
  data() {
    return {
      text: '',
      simple_menu: simple_menu,
      sidebarOpened: false,
      loginError: false,
      leftDrawerOpen: false,
    }
  },
  mounted() {
    document.title = 'Internet Health Report'
  },
  methods: {
    expandSidebar() {
      this.sidebarOpened = !this.sidebarOpened
    },
    login(email, password) {
      if (this.$ihrStyle.validateEmail(email) && this.$ihrStyle.validatePassword(password)) {
        this.$ihr_api.userLogin(
          email,
          password,
          () => {},
          () => {
            this.loginError = true
          }
        )
      }
    },
    logout() {
      this.$ihr_api.userLogout()
    },
  },
}
</script>
<style lang="stylus">
@import '~@/styles/header.styl'
</style>
