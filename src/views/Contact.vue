<script setup></script>

<template>
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
        <a href="mailto:admin@ihr.live">admin@ihr.live</a>
      </p>
    </div>
  </div>
</template>

<style lang="stylus">
#IHR_
  &contact-page
    width 60%
    margin 0 auto
    @media screen and (max-width: 600px)
      width 100%
      padding: 0 1rem;

.IHR_background
    width 1000px
    height 1000px
    max-width 100%
    background-repeat no-repeat
    background-position left top
    background-size 1000px 1000px
    opacity 0.1
    position absolute
    top 450px
    overflow-x hidden
    position fixed
    @media screen and (max-width: 600px)
      width: 100%


.IHR_
  &contact-page

    & > h1
        line-height 1.5rem
        padding 0.5rem 0
        font-weight 500;
        border-bottom 1px solid #ccc
        margin 4rem 0 1.5rem
        @media screen and (max-width: 600px)
          font-size 1.8125rem

    & > h2
      margin-bottom 1.625rem
      font-weight 500;
      line-height 1.5rem
      border-bottom 1px solid #ccc
      margin 4rem 0 1.5rem
      @media screen and (max-width: 600px)
        font-size 1.5rem

    & > p
      font-size 1.5rem
      width 100%
      margin 2.5rem auto
      text-align left
      @media screen and (max-width: 600px)
        font-size 1rem
      & > a
        word-break break-word
</style>
