<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import PrefixPopularDomains from '@/components/iyp/prefix/PrefixPopularDomains.vue'
import PrefixAuthoritativeNameservers from '@/components/iyp/prefix/PrefixAuthoritativeNameservers.vue'

const props = defineProps(['getPrefix', 'pageTitle'])
</script>

<template>
  <GenericCardController
    :title="$t('iyp.prefix.popularDomains.title')"
    :sub-title="$t('iyp.prefix.popularDomains.caption')+getPrefix"
  >
    <PrefixPopularDomains
      :page-title="pageTitle"
      :get-prefix="getPrefix"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.prefix.nameservers.title')"
    :sub-title="$t('iyp.prefix.nameservers.caption')+getPrefix"
    class="card"
  >
    <PrefixAuthoritativeNameservers
      :page-title="pageTitle"
      :get-prefix="getPrefix"
    />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>