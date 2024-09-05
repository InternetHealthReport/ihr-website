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
    :sub-title="$t('iyp.domainname.nameservers.caption') + pageTitle"
    :info-title="$t('iyp.domainname.nameservers.info.title')"
    :info-description="$t('iyp.domainname.nameservers.info.description')"
  >
    <HostNameAuthoritativeNameservers :page-title="pageTitle" :host-name="hostName" />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.domainname.country_query.title')"
    :sub-title="$t('iyp.domainname.country_query.caption') + pageTitle"
    :info-title="$t('iyp.domainname.country_query.info.title')"
    :info-description="$t('iyp.domainname.country_query.info.description')"
    class="card"
  >
    <HostNameQueryingCountries :page-title="pageTitle" :host-name="hostName" />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.domainname.as_query.title')"
    :sub-title="$t('iyp.domainname.as_query.caption') + pageTitle"
    :info-title="$t('iyp.domainname.as_query.info.title')"
    :info-description="$t('iyp.domainname.as_query.info.description')"
    class="card"
  >
    <HostNameQueryingASes :page-title="pageTitle" :host-name="hostName" />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>
