<template>
  <q-header elevated primary class="IHR_minimum-width">
    <q-toolbar class="q-py-sm q-px-lg row">
      <div class="col-8 row no-wrap items-center">
        <div>
          <!--<q-btn flat @click="expandSidebar">-->
          <!--<q-icon name="fas fa-bars" class="text-white" />-->
          <!--</q-btn>-->
        </div>
        <q-item id="IHR_home-button">
          <router-link :to="{ name: 'home' }">
            <q-btn round dense flat :ripple="false" no-caps size="22px">
              <img src="@/assets/imgs/ihr_logo.svg" style="width: 45px;" />
            </q-btn>
          </router-link>
        </q-item>
        <network-search-bar />

        <div
          class="IHR_menu-entries q-ml-xs q-gutter-md text-body2 text-weight-bold row items-center no-wrap"
        >
          <router-link
            :key="item.entryName"
            :to="{ name: item.routeName }"
            v-for="item in simple_menu"
            >{{ $t(item.entryName) }}</router-link
          >
        </div>
      </div>
    <div class="col-4 row no-wrap justify-end">
        <div
          class="IHR_menu-entries q-ml-xs q-gutter-md text-body2 text-weight-bold row items-center no-wrap"
        >
        <router-link :to="{ name:'covid19' }">RTT/COVID-19</router-link>
        </div>
    </div>
      <!--Log in /Log out stuff here-->
    </q-toolbar>
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
    entryName: "header.globalReport",
    routeName: "global_report"
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
  }
];

// subset of router, see router.js
export default {
  name: "Default",
  components: {
    NetworkSearchBar
  },
  data() {
    return {
      text: "",
      simple_menu: simple_menu,
      sidebarOpened: false,
      loginError: false
    };
  },
  mounted() {
    document.title = "Internet Health Report";
  },
  methods: {
    expandSidebar() {
      this.sidebarOpened = !this.sidebarOpened;
    },
    login(email, password) {
      if (
        this.$ihrStyle.validateEmail(email) &&
        this.$ihrStyle.validatePassword(password)
      ) {
        this.$ihr_api.userLogin(
          email,
          password,
          () => {},
          () => {
            this.loginError = true;
          }
        );
      }
    },
    logout() {
      this.$ihr_api.userLogout();
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
    min-width 800px !important

  &menu-entries
    a, button
      menu-delinkify 1

    button
      box-shadow none

  &dropdown-menu
    background-color $info

    a
      menu-delinkify 1

  &footer
    & a
      color white

    ~/fsection
      padding-top 5pt
      border-left solid gray 1px

      &first-child
        border-left none

    ~/copyright
      & > div
        margin 7pt 0pt

    ~/external-links
      font-size 3.0em
      text-decoration none

      & a
        color white

    ~/sitemap
      font-size 12pt
      font-weight 300
      text-align center

      & > span
        padding-left 20pt
        text-align left
        & a
            menu-delinkify 0
        & > ul
          margin-top 2pt
          & > li
            list-style-type: none;
            text-align left
            & > strong
                text-transform capitalize

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
