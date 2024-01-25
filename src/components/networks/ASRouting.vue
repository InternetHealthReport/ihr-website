<script setup>
import { QCard, QTabs, QTab, QSeparator, QTabPanels, QTabPanel } from 'quasar'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, watch, computed, onMounted, inject } from 'vue'
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import ASConnectedASes from '@/components/iyp/ASConnectedASes.vue'

const props = defineProps(['asNumber', 'pageTitle'])

const iyp_api = inject('iyp_api')

const route = useRoute()
const router = useRouter()
</script>

<template>
  <GenericCardController
    :title="$t('iyp.as.peers.title')"
    :sub-title="$t('iyp.as.peers.caption')+asNumber"
  >
    <ASConnectedASes
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
</template>