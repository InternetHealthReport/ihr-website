<template>
  <div class="q-pa-md">
    <div class="q-pb-sm">Model: {{ model }}</div>

    <q-date v-model="model" />
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  setup() {
    return {
      model: ref({ year: '2020/07/08' }),
    }
  },
}
</script>
