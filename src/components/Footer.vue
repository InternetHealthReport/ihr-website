<script setup>
import { RouterLink } from 'vue-router'
import { QFooter, QBtn, QIcon, QBadge, QSeparator } from 'quasar'
import Tr from '@/i18n/translation'
import { version } from '../../package.json'
</script>

<template>
  <QFooter elevated class="ihr-footer text-white" style="z-index: 999">
    <!-- Main footer content -->
    <div class="ihr-footer__inner">
      <!-- Col 1: Logo + Social -->
      <div class="ihr-footer__brand">
        <RouterLink :to="Tr.i18nRoute({ name: 'home' })" class="ihr-footer__logo-link">
          <img src="/imgs/ihr_logo.svg" class="ihr-footer__logo" alt="IHR Logo" />
        </RouterLink>
        <div class="ihr-footer__brand-name">
          Internet Health Report
          <a
            :href="`https://github.com/InternetHealthReport/ihr-website/releases/tag/v${version}`"
            target="_blank"
            class="ihr-footer__version"
          >
            v{{ version }}
          </a>
        </div>
        <p class="ihr-footer__tagline">Monitoring the health of the Internet</p>
        <div class="ihr-footer__social">
          <a href="https://x.com/ihr_alerts" target="_blank" aria-label="Follow us on X">
            <QIcon name="fab fa-square-x-twitter" />
          </a>
          <a
            href="https://github.com/InternetHealthReport"
            target="_blank"
            aria-label="Visit our GitHub"
          >
            <QIcon name="fab fa-github-square" />
          </a>
          <a href="mailto:admin@ihr.live" target="_blank" aria-label="Contact us via email">
            <QIcon name="fas fa-envelope-square" />
          </a>
        </div>
      </div>

      <!-- Col 2: Reports -->
      <div class="ihr-footer__col">
        <div class="ihr-footer__col-title">{{ $t('footer.reportPages.title') }}</div>
        <ul>
          <li>
            <RouterLink :to="Tr.i18nRoute({ name: 'global-report' })">{{
              $t('footer.reportPages.global')
            }}</RouterLink>
          </li>
          <li>
            <RouterLink :to="Tr.i18nRoute({ name: 'country', params: { cc: null } })">{{
              $t('footer.reportPages.country')
            }}</RouterLink>
          </li>
          <li>
            <RouterLink :to="Tr.i18nRoute({ name: 'network', params: { id: null } })">{{
              $t('footer.reportPages.network')
            }}</RouterLink>
          </li>
          <li>
            <RouterLink :to="Tr.i18nRoute({ name: 'hostname', params: { id: null } })">{{
              $t('footer.reportPages.hostName')
            }}</RouterLink>
          </li>
          <li>
            <RouterLink :to="Tr.i18nRoute({ name: 'tag', params: { id: null } })">{{
              $t('footer.reportPages.tag')
            }}</RouterLink>
          </li>
          <li>
            <RouterLink :to="Tr.i18nRoute({ name: 'rank', params: { rank: null } })">{{
              $t('footer.reportPages.rank')
            }}</RouterLink>
          </li>
          <li>
            <RouterLink :to="Tr.i18nRoute({ name: 'rov' })">{{
              $t('footer.reportPages.rov')
            }}</RouterLink>
          </li>
        </ul>
      </div>

      <!-- Col 3: Tools -->
      <div class="ihr-footer__col">
        <div class="ihr-footer__col-title">{{ $t('footer.tools.title') }}</div>
        <ul>
          <li>
            <RouterLink :to="Tr.i18nRoute({ name: 'metis' })">{{
              $t('footer.tools.metis')
            }}</RouterLink>
          </li>
          <li>
            <RouterLink :to="Tr.i18nRoute({ name: 'observable' })">{{
              $t('footer.tools.observable')
            }}</RouterLink>
          </li>
          <li>
            <RouterLink :to="Tr.i18nRoute({ name: 'upstream-topology' })">{{
              $t('footer.tools.topology')
            }}</RouterLink>
          </li>
          <li>
            <RouterLink :to="Tr.i18nRoute({ name: 'bgp-monitor' })">{{
              $t('footer.tools.bgpMonitor')
            }}</RouterLink>
          </li>
          <li>
            <RouterLink :to="Tr.i18nRoute({ name: 'traceroute-monitor' })">{{
              $t('footer.tools.traceroute')
            }}</RouterLink>
          </li>
        </ul>
      </div>

      <!-- Col 4: About -->
      <div class="ihr-footer__col">
        <div class="ihr-footer__col-title">{{ $t('footer.about.title') }}</div>
        <ul>
          <li>
            <RouterLink :to="Tr.i18nRoute({ name: 'documentation' })">{{
              $t('footer.documentation.title')
            }}</RouterLink>
          </li>
          <li>
            <RouterLink :to="Tr.i18nRoute({ name: 'documentation', hash: '#AS-dependency' })">{{
              $t('footer.documentation.analysisModules')
            }}</RouterLink>
          </li>
          <li>
            <RouterLink :to="Tr.i18nRoute({ name: 'documentation', hash: '#REST-API' })">{{
              $t('footer.documentation.dataAccess')
            }}</RouterLink>
          </li>
          <li><RouterLink :to="Tr.i18nRoute({ name: 'api' })">API</RouterLink></li>
          <li>
            <RouterLink :to="Tr.i18nRoute({ name: 'contact' })">{{
              $t('footer.about.contact')
            }}</RouterLink>
          </li>
          <li>
            <RouterLink :to="Tr.i18nRoute({ name: 'documentation', hash: '#Data-policy' })">{{
              $t('footer.about.datapolicy')
            }}</RouterLink>
          </li>
        </ul>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="ihr-footer__bottom">
      <div class="ihr-footer__bottom-inner">
        <span class="ihr-footer__copyright">
          <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank">
            <img
              alt="CC BY-NC-SA 4.0"
              style="border-width: 0; height: 16px; vertical-align: middle"
              src="https://i.creativecommons.org/l/by-nc-sa/4.0/80x15.png"
            />
          </a>
          <span class="q-ml-sm">
            Internet Health Report —
            <a
              rel="license"
              href="http://creativecommons.org/licenses/by-nc-sa/4.0/"
              target="_blank"
              >CC BY-NC-SA 4.0</a
            >. Contact <a href="mailto:admin@ihr.live">admin@ihr.live</a> for other permissions.
          </span>
        </span>
      </div>
    </div>
  </QFooter>
</template>

<style>
/* Footer base */
.ihr-footer {
  background: #0f172a !important;
}

/* Inner grid */
.ihr-footer__inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 2rem;
  padding: 3rem 2rem 2rem;
}
@media (max-width: 768px) {
  .ihr-footer__inner {
    grid-template-columns: 1fr 1fr;
    gap: 2rem 1.5rem;
  }
}
@media (max-width: 480px) {
  .ihr-footer__inner {
    grid-template-columns: 1fr;
  }
}

/* Brand col */
.ihr-footer__logo-link {
  display: inline-block;
}
.ihr-footer__logo {
  width: 50px;
}
.ihr-footer__brand-name {
  font-size: 1.1rem;
  font-weight: 700;
  margin-top: 0.75rem;
}
.ihr-footer__version {
  font-size: 0.7rem;
  color: #f87171;
  text-decoration: none;
  margin-left: 0.35rem;
  vertical-align: super;
}
.ihr-footer__tagline {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0.5rem 0 1rem;
}
.ihr-footer__social {
  display: flex;
  gap: 0.75rem;
  font-size: 1.75rem;
}
.ihr-footer__social a {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  transition: color 0.15s;
}
.ihr-footer__social a:hover {
  color: #fff;
}

/* Link columns */
.ihr-footer__col-title {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 0.75rem;
}
.ihr-footer__col ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.ihr-footer__col ul li {
  margin-bottom: 0.4rem;
}
.ihr-footer__col ul li a {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 0.9rem;
  text-transform: capitalize;
  transition: color 0.15s;
}
.ihr-footer__col ul li a:hover {
  color: #fff;
  text-decoration: underline;
}

/* Bottom bar */
.ihr-footer__bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1rem 2rem;
}
.ihr-footer__bottom-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ihr-footer__copyright {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.ihr-footer__copyright a {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
}
.ihr-footer__copyright a:hover {
  color: #fff;
  text-decoration: underline;
}
</style>
