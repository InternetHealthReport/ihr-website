<template>
  <div id="IHR_account-activation">
    <h1>{{ $t('accountActivation.title') }}</h1>
    <div class="shadow-2">
      {{ bodyText }}
      <div v-if="actualState == state.VALIDATION" class="IHR_content">
        <q-spinner color="secondary" size="15em" />
      </div>
      <div v-else-if="actualState == state.VALIDATE" class="IHR_content IHR_content-confirm">
        <login-form v-model="loginError">
          <template v-slot:default="user">
            <q-btn color="positive" @click="validateAndSend(user.email, user.password)" id="IHR_validare-and-send">{{
              $t('header.signUp')
            }}</q-btn>
          </template>
        </login-form>
      </div>
      <div v-else-if="actualState == state.VALID" class="row justify-around IHR_content">
        <q-btn color="secondary" class="col-3" @click="$router.push({ name: 'personal_page' })">{{ $t('personalPage.title') }}</q-btn>
      </div>
      <div v-else class="row justify-around IHR_content">
        <q-btn color="positive" class="col-3" @click="$router.push({ name: 'sign_up' })">{{ $t('header.signUp') }}</q-btn>
        <q-btn color="secondary" class="col-3" @click="$router.push({ name: 'home' })">homepage</q-btn>
      </div>
    </div>
  </div>
</template>

<script>
import LoginForm from '@/components/forms/LoginForm'

const TOKEN_STATE = {
  NOPE: 0,
  VALIDATE: 1,
  VALIDATION: 2,
  INVALID: 3,
  VALID: 4,
  ALREADY_VALIDATED: 5,
}

export default {
  //console.log(this.$route.query.test) // outputs 'yay'
  components: {
    LoginForm,
  },
  data() {
    return {
      state: TOKEN_STATE,
      actualState: TOKEN_STATE.NOPE,
      loginError: false,
      isPwd: true,
    }
  },
  beforeMount() {
    if (this.$route.query.token !== undefined) {
      this.actualState = TOKEN_STATE.VALIDATE
    } else {
      this.actualState = TOKEN_STATE.NOPE
    }
  },
  mounted() {},
  methods: {
    validateAndSend(email, password) {
      if (this.$ihrStyle.validatePassword(password) && this.$ihrStyle.validateEmail(email)) {
        let entrypoint = this.$route.query.active ? this.$ihr_api.userChangeEmail : this.$ihr_api.userValidate
        entrypoint(
          email,
          password,
          this.$route.query.token,
          () => {
            this.actualState = TOKEN_STATE.VALID
          },
          error => {
            console.log(error.status)
            switch (error.status) {
              case 403:
                this.$q.notify({
                  color: 'negative',
                  multiline: true,
                  message: this.$t('accountActivation.wrongCredential'),
                })
                break
              case 409:
                this.actualState = TOKEN_STATE.ALREADY_VALIDATED
                break
              default:
                this.actualState = TOKEN_STATE.INVALID
            }
          }
        )
      }
    },
  },
  computed: {
    bodyText() {
      switch (this.actualState) {
        default:
        case TOKEN_STATE.NOPE:
          return this.$t('accountActivation.goAway')
        case TOKEN_STATE.VALIDATE:
          return this.$t('accountActivation.signIntoValidate')
        case TOKEN_STATE.VALIDATION:
          return this.$t('accountActivation.validationInProgress')
        case TOKEN_STATE.INVALID:
          return this.$t('accountActivation.tokenInvalid')
        case TOKEN_STATE.VALID:
          return this.$t('accountActivation.accountValidate')
        case TOKEN_STATE.ALREADY_VALIDATED:
          return this.$t('accountActivation.alreadyValidated')
      }
    },
  },
}
</script>

<style lang="stylus" scoped>
#IHR_
  &account-activation
    width 80%
    padding 0pt 16pt
    margin 0 auto

    & > h1
      text-align center
      &:first-letter
        text-transform capitalize
    & > div
      width 70%
      text-align center
      margin 0px auto
      padding 28pt 0pt 28pt 0pt
      font-size 20pt

.IHR_
  &content
    margin-top 2em
    & > .col-3
      margin-top 12pt
      font-size 14pt
      font-weight 600
      height @font-size * 3

    &-confirm
      & > *
        width 60%

        margin 4pt auto
#IHR_
  &validare-and-send
    width auto
    font-size 14pt
</style>
