<template>
</template>

<script>

import ReactiveChart from '@/components/ReactiveChart'

export default {
  components: {
  },
  data:{
    data:[{
      x: [1,2,3,4],
      y: [10,15,13,17],
      type:"scatter"
    }],
    layout:{
      title: "My graph"
    }
  }
}
</script>

<style>

</style>
