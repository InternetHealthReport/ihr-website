<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import HostNameRankings from '@/components/iyp/hostName/HostNameRankings.vue'

const props = defineProps(['pageTitle', 'hostName'])
</script>

<template>
  <GenericCardController
    :title="$t('iyp.domainname.rankings.title')"
    :sub-title="$t('iyp.domainname.rankings.caption')+pageTitle"
    :info-title="$t('iyp.domainname.rankings.info.title')"
    :info-description="$t('iyp.domainname.rankings.info.description')"
  >
    <HostNameRankings
      :page-title="pageTitle"
      :host-name="hostName"
    />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>