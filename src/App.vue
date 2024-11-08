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

<style>
.IHR_menu-entries a,
.IHR_menu-entries button {
  font-size: 1rem;
  color: #fff;
  text-decoration: none;
  text-transform: capitalize;
  font-weight: 700;
}
.IHR_menu-entries button {
  box-shadow: none;
}
.IHR_footer a {
  color: #fff;
}
.IHR_footer afirst-child {
  border-left: none;
}
.IHR_copyright > div {
  margin: 0.5rem 0;
}
.IHR_external-links {
  font-size: 3em;
  text-decoration: none;
}
.IHR_external-links a {
  color: #fff;
}
.IHR_scroll-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2000;
  cursor: pointer;
  transition: all 0.6s;
  border-radius: 50%;
  color: #fff;
  padding: 0.7rem 0.8rem;
  border: 1px solid #fff;
  opacity: 0.8;
}
.IHR_scroll-btn:hover {
  transform: scale(1.1);
}
#IHR_home-button {
  padding: 0px 13px 0px 2px;
}
#IHR_forgotten-password {
  white-space: nowrap;
}
#IHR_user-menu {
  padding: 0.25rem;
  font-size: 1rem;
}
#IHR_user-menu *:first-letter {
  text-transform: capitalize;
}
#IHR_last-element {
  height: 50px;
}

</style>
