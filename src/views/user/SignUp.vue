<template>
  <div id="IHR_sig-in-form">
    <transition name="IHR_errors-banner-animation">
      <q-banner class="IHR_errors-banner" v-if="errors.length != 0">
        <p v-for="error in errors" :key="error">{{ $t(`sigIn.${error}`) }}</p>
        <template v-slot:action>
          <q-btn flat color="white" :label="$t('close')" @click="errors = []" />
        </template>
      </q-banner>
    </transition>
    <h1>{{ title }}</h1>
    <div class="shadow-2" id="IHR_sig-in-form-container" v-if="!emailSent">
      <q-input v-model="email" label="email" type="email" :rules="[val => $ihrStyle.validateEmail(val) || $t('forms.fancyEmail')]">
        <template v-slot:prepend>
          <q-icon name="fa fa-envelope" />
        </template>
      </q-input>
      <q-input
        v-model="password"
        label="password"
        :type="isPwd ? 'password' : 'text'"
        :rules="[val => $ihrStyle.validatePassword(val) || $t('forms.weakPassword')]"
      >
        <template v-slot:prepend>
          <q-icon name="fa fa-key" />
        </template>
        <template v-slot:append>
          <q-icon :name="isPwd ? 'far fa-eye' : 'far fa-eye-slash'" class="cursor-pointer" @click="isPwd = !isPwd" />
        </template>
      </q-input>
      <div
        :style="{
          height: recaptcha_loaded ? 'auto' : '90px',
          position: 'relative',
        }"
      >
        <vue-recaptcha
          :sitekey="$ihrStyle.recaptchaKey"
          id="IHR_sig-in-captcha"
          @verify="verify"
          @expired="expired"
          :render="ensureCss"
        ></vue-recaptcha>
        <q-inner-loading :showing="!recaptcha_loaded">
          <q-spinner-gears size="50px" color="primary" />
        </q-inner-loading>
      </div>
      <div>{{ $t('sigIn.mailWillBeSent') }}</div>
      <q-btn color="positive" @click="validateAndSend">{{ $t('header.signUp') }}</q-btn>
    </div>
    <div class="shadow-2" id="IHR_confirm-your-email" v-else>
      <div>{{ $t('sigIn.emailSentTo') }}</div>
      <div id="IHR_email-confirmation">{{ email }}</div>
      <div>{{ $t('sigIn.pleaseFollowTheLink') }}</div>
    </div>
  </div>
</template>

<script>
import VueRecaptcha from 'vue-recaptcha'

export default {
  components: { VueRecaptcha },
  data() {
    return {
      email: '',
      password: '',
      recaptcha: '',
      emailSent: false,
      isPwd: true,
      recaptcha_loaded: false,
      errors: [],
    }
  },
  mounted() {
    this.$libraryDelayer.load('google_recaptcha', () => {
      this.recaptcha_loaded = true
      this.$libraryDelayer.getRidOfInlineStyle('IHR_sig-in-captcha', 'div')
    })
  },
  methods: {
    expired() {
      this.recaptcha = ''
      console.log('expired')
    },
    verify(response) {
      this.recaptcha = response
    },
    ensureCss(id) {
      this.$libraryDelayer.getRidOfInlineStyle(id, 'div')
    },
    validateAndSend() {
      this.errors = []
      this.recaptcha != '' || this.errors.push('missingReCaptcha')
      this.$ihrStyle.validatePassword(this.password) || this.errors.push('passwordTooWeak')
      this.$ihrStyle.validateEmail(this.email) || this.errors.push('strangeEmail')
      if (this.errors.length == 0)
        this.$ihr_api.userSignIn(
          this.email,
          this.password,
          this.recaptcha,
          () => {
            this.emailSent = true
            this.password = ''
          },
          error => {
            console.error(error) //TODO bettere error handling
            console.log(error.detail)
          }
        )
    },
  },
  computed: {
    title() {
      return this.emailSent ? this.$t('sigIn.thankYou') : this.$t('sigIn.title')
    },
  },
}
</script>
<style lang="stylus" scoped>
@import '../../styles/quasar.variables'
#IHR_
  &sig-in-
    &form
      width 90%
      margin 2vh auto
      text-align center

      & > h1:first-letter
        text-transform capitalize

      & > &-container
        width 80%
        margin: 0 auto
        max-width 500px
        padding 10px 0px

        > *
          width 80%
          margin: 8pt auto

  &confirm-your-email
    width 70%
    margin 0px auto
    padding 20pt 0pt 10pt 0pt
    font-size 20pt
    & > div
      margin-bottom 20pt
      &:first-child:first-letter
        text-transform capitalize

  &email-confirmation
    background-color $secondary
    display inline-block
    padding 6pt 24pt
    color white
    font-weight 500
    letter-spacing 1pt
</style>
