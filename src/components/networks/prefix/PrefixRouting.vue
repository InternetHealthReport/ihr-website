<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import PrefixUpstreamASes from '@/components/iyp/prefix/PrefixUpstreamASes.vue'
import PrefixRPKIRouteOriginAuthorization from '@/components/iyp/prefix/PrefixRPKIRouteOriginAuthorization.vue'
import PrefixLessSpecificPrefixes from '@/components/iyp/prefix/PrefixLessSpecificPrefixes.vue'
import PrefixMoreSpecificPrefixes from '@/components/iyp/prefix/PrefixMoreSpecificPrefixes.vue'

const props = defineProps(['getPrefix', 'pageTitle'])
</script>

<template>
  <GenericCardController
    :title="$t('iyp.prefix.upstreams.title')"
    :sub-title="getPrefix+' depends on these ASes'"
    :info-title="$t('iyp.prefix.upstreams.info.title')"
    :info-description="$t('iyp.prefix.upstreams.info.description')"
  >
    <PrefixUpstreamASes
      :page-title="pageTitle"
      :get-prefix="getPrefix"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.prefix.roas.title')"
    :sub-title="$t('iyp.prefix.roas.caption')+getPrefix"
    :info-title="$t('iyp.prefix.roas.info.title')"
    :info-description="$t('iyp.prefix.roas.info.description')"
    class="card"
  >
    <PrefixRPKIRouteOriginAuthorization
      :page-title="pageTitle"
      :get-prefix="getPrefix"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.prefix.lessSpecific.title')"
    :sub-title="$t('iyp.prefix.lessSpecific.caption')+getPrefix"
    :info-title="$t('iyp.prefix.lessSpecific.info.title')"
    :info-description="$t('iyp.prefix.lessSpecific.info.description')"
    class="card"
  >
    <PrefixLessSpecificPrefixes
      :page-title="pageTitle"
      :get-prefix="getPrefix"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.prefix.moreSpecific.title')"
    :sub-title="$t('iyp.prefix.moreSpecific.caption')+getPrefix"
    :info-title="$t('iyp.prefix.moreSpecific.info.title')"
    :info-description="$t('iyp.prefix.moreSpecific.info.description')"
    class="card"
  >
    <PrefixMoreSpecificPrefixes
      :page-title="pageTitle"
      :get-prefix="getPrefix"
    />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>