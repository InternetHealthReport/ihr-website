<template>
  <div class="container">
    <div class="image">
      <img class="responsive" src="../assets/imgs/img.svg" style="300px" alt="404" />
    </div>
    <p class="head">What on Internet are you doing here !</p>
    <p class="content">Well this is sad the page that you were looking for is not here</p>
    <button class="sec" @click="$router.push('/')">Get Yourself Home</button>
  </div>
</template>

<style lang="scss" scoped>
.container {
  align-content: center;
  text-align: center;
  color: #263238;
  line-height: 1.3;
  margin: 5rem auto;

  .sec {
    background-color: #dc0000;
    text-align: center;
    font: bold;
    height: 30px;
    border-radius: 12px;
    border: 1px solid #dc0000;
  }

  .head {
    font-weight: bold;
    font-size: 2.5em;
    line-height: 1.3em;
    margin-top: 0.2em;
  }

  .content {
    font-weight: 500;
    font-size: 1.4em;
  }

  .image .resposive {
    object-fit: contain;
    max-width: 50%;
    height: auto;
  }
}
</style>
