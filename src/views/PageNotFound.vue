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

<style lang="stylus" scoped>
#page {
  margin : 0;
  padding: 0;
  position: relative;
  height: 100vh;
}

#page .notfound {
  position: absolute;
  left: 50%;
  top: 50%;
  -webkit-transform: translate(-50%, -50%);
      -ms-transform: translate(-50%, -50%);
          transform: translate(-50%, -50%);
}

.notfound {
  max-width: 520px;
  width: 100%;
  text-align: center;
  line-height: 1.5;
}

.notfound .image404 {
  height: 190px;
}

.notfound .image404 h1 {
  font-family: 'Montserrat', sans-serif;
  font-size: 170px;
  font-weight: 700;
  margin: 0px;
  color: #232323;
}

.notfound .image404 h1>span {
  display: inline-block;
  width: 100px;
  height: 100px;
  background-image: url('../assets/imgs/ihr_logo.svg');
  background-size: cover;
  -webkit-transform: scale(1.4);
      -ms-transform: scale(1.4);
          transform: scale(1.4);
  z-index: -1;
}

.notfound h2 {
  font-family: 'Montserrat', sans-serif;
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  text-transform: uppercase;
  color: #232323;
}

.notfound p {
  font-family: 'Montserrat', sans-serif;
  color: #787878;
  font-weight: 300;
}

.notfound button {
  font-family: 'Montserrat', sans-serif;
  display: inline-block;
  padding: 12px 30px;
  font-weight: 700;
  background-color: #dc0000;
  color: #fff;
  border-radius: 40px;
  text-decoration: none;
  -webkit-transition: 0.2s all;
  transition: 0.2s all;
}

.notfound button:hover {
  opacity: 0.8;
}

@media screen and (max-width: 320px) {

  #page {
    width: 100vw;
  }
  .notfound .image404 {
    height: 85px;
  }
  .notfound .image404 h1 {
    font-size: 66px;
  }
  .notfound .image404 h1>span {
    width: 40px;
    height: 40px;
  }
}

@media screen and (max-width: 767px) {

  #page {
    width: 100vw;

  }
  .notfound .image404 {
    height: 115px;
  }
  .notfound .image404 h1 {
    font-size: 86px;
  }
  .notfound .image404 h1>span {
    width: 60px;
    height: 60px;
  }
}
</style>
