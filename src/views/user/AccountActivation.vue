<template>
  <div id="IHR_account-activation">
    <h1>{{$t('accountActivation.title')}}</h1>
    <div class="shadow-2">
      {{bodyText}}
      <div v-if="checkState('VALIDATION')" class="IHR_content">
        <q-spinner color="secondary" size="4em" />
      </div>
      <div v-else-if="checkState('VALIDATE')" class="IHR_content IHR_content-confirm">
        <q-input
          v-model="email"
          label="email"
          type="email"
          :rules="[val => $ihrStyle.validateEmail(val) || $t('forms.fancyEmail')]"
        >
          <template v-slot:prepend>
            <q-icon name="far fa-envelope" />
          </template>
        </q-input>
        <q-input
          v-model="password"
          label="password"
          filled
          :type="isPwd ? 'password' : 'text'"
          :rules="[val => $ihrStyle.validatePassword(val) || $t('genericErrors.invalid')]"
        >
          <template v-slot:append>
            <q-icon
              :name="isPwd ? 'far fa-eye' : 'far fa-eye-slash'"
              class="cursor-pointer"
              @click="isPwd = !isPwd"
            />
          </template>
        </q-input>
        <q-btn color="secondary" @click="validateAndSend" id="IHR_validare-and-send">{{$t('header.signUp')}}</q-btn>
      </div>
      <div v-else-if="checkState('INVALID')" class="row justify-around IHR_content">
        <q-btn
          color="secondary"
          class="col-3"
          @click="$router.push({name : 'sign_in'})"
        >{{$t('header.signUp')}}</q-btn>
        <q-btn color="secondary" class="col-3" @click="$router.push({name : 'home'})">homepage</q-btn>
      </div>
      <div v-else-if="checkState('VALID')" class="row justify-around IHR_content">
        <q-btn
          color="secondary"
          class="col-3"
          @click="$router.push({name : 'sign_in'})"
        >{{$t('personalPage.title')}}</q-btn>
      </div>
      <div v-else class="row justify-around IHR_content">
        <q-btn
          color="secondary"
          class="col-3"
          @click="$router.push({name : 'sign_in'})"
        >{{$t('header.signUp')}}</q-btn>
        <q-btn color="secondary" class="col-3" @click="$router.push({name : 'home'})">homepage</q-btn>
      </div>
    </div>
  </div>
</template>

<script>
const TOKEN_STATE = {
  NOPE: 0,
  VALIDATE: 1,
  VALIDATION: 2,
  INVALID: 3,
  VALID: 4
};

export default {
  //console.log(this.$route.query.test) // outputs 'yay'
  data() {
    return {
      state: TOKEN_STATE.NOPE,
      email: "",
      password: "",
      isPwd: true
    };
  },
  beforeMount() {
    if (this.$route.query.token !== undefined) {
      this.state = TOKEN_STATE.VALIDATE;
    } else {
      this.state = TOKEN_STATE.NOPE;
    }
  },
  mounted() {
    console.log(this.token);
    console.log(this.state);
  },
  methods: {
    checkState(_state) {
      return TOKEN_STATE[_state] === this.state;
    },
    validateAndSend() {
      if(this.$ihrStyle.validatePassword(this.password) && this.$ihrStyle.validateEmail(this.email)) {
        this.$ihr_api.userValidate(this.email, this.password, this.$route.query.token,
        ()=>{
          this.password = "";
          this.sate = TOKEN_STATE.VALID;
          console.log("OKOK")
        },
        (error)=>{
          this.sate = TOKEN_STATE.INVALID;
          console.log(error.response.data.detail)
        });
      }
    }
  },
  computed: {
    bodyText() {
      switch (this.state) {
        default:
        case TOKEN_STATE.NOPE:
          return this.$t("accountActivation.goAway");
        case TOKEN_STATE.VALIDATE:
          return this.$t("accountActivation.signIntoValidate");
        case TOKEN_STATE.VALIDATION:
          return this.$t("accountActivation.validationInProgress");
        case TOKEN_STATE.INVALID:
          return this.$t("accountActivation.tokenInvalid");
        case TOKEN_STATE.VALID:
          return this.$t("accountActivation.accountValidate");
      }
    }
  }
};
</script>

<style lang="stylus" scoped>
#IHR_
  &account-activation
    width 80%
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
