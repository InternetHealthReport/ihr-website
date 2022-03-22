<template>
    <q-layout view="hHh LpR fff" id="app" class="IHR_minimum-width bg-white">
        <router-view name="header" />
        <q-page-container class="IHR_minimum-width">
            <router-view />
            <div id="IHR_last-element">&nbsp;</div>
        </q-page-container>
        <router-view name="footer" />
    </q-layout>
</template>
<script>
import languages from 'quasar/lang/index.json'
import routerBase from '@/router'

// subset of router, see router.js
export default {
    name: 'Default',
    components: {},
    data() {
        return {
            text: '',
        }
    },
}
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
