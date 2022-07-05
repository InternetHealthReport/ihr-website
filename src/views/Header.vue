<template>
  <q-header elevated primary class="IHR_minimum-width">
    <q-toolbar class="q-py-sm q-px-lg row">
      <div class="col-12 row no-wrap items-center">
        <q-item id="IHR_home-button">
          <router-link :to="{ name: 'home' }">
            <q-btn round dense flat :ripple="false" no-caps size="22px">
              <img src="@/assets/imgs/ihr_logo.svg" style="width: 45px;" />
            </q-btn>
          </router-link>
        </q-item>
        <network-search-bar class="col-3 q-px-sm" />
        <div class="IHR_menu-entries text-body2 text-weight-bold row items-center no-wrap">
          <q-btn-group flat :key="item.entryName" v-for="item in simple_menu">
            <q-btn flat v-if="item.options == null" :label="$t(item.entryName)" :to="{ name: item.routeName }" />
            <q-btn-dropdown flat :label="$t(item.entryName)" v-else menu-anchor="bottom left" menu-self="top left">
              <q-list class="rounded-borders text-white bg-primary" bordered separator padding>
                <q-item clickable v-close-popup :key="option.entryName" v-for="option in item.options"
                  :to="{ name: option.routeName }" active-class="text-grey">
                  <q-item-section>
                    <q-item-label class="text-bold">{{ $t(option.entryName) }}</q-item-label>
                    <q-item-label class="text-grey" caption lines="2">{{ $t(option.summary) }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </q-btn-group>
          <div v-if="!user || user === 'null'" style="position:absolute;right:30px;line-height:68px">
            <q-btn flat :label="$t('header.login')" :to="{ name: 'login' }" />
            <q-btn flat :label="$t('header.register')" :to="{ name: 'register' }" />
          </div>
          <div v-else style="position:absolute;right:30px;line-height:68px">
            <q-btn flat :label="user" />
            <q-btn flat :label="$t('header.logout')" @click="logout" />
          </div>
        </div>
      </div>
      <!--Log in /Log out stuff here-->
    </q-toolbar>
    <q-dialog v-model="emailSent">
      <q-card style="width: 300px">
        <q-card-section>
          <div class="text-h6">Alert</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          {{ message }}
        </q-card-section>

        <q-card-actions align="right" class="bg-white text-teal">
          <q-btn flat label="OK" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-header>

</template>

<script>
import NetworkSearchBar from "@/components/search_bar/NetworkSearchBar";

const simple_menu = [
  {
    entryName: "header.home",
    routeName: "home"
  },
  {
    entryName: "header.reports",
    routeName: "global_report",
    options: [
      {
        entryName: "header.globalReport",
        routeName: "global_report",
        summary: "Alarms reported across all networks"
      },
      {
        entryName: "header.countryReport",
        routeName: "countries",
        summary: "Overview of Internet ressources per country"
      },
      {
        entryName: "header.networkReport",
        routeName: "networks",
        summary: "Details for a single network (AS or IXP)"
      },
      {
        entryName: "header.rovReport",
        routeName: "rov",
        summary: "Route Origin Validation of ressources seen on BGP"
      },
      {
        entryName: "header.covid19",
        routeName: "covid19",
        summary: "RTT analysis during national lockdowns"
      }
    ]
  },
  {
    entryName: "header.documentation",
    routeName: "documentation"
  },
  {
    entryName: "header.API",
    routeName: "api"
  },
  {
    entryName: "header.contact",
    routeName: "contact"
  },
  {
    entryName: "header.select",
    routeName: "select"
  },
];

// subset of router, see router.js
export default {
  name: "HeaderPage",
  components: {
    NetworkSearchBar
  },
  props: ["login"],
  watch: {
    login(newV, oldV) {
      console.log(111, newV, oldV)
      this.user = newV
    },
    deep: true
  },
  data() {
    return {
      text: "",
      user: "",
      simple_menu: simple_menu,
      sidebarOpened: false,
      emailSent: false,
      message: "",
    };
  },
  mounted() {
    document.title = "Internet Health Report";
    this.user = this.$ihr_api._get_user()
  },
  methods: {
    expandSidebar() {
      this.sidebarOpened = !this.sidebarOpened;
    },
    logout() {
      this.$ihr_api.userLogout(
        res => {
          this.emailSent = true
          this.message = res.msg
          if (res.code === 200) {
            this.user = ''
            this.$emit('logout')
          }
        },
        error => {
          this.emailSent = true
          this.message = error.detail
        });
    }
  }
};
</script>
<style lang="stylus">
@import '~quasar-variables';

menu-delinkify(val)
  font-size 12pt
  color white
  text-decoration none
  text-transform capitalize
  if val
    font-weight 700

.IHR_
  &minimum-width
    min-width 640px !important

  &menu-entries
    a, button
      menu-delinkify 1

    button
      box-shadow none

  &dropdown-menu
    background-color $primary

    a
      menu-delinkify 1

#IHR_
  &home-button
    padding 0px 13px 0px 2px

  &signin-button
    margin 2pt 0pt 3pt 0pt

  &sigin-title
    font-weight 500
    font-size 15pt
    margin 3pt auto 2pt auto
    &:first-letter
      text-transform capitalize

  &local-selector
    margin-left 7pt

  &forgotten-password
    white-space nowrap

  &user-menu
    padding 3pt
    font-size 12pt
    & *:first-letter
      text-transform capitalize

  &last-element
    height 50px;
</style>
