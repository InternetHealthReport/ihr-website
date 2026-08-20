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
  <div class="content-width">
    <div id="swagger-ui" class="swagger-wrapper"></div>
  </div>
</template>

<style>
/* Reset your app's global overrides inside the swagger wrapper */
.swagger-wrapper h1,
.swagger-wrapper h2,
.swagger-wrapper h3,
.swagger-wrapper h4,
.swagger-wrapper h5,
.swagger-wrapper h6 {
  font-size: revert !important;
  font-weight: revert !important;
  color: revert !important;
  margin: revert !important;
  line-height: revert !important;
  border-bottom: none !important;
}

.swagger-wrapper p {
  font-size: revert !important;
  margin: revert !important;
  color: revert !important;
  line-height: revert !important;
}

.swagger-wrapper p::first-letter {
  text-transform: none !important;
}

.swagger-wrapper a {
  color: revert !important;
  text-decoration: revert !important;
}

.swagger-wrapper ul,
.swagger-wrapper li {
  margin: revert !important;
  padding: revert !important;
  list-style: revert !important;
}

.swagger-wrapper * {
  box-sizing: revert;
}
</style>
