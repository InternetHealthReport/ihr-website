<template>
  <div>
    <h1>Country Report</h1>
  </div>
</template>

<script>
export default {
  components: {},
  data: function() {
    return {
      data: [
        {
          x: [1, 2, 3, 4],
          y: [10, 15, 13, 17],
          type: "scatter"
        }
      ],
      layout: {
        title: "My graph"
      }
    };
  }
};
</script>

<style></style>
