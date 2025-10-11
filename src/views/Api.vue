<script setup>
import { onMounted } from 'vue'
import { SwaggerUIBundle, SwaggerUIStandalonePreset } from 'swagger-ui-dist'
import 'swagger-ui-dist/swagger-ui.css'

onMounted(() => {
  SwaggerUIBundle({
    url: 'https://www.ihr.live/ihr/api/openapi.json',
    dom_id: '#swagger-ui',
    layout: 'BaseLayout',
    defaultModelsExpandDepth: -1,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    deepLinking: false
  })
})
</script>

<template>
  <div class="row justify-center">
    <div class="col-10">
      <div id="swagger-ui" />
    </div>
  </div>
</template>

<style scoped></style>
