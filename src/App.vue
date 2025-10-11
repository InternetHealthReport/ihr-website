<script setup>
import { RouterView } from 'vue-router'
import { QLayout, QPageContainer, QIcon } from 'quasar'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import LocalStorageBanner from './components/LocalStorageBanner.vue'

// Throttle function
const throttle = (func, delay) => {
  let lastCall = 0
  return (...args) => {
    const now = new Date().getTime()
    if (now - lastCall < delay) return
    lastCall = now
    return func(...args)
  }
}

// Anti-shake function
const debounce = (func, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

const scrollPosition = ref(0)

const showScrollTopButton = computed(() => {
  return scrollPosition.value > 0
})

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

const updateScrollPosition = throttle(() => {
  scrollPosition.value = window.scrollY
}, 100) // Updated every 100ms

// Throttle the scrolling process (every 100ms)
const throttledUpdate = throttle(updateScrollPosition, 100)
// Anti-shake processing scroll stop (100ms delay)
const debouncedUpdate = debounce(updateScrollPosition, 100)

onMounted(() => {
  window.addEventListener(
    'scroll',
    (event) => {
      throttledUpdate(event) // Throttling updates during scrolling
      debouncedUpdate(event) // Anti-shake update after scrolling stops
    },
    { passive: true }
  )
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', throttledUpdate)
  window.removeEventListener('scroll', debouncedUpdate)
})
</script>

<template>
  <QLayout
    id="app"
    view="hHh LpR fff"
  >
    <Header />
    <QPageContainer>
      <RouterView />
      <!-- <div id="IHR_last-element"> </div> -->
    </QPageContainer>
    <Footer />
    <Transition name="fade-slide">
      <button
        v-show="showScrollTopButton"
        aria-label="Scroll to top"
        class="IHR_scroll-btn bg-primary text-white"
        @click="scrollToTop"
      >
        <QIcon name="fas fa-arrow-up" />
      </button>
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
  cursor: pointer;
  border-radius: 50%;
  color: #fff;
  padding: 0.7rem 0.8rem;
  border: 1px solid #fff;
  opacity: 0.8;
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
