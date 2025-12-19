<script setup>
import { RouterView } from 'vue-router'
import { QLayout, QPageContainer, QBtn } from 'quasar'
import { ref } from 'vue'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import LocalStorageBanner from './components/LocalStorageBanner.vue'

const scrollPosition = ref(0)

const scroll = (event) => {
  scrollPosition.value = event.position
}

const scrollToTop = () => {
  try {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  } catch (error) {
    console.error('Error scrolling to top:', error)
    window.scrollTo(0, 0) // Backup programme
  }
}
</script>

<template>
  <QLayout id="app" view="hHh LpR fff" @scroll="scroll">
    <Header />
    <QPageContainer>
      <RouterView />
      <!-- <div id="IHR_last-element"> </div> -->
    </QPageContainer>
    <Footer />
    <Transition name="fade-slide">
      <div class="IHR_scroll-btn" v-if="scrollPosition > 0">
        <QBtn icon="fas fa-arrow-up" class="bg-primary text-white" round @click="scrollToTop" />
      </div>
    </Transition>
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
  border-radius: 50%;
  border: 1px solid #fff;
}
.IHR_scroll-btn:hover {
  transform: scale(1.1);
}
.IHR_scroll-btn:focus {
  outline: 2px solid #fff;
}

/* Transition animation */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.3s ease-in-out,
    transform 0.3s ease-in-out;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}

#IHR_home-button {
  padding: 0 13px 0 2px;
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
