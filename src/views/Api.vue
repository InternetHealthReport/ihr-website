<template>
  <div>
      <div id="swagger-ui"></div>
  </div>
</template>
<script>
import SwaggerUI, { presets } from 'swagger-ui'

export default {
  components: {
  },
  data() {
    return {
    }
  },
  mounted: function() {
    const ui = SwaggerUI({
        url: "https://ihr.iijlab.net/ihr/swagger.yaml",
        dom_id: "#swagger-ui",
        layout: "BaseLayout",
        presets: [presets.apis],
        deepLinking: false
    });
  }
};
</script>

<style lang="stylus" scoped>
.version
    color red
</style>
