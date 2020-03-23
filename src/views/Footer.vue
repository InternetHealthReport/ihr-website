<template>
    <q-footer
      elevated
      primary
      class="IHR_minimum-width IHR_footer text-white text-center row items-streatch content-stretch no-wrap justiy-between"
    >
      <div class="col-2 IHR_copyright IHR_fsection q-pt-md">
        <div class="text-weight-bold">
          Internet Health Report
        </div>
        <div>
          <router-link :to="{name : 'home'}">
            <q-btn round dense flat :ripple="false" no-caps size="22px">
              <img src="@/assets/imgs/ihr_logo.svg" style="width: 50px;" />
            </q-btn>
          </router-link>
        </div>
      </div>
      <div class="IHR_fsection col-8 q-pt-md">
        <div class="IHR_sitemap row justify-start">
        <span class="col-3">
          <ul>
            <li class="text-weight-bold">
                {{$t('footer.reportPages.title')}}
            </li>
            <li>
              <router-link
                :to="{name : 'global_report'}"
              >{{$t('footer.reportPages.global')}}</router-link>
            </li>
            <li>
              <router-link
                  :to="{name : 'networks', params:{asn:null}}"
              >{{$t('footer.reportPages.network')}}</router-link>
            </li>
          </ul>
        </span>
        <span class="col-3">
          <ul>
            <li class="text-weight-bold">
              <router-link
                :to="{name : 'documentation'}" >
                  {{$t('footer.documentation.title')}}
              </router-link>
            </li>
            <li>
              <router-link
                :to="{name : 'documentation'}"
              >{{$t('footer.about.title')}}</router-link>
            </li>
            <li>
              <router-link
                :to="{name : 'documentation', hash:'#AS_dependency'}"
              >{{$t('footer.documentation.analysisModules')}}</router-link>
            </li>
            <li>
              <router-link
                :to="{name : 'documentation', hash:'#REST_API' }"
              >{{$t('footer.documentation.dataAccess')}}</router-link>
            </li>
          </ul>
        </span>
        <span class="col-3">
          <ul>
            <li class="text-weight-bold">
              <router-link
                :to="{name : 'contact'}" >
                  {{$t('footer.about.contact')}}
                </router-link>
            </li>
            <li>
              <router-link
                :to="{name : 'documentation', hash:'#Acknowledgements'}"
              >{{$t('footer.about.acknowledgments')}}</router-link>
            </li>
            <li>
              <router-link
                :to="{name : 'documentation', hash:'#Data_policy'}"
              >{{$t('footer.about.datapolicy')}}</router-link>
            </li>
          </ul>
        </span>
        </div>
        <div class="row items-center q-pt-lg">
            <div class="col-2"><a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" /></a></div>
            <div class="col-10 text-caption text-left q-pa-md">
                <span xmlns:dct="http://purl.org/dc/terms/" href="http://purl.org/dc/dcmitype/Dataset" property="dct:title" rel="dct:type"> Internet Health Report</span> is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>. Permissions beyond the scope of this license may be available at <a xmlns:cc="http://creativecommons.org/ns#" href="mailto:ihr-admin@iij-ii.co.jp" rel="cc:morePermissions">ihr-admin@iij-ii.co.jp</a>.
            </div>
        </div>
      </div>
      <div class="IHR_external-links col-2 IHR_fsection">
        <div class="row wrap justify-center q-pt-lg">
          <a href="https://twitter.com/ihr_alerts" class="col-1" target="_blank">
            <q-icon name="fab fa-twitter-square" />
          </a>
          <div class="col-1 q-pa-md"></div>
          <a href="https://github.com/InternetHealthReport" class="col-1" target="_blank">
            <q-icon name="fab fa-github-square" />
          </a>
          <div class="col-1 q-pa-md"></div>
          <router-link :to="{name : 'contact'}" class="col-1" target="_blank">
            <q-icon name="fas fa-envelope-square" />
          </router-link>
        </div>
      </div>
    </q-footer>
</template>
<script>
