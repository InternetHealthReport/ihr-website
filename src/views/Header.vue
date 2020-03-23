<template>
    <q-header elevated primary  class="IHR_minimum-width">
      <q-toolbar class="q-py-sm q-px-lg row">
        <div class="col-8 row no-wrap items-center">
          <div>
            <!--<q-btn flat @click="expandSidebar">-->
              <!--<q-icon name="fas fa-bars" class="text-white" />-->
            <!--</q-btn>-->
          </div>
          <q-item id="IHR_home-button">
            <router-link :to="{name : 'home'}">
              <q-btn round dense flat :ripple="false" no-caps size="22px">
                <img src="@/assets/imgs/ihr_logo.svg" style="width: 45px;" />
              </q-btn>
            </router-link>
          </q-item>
          <network-search-bar/>

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

        <!--Log in /Log out stuff here-->
      </q-toolbar>
    </q-header>
</template>

<script>
import NetworkSearchBar from "@/components/search_bar/NetworkSearchBar";
import LoginForm from "@/components/forms/LoginForm";
import LocaleSelector from "@/locales/LocaleSelector";

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
    NetworkSearchBar,
    LoginForm,
    LocaleSelector,
  },
  data() {
    return {
      text: "",
      simple_menu: simple_menu,
      sidebarOpened: false,
      loginError: false
    };
  },
  mounted(){ 
    document.title = 'Internet Health Report';
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
  },
};
</script>
