<template>
    <fragment>
        <div>
            <label for="password" class="IHR_label">password</label>
            <q-input
                v-model="password"
                name="password"
                type="password"
                :readonly="readOnly"
                :input-class="passwordClass"
                :filled="filled"
                :borderlessy="borderlessy"
                :rules="[
                    val => $ihrStyle.validatePassword(val) || $t('genericErrors.invalid'),
                    val => val == password2 || $t('genericErrors.notMatchingPassword'),
                ]"
                @input="$refs['passwordConfirm'].validate()"
                ref="password"
            >
                <template v-slot:append>
                    <q-icon :name="isPwd ? 'far fa-eye' : 'far fa-eye-slash'" class="cursor-pointer" @click="isPwd = !isPwd" />
                </template>
            </q-input>
            <slot></slot>
        </div>
        <div v-show="!readOnly">
            <label for="passwordConfrim" class="IHR_label">{{ $t('passwordConfirm') }}</label>
            <q-input
                v-model="password2"
                name="passwordConfrim"
                type="password"
                :input-class="passwordClass"
                :filled="filled"
                :rules="[
                    val => val == password || $t('genericErrors.notMatchingPassword'),
                    val => $ihrStyle.validatePassword(val) || $t('genericErrors.invalid'),
                ]"
                @input="$refs['password'].validate()"
                ref="passwordConfirm"
            />
        </div>
    </fragment>
</template>

<script>
const PASSWORD_STATE = {
    INVALID: {
        toString() {
            return 'InvalidPassword'
        },
    },
    DONT_MATCH: {
        toString() {
            return 'NotMatchingPassword'
        },
    },
}

export default {
    props: {
        value: {
            required: true,
        },
        readOnly: {
            type: Boolean,
            required: false,
            default: false,
        },
        borderlessy: {
            type: Boolean,
            required: false,
            default: false,
        },
        filled: {
            type: Boolean,
            required: false,
            default: false,
        },
    },
    data() {
        return {
            password: 'default password',
            password2: '',
            isPwd: true,
        }
    },
    methods: {
        resetValidation(value) {
            this.password = value
            this.password2 = ''
            this.$refs['passwordConfirm'].resetValidation()
            this.$refs['password'].resetValidation()
        },
        checkPasswords() {
            if (!this.$ihrStyle.validatePassword(this.password)) {
                this.$emit('input', PASSWORD_STATE.INVALID)
                return
            }
            if (this.password != this.password2) {
                this.$emit('input', PASSWORD_STATE.DONT_MATCH)
                return
            }
            this.$emit('input', this.password)
        },
        isValid() {
            return typeof this.value === 'string' || this.value instanceof String
        },
    },
    mounted() {
        this.checkPasswords()
    },
    computed: {
        passwordClass() {
            return this.readOnly ? 'IHR_input-readonly' : 'IHR_input-editable'
        },
    },
    watch: {
        password() {
            this.checkPasswords()
        },
        password2() {
            this.checkPasswords()
        },
    },
}
</script>

<style lang="stylus" scoped>
/*
.IHR_
  &input-
    &readonly
      text-align center

    &editable
      text-align left
*/
</style>
