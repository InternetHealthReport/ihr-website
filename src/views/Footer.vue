<template>
  <q-footer elevated primary class="IHR_footer text-white text-center ">
    <div class="IHR_footer_contents">
      <div class="IHR_fsection">
        <div class="" style="width:360px;max-width: 400px;">
          <div>
            <router-link :to="{ name: 'home' }">
              <q-btn round dense flat :ripple="false" no-caps>
                <img src="@/assets/imgs/ihr_logo.svg" class="ihr-logo" />
              </q-btn>
            </router-link>
            <h1 class="text-weight-bold text-h5 q-mt-sm">Internet Health Report</h1>
          </div>
          <div class="IHR_external-links ">
            <div class="row nowrap justify-evenly ">
              <a href="https://twitter.com/ihr_alerts" class="" target="_blank">
                <q-icon name="fab fa-twitter-square" class="inline-block" />
              </a>
              <a href="https://github.com/InternetHealthReport" class="" target="_blank">
                <q-icon name="fab fa-github-square" class="inline-block" />
              </a>
              <router-link :to="{ name: 'contact' }" class="" target="_blank">
                <q-icon name="fas fa-envelope-square" class="inline-block" />
              </router-link>
            </div>
          </div>
        </div>
      </div>
      <div class="IHR_fsection ">
        <div class="IHR_sitemap " style="max-width: 700px;">
          <ul>
            <li class="text-weight-bold links-title text-capitalize">
              {{ $t('footer.reportPages.title') }}
            </li>
            <li>
              <router-link :to="{ name: 'global_report' }">{{ $t('footer.reportPages.global') }}</router-link>
            </li>
            <li>
              <router-link :to="{ name: 'countries', params: { cc: null } }">{{ $t('footer.reportPages.country')
              }}</router-link>
            </li>
            <li>
              <router-link :to="{ name: 'networks', params: { asn: null } }">{{ $t('footer.reportPages.network')
              }}</router-link>
            </li>
            <li>
              <router-link :to="{ name: 'rov' }">{{ $t('footer.reportPages.rov') }}</router-link>
            </li>
            <li>
              <router-link :to="{ name: 'covid19' }">{{ $t('footer.reportPages.covid19') }}</router-link>
            </li>
          </ul>
          <ul>
            <li class="text-weight-bold links-title text-capitalize">
              <router-link :to="{ name: 'documentation' }">
                {{ $t('footer.documentation.title') }}
              </router-link>
            </li>
            <li>
              <router-link :to="{ name: 'documentation' }">{{ $t('footer.about.title') }}</router-link>
            </li>
            <li>
              <router-link :to="{ name: 'documentation', hash: '#AS_dependency' }">{{
                $t('footer.documentation.analysisModules')
              }}</router-link>
            </li>
            <li>
              <router-link :to="{ name: 'documentation', hash: '#REST_API' }">{{ $t('footer.documentation.dataAccess')
              }}</router-link>
            </li>
          </ul>
          <ul>
            <li class="text-weight-bold links-title text-capitalize">
              <router-link :to="{ name: 'contact' }">
                {{ $t('footer.about.contact') }}
              </router-link>
            </li>
            <li>
              <router-link :to="{ name: 'documentation', hash: '#Acknowledgements' }">{{
                $t('footer.about.acknowledgments') }}</router-link>
            </li>
            <li>
              <router-link :to="{ name: 'documentation', hash: '#Data_policy' }">{{ $t('footer.about.datapolicy')
              }}</router-link>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="IHR_fsection ">
      <div class="row items-center IHR_license-section" style="max-width: 800px;">
        <div class="col-3 ">
          <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank"><img
              alt="Creative Commons License" style="border-width: 0"
              src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" /></a>
        </div>
        <div class="col-9 text-caption text-center q-pa-sm">
          <span xmlns:dct="http://purl.org/dc/terms/" href="http://purl.org/dc/dcmitype/Dataset" property="dct:title"
            rel="dct:type">
            Internet Health Report</span>
          is licensed under a
          <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank">Creative Commons
            Attribution-NonCommercial-ShareAlike 4.0 International License</a>. Permissions beyond the scope of this
          license may be available at
          <a xmlns:cc="http://creativecommons.org/ns#" href="mailto:admin@ihr.live"
            rel="cc:morePermissions">admin@ihr.live</a>.
        </div>
      </div>
    </div>
  </q-footer>
</template>

<script>
export default {

  name: 'AppFooter',
}
</script>

<style lang="stylus">
@import '~@/styles/footer.styl'
</style>
