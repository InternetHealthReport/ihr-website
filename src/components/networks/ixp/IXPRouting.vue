<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import IXPMembers from '@/components/iyp/ixp/IXPMembers.vue'

const props = defineProps(['ixpNumber', 'pageTitle'])
</script>

<template>
  <GenericCardController
    :title="$t('iyp.ixp.members.title')"
    sub-title="Member Autonomous Systems (ASes)"
    :info-title="$t('iyp.ixp.members.info.title')"
    :info-description="$t('iyp.ixp.members.info.description')"
  >
    <IXPMembers
      :ixpNumber="ixpNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>