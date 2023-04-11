<template>
  <div id="page">
    <div class="notfound">
      <div class="image404">
        <h1>4<span> </span>4</h1>
      </div>
      <h2>What on Internet are you doing here !</h2>
      <p>Well this is sad the page that you were looking for is not here</p>
      <button class="sec" @click="$router.push('/')">Get Yourself Home</button>
    </div>
  </div>
</template>

<script>
</script>

<style lang="stylus" scoped>
@import '~@/styles/pageNotFound.styl';
</style>
