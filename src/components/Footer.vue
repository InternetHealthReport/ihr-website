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
                <img src="@/assets/imgs/ihr_logo.svg" class="ihr-logo" />
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
              <a href="https://x.com/ihr_alerts" class="" target="_blank">
                <QIcon name="fab fa-square-x-twitter" class="inline-block" />
              </a>
              <a href="https://github.com/InternetHealthReport" class="" target="_blank">
                <QIcon name="fab fa-github-square" class="inline-block" />
              </a>
              <a href="mailto:admin@ihr.live" class="" target="_blank">
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
            <li>
              <RouterLink :to="Tr.i18nRoute({ name: 'covid19' })">{{
                $t('footer.reportPages.covid19')
              }}</RouterLink>
            </li>
          </ul>
          <ul>
            <li class="text-weight-bold links-title text-capitalize">
              <RouterLink :to="Tr.i18nRoute({ name: 'documentation' })">
                {{ $t('footer.documentation.title') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink :to="Tr.i18nRoute({ name: 'documentation' })">{{
                $t('footer.about.title')
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
          </ul>
          <ul>
            <li class="text-weight-bold links-title text-capitalize">
              <RouterLink :to="Tr.i18nRoute({ name: 'contact' })">
                {{ $t('footer.about.contact') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink
                :to="Tr.i18nRoute({ name: 'documentation', hash: '#Acknowledgements' })"
                >{{ $t('footer.about.acknowledgments') }}</RouterLink
              >
            </li>
            <li>
              <RouterLink :to="Tr.i18nRoute({ name: 'documentation', hash: '#Data-policy' })">{{
                $t('footer.about.datapolicy')
              }}</RouterLink>
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

<style lang="stylus">
.inline-block:hover{
  transform: scale(1.2);
}
.ihr-logo{
  width: 80px;
  border 4px solid transparent
}

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
    display flex
    flex-direction column
    align-items center

  &footer_contents
      display flex
      flex-direction column
      align-items center
      @media screen and (min-width: 1000px)
        width 80%
        margin-left auto
        margin-right auto
        flex-direction row
        justify-content space-evenly
        align-items flex-start

    & a
      color white

    ~/fsection
      padding-top 1.5rem
      padding-bottom 1.5rem
      border none
      @media screen and (max-width: 600px)
        padding-top 1rem
        padding-bottom 1rem

    ~/license-section
      @media screen and (max-width: 1000px)
        display flex
        flex-direction column

    ~/external-links
      font-size 3.0em
      margin-top .5rem

      & a
        color white
        text-decoration none

    ~/sitemap
      display flex
      justify-content center
      font-size 1rem
      font-weight 300
      text-align center
      @media screen and (max-width 600px)
        flex-direction column

      & > ul
        min-width 10rem
        list-style-type none
        margin 0
        padding .5rem 1.5rem

        & > li > a
          text-decoration none
          text-transform capitalize

          &:hover
            text-decoration underline


        & > .links-title
          font-size 1.25rem

          & > a:hover
            text-decoration none

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
