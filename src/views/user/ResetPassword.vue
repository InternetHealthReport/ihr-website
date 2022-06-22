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
    <h1>{{ $t('resetPassword.title') }}</h1>
    <!-- <div class="row justify-around IHR_content" v-if="$ihr_api.authenticated">
            <q-btn color="secondary" class="col-3" @click="$router.push({ name: 'personal_page' })">{{ $t('personalPage.title') }}</q-btn>
        </div> -->
    <div class="shadow-2" id="IHR_reset-password-form">
      <q-input v-model="email" label="email" type="email"
        :rules="[val => $ihrStyle.validateEmail(val) || $t('forms.fancyEmail')]">
        <template v-slot:prepend>
          <q-icon name="fa fa-envelope" />
        </template>
      </q-input>
      <q-input v-model="password" label="new_password" :type="isPwd ? 'password' : 'text'"
        :rules="[val => $ihrStyle.validatePassword(val) || $t('forms.weakPassword')]">
        <template v-slot:prepend>
          <q-icon name="fa fa-key" />
        </template>
        <template v-slot:append>
          <q-icon :name="isPwd ? 'far fa-eye' : 'far fa-eye-slash'" class="cursor-pointer" @click="isPwd = !isPwd" />
        </template>
      </q-input>
      <q-input v-model="code" label="code" :rules="[val => $ihrStyle.validateCode(val) || $t('forms.weakCode')]">
        <template v-slot:prepend>
          <q-icon name="fa fa-check" />
        </template>
        <template v-slot:append>
          <q-btn @click="sendCode" color="secondary" no-caps>send</q-btn>
        </template>
      </q-input>
      <div :style="{
        height: recaptcha_loaded ? 'auto' : '90px',
        position: 'relative',
      }">
        <!-- <vue-recaptcha
          :sitekey="$ihrStyle.recaptchaKey"
          id="IHR_sig-in-captcha"
          @verify="verify"
          @expired="expired"
          :render="ensureCss"
        ></vue-recaptcha> -->
        <q-inner-loading :showing="!recaptcha_loaded">
          <q-spinner-gears size="50px" color="primary" />
        </q-inner-loading>
      </div>
      <q-btn color="positive" @click="forgetpassword()">
        {{ $t('resetPassword.resetPassword') }}
      </q-btn>
    </div>
    <!-- <div class="shadow-2" id="IHR_confirm-your-email" v-else>
            <div>{{ $t('resetPassword.instructionPart1') }}</div>
            <div id="IHR_email-confirmation">{{ email }}</div>
            <div>{{ $t('resetPassword.instructionPart2') }}</div>
        </div> -->
    <q-dialog v-model="emailSent">
      <q-card style="width: 300px">
        <q-card-section>
          <div class="text-h6">Alert</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          {{ message }}
        </q-card-section>

        <q-card-actions align="right" class="bg-white text-teal">
          <q-btn flat label="OK" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
// import VueRecaptcha from "vue-recaptcha";

export default {
  components: {
    // VueRecaptcha,
  },
  data() {
    return {
      email: '',
      recaptcha: '',
      password: '',
      code: '',
      isPwd: true,
      message: '',
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
    sendCode() {
      this.$ihr_api.sendforgetpasswordemail(
        this.email,
        res => {
          this.emailSent = true
          this.message = res.msg
        },
        error => {
          this.emailSent = true
          this.message = error.detail
        }
      )
    },
    forgetpassword() {
      if (!this.$ihrStyle.validateEmail(this.email)) {
        this.error = 'InvalidEmail'
        return
      }
      if (!this.$ihrStyle.validatePassword(this.password)) {
        this.error = 'passwordTooWeak'
        return
      }
      // if (this.recaptcha == '') {
      //     this.error = 'AreYouRobot'
      //     return
      // }
      this.error = null
      this.$ihr_api.userforgetpassword(
        this.email,
        this.password,
        this.code,
        res => {
          this.emailSent = true
          this.message = res.msg
        },
        error => {
          this.emailSent = true
          this.message = error.detail
        }
      )
    },
  },
  computed: {},
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
