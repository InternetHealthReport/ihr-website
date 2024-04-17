<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import HostNameIPAddressesPrefixes from '@/components/iyp/hostName/HostNameIPAddressesPrefixes.vue'

const props = defineProps(['pageTitle', 'hostName'])
</script>

<template>
  <GenericCardController
    :title="$t('iyp.domainname.ips.title')"
    :sub-title="$t('iyp.domainname.ips.caption')+pageTitle"
    :info-title="$t('iyp.domainname.ips.info.title')"
    :info-description="$t('iyp.domainname.ips.info.description')"
  >
    <HostNameIPAddressesPrefixes
      :page-title="pageTitle"
      :host-name="hostName"
    />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>