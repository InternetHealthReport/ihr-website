<template>
  <q-layout view="hHh LpR fff" id="app">
    <q-header elevated primary>
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
          <search-bar dark/>
          <div
            class="IHR_menu-entries q-ml-xs q-gutter-md text-body2 text-weight-bold row items-center no-wrap"
          >
            <router-link
              :key="item.entryName"
              :to="{name : item.routeName}"
              v-for="item in simple_menu"
            >{{$t(item.entryName)}}</router-link>
            <q-btn-dropdown
              color="primary"
              :label="$t(item.section)"
              :key="item.section"
              v-for="item in dropdown_menu"
            >
              <q-list class="IHR_dropdown-menu">
                <q-item v-close-popup :key="subItem.entryName" v-for="subItem in item.content">
                  <router-link :to="{name : item.routeName}">{{$t(subItem.entryName)}}</router-link>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </div>
        </div>
        <div class="col-4 row no-wrap justify-end">
          <div v-if="$ihr_api.authenticated" class="q-pl-sm q-gutter-sm row items-center no-wrap">
            <q-btn dense flat round size="13px" icon="fas fa-bell" />
            <q-btn dense flat no-wrap>
              <q-avatar rounded size="30px">
                <q-icon name="fas fa-user-circle" color="accent"/>
              </q-avatar>
              <q-icon name="fas fa-sort-down" size="16px"/>
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
                      <router-link :to="{name : 'personal_page', hash: '#profile'}" class="IHR_delikify">
                        {{$t('user.profile')}}
                      </router-link>
                    </q-item-section>
                  </q-item>
                  <q-item clickable>
                    <q-item-section>
                      <router-link :to="{name : 'personal_page', hash: '#settings'}" class="IHR_delikify">
                        {{$t('user.settings')}}
                      </router-link>
                    </q-item-section>
                  </q-item>
                  <q-item clickable @click="logout">
                    <q-item-section>
                      <router-link to="/" class="IHR_delikify">
                        {{$t('user.logout')}}
                      </router-link>
                    </q-item-section>
                  </q-item>
                  <q-separator />
                  <q-separator />
                  <q-item clickable>
                    <q-item-section>
                      {{$t('user.signOut')}}
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
          <div v-else  class="IHR_menu-entries col-12 row items-center justify-end q-gutter-md">
            <router-link :to="{name : 'sign_up'}" >
              <span>{{$t('header.signUp')}}</span>
            </router-link>
            <q-btn dense flat no-wrap>
              <span>{{$t('header.signIn')}}</span>
              <q-menu>
                <q-list dense>
                  <q-item>
                    <q-item-section >
                      <h4 id="IHR_sigin-title">{{$t('header.signInTitle')}}</h4>
                      </q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item>
                    <login-form v-model="loginError">
                      <template v-slot:default="user" @keydown.enter="login(user.email, user.password)">
                        <q-btn color="secondary" id="IHR_signin-button" @click="login(user.email, user.password)">
                          {{$t('header.signIn')}}
                        </q-btn>
                      </template>
                    </login-form>
                  </q-item>
                  <q-item>
                    <q-item-section class="row no-wrap" id="IHR_forgotten-password">
                      {{$t('header.ForgottenPassword')}}<router-link :to="{name : 'reset_password'}" >
                        {{$t('header.here')}}
                      </router-link>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
          <locale-selector id="IHR_local-selector"/>
        </div>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view :show-sidebar="sidebarOpened" @sidebar-action="sidebarOpened = $event"/>
    </q-page-container>
    <q-footer elevated primary class="IHR_footer text-white text-center row items-end">
      <span class="col-2 IHR_copyright">Internet Healt Report 2019 &#9400;</span>
      <span class="IHR_sitemap col-8">
        <router-link
          :key="item.entryName"
          :to="{name : item.routeName}"
          v-for="item in [...simple_menu, ...dropdown_menu]"
        >{{$t(item.entryName)}}</router-link>
      </span>
      <span class="IHR_external-links col-2">
        <a href="https://twitter.com/ihr_alerts">
          <q-icon name="fab fa-twitter-square" />
        </a>
        <a href="https://github.com/InternetHealthReport">
          <q-icon name="fab fa-github-square" />
        </a>
      </span>
    </q-footer>
  </q-layout>
</template>
<script>
import languages from "quasar/lang/index.json";
import LocaleSelector from "@/locales/LocaleSelector";
import SearchBar from "@/components/SearchBar";
import routerBase from "@/router";
import LoginForm from "@/components/forms/LoginForm"

// subset of router, see router.js

const simple_menu = [
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

const dropdown_menu = [
  {
    section: "header.participants",
    content: [
      {
        entryName: "header.networks",
        routeName: "networks"
      },
      {
        entryName: "header.countries",
        routeName: "countries"
      }
    ]
  }
];

export default {
  name: "Default",
  components: {
    LocaleSelector,
    SearchBar,
    LoginForm
  },
  data() {
    return {
      text: "",
      simple_menu: simple_menu,
      dropdown_menu: dropdown_menu,
      sidebarOpened: false,
      loginError: false
    };
  },
  methods: {
    expandSidebar() {
      this.sidebarOpened = !this.sidebarOpened;
    },
    login(email, password) {
      if(this.$ihrStyle.validateEmail(email) && this.$ihrStyle.validatePassword(password)) {
        this.$ihr_api.userLogin(email, password, ()=>{}, ()=>{
          this.loginError = true
        })
      }
    },
    logout(){
      this.$ihr_api.userLogout();
    }
  },
  computed: {
    atBottom() {
      let element = this.$refs.scroll;
      console.log(this.$refs);
      console.log(element);
    }
  }
};
</script>
<style lang="stylus">
@import '~quasar-variables';

#app
  min-width 970px

menu-delinkify()
  font-size 12pt
  color white
  text-decoration none
  text-transform capitalize
  font-weight 700

.IHR_
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
      border-left solid gray 1px

      &first-child
        border-left none

    ~/copyright
      vertical-align bottom

    ~/external-links
      font-size 18pt

      & a
        color white

    ~/sitemap
      font-size 18pt

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
</style>