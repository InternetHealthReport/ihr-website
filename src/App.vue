<template>
  <q-layout view="hHh LpR fff" id="app" class="IHR_minimum-width">
    <q-header elevated primary  class="IHR_minimum-width">
      <q-toolbar class="q-py-sm q-px-md row">
        <div class="col-8 row no-wrap items-center">
          <div>
            <q-btn flat @click="expandSidebar">
              <q-icon name="fas fa-bars" class="text-white" />
            </q-btn>
          </div>
          <q-item id="IHR_home-button">
            <router-link :to="{name : 'home'}">
              <q-btn round dense flat :ripple="false" no-caps size="22px">
                <img src="@/assets/imgs/ihr_logo.svg" style="width: 80%;" />
              </q-btn>
            </router-link>
          </q-item>
          <network-search-bar dark />
          <div
            class="IHR_menu-entries q-ml-xs q-gutter-md text-body2 text-weight-bold row items-center no-wrap"
          >
            <router-link
              :key="item.entryName"
              :to="{name : item.routeName}"
              v-for="item in simple_menu"
            >{{$t(item.entryName)}}</router-link>
          </div>
        </div>
        <div class="col-4 row no-wrap justify-end">
          <div v-if="$ihr_api.authenticated" class="q-pl-sm q-gutter-sm row items-center no-wrap">
            <q-btn dense flat round size="13px" icon="fas fa-bell" />
            <q-btn dense flat no-wrap>
              <q-avatar rounded size="30px">
                <q-icon name="fas fa-user-circle" color="accent" />
              </q-avatar>
              <q-icon name="fas fa-sort-down" size="16px" />
              <q-menu auto-close id="IHR_user-menu">
                <q-list dense>
                  <q-item>
                    <q-item-section>
                      <div>
                        {{$t('user.signedAs')}}
                        <strong>{{$ihr_api.user}}</strong>
                      </div>
                    </q-item-section>
                  </q-item>
                  <q-separator />
                  <q-separator />
                  <q-item clickable>
                    <q-item-section>
                      <router-link
                        :to="{name : 'personal_page', hash: '#profile'}"
                        class="IHR_delikify"
                      >{{$t('user.profile')}}</router-link>
                    </q-item-section>
                  </q-item>
                  <q-item clickable>
                    <q-item-section>
                      <router-link
                        :to="{name : 'personal_page', hash: '#settings'}"
                        class="IHR_delikify"
                      >{{$t('user.settings')}}</router-link>
                    </q-item-section>
                  </q-item>
                  <q-item clickable @click="logout">
                    <q-item-section>
                      <router-link to="/" class="IHR_delikify">{{$t('user.logout')}}</router-link>
                    </q-item-section>
                  </q-item>
                  <q-separator />
                  <q-separator />
                  <q-item clickable>
                    <q-item-section>{{$t('user.signOut')}}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
          <div v-else class="IHR_menu-entries col-12 row items-center justify-end q-gutter-md">
            <router-link :to="{name : 'sign_up'}">
              <span>{{$t('header.signUp')}}</span>
            </router-link>
            <q-btn dense flat no-wrap>
              <span>{{$t('header.signIn')}}</span>
              <q-menu>
                <q-list dense>
                  <q-item>
                    <q-item-section>
                      <h4 id="IHR_sigin-title">{{$t('header.signInTitle')}}</h4>
                    </q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item>
                    <login-form v-model="loginError">
                      <template
                        v-slot:default="user"
                        @keydown.enter="login(user.email, user.password)"
                      >
                        <q-btn
                          color="secondary"
                          id="IHR_signin-button"
                          @click="login(user.email, user.password)"
                        >{{$t('header.signIn')}}</q-btn>
                      </template>
                    </login-form>
                  </q-item>
                  <q-item>
                    <q-item-section class="row no-wrap" id="IHR_forgotten-password">
                      <router-link :to="{name : 'reset_password'}">{{$t('header.ForgottenPassword')}}</router-link>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
          <!--<locale-selector id="IHR_local-selector" />-->
        </div>
      </q-toolbar>
    </q-header>
    <q-page-container class="IHR_minimum-width">
      <router-view :show-sidebar="sidebarOpened" @sidebar-action="sidebarOpened = $event === true" />
      <div id="IHR_last-element">&nbsp;</div>
    </q-page-container>
    <q-footer
      elevated
      primary
      class="IHR_minimum-width IHR_footer text-white text-center row items-streatch content-stretch no-wrap justiy-between"
    >
      <span class="col-2 IHR_copyright">
        <div>
          <strong>Internet Health Report 2019 &#9400;</strong>
        </div>
        <div>
          <router-link :to="{name : 'home'}">
            <q-btn round dense flat :ripple="false" no-caps size="22px">
              <img src="@/assets/imgs/ihr_logo.svg" style="width: 80%;" />
            </q-btn>
          </router-link>
        </div>
      </span>
      <span class="IHR_sitemap col-8 row">
        <span class="col-4">
          <ul>
            <li>
              <strong>{{$t('footer.reportPages.title')}}</strong>
            </li>
            <li>
              <router-link
                :to="{name : 'global_report'}"
              >{{$t('footer.reportPages.global')}}</router-link>
            </li>
            <li>
              <router-link
                :to="{name : 'as_and_ixp', params:{ asn: 2497 }}"
              >{{$t('footer.reportPages.network')}}</router-link>
            </li>
          </ul>
        </span>
        <span class="col-4">
          <ul>
            <li>
              <strong>{{$t('footer.documentation.title')}}</strong>
            </li>
            <li>
              <router-link
                :to="{name : 'docs'}"
              >{{$t('footer.documentation.modulesExplanation')}}</router-link>
            </li>
            <li>
              <router-link
                :to="{name : 'api'}"
              >{{$t('footer.documentation.apiEndpoints')}}</router-link>
            </li>
            <li>
              <router-link
                :to="{name : 'python_wrapper'}"
              >{{$t('footer.documentation.pythonWrapper')}}</router-link>
            </li>
          </ul>
        </span>
        <span class="col-4">
          <ul>
            <li>
              <strong>{{$t('footer.about.title')}}</strong>
            </li>
            <li>
              <router-link
                :to="{name : 'policy'}"
              >{{$t('footer.about.policy')}}</router-link>
            </li>
            <li>
              <router-link
                :to="{name : 'contacts'}"
              >{{$t('footer.about.contacts')}}</router-link>
            </li>
            <li>
              <router-link
                :to="{name : 'acknowledgments'}"
              >{{$t('footer.about.acknowledgments')}}</router-link>
            </li>
          </ul>
        </span>
      </span>
      <span class="IHR_external-links col-2 ">
        <div class="row wrap justify-around">
          <a href="https://twitter.com/ihr_alerts" class="col-4">
            <q-icon name="fab fa-twitter-square" />
          </a>
          <a href="https://github.com/InternetHealthReport" class="col-4">
            <q-icon name="fab fa-github-square" />
          </a>
          <router-link :to="{name : 'contacts'}" class="col-4">
            <q-icon name="fas fa-envelope-square" />
          </router-link>
        </div>
      </span>
    </q-footer>
  </q-layout>
</template>
<script>
import languages from "quasar/lang/index.json";
import LocaleSelector from "@/locales/LocaleSelector";
import NetworkSearchBar from "@/components/search_bar/NetworkSearchBar";
import routerBase from "@/router";
import LoginForm from "@/components/forms/LoginForm";

// subset of router, see router.js

const simple_menu = [
  {
    entryName: "header.globalReport",
    routeName: "global_report"
  },
  {
    entryName: "header.documentation",
    routeName: "docs"
  },
  {
    entryName: "header.API",
    routeName: "api"
  },
  {
    entryName: "header.contacts",
    routeName: "contacts"
  }
];

export default {
  name: "Default",
  components: {
    LocaleSelector,
    NetworkSearchBar,
    LoginForm
  },
  data() {
    return {
      text: "",
      simple_menu: simple_menu,
      sidebarOpened: false,
      loginError: false
    };
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
    min-width 945px !important

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
    & > *
      padding-top 5pt
      border-left solid gray 1px

      &first-child
        border-left none

    ~/copyright
      & > div
        margin 7pt 0pt

    ~/external-links
      font-size 3.5em

      & a
        color white

    ~/sitemap
      font-size 12pt
      font-weight 300
      text-align center
      & a
        menu-delinkify 0

      & > span
        padding-left 20pt
        text-align left
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
