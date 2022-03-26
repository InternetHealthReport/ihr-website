<template>
  <div id="IHR_reset-password">
    <transition name="IHR_errors-banner-animation">
      <q-banner class="IHR_errors-banner" v-if="error != null">
        <p>{{ $t(`resetPassword.error${error}`) }}</p>
        <template v-slot:action>
          <q-btn flat color="white" :label="$t('close')" @click="error = null" />
        </template>
      </q-banner>
    </transition>
    <h1>{{ title }}</h1>
    <div class="row justify-around IHR_content" v-if="$ihr_api.authenticated">
      <q-btn color="secondary" class="col-3" @click="$router.push({ name: 'personal_page' })">{{ $t('personalPage.title') }}</q-btn>
    </div>
    <div class="shadow-2" id="IHR_reset-password-form" v-else-if="!emailSent">
      <q-input v-model="email" label="email" type="email" :rules="[val => $ihrStyle.validateEmail(val) || $t('forms.fancyEmail')]">
        <template v-slot:prepend>
          <q-icon name="far fa-envelope" />
        </template>
      </q-input>
      <div>
        <password-confirm v-model="password" v-if="token != undefined" ref="password" />
      </div>
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
      <q-btn color="secondary" @click="token != undefined ? validateAndChange() : validateAndSend()">
        {{ $t(`resetPassword.${token != undefined ? 'resetPassword' : 'recoverPassword'}`) }}
      </q-btn>
    </div>
    <div class="shadow-2" id="IHR_confirm-your-email" v-else>
      <div>{{ $t('resetPassword.instructionPart1') }}</div>
      <div id="IHR_email-confirmation">{{ email }}</div>
      <div>{{ $t('resetPassword.instructionPart2') }}</div>
    </div>
  </div>
</template>

<script>
import VueRecaptcha from 'vue-recaptcha'
import PasswordConfirm from '@/components/forms/PasswordConfirm'

export default {
  components: {
    VueRecaptcha,
    PasswordConfirm,
  },
  data() {
    return {
      email: '',
      recaptcha: '',
      password: '',
      token: this.$route.query.token,
      error: null,
      emailSent: false,
      recaptcha_loaded: false,
    }
  },
  mounted() {
    this.$libraryDelayer.load('google_recaptcha', () => {
      this.recaptcha_loaded = true
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
      if (!this.$ihrStyle.validateEmail(this.email)) {
        this.error = 'InvalidEmail'
        return
      }
      if (this.recaptcha == '') {
        this.error = 'AreYouRobot'
        return
      }
      this.$ihr_api.userResetPasswordRequest(
        this.email,
        this.recaptcha,
        () => {
          this.emailSent = true
          this.error = null
        },
        error => {
          this.error = error.status
          console.log(error.detail)
        }
      )
    },
    validateAndChange() {
      if (!this.$ihrStyle.validateEmail(this.email)) {
        this.error = 'InvalidEmail'
        return
      }
      if (!this.$refs['password'].isValid()) {
        this.error = this.password.toString()
        return
      }
      if (this.recaptcha == '') {
        this.error = 'AreYouRobot'
        return
      }
      this.$ihr_api.userResetPassword(
        this.email,
        this.password,
        this.recaptcha,
        () => {
          this.error = null
        },
        error => {
          this.error = error.status
          console.log(error.detail)
        }
      )
    },
  },
  computed: {
    title() {
      if (this.$ihr_api.authenticated) {
        return this.$t('resetPassword.youAreLoggedIn')
      }
      if (this.token != undefined) {
        return this.$t('resetPassword.fillToChange')
      }
      return this.emailSent ? this.$t('resetPassword.emailSent') : this.$t('resetPassword.title')
    },
  },
}
</script>
<style lang="stylus" scoped>
@import '../../styles/quasar.variables'
#IHR_
  &reset-password
    width 50%
    margin 2vh auto
    text-align center
    font-size 20pt

    & > h1:first-letter
      text-transform capitalize

    & > &-form, ~/confirm-your-email
      width 80%
      margin: 0 auto
      max-width 500px
      padding 10px 0px

      > *
        width 80%
        margin: 8pt auto

  &email-confirmation
    background-color $secondary
    display inline-block
    padding 6pt 24pt
    color white
    font-weight 500
    letter-spacing 1pt
</style>
