<script setup>
import { RouterLink } from 'vue-router'
import { QCard, QCardSection, QIcon, QBtn } from 'quasar'
import Tr from '@/i18n/translation'
import UserInfo from '@/components/UserInfo.vue'
import Globe from '@/components/Globe.vue'

const ANALYSIS_MODULES = [
  {
    key: 'asInterdependence',
    name: 'homePage.analysisModules.asInterdependence',
    icon: 'fas fa-project-diagram',
    image: '/imgs/hegemony_AS2497.png'
  },
  {
    key: 'networkDelay',
    name: 'homePage.analysisModules.networkDelay',
    icon: 'fas fa-shipping-fast',
    image: '/imgs/netdelay_AS24482.png'
  },
  {
    key: 'delayAndForwarding',
    name: 'homePage.analysisModules.delayAndForwarding',
    icon: 'fas fa-exchange-alt',
    image: '/imgs/forwarding_AS174.png'
  },
  {
    key: 'disco',
    name: 'homePage.analysisModules.disco',
    icon: 'fas fa-plug',
    image: '/imgs/disco_AS16322.png'
  }
]

const REPORTS = [
  { key: 'global', icon: 'fas fa-globe', route: 'global-report' },
  { key: 'country', icon: 'fas fa-flag', route: 'country' },
  { key: 'network', icon: 'fas fa-network-wired', route: 'network' },
  { key: 'hostname', icon: 'fas fa-server', route: 'hostname' },
  { key: 'tag', icon: 'fas fa-tags', route: 'tag' },
  { key: 'rank', icon: 'fas fa-chart-bar', route: 'rank' }
]

const TOOLS = [
  { key: 'metis', icon: 'fas fa-map-marked-alt', route: 'metis' },
  { key: 'bgpMonitor', icon: 'fas fa-broadcast-tower', route: 'bgp-monitor' },
  { key: 'traceroute', icon: 'fas fa-route', route: 'traceroute-monitor' }
]

const ORGANIZATIONS = [
  { name: 'iij', logo: '/imgs/IIJ-logo.svg', url: 'https://www.iij.ad.jp/en/', height: 60 },
  { name: 'ripe', logo: '/imgs/RIPE_NCC_logo.svg', url: 'https://www.ripe.net/', height: 45 },
  {
    name: 'gsoc',
    logo: '/imgs/gsoc-logo.svg',
    url: 'https://summerofcode.withgoogle.com/',
    height: 60
  },
  { name: 'routeviews', logo: '/imgs/rv-logo.png', url: 'http://www.routeviews.org/', height: 80 },
  {
    name: 'isoc',
    logo: '/imgs/isoc-logo.png',
    url: 'https://www.internetsociety.org/',
    height: 80
  },
  {
    name: 'manrs',
    logo: '/imgs/MANRS_logo_Horz_RGB_Dark.png',
    url: 'https://www.manrs.org/',
    height: 75
  },
  {
    name: 'apnic',
    logo: '/imgs/apnic-foundation-logo.png',
    url: 'https://apnic.foundation/',
    height: 120
  },
  {
    name: 'cloudflare',
    logo: '/imgs/cloudflare-logo.png',
    url: 'https://www.cloudflare.com/',
    height: 70
  },
  { name: 'fastly', logo: '/imgs/fastly-logo.svg', url: 'https://www.fastly.com/', height: 50 }
]
</script>

<template>
  <div id="IHR_home">
    <!-- Hero -->
    <section class="hero">
      <div class="hero__bg" />
      <div class="hero__inner content-width">
        <div class="row items-center q-col-gutter-lg">
          <div class="col-12 col-md-7">
            <h1 class="hero__headline">{{ $t('homePage.hero.headline') }}</h1>
            <p class="hero__subtitle">{{ $t('homePage.hero.subtitle') }}</p>
            <div class="hero__actions-wrap">
              <div class="row q-gutter-sm">
                <QBtn
                  unelevated
                  color="white"
                  text-color="dark"
                  :label="$t('homePage.hero.globalReport')"
                  :to="Tr.i18nRoute({ name: 'global-report' })"
                  no-caps
                  size="lg"
                  class="hero__btn"
                />
                <QBtn
                  outline
                  color="white"
                  :label="$t('homePage.hero.exploreNetworks')"
                  :to="Tr.i18nRoute({ name: 'network' })"
                  no-caps
                  size="lg"
                  class="hero__btn"
                />
              </div>
              <UserInfo class="q-mt-lg full-width" />
            </div>
          </div>
          <div class="col-12 col-md-5 hero__globe">
            <Globe />
          </div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="stats">
      <div class="content-width">
        <div class="row justify-around q-col-gutter-md">
          <div
            v-for="s in ['networks', 'countries', 'dataSources', 'monitoring']"
            :key="s"
            class="text-center"
            style="min-width: 130px"
          >
            <span class="stats__number">{{ $t(`homePage.stats.${s}`) }}</span>
            <span class="stats__label">{{ $t(`homePage.stats.${s}Label`) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Features (alternating rows) -->
    <section class="content-width q-pa-md q-pt-lg">
      <h2 class="section-title">{{ $t('homePage.features.title') }}</h2>
      <div
        v-for="(mod, i) in ANALYSIS_MODULES"
        :key="mod.key"
        class="feature-row row items-center q-col-gutter-xl"
        :class="{ 'flex-row-reverse': i % 2 !== 0 }"
      >
        <div class="col-12 col-md-7">
          <h2 class="feature-row__title">{{ $t(`${mod.name}.title`) }}</h2>
          <p class="feature-row__desc">{{ $t(`${mod.name}.description`) }}</p>
          <RouterLink
            :to="Tr.i18nRoute({ name: 'documentation', hash: $t(`${mod.name}.docHash`) })"
            class="feature-row__link"
          >
            {{ $t('homePage.learnmore') }}{{ $t(`${mod.name}.title`) }}
            <QIcon name="fas fa-chevron-right" size="0.7rem" class="q-ml-xs" />
          </RouterLink>
        </div>
        <div class="col-12 col-md-5">
          <img :src="mod.image" :alt="$t(`${mod.name}.title`)" class="feature-row__img" />
        </div>
      </div>
    </section>

    <!-- Reports -->
    <section class="section--light q-pa-xl">
      <div class="content-width">
        <h2 class="section-title">{{ $t('homePage.reports.title') }}</h2>
        <div class="row q-col-gutter-md">
          <div v-for="report in REPORTS" :key="report.key" class="col-12 col-sm-6 col-md-4">
            <RouterLink :to="Tr.i18nRoute({ name: report.route })" class="card-link">
              <QCard flat bordered class="card-hover full-height">
                <QCardSection class="text-center q-py-lg">
                  <QIcon :name="report.icon" size="2rem" color="primary" class="q-mb-sm" />
                  <div class="card-title">{{ $t(`homePage.reports.${report.key}.name`) }}</div>
                  <div class="card-desc">
                    {{ $t(`homePage.reports.${report.key}.description`) }}
                  </div>
                </QCardSection>
              </QCard>
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Tools -->
    <section class="q-pa-xl">
      <div class="content-width">
        <h2 class="section-title">{{ $t('homePage.tools.title') }}</h2>
        <div class="row q-col-gutter-md">
          <div v-for="tool in TOOLS" :key="tool.key" class="col-12 col-sm-6 col-md-4">
            <RouterLink :to="Tr.i18nRoute({ name: tool.route })" class="card-link">
              <QCard flat bordered class="card-hover full-height">
                <QCardSection class="text-center q-py-lg">
                  <QIcon :name="tool.icon" size="2rem" color="primary" class="q-mb-sm" />
                  <div class="card-title">{{ $t(`homePage.tools.${tool.key}.name`) }}</div>
                  <div class="card-desc">{{ $t(`homePage.tools.${tool.key}.description`) }}</div>
                </QCardSection>
              </QCard>
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Partners -->
    <section class="section--light q-pa-xl">
      <h2 class="section-title">{{ $t('homePage.ack.title') }}</h2>
      <div class="marquee content-width">
        <div class="marquee__track">
          <a
            v-for="(org, i) in [...ORGANIZATIONS, ...ORGANIZATIONS]"
            :key="org.name + '-' + i"
            :href="org.url"
            target="_blank"
            rel="noopener noreferrer"
            class="marquee__logo"
          >
            <img :src="org.logo" :alt="org.name" :style="{ height: org.height + 'px' }" />
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/*
 * Overrides for main.css globals (h1/h2/h3 !important, p:first-letter, a color).
 * Quasar utility classes used where possible; custom CSS only where needed.
 */

/* Layout helper now in main.css */

/* ===== HERO ===== */
.hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1a2327 0%, #263238 40%, #1e282e 100%);
  padding: 5rem 0 2.5rem;
  color: #fff;
  min-height: 540px;
}
.hero__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 80% 60% at 70% 40%,
    rgba(38, 50, 56, 0.15) 0%,
    transparent 70%
  );
  pointer-events: none;
}
.hero__inner {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 0 2rem;
}
#IHR_home .hero__headline {
  font-size: 3.2rem !important;
  font-weight: 800 !important;
  line-height: 1.12;
  margin: 0 0 1.25rem;
  letter-spacing: -0.025em;
  color: #fff;
}
#IHR_home .hero__subtitle {
  font-size: 1.125rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 2rem;
  max-width: 520px;
}
#IHR_home .hero__subtitle::first-letter {
  text-transform: none;
}
.hero__actions-wrap {
  width: fit-content;
}
.hero__btn {
  font-weight: 600 !important;
  border-radius: 8px;
  padding: 0 1.75rem;
}
.hero__globe {
  aspect-ratio: 1;
}
@media (max-width: 960px) {
  .hero {
    padding: 3.5rem 1.5rem 2rem;
    min-height: auto;
  }
  .hero__inner {
    flex-direction: column;
    text-align: center;
  }
  .hero__inner > :first-child {
    order: 2;
  }
  #IHR_home .hero__headline {
    font-size: 2.25rem !important;
  }
  .hero__subtitle {
    max-width: 100%;
  }
  .hero__actions-wrap {
    margin: 0 auto;
  }
  .hero__globe {
    width: 320px;
    max-width: 100%;
    order: -1;
  }
}

/* ===== STATS ===== */
.stats {
  background: #f8fafc;
  padding: 2.5rem 2rem;
}
.stats__number {
  display: block;
  font-size: 2.5rem;
  font-weight: 800;
  color: #263238;
  line-height: 1.2;
}
.stats__label {
  display: block;
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
  margin-top: 0.3rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ===== SHARED ===== */
.section--light {
  background: #f8fafc;
}
#IHR_home .section-title {
  font-size: 2.125rem !important;
  font-weight: 700 !important;
  text-align: center;
  margin: 0 0 2.5rem;
  color: #263238;
}

/* ===== FEATURES (alternating rows) ===== */
.feature-row {
  padding: 4rem 0;
  border-bottom: 1px solid #e5e7eb;
}
.feature-row:last-child {
  border-bottom: none;
}
#IHR_home .feature-row__title {
  font-size: 2rem !important;
  font-weight: 700 !important;
  color: #263238;
  margin: 0 0 1rem;
  line-height: 1.25;
}
#IHR_home .feature-row__desc {
  font-size: 1rem;
  line-height: 1.75;
  color: #475569;
  margin: 0 0 1.5rem;
}
#IHR_home .feature-row__desc::first-letter {
  text-transform: none;
}
.feature-row__link {
  color: #263238 !important;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}
.feature-row__link:hover {
  text-decoration: underline;
}
.feature-row__img {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
}
.flex-row-reverse {
  flex-direction: row-reverse;
}
@media (max-width: 768px) {
  .feature-row,
  .flex-row-reverse {
    flex-direction: column;
    padding: 2.5rem 0;
  }
  #IHR_home .feature-row__title {
    font-size: 1.5rem !important;
  }
}

/* ===== CARDS (reports & tools) ===== */
.card-link {
  text-decoration: none !important;
  color: inherit;
}
#IHR_home .card-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: #263238;
  margin-bottom: 0.35rem;
}
#IHR_home .card-desc {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.55;
}
#IHR_home .card-desc::first-letter {
  text-transform: none;
}
.card-hover {
  border-radius: 10px !important;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
  cursor: pointer;
}
.card-hover:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
.card-arrow {
  opacity: 0;
  transition: opacity 0.2s;
}
.card-hover:hover .card-arrow {
  opacity: 1;
}

/* ===== PARTNERS MARQUEE ===== */
.marquee {
  overflow: hidden;
  width: 100%;
  mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 8%,
    black 92%,
    transparent 100%
  );
}
.marquee__track {
  display: flex;
  align-items: stretch;
  gap: 4rem;
  width: max-content;
  animation: marquee-scroll 30s linear infinite;
  will-change: transform;
}
.marquee:hover .marquee__track {
  animation-play-state: paused;
}
.marquee__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-height: 120px;
}
.marquee__logo img {
  width: auto;
}
@keyframes marquee-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}
</style>
