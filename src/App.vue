<template>
  <q-layout view="hHh LpR fff" id="app">
    <q-header elevated primary>
      <q-toolbar class="q-py-sm q-px-md row">
        <div>
          <q-btn flat @click="expandSidebar">
            <q-icon name="fas fa-bars" class="text-white" />
          </q-btn>
        </div>
        <div class="col-8 row no-wrap">
          <q-item id="IHR_home-button">
            <router-link :to="{name : 'home'}">
              <q-btn round dense flat :ripple="false" no-caps size="22px">
                <img src="@/assets/imgs/ihr_logo.svg" style="width: 80%;" />
              </q-btn>
            </router-link>
          </q-item>
          <search-bar></search-bar>
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
          <div class="q-pl-sm q-gutter-sm row items-center no-wrap">
            <q-btn dense flat round size="sm" icon="fas fa-bell" />
            <q-btn dense flat no-wrap>
              <q-avatar rounded size="20px">
                <img src="https://cdn.quasar.dev/img/avatar3.jpg" />
              </q-avatar>
              <q-icon name="fas fa-sort-down" size="16px" />
              <q-menu auto-close>
                <q-list dense>
                  <q-item>
                    <q-item-section>
                      <div>
                        Signed in as
                        <strong>Mary</strong>
                      </div>
                    </q-item-section>
                  </q-item>
                  <q-separator />
                  <q-separator />
                  <q-item clickable>
                    <q-item-section>Your profile</q-item-section>
                  </q-item>
                  <q-item clickable>
                    <q-item-section>Your repositories</q-item-section>
                  </q-item>
                  <q-item clickable>
                    <q-item-section>Your projects</q-item-section>
                  </q-item>
                  <q-item clickable>
                    <q-item-section>Your stars</q-item-section>
                  </q-item>
                  <q-item clickable>
                    <q-item-section>Your gists</q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item clickable>
                    <q-item-section>Help</q-item-section>
                  </q-item>
                  <q-item clickable>
                    <q-item-section>Settings</q-item-section>
                  </q-item>
                  <q-item clickable>
                    <q-item-section>Sign out</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
            <locale-selector />
          </div>
          
        </div>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view :show-sidebar="sidebarOpened" @sidebar-action="sidebarOpened = $event" />
    </q-page-container>
    <q-footer
      elevated
      primary
      class="IHR_footer text-white text-center row items-end"
    >
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
    SearchBar
  },
  data() {
    return {
      text: "",
      simple_menu: simple_menu,
      dropdown_menu: dropdown_menu,
      sidebarOpened: false
    };
  },
  methods: {
    expandSidebar() {
      this.sidebarOpened = !this.sidebarOpened;
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

#app {
  min-width: 970px;
}

menu-delinkify() {
  font-size: 12pt;
  color: white;
  text-decoration: none;
  text-transform: capitalize;
  font-weight: 700;
}

.IHR_ {
  &menu-entries {
    a, button {
      menu-delinkify: 1;
    }

    button {
      box-shadow: none;
    }
  }

  &dropdown-menu {
    background-color: $info;

    a {
      menu-delinkify: 1;
    }
  }

  &footer {
    & > * {
      border-left: solid gray 1px;

      &:first-child {
        border-left: none;
      }
    }

    ~/copyright {
      vertical-align: bottom;
    }

    ~/external-links {
      font-size: 18pt;

      & a {
        color: white;
      }
    }

    ~/sitemap {
      font-size: 18pt;

      a {
        menu-delinkify: 1;
      }
    }
  }
}

#IHR_ {
  &home-button {
    padding: 0px 13px 0px 2px;
  }
}
</style>