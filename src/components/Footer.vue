<script setup>
import { RouterLink } from 'vue-router'
import { QFooter, QIcon } from 'quasar'
import Tr from '@/i18n/translation'
import { version } from '../../package.json'

const REPORT_LINKS = [
  { label: 'footer.reportPages.global', route: 'global-report' },
  { label: 'footer.reportPages.country', route: 'country', params: { cc: null } },
  { label: 'footer.reportPages.network', route: 'network', params: { id: null } },
  { label: 'footer.reportPages.hostName', route: 'hostname', params: { id: null } },
  { label: 'footer.reportPages.tag', route: 'tag', params: { id: null } },
  { label: 'footer.reportPages.rank', route: 'rank', params: { rank: null } },
  { label: 'footer.reportPages.rov', route: 'rov' }
]

const TOOL_LINKS = [
  { label: 'footer.tools.metis', route: 'metis' },
  { label: 'footer.tools.observable', route: 'observable' },
  { label: 'footer.tools.topology', route: 'upstream-topology' },
  { label: 'footer.tools.bgpMonitor', route: 'bgp-monitor' },
  { label: 'footer.tools.traceroute', route: 'traceroute-monitor' }
]

const ABOUT_LINKS = [
  { label: 'footer.documentation.title', route: 'documentation' },
  { label: 'footer.documentation.analysisModules', route: 'documentation', hash: '#AS-dependency' },
  { label: 'footer.documentation.dataAccess', route: 'documentation', hash: '#REST-API' },
  { label: 'API', route: 'api', raw: true },
  { label: 'footer.about.contact', route: 'contact' },
  { label: 'footer.about.datapolicy', route: 'documentation', hash: '#Data-policy' }
]

const SOCIAL_LINKS = [
  { icon: 'fab fa-square-x-twitter', url: 'https://x.com/ihr_alerts', aria: 'Follow us on X' },
  {
    icon: 'fab fa-github-square',
    url: 'https://github.com/InternetHealthReport',
    aria: 'Visit our GitHub'
  },
  { icon: 'fas fa-envelope-square', url: 'mailto:admin@ihr.live', aria: 'Contact us via email' }
]

const COLUMNS = [
  { title: 'footer.reportPages.title', links: REPORT_LINKS },
  { title: 'footer.tools.title', links: TOOL_LINKS },
  { title: 'footer.about.title', links: ABOUT_LINKS }
]
</script>

<template>
  <QFooter elevated class="bg-blue-grey-10 text-white" style="z-index: 999">
    <!-- Main grid -->
    <div class="ihr-footer-grid content-width q-pa-xl">
      <!-- Brand column -->
      <div class="column items-start">
        <RouterLink
          :to="Tr.i18nRoute({ name: 'home' })"
          class="column items-center no-wrap"
          style="text-decoration: none; color: inherit"
        >
          <img src="/imgs/ihr_logo.svg" alt="IHR Logo" style="width: 50px" />
          <span class="text-subtitle1 text-weight-bold q-mt-xs">Internet Health Report</span>
        </RouterLink>
        <p class="text-caption q-mt-sm q-mb-md" style="color: rgba(255, 255, 255, 0.5)">
          Monitoring the health of the Internet
        </p>
        <div class="row q-gutter-sm" style="font-size: 2rem">
          <a
            v-for="social in SOCIAL_LINKS"
            :key="social.icon"
            :href="social.url"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="social.aria"
            class="ihr-footer-social-link"
          >
            <QIcon :name="social.icon" />
          </a>
        </div>
      </div>

      <!-- Link columns -->
      <div v-for="col in COLUMNS" :key="col.title">
        <div
          class="text q-mb-sm"
          style="
            color: rgba(255, 255, 255, 0.5);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding-bottom: 0.5rem;
          "
        >
          {{ $t(col.title) }}
        </div>
        <ul class="ihr-footer-links">
          <li v-for="link in col.links" :key="link.label" class="q-mb-xs">
            <RouterLink
              :to="Tr.i18nRoute({ name: link.route, params: link.params, hash: link.hash })"
              class="ihr-footer-link"
            >
              {{ link.raw ? link.label : $t(link.label) }}
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>

    <!-- Bottom bar -->
    <div style="border-top: 1px solid rgba(255, 255, 255, 0.08)">
      <div class="content-width row items-center justify-between q-px-lg q-py-md ihr-footer-bottom">
        <span
          class="row items-center q-gutter-xs text-caption"
          style="color: rgba(255, 255, 255, 0.45)"
        >
          <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank">
            <img
              alt="CC BY-NC-SA 4.0"
              style="border-width: 0; height: 16px; vertical-align: middle"
              src="https://i.creativecommons.org/l/by-nc-sa/4.0/80x15.png"
            />
          </a>
          <span>
            Internet Health Report —
            <a
              rel="license"
              href="http://creativecommons.org/licenses/by-nc-sa/4.0/"
              target="_blank"
              class="ihr-footer-link--muted"
              >CC BY-NC-SA 4.0</a
            >. Contact
            <a href="mailto:admin@ihr.live" class="ihr-footer-link--muted">admin@ihr.live</a> for
            other permissions.
          </span>
        </span>
        <a
          :href="`https://github.com/InternetHealthReport/ihr-website/releases/tag/v${version}`"
          target="_blank"
          rel="noopener noreferrer"
          class="text-caption"
          style="color: #f87171; text-decoration: none"
        >
          v{{ version }}
        </a>
      </div>
    </div>
  </QFooter>
</template>

<style>
/* Grid layout — only custom CSS needed for the 4-column grid */
.ihr-footer-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  align-items: start;
  gap: 2.5rem;
}
@media (max-width: 768px) {
  .ihr-footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 480px) {
  .ihr-footer-grid {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .ihr-footer-grid .column.items-start {
    align-items: center;
  }
}

/* Link list reset */
.ihr-footer-links {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* Link styles */
.ihr-footer-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 0.9rem;
  text-transform: capitalize;
  transition: color 0.15s;
}
.ihr-footer-link:hover {
  color: #fff;
  text-decoration: underline;
}

/* Social icons */
.ihr-footer-social-link {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  transition: color 0.15s;
}
.ihr-footer-social-link:hover {
  color: #fff;
}

/* Bottom bar muted links */
.ihr-footer-link--muted {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
}
.ihr-footer-link--muted:hover {
  color: #fff;
  text-decoration: underline;
}

/* Bottom bar responsive */
@media (max-width: 600px) {
  .ihr-footer-bottom {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
}
</style>
