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
  >
    <PrefixUpstreamASes
      :page-title="pageTitle"
      :get-prefix="getPrefix"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.prefix.roas.title')"
    :sub-title="$t('iyp.prefix.roas.caption')+getPrefix"
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