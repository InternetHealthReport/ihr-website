<script setup>
import { onMounted } from 'vue';
import SwaggerUI from 'swagger-ui'

onMounted(() => {
  SwaggerUI({
    url: 'https://ihr.iijlab.net/ihr/api/swagger.yaml?1234',
    dom_id: '#swagger-ui',
    layout: 'BaseLayout',
    defaultModelsExpandDepth: -1,
    presets: [SwaggerUI.presets.apis],
    deepLinking: false,
  })
})

</script>

<template>
  <div class="row justify-center">
    <div class="col-10">
      <div id="swagger-ui"></div>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
.IHR_section_api
  width 85%

.opblock.opblock-get
  background red
  padding-top 100px
  color $primary

</style>