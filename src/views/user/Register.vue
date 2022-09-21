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
    <h1>{{ $t("sigIn.register") }}</h1>
    <div class="shadow-2" id="IHR_sig-in-form-container">
      <q-input v-model="email" label="email" type="email"
        :rules="[val => $ihrStyle.validateEmail(val) || $t('forms.fancyEmail')]">
        <template v-slot:prepend>
          <q-icon name="fa fa-envelope" />
        </template>
      </q-input>
      <q-input v-model="password" label="password" @blur="showCode" :type="isPwd ? 'password' : 'text'" :rules="[
        val => $ihrStyle.validatePassword(val) || $t('forms.weakPassword')
      ]">
        <template v-slot:prepend>
          <q-icon name="fa fa-key" />
        </template>
        <template v-slot:append>
          <q-icon :name="isPwd ? 'far fa-eye' : 'far fa-eye-slash'" class="cursor-pointer" @click="isPwd = !isPwd" />
        </template>
      </q-input>
      <q-input v-show="isShowCode" v-model="code" label="verification code" :rules="[
        val => $ihrStyle.validateCode(val) || $t('forms.weakCode')
      ]">
        <template v-slot:prepend>
          <q-icon name="fa fa-check" />
        </template>
        <template v-slot:append>
          <q-btn v-if="!countShow" @click="sendCode" color="secondary" no-caps>{{ codeText }}</q-btn>
          <q-btn v-else color="secondary" no-caps>{{ codeCount }}</q-btn>
        </template>
      </q-input>
      <!-- <div :style="{
        height: recaptcha_loaded ? 'auto' : '90px',
        position: 'relative'
      }">
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
      </div> -->
      <!-- <div>{{ $t("sigIn.mailWillBeSent") }}</div> -->
      <div style="display:flex;justify-content:space-between;">
        <router-link to="login">Login</router-link>
      </div>
      <q-btn color="positive" @click="validateAndSend">register</q-btn>
    </div>
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
  // components: { VueRecaptcha },
  name: 'RegisterPage',
  data() {
    return {
      email: "",
      password: "",
      recaptcha: "",
      code: "",
      codeText: "send code",
      message: "",
      emailSent: false,
      isPwd: true,
      isShowCode: false,
      recaptcha_loaded: false,
      countShow: false,
      codeCount: 60,
      errors: []
    };
  },
  mounted() {
    this.$libraryDelayer.load("google_recaptcha", () => {
      this.recaptcha_loaded = true;
      this.$libraryDelayer.getRidOfInlineStyle("IHR_sig-in-captcha", "div");
    });
  },
  methods: {
    expired() {
      this.recaptcha = "";
      console.log("expired");
    },
    verify(response) {
      this.recaptcha = response;
    },
    ensureCss(id) {
      this.$libraryDelayer.getRidOfInlineStyle(id, "div");
    },
    validateAndSend() {
      this.errors = [];
      // this.recaptcha != "" || this.errors.push("missingReCaptcha");
      this.$ihrStyle.validatePassword(this.password) ||
        this.errors.push("passwordTooWeak");
      this.$ihrStyle.validateEmail(this.email) ||
        this.errors.push("strangeEmail");
      if (this.errors.length == 0)
        this.$ihr_api.userSignIn(
          this.email,
          this.password,
          this.code,
          (res) => {
            this.emailSent = true
            this.message = res.msg
            if (res.code === 200) {
              this.$router.push('/en-us/login')
            }
          },
          error => {
            this.emailSent = true
            this.message = error.detail
          }
        );
    },
    showCode() {
      this.isShowCode = true
    },
    sendCode() {
      const TIME_COUNT = 60
      this.countShow = true
      let codeTimer = setInterval(() => {
        if (this.codeCount > 0 && this.codeCount <= TIME_COUNT) {
          this.codeCount--
        } else {
          this.countShow = false
          this.codeCount = 60
          clearInterval(codeTimer)
          codeTimer = null
        }
      }, 1000)
      this.$ihr_api.sendsendregisteremail(this.email,
        (res) => {
          this.emailSent = true
          this.message = res.msg
        },
        (error) => {
          this.emailSent = true
          this.message = error.detail
        })
    }

  },
  computed: {
  }
};
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
