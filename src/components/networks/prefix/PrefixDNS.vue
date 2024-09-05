<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import PrefixPopularDomains from '@/components/iyp/prefix/PrefixPopularDomains.vue'
import PrefixAuthoritativeNameservers from '@/components/iyp/prefix/PrefixAuthoritativeNameservers.vue'
import PrefixPopularHostNames from '@/components/iyp/prefix/PrefixPopularHostNames.vue'

const props = defineProps(['getPrefix', 'pageTitle'])
</script>

<template>
  <GenericCardController
    :title="$t('iyp.prefix.popularDomains.title')"
    :sub-title="$t('iyp.prefix.popularDomains.caption') + getPrefix"
    :info-title="$t('iyp.prefix.popularDomains.info.title')"
    :info-description="$t('iyp.prefix.popularDomains.info.description')"
  >
    <PrefixPopularDomains :page-title="pageTitle" :get-prefix="getPrefix" />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.prefix.popularHostNames.title')"
    :sub-title="$t('iyp.prefix.popularHostNames.caption') + getPrefix"
    :info-title="$t('iyp.prefix.popularHostNames.info.title')"
    :info-description="$t('iyp.prefix.popularHostNames.info.description')"
    class="card"
  >
    <PrefixPopularHostNames :page-title="pageTitle" :get-prefix="getPrefix" />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.prefix.nameservers.title')"
    :sub-title="$t('iyp.prefix.nameservers.caption') + getPrefix"
    :info-title="$t('iyp.prefix.nameservers.info.title')"
    :info-description="$t('iyp.prefix.nameservers.info.description')"
    class="card"
  >
    <PrefixAuthoritativeNameservers :page-title="pageTitle" :get-prefix="getPrefix" />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>
