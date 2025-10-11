<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import ASOriginatedPrefixes from '@/components/iyp/as/ASOriginatedPrefixes.vue'
import ASSiblingASes from '@/components/iyp/as/ASSiblingASes.vue'

const props = defineProps(['asNumber', 'pageTitle'])
</script>

<template>
  <GenericCardController
    :title="$t('iyp.as.ipPrefix.title')"
    :sub-title="$t('iyp.as.ipPrefix.caption') + asNumber"
    :info-title="$t('iyp.as.ipPrefix.info.title')"
    :info-description="$t('iyp.as.ipPrefix.info.description')"
  >
    <ASOriginatedPrefixes
      :as-number="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.siblings.title')"
    :sub-title="$t('iyp.as.siblings.caption')"
    :info-title="$t('iyp.as.siblings.info.title')"
    :info-description="$t('iyp.as.siblings.info.description')"
    class="card"
  >
    <ASSiblingASes
      :as-number="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
</template>

<style>
.card {
  margin-top: 20px;
}
</style>
