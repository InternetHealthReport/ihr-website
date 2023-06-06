<template>
  <div>
    <p>AS Name:</p>
    <p>AS Number: {{ asNumber }}</p>
    <p>Country of origin:</p>
    <p>Website:</p>
    <p>AS Prefix Count:</p>
    <p>AS Neighbours:</p>
  </div>
</template>
<script>
export default {
  props: {
    asNumber: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {}
  },
}
</script>
<style></style>
