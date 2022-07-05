<template>
    <q-list>
        <q-item>
            <q-item-section>
                <q-input
                    v-model="email"
                    label="email"
                    type="email"
                    :rules="[val => $ihrStyle.validateEmail(val) || $t('forms.fancyEmail'), externalError]"
                    @input="$emit('input', false)"
                    ref="email"
                >
                </q-input>
            </q-item-section>
        </q-item>
        <q-item>
            <q-item-section>
                <q-input
                    v-model="password"
                    label="password"
                    :type="isPwd ? 'password' : 'text'"
                    :rules="[val => $ihrStyle.validatePassword(val) || $t('forms.weakPassword'), externalError]"
                    ref="password"
                    @input="$emit('input', false)"
                >
                    <template v-slot:append>
                        <q-icon :name="isPwd ? 'far fa-eye' : 'far fa-eye-slash'" class="cursor-pointer" @click="isPwd = !isPwd" />
                    </template>
                </q-input>
            </q-item-section>
        </q-item>
        <q-item v-if="hasDefaultSlot">
            <q-item-section>
                <slot :email="validEmailOrNull" :password="validPasswordOrNull"></slot>
            </q-item-section>
        </q-item>
    </q-list>
</template>

<script>
class MalformedInput extends Error {
    constructor(message) {
        super(message)
    }
}

export default {
    props: {
        value: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            email: '',
            password: '',
            isPwd: true,
        }
    },
    methods: {
        externalError(val) {
            return !this.value || this.$t('forms.loginUnsuccessful')
        },
    },
    computed: {
        hasDefaultSlot() {
            return !!this.$slots.default || !!this.$scopedSlots
        },
        validEmailOrNull() {
            return this.$ihrStyle.validateEmail(this.email) ? this.email : null
        },
        validPasswordOrNull() {
            return this.$ihrStyle.validatePassword(this.password) ? this.password : null
        },
    },
    watch: {
        value(oldValue, newValue) {
            this.$refs.email.validate(this.email)
            this.$refs.password.validate(this.password)
        },
    },
}

export { MalformedInput }
</script>

<style lang="stylus">
.IHR_
  &signin-button
    margin 2pt 0pt 3pt 0pt
</style>
