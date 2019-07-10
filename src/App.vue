<template>
  <q-layout id="app">
    <q-header elevated class="" primary>
      <q-toolbar class="q-py-sm q-px-md">
        <q-item>
          <router-link :to="{name : 'home'}">
            <q-btn round dense flat :ripple="false" no-caps size="22px">
              <img src="@/assets/imgs/logo_ihr.png" style="width: 80%;">
            </q-btn>
          </router-link>
        </q-item>
        <search-bar></search-bar>
        <div class="IHR_menu-entries q-ml-xs q-gutter-md text-body2 text-weight-bold row items-center no-wrap">
          <router-link v-bind:key="item.entryName" :to="{name : item.routeName}"  v-for="item in simple_menu">
            {{$t(item.entryName)}}
          </router-link>
          <q-btn-dropdown color="primary" :label="$t(item.section)" v-bind:key="item.section" v-for="item in dropdown_menu">
            <q-list class="IHR_dropdown-menu">
              <q-item v-close-popup v-bind:key="subItem.entryName"  v-for="subItem in item.content">
                  <router-link :to="{name : item.routeName}">
                    {{$t(subItem.entryName)}}
                  </router-link>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
        <q-space />
        <div class="q-pl-sm q-gutter-sm row items-center no-wrap">
          <q-btn v-if="$q.screen.gt.xs" dense flat round size="sm" icon="fas fa-bell" />
          <q-btn v-if="$q.screen.gt.xs" dense flat>
            <div class="row items-center no-wrap">
              <q-icon name="fas fa-plus-square" size="20px" />
              <q-icon name="fas fa-sort-down" size="16px" style="margin-left: -2px" />
            </div>
            <q-menu auto-close>
              <q-list dense style="min-width: 100px">
                <q-item clickable class="GL__menu-link">
                  <q-item-section>New repository</q-item-section>
                </q-item>
                <q-item clickable class="GL__menu-link">
                  <q-item-section>Import repository</q-item-section>
                </q-item>
                <q-item clickable class="GL__menu-link">
                  <q-item-section>New gist</q-item-section>
                </q-item>
                <q-item clickable class="GL__menu-link">
                  <q-item-section>New organization</q-item-section>
                </q-item>
                <q-separator />
                <q-item-label header>This repository</q-item-label>
                <q-item clickable class="GL__menu-link">
                  <q-item-section>New issue</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>

          <q-btn dense flat no-wrap>
            <q-avatar rounded size="20px">
              <img src="https://cdn.quasar.dev/img/avatar3.jpg">
            </q-avatar>
            <q-icon name="fas fa-sort-down" size="16px" />
            <q-menu auto-close>
              <q-list dense>
                <q-item class="GL__menu-link-signed-in">
                  <q-item-section>
                    <div>Signed in as <strong>Mary</strong></div>
                  </q-item-section>
                </q-item>
                <q-separator />
                <q-separator />
                <q-item clickable class="GL__menu-link">
                  <q-item-section>Your profile</q-item-section>
                </q-item>
                <q-item clickable class="GL__menu-link">
                  <q-item-section>Your repositories</q-item-section>
                </q-item>
                <q-item clickable class="GL__menu-link">
                  <q-item-section>Your projects</q-item-section>
                </q-item>
                <q-item clickable class="GL__menu-link">
                  <q-item-section>Your stars</q-item-section>
                </q-item>
                <q-item clickable class="GL__menu-link">
                  <q-item-section>Your gists</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable class="GL__menu-link">
                  <q-item-section>Help</q-item-section>
                </q-item>
                <q-item clickable class="GL__menu-link">
                  <q-item-section>Settings</q-item-section>
                </q-item>
                <q-item clickable class="GL__menu-link">
                  <q-item-section>Sign out</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <locale-selector/>
        </div>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import languages from "quasar/lang/index.json";
import LocaleSelector from "@/locales/LocaleSelector";
import SearchBar from "@/components/SearchBar";
import routerBase from "@/router"

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
]

const dropdown_menu = [
  {
    section : "header.participants",
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
  data () {
    return {
      text: "",
      simple_menu: simple_menu,
      dropdown_menu: dropdown_menu
    };
  }
}
</script>
<style lang="stylus">
@import '~quasar-variables'

menu-delinkify()
  font-size 12pt
  color: white
  text-decoration none
  text-transform capitalize
  font-weight 700

.IHR_
  &selected-menu-link

  &menu-entries
    a,
    button
      menu-delinkify 1
    button
      box-shadow none

  &dropdown-menu
    background-color $info
    a
      menu-delinkify 1

  /*
.GL
  &__select-GL__menu-link
    .default-type
      visibility hidden

    &:hover
      background #0366d6
      color white
      .q-item__section--side
        color white
      .default-type
        visibility visible

  &__toolbar-link
    a
      color white
      text-decoration none
      &:hover
        opacity 0.7

  &__menu-link:hover
    background #0366d6
    color white

  &__menu-link-signed-in
  &__menu-link-status
    &:hover
      & > div
        background white !important

  &__menu-link-status
    color $blue-grey-6
    &:hover
      color $light-blue-9

  &__toolbar-select.q-field--focused
    width 450px !important
    .q-field__append
      display none
*/
</style>
<!--
//flags incons

<div>Icons made by 
<a href="https://www.freepik.com/?__hstc=57440181.bfe11e669d937a19a0cdcc809b9be889.1562286331749.1562286331749.1562286331749.1&__hssc=57440181.3.1562286331751&__hsfp=694215102" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/"             title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/"             
title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>


alternative
https://www.iconfinder.com/iconsets/142-mini-country-flags-16x16px
-->