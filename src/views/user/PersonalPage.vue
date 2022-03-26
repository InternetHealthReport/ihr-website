<template>
  <div>
    <div v-if="!$ihr_api.authenticated" class="shadow-2 IHR_not-access">
      <h2>{{ $t('personalPage.goAway') }}</h2>
      <div class="row justify-around">
        <q-btn color="secondary" class="col-3" @click="$router.push({ name: 'sign_up' })">{{ $t('header.signUp') }}</q-btn>
        <q-btn color="secondary" class="col-3" @click="$router.push({ name: 'home' })">homepage</q-btn>
      </div>
    </div>
    <div v-else>
      <q-drawer :value="showSidebar" side="left" bordered content-class="IHR_personal-page-sidebar">
        <h3>{{ $t('personalPage.title') }}</h3>
        <div>
          <router-link :to="{ name: 'personal_page', hash: '#profile' }" class="IHR_delikify">{{
            $t('personalPage.personaInfo')
          }}</router-link>
        </div>
        <div>
          <router-link :to="{ name: 'personal_page', hash: '#settings' }" class="IHR_delikify">{{
            $t('personalPage.settings')
          }}</router-link>
        </div>
      </q-drawer>
      <div id="IHR_personal-page">
        <div id="profile">
          <h2>{{ $t('personalPage.personaInfo') }}</h2>
          <div v-show="toSave !== false">
            <label>{{ $t('personalPage.definitiveConfirm') }}</label>
            <confirm-element :value="false" :related-input="toSave" @save="submit" @restore="reset" />
          </div>
          <div>
            <label for="email" class="IHR_label">email</label>
            <q-input
              v-model="email.content"
              name="email"
              type="email"
              :readonly="email.readonly"
              :input-class="emailClass"
              :borderlessy="email.readonly"
            />
            <confirm-element
              v-model="email.readonly"
              :related-input="email.content"
              @save="activeSave({ email: email.content })"
              :restore.sync="email.content"
            />
          </div>
          <password-confirm v-model="password.content" :read-only="password.readonly" :borderlessy="password.readonly" ref="password">
            <confirm-element
              v-model="password.readonly"
              :related-input="password.content"
              @save="$refs['password'].isValid() ? activeSave({ password: password.content }) : (password.readonly = false)"
              @restore="$refs['password'].resetValidation(password.content)"
            />
          </password-confirm>
        </div>
        <div id="settings">
          <h2>{{ $t('personalPage.settings') }}</h2>
          <p>{{ $t('personalPage.settingInstruction') }}</p>
          <div class="row">
            <q-table
              :title="$t('personalPage.monitoredAs')"
              :data="monitoring.query.monitoredAsn"
              :columns="monitoring.columns"
              row-key="asnumber"
              selection="multiple"
              :selected.sync="monitoring.selected"
              class="IHR_settings-table col-9"
            >
              <template v-slot:top-right>
                <div class="q-gutter-xs row items-center">
                  <q-btn color="negative" v-show="monitoring.selected.length > 0" @click="removeMonitored">{{
                    $t('personalPage.removeSelected')
                  }}</q-btn>
                  <span class="IHR_label">{{ $t('personalPage.addAs') }}</span>
                  <network-search-bar>
                    <template v-slot:default="elem">
                      <q-btn @click="addAsn(elem.asn)" flat class="IHR_asn-element">
                        <q-item-section side>{{ elem.asn.number | ihr_NumberToAsOrIxp }}</q-item-section>
                        <q-item-section class="IHR_asn-name">{{ elem.asn.name }}</q-item-section>
                      </q-btn>
                    </template>
                  </network-search-bar>
                </div>
              </template>
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td auto-width>
                    <q-toggle dense v-model="props.selected" />
                  </q-td>
                  <q-td :props="props" key="asNumber">
                    <a
                      @click="
                        newWindow({
                          name: 'networks',
                          params: { asn: getCellValue(props, 'asNumber') },
                        })
                      "
                      href="javascript:void(0)"
                    >
                      {{ getCellValue(props, 'asNumber') }}
                    </a>
                  </q-td>
                  <q-td :props="props" key="name">{{ getCellValue(props, 'name') }}</q-td>
                </q-tr>
              </template>
            </q-table>
            <div class="col-3" id="IHR_monitored-as-panel">
              <q-btn-toggle
                :value="monitoring.globalLevel"
                @input="
                  monitoring.globalLevel = $event
                  monitoring.query.setGlobalLevel($event)
                "
                :toggle-color="nofifyLevelColor"
                :toggle-text-color="nofifyLevelColor == 'warning' ? 'black' : 'white'"
                :options="monitoring.levelOption"
              />
              <div class="IHR_info-level shadow-1">{{ explaination }}</div>
              <div class="q-gutter-sm" v-show="monitoring.query.modified">
                <q-btn color="positive" @click="saveMonitoring">{{ $t('personalPage.confirm') }}</q-btn>
                <q-btn color="negative" @click="monitoring.query.restore()">{{ $t('personalPage.reset') }}</q-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NetworkSearchBar from '@/components/search_bar/NetworkSearchBar'
import PasswordConfirm from '@/components/forms/PasswordConfirm'
import { MonitoringUserQuery } from '@/plugins/IhrApi'

const ConfirmElement = {
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    relatedInput: {
      required: true,
    },
  },
  data() {
    return {
      savedRelatedInput: this.relatedInput,
    }
  },
  methods: {
    primaryClick() {
      if (this.value) {
        this.readonly(false)
        return
      }
      this.readonly(true)
      if (this.savedRelatedInput != this.relatedInput) {
        this.$emit('save')
        this.save()
      }
    },
    readonly(value) {
      this.$emit('input', value)
    },
    save() {
      this.savedRelatedInput = this.relatedInput
    },
    restore() {
      this.$emit('restore', this.savedRelatedInput)
    },
  },
  computed: {
    primaryButton() {
      return this.value ? this.$t('personalPage.change') : this.$t('personalPage.confirm')
    },
    primaryColor() {
      return this.value ? 'secondary' : 'positive'
    },
  },
  template: `
  <span class="IHR_confirm-element">
    <q-btn :color="primaryColor" @click="primaryClick">
      {{primaryButton}}
    </q-btn>
    <q-btn color="negative" @click="readonly(true); restore();" v-show="!value">{{$t("personalPage.reset")}}</q-btn>
  </span>
  `,
}

export default {
  components: {
    ConfirmElement,
    NetworkSearchBar,
    PasswordConfirm,
  },
  props: {
    showSidebar: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    let monitoringLevel = []
    for (let level in MonitoringUserQuery.NOTIFY_LEVEL) {
      if (MonitoringUserQuery.NOTIFY_LEVEL[level] instanceof Function) continue
      monitoringLevel.push({
        label: MonitoringUserQuery.NOTIFY_LEVEL.toString(MonitoringUserQuery.NOTIFY_LEVEL[level]),
        value: MonitoringUserQuery.NOTIFY_LEVEL[level],
      })
    }

    return {
      toSave: false,
      saved: {
        email: 'original',
        password: 'user password',
      },
      email: {
        content: 'email@polpo.it',
        readonly: true,
      },
      password: {
        content: 'email@polpo.it',
        readonly: true,
      },
      monitoring: {
        modified: false,
        query: new MonitoringUserQuery(),
        globalLevel: MonitoringUserQuery.NOTIFY_LEVEL.LOW,
        levelOption: monitoringLevel,
        asn: [],
        selected: [],
        columns: [
          {
            name: 'asNumber',
            required: true,
            label: this.$t('asn'),
            align: 'left',
            field: row => row.asnumber,
            format: val => this.$options.filters.ihr_NumberToAsOrIxp(val),
            sortable: true,
          },
          {
            name: 'name',
            label: this.$t('name'),
            align: 'left',
            field: row => row.asname,
            format: val => val,
            sortable: true,
          },
        ],
      },
    }
  },
  mounted() {
    this.$emit('sidebar-action', true)
    this.$ihr_api.userShow(
      user => {
        this.saved.email = user.email
        this.email.content = user.email
        this.monitoring.query.set(user.monitoredasn)
        this.monitoring.globalLevel =
          user.monitoredasn.length == 0 ? MonitoringUserQuery.NOTIFY_LEVEL.LOW : user.monitoredasn[0].notifylevel
      },
      error => {
        console.log(error)
        if (error.status == 401)
          // unauthorized
          this.$ihr_api.userLogout()
        console.log(error)
      }
    )
  },
  beforeDestroy() {
    //invalidate everything to be safe
    this.email.content = 'invalid'
    this.password.content = 'invalid'
    this.monitoring.query = null
    this.saved.email = 'invalid'
    this.saved.password = 'invalid'
  },
  methods: {
    activeSave(changedElement) {
      if (this.toSave === false) {
        this.toSave = {}
      }
      this.toSave = { ...this.toSave, ...changedElement }
    },
    submit() {
      console.log(this.toSave)
      this.$ihr_api.userChangeCredentials(
        this.toSave,
        (_, response) => {
          let message = ''
          let data = JSON.parse(response.config.data)
          console.log(data)
          if (data.password != undefined) {
            message += this.$t('personalPage.changesApplied')
          }
          if (data.email != undefined) {
            message += this.$t('personalPage.confirmYourEmail')
          }

          this.$q.notify({
            color: 'positive',
            multiline: true,
            message: message,
          })
          this.toSave = false
        },
        error => {
          let message = ''
          if (error.status == 409) {
            message += this.$t('personalPage.error409')
          }

          this.$q.notify({
            color: 'negative',
            multilne: true,
            message: message + this.$t('personalPage.changesNotApplied'),
          })
          this.reset()
        }
      )
    },
    reset() {
      this.email.content = this.saved.email
      this.password.content = this.saved.password
      this.email.readonly = this.password.readonly = true
      this.toSave = false
    },
    addAsn(asn) {
      this.monitoring.query.push(asn, this.monitoring.globalLevel)
      this.monitoring.modified = true
      console.log('addAsn', asn)
    },
    removeMonitored() {
      this.monitoring.selected.forEach(elem => {
        this.monitoring.query.remove(elem.asnumber)
      })
      this.monitoring.selected = []
    },
    getCellValue(props, columnName) {
      console.log('getCellValue', props, columnName)
      let col = props.colsMap[columnName]
      return col.format(col.field(props.row))
    },
    saveMonitoring() {
      if (this.monitoring.query.verifyModified())
        this.$ihr_api.userAddMonitoring(
          this.monitoring.query,
          (_, response) => {
            this.monitoring.query.set(JSON.parse(response.config.data).monitoredasn)
          },
          err => {
            console.error(err)
          }
        )
    },
  },
  computed: {
    emailClass() {
      return this.email.editable ? 'IHR_input-readonly' : 'IHR_input-editable'
    },
    nofifyLevelColor() {
      return MonitoringUserQuery.NOTIFY_LEVEL.toColor(this.monitoring.globalLevel)
    },
    explaination() {
      let str = MonitoringUserQuery.NOTIFY_LEVEL.toString(this.monitoring.globalLevel)
      return this.$t(`personalPage.notifyLevelExplanation.${str}`)
    },
  },
}
</script>

<style lang="stylus">
@import '~quasar-variables';

#IHR_
  &personal-page
    width 90%
    margin 0pt auto

    & #profile
      width 90%

      & > div
        display table-row

        & > *
          display table-cell

        & > label
          text-align right
          padding-right 5pt
          font-weight 500

        & > *last-child
          padding-left 8pt


  &monitored-as-panel
    text-align center
    & .IHR_
      &info-level
        margin 7pt auto
        padding 4pt
        font-size 12pt
        background-color $info
        color white
        max-width 240px
        min-width 230px
        min-height 90px
        &:first-letter
          text-transform capitalize

.IHR_
  &confirm-element
    padding-left 8pt
  &not-access
    width 50%
    margin 40pt auto 0px auto
    padding 3pt 8pt 20pt 8pt
    text-align center
    & > h2
      margin-bottom 20pt

  &personal-page-sidebar
    & > h3
      margin-top 2pt
      width 88%
      margin 0px auto
      font-size 15pt
      font-weight 500

      &:first-letter
        text-transform capitalize

    & > div
      width 82%
      margin 4pt auto 2pt auto

      & a:hover
        padding-bottom 2pt
        border-bottom 2px solid $secondary

      & a:active
        border-bottom 2px solid $accent

  &asn-monitoring-board
    width 92%
    min-height 50vh
    margin-bottom 30vh
    margin-left 12pt

  &asn-element
    width 100%
    margin 0px
    padding 0px

    ~/asn-name
      text-align left

  &settings-table
    max-width 90%
</style>
