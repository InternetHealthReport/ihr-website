<script setup>
import { RouterLink } from 'vue-router'
import { QFooter, QBtn, QIcon, QBadge } from 'quasar'
import Tr from '@/i18n/translation'
import { version } from '../../package.json'
</script>

<template>
  <QFooter elevated primary class="IHR_footer text-white text-center" style="z-index: 999">
    <div class="IHR_footer_contents">
      <div class="IHR_fsection">
        <div class="" style="max-width: 400px">
          <div>
            <QBtn round dense flat :ripple="false" no-caps>
              <RouterLink :to="Tr.i18nRoute({ name: 'home' })">
                <img src="/imgs/ihr_logo.svg" class="ihr-logo" alt="IHR Logo" />
              </RouterLink>
              <a
                :href="`https://github.com/InternetHealthReport/ihr-website/releases/tag/v${version}`"
                class=""
                target="_blank"
              >
                <QBadge color="red" floating>v{{ version }}</QBadge>
              </a>
            </QBtn>
            <div class="text-weight-bold text-h5 q-mt-sm">Internet Health Report</div>
          </div>
          <div class="IHR_external-links">
            <div class="row nowrap justify-evenly">
              <a
                href="https://x.com/ihr_alerts"
                class=""
                target="_blank"
                aria-label="Follow us on X"
              >
                <QIcon name="fab fa-square-x-twitter" class="inline-block" />
              </a>
              <a
                href="https://github.com/InternetHealthReport"
                class=""
                target="_blank"
                aria-label="Visit our GitHub"
              >
                <QIcon name="fab fa-github-square" class="inline-block" />
              </a>
              <a
                href="mailto:admin@ihr.live"
                class=""
                target="_blank"
                aria-label="Contact us via email"
              >
                <QIcon name="fas fa-envelope-square" class="inline-block" />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div class="IHR_fsection">
        <div class="IHR_sitemap" style="max-width: 700px">
          <ul>
            <li class="text-weight-bold links-title text-capitalize">
              {{ $t('footer.reportPages.title') }}
            </li>
            <li>
              <RouterLink :to="Tr.i18nRoute({ name: 'global-report' })">
                {{ $t('footer.reportPages.global') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink :to="Tr.i18nRoute({ name: 'country', params: { cc: null } })">
                {{ $t('footer.reportPages.country') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink :to="Tr.i18nRoute({ name: 'network', params: { id: null } })">
                {{ $t('footer.reportPages.network') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink :to="Tr.i18nRoute({ name: 'hostname', params: { id: null } })">
                {{ $t('footer.reportPages.hostName') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink :to="Tr.i18nRoute({ name: 'tag', params: { id: null } })">
                {{ $t('footer.reportPages.tag') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink :to="Tr.i18nRoute({ name: 'rank', params: { rank: null } })">
                {{ $t('footer.reportPages.rank') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink :to="Tr.i18nRoute({ name: 'rov' })">
                {{ $t('footer.reportPages.rov') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink :to="Tr.i18nRoute({ name: 'covid19' })">
                {{ $t('footer.reportPages.covid19') }}
              </RouterLink>
            </li>
          </ul>
          <ul>
            <li class="text-weight-bold links-title text-capitalize">
              <RouterLink :to="Tr.i18nRoute({ name: 'documentation' })">
                {{ $t('footer.documentation.title') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink :to="Tr.i18nRoute({ name: 'documentation' })">
                {{ $t('footer.about.title') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink :to="Tr.i18nRoute({ name: 'documentation', hash: '#AS-dependency' })">
                {{ $t('footer.documentation.analysisModules') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink :to="Tr.i18nRoute({ name: 'documentation', hash: '#REST-API' })">
                {{ $t('footer.documentation.dataAccess') }}
              </RouterLink>
            </li>
          </ul>
          <ul>
            <li class="text-weight-bold links-title text-capitalize">
              <RouterLink :to="Tr.i18nRoute({ name: 'contact' })">
                {{ $t('footer.about.contact') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink :to="Tr.i18nRoute({ name: 'documentation', hash: '#Acknowledgements' })">
                {{ $t('footer.about.acknowledgments') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink :to="Tr.i18nRoute({ name: 'documentation', hash: '#Data-policy' })">
                {{ $t('footer.about.datapolicy') }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="IHR_fsection">
      <div class="row items-center IHR_license-section" style="max-width: 800px">
        <div class="col-3">
          <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank"
            ><img
              alt="Creative Commons License"
              style="border-width: 0"
              src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png"
          /></a>
        </div>
        <div class="col-9 text-caption text-center q-pa-sm">
          <span
            xmlns:dct="http://purl.org/dc/terms/"
            href="http://purl.org/dc/dcmitype/Dataset"
            property="dct:title"
            rel="dct:type"
          >
            Internet Health Report</span
          >
          is licensed under a
          <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank"
            >Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a
          >. Permissions beyond the scope of this license may be available at
          <a
            xmlns:cc="http://creativecommons.org/ns#"
            href="mailto:admin@ihr.live"
            rel="cc:morePermissions"
            >admin@ihr.live</a
          >.
        </div>
      </div>
    </div>
  </QFooter>
</template>

<style>
.inline-block:hover {
  transform: scale(1.2);
}
.ihr-logo {
  width: 80px;
  border: 4px solid transparent;
}
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
.IHR_footer {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.IHR_footer_contents {
  display: flex;
  flex-direction: column;
  align-items: center;
}
@media screen and (min-width: 1000px) {
  .IHR_footer_contents {
    width: 80%;
    margin-left: auto;
    margin-right: auto;
    flex-direction: row;
    justify-content: space-evenly;
    align-items: flex-start;
  }
}
.IHR_ a {
  color: #fff;
}
.IHR_fsection {
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
  border: none;
}
@media screen and (max-width: 600px) {
  .IHR_fsection {
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
}
@media screen and (max-width: 1000px) {
  .IHR_license-section {
    display: flex;
    flex-direction: column;
  }
}
.IHR_external-links {
  font-size: 3em;
  margin-top: 0.5rem;
}
.IHR_external-links a {
  color: #fff;
  text-decoration: none;
}
.IHR_sitemap {
  display: flex;
  justify-content: center;
  font-size: 1rem;
  font-weight: 300;
  text-align: center;
}
@media screen and (max-width: 600px) {
  .IHR_sitemap {
    flex-direction: column;
  }
}
.IHR_sitemap > ul {
  min-width: 10rem;
  list-style-type: none;
  margin: 0;
  padding: 0.5rem 1.5rem;
}
.IHR_sitemap > ul > li > a {
  text-decoration: none;
  text-transform: capitalize;
}
.IHR_sitemap > ul > li > a:hover {
  text-decoration: underline;
}
.IHR_sitemap > ul > .links-title {
  font-size: 1.25rem;
}
.IHR_sitemap > ul > .links-title > a:hover {
  text-decoration: none;
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
