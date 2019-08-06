<template>
  <div>
    <tracemon :utc-time="new Date('2019-07-25T11:30:00.000Z')" :propb-ids="porbs"/>
  </div>
</template>
<script>
import Tracemon from "../components/ripe/Tracemon"

export default {
  components: {
    Tracemon
  },
  data() {
    return {
      porbs:{
        1004797: [3491],
        9181034: [15701],
        9181042: [14827],
        9181792: [15701],
      }
    }
  }
};
</script>

<style>
</style>
