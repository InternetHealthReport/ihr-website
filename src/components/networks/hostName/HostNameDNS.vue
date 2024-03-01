<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import HostNameAuthoritativeNameservers from '@/components/iyp/hostName/HostNameAuthoritativeNameservers.vue'
import HostNameQueryingCountries from '@/components/iyp/hostName/HostNameQueryingCountries.vue'
import HostNameQueryingASes from '@/components/iyp/hostName/HostNameQueryingASes.vue'

const props = defineProps(['pageTitle', 'hostName'])
</script>

<template>
  <GenericCardController
    :title="$t('iyp.domainname.nameservers.title')"
    :sub-title="$t('iyp.domainname.nameservers.caption')+pageTitle"
  >
    <HostNameAuthoritativeNameservers
      :page-title="pageTitle"
      :host-name="hostName"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.domainname.country_query.title')"
    :sub-title="$t('iyp.domainname.country_query.caption')+pageTitle"
    class="card"
  >
    <HostNameQueryingCountries
      :page-title="pageTitle"
      :host-name="hostName"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.domainname.as_query.title')"
    :sub-title="$t('iyp.domainname.as_query.caption')+pageTitle"
    class="card"
  >
    <HostNameQueryingASes
      :page-title="pageTitle"
      :host-name="hostName"
    />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>