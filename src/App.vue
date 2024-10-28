<script setup>
import { RouterView } from 'vue-router'
import { QLayout, QPageContainer, QIcon } from 'quasar'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import LocalStorageBanner from './components/LocalStorageBanner.vue'

let scrollPosition = ref(0)

const showScrollTopButton = () => {
  return scrollPosition > 0
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const updateScrollPosition = () => {
  scrollPosition = window.scrollY
}

onMounted(() => {
  window.addEventListener('scroll', updateScrollPosition)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateScrollPosition)
})
</script>

<template>
  <QLayout view="hHh LpR fff" id="app">
    <Header></Header>
    <QPageContainer>
      <RouterView />
      <!-- <div id="IHR_last-element">&nbsp;</div> -->
    </QPageContainer>
    <Footer></Footer>
    <button
      v-if="showScrollTopButton"
      @click="scrollToTop"
      class="IHR_scroll-btn bg-primary text-white"
    >
      <QIcon name="fas fa-arrow-up"></QIcon>
    </button>
  </QLayout>
  <LocalStorageBanner :disable="true" />
</template>

<style lang="stylus">
menu-delinkify(val)
  font-size 1rem
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

      &first-child
        border-left none

    ~/copyright
      & > div
        margin 0.5rem 0

    ~/external-links
      font-size 3.0em
      text-decoration none

      & a
        color white

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

  &forgotten-password
    white-space nowrap

  &user-menu
    padding 0.25rem
    font-size 1rem
    & *:first-letter
      text-transform capitalize

  &last-element
    height 50px;
</style>
