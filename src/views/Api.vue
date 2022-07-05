<template>
  <div class="row justify-center">
    <div class="col-10 ">
      <div id="swagger-ui"></div>
    </div>
  </div>
</template>
<script>
import SwaggerUI, { presets } from "swagger-ui";

export default {
  components: {},
  name:'ApiPage',
  data() {
    return {};
  },
  mounted: function() {
    const ui = SwaggerUI({
      url: "http://175.24.90.72:8000/swagger.yaml?1234",
      dom_id: "#swagger-ui",
      layout: "BaseLayout",
      defaultModelsExpandDepth: -1,
      presets: [presets.apis],
      deepLinking: false
    });
  }
};
</script>

<style lang="stylus" scoped>
@import '~quasar-variables'

.IHR_section_api
  width 85%

.opblock.opblock-get
        background red
        padding-top 100px
        color $primary
</style>
