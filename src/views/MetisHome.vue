<script setup>
import { RouterLink } from 'vue-router'
import { QBtn } from 'quasar'
import Tr from '@/i18n/translation'
</script>

<template>
  <div>
    <h1 class="text-center">{{ $t('mentis.title') }}</h1>
    <div class="row justify-center">
      <div class="IHR_description">
        <p v-html="$t('mentis.description') "></p>
        <p>
          <span v-html="$t('mentis.documentation')"></span>
          <RouterLink :to="Tr.i18nRoute({ name: 'documentation' })">documentation</RouterLink>.
        </p>
        <p>{{ $t('mentis.body') }}</p>
        <h2>{{ $t('mentis.AtlasProbe.title') }}</h2>
        <p>{{ $t('mentis.AtlasProbe.selection') }}</p>
        <div class="row justify-center q-pb-lg">
          <QBtn color="secondary" :label="$t('mentis.AtlasProbe.selctionBtnLabel')" :to="Tr.i18nRoute({ name: 'metis-selection' })" />
        </div>
        <p>{{ $t('mentis.AtlasProbe.deployment') }}</p>
        <div class="row justify-center">
          <QBtn color="secondary" :label="$t('mentis.AtlasProbe.deploymentBtnLabel')" :to="Tr.i18nRoute({ name: 'metis-deployment' })" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="stylus">
.IHR_description
    max-width 900px
    padding 0 1rem
    font-size 14pt
h1
  font-weight 500
</style>
