<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import Whois from '@/components/Whois.vue'

const props = defineProps(['getPrefix', 'pageTitle'])
</script>

<template>
  <GenericCardController
    :title="$t('whois.title')"
    :sub-title="$t('whois.caption')"
    :info-title="$t('whois.info.title')"
    :info-description="$t('whois.info.description')"
  >
    <Whois :page-title="pageTitle" :get-prefix="getPrefix" />
  </GenericCardController>
</template>

<style>
.card {
  margin-top: 20px;
}
</style>
