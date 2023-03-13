<template>
  <q-layout view="hHh LpR fff" id="app" class="IHR bg-white">
    <router-view name="header" />
    <q-page-container>
      <router-view />
      <div id="IHR_last-element">&nbsp;</div>
    </q-page-container>
    <router-view name="footer" />
    <button v-if="showScrollTopButton" @click="scrollToTop" class="IHR_scroll-btn bg-primary text-white"><q-icon name="fas fa-arrow-up"></q-icon></button>
  </q-layout>
</template>
<script>
// subset of router, see router.js
export default {
  name: 'App',
  components: {},
  data() {
    return {
      text: '',
      scrollPosition: 0
    }
  },
  computed: {
    showScrollTopButton() {
      return this.scrollPosition > 0;
    }
  },
  methods: { 
    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    },
    updateScrollPosition() {
      this.scrollPosition = window.scrollY;
    }
  }, 
  mounted() {
    window.addEventListener('scroll', this.updateScrollPosition);
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.updateScrollPosition);
  }
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

  &scroll-btn
    position fixed
    bottom 20px
    right 20px
    z-index 2000
    cursor pointer
    transition all 0.6s
    border-radius 50%
    color white
    padding 0.7rem 0.8rem
    border 1px solid white
    opacity 0.8
    &:hover
      transform scale(1.1)

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
