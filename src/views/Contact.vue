<template>
  <div>
    <div id="IHR_contact-page">
      <div class="IHR_contact-page">
        <h1>Feedback</h1>
        <p class="IHR_description">
          Please submit bug reports and feature requests on Github:
          <a href="https://github.com/InternetHealthReport/ihr-website/issues" target="_blank"
            >https://github.com/InternetHealthReport/ihr-website/issues</a
          >
        </p>
        <h1>Others</h1>
        <p>
          For questions and inquiries, please contact us at:
          <a href="mailto:ihr-admin@iij-ii.co.jp">ihr-admin@iij-ii.co.jp</a>
        </p>
      </div>
    </div>
    <div
      class="IHR_background"
      :style="{
        backgroundImage: 'url(' + require('@/assets/imgs/ihr_logo.svg') + ')',
      }"
    ></div>
  </div>
</template>
<script>
export default {
  name: 'ContactView',
  components: {},
  data() {
    return {}
  },
}
</script>

<style lang="stylus">
#IHR_
  &contact-page
    width 60%
    margin 0pt auto

.IHR_background
    width 1000px
    height 1000px
    background-repeat no-repeat
    background-position left top
    background-size 1000px 1000px
    opacity 0.1
    position absolute
    left 60%
    top 450px
    overflow-x hidden
    position fixed


.IHR_
  &contact-page

    & > h1
        line-height 1.5rem
        padding 0.5rem 0
        font-weight 500;
        border-bottom 1px solid #ccc
        margin 4rem 0 1.5rem

    & > h2
      margin-bottom 20pt
      font-weight 500;
      line-height 1.5rem
      border-bottom 1px solid #ccc
      margin 4rem 0 1.5rem

    & > p
      font-size 18pt
      width 90%
      margin 30pt auto
      text-align left
</style>
