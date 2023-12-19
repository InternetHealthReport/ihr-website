<script setup>
import { ref } from 'vue'
import MetisWidget from '@/components/MetisWidget.vue'

const nbprobes = ref('100')
</script>

<template>
  <div>
    <h1 class="text-center">{{ $t('mentis.mentisDeployment.title') }}</h1>
    <div class="row justify-center">
      <div class="IHR_description">
        <p>
          {{ $t('mentis.mentisDeployment.description') }}
        </p>
        <p>
          {{ $t('mentis.mentisDeployment.body') }}
          
        </p>
        <p>
          {{ $t('mentis.mentisDeployment.recommendationsUpdateAndQueries.body') }}
          <router-link to="/en-us/api">{{ $t('mentis.mentisDeployment.recommendationsUpdateAndQueries.apiPage') }}</router-link>.
        </p>
      </div>
    </div>
    <div class="row justify-center">
      <div class="col-4 q-px-md">
        <MetisWidget widget-title="IPv4 AS-path length" af="4" metric="as_path_length" :nbprobes="nbprobes" />
      </div>
      <div class="col-4 q-px-md">
        <MetisWidget widget-title="IPv4 RTT" af="4" metric="rtt" :nbprobes="nbprobes" />
      </div>
      <div class="col-4 q-px-md">
        <MetisWidget widget-title="IPv4 IP hops" af="4" metric="ip_hops" :nbprobes="nbprobes" />
      </div>
    </div>
    <div class="row justify-center">
      <div class="col-4 q-px-md">
        <MetisWidget widget-title="IPv6 AS-path length" af="6" metric="as_path_length" :nbprobes="nbprobes" />
      </div>
      <div class="col-4 q-px-md">
        <MetisWidget widget-title="IPv6 RTT" af="6" metric="rtt" :nbprobes="nbprobes" />
      </div>
      <div class="col-4 q-px-md">
        <MetisWidget widget-title="IPv6 IP hops" af="6" metric="ip_hops" :nbprobes="nbprobes" />
      </div>
    </div>
  </div>
</template>

<style lang="stylus">
.IHR_description
    font-weight 400
    max-width 900px
</style>
