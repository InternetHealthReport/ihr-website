<script setup>
import { ref, watch, onMounted } from 'vue'
import { useQuasar, date as qDateUtil } from 'quasar'
import { RouterLink } from 'vue-router'
import Tr from '@/i18n/translation'

const $q = useQuasar()

const drawer = ref($q.screen.gt.sm)

const props = defineProps({
  navigation: {
    type: Array,
    required: true
  },
  external: {
    type: Array,
    required: false
  },
  addressFamily: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: true
  },
  tags: {
    type: Array,
    required: false
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  activeSlot: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['change-slot', 'change-end-time', 'change-af'])

const MAX_DAYS = 3

const formatDate = (date) => {
  return date.toISOString().split('T')[0].replaceAll('-', '/')
}

const formatAf = (af) => {
  if (af === 4) return 'IPv4'
  return 'IPv6'
}

const formatAfReverse = (af) => {
  if (af === 'IPv4') return 4
  return 6
}

const addressFamily = ref(formatAf(props.addressFamily))
const period = ref(7)
const days = ref({ from: formatDate(props.startTime), to: formatDate(props.endTime) })
const external = ref(props.external)

// Restrict which dates can be picked once a "from" is chosen
const dateOptions = (dateStr) => {
  return dateStr <= formatDate(new Date())
}
watch(days, (val) => {
  if (!val) return

  // q-date collapses to a plain string when from === to (single date clicked)
  const rawFrom = typeof val === 'string' ? val : val.from
  const rawTo = typeof val === 'string' ? val : val.to

  if (!rawFrom || !rawTo) return // still mid-selection, nothing to do yet

  const from = qDateUtil.extractDate(rawFrom, 'YYYY/MM/DD')
  const to = qDateUtil.extractDate(rawTo, 'YYYY/MM/DD')

  const diffDays = Math.round((to.getTime() - from.getTime()) / 86400000) + 1

  if (diffDays > MAX_DAYS) {
    const clampedTo = qDateUtil.addToDate(from, { days: MAX_DAYS - 1 })

    days.value = {
      from: rawFrom,
      to: qDateUtil.formatDate(clampedTo, 'YYYY/MM/DD')
    }

    emit('change-end-time', { to: clampedTo, diffDays: MAX_DAYS })
  } else {
    emit('change-end-time', { to: to, diffDays: diffDays })
  }
})

watch(addressFamily, () => {
  emit('change-af', formatAfReverse(addressFamily.value))
})

watch(
  () => props.external,
  () => {
    external.value = props.external.filter((obj) => !obj.value.endsWith('null'))
  },
  { deep: true }
)

onMounted(() => {
  external.value = external.value.filter((obj) => !obj.value.endsWith('null'))
})
</script>

<template>
  <q-drawer
    v-model="drawer"
    show-if-above
    :width="220"
    class="ihr-drawer text-white"
    style="height: 100vh !important"
  >
    <div class="column">
      <q-list padding>
        <q-item
          v-for="item in navigation"
          :key="item.label"
          clickable
          v-ripple
          :active="item.value === activeSlot"
          active-class="nav-active"
          @click="emit('change-slot', item.value)"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>

          <q-item-section>
            {{ item.label }}
          </q-item-section>
        </q-item>
      </q-list>

      <div v-if="external?.length">
        <q-separator dark inset />

        <div class="q-pa-md">
          <q-list dense>
            <q-item
              clickable
              v-for="obj in external"
              :key="obj.label"
              :href="obj.value"
              target="_blank"
            >
              <q-item-section>{{ obj.label }}</q-item-section>
              <q-item-section side>
                <q-icon name="open_in_new" color="white" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </div>
  </q-drawer>

  <div>
    <div style="margin: 10px" v-if="$q.screen.lt.md">
      <q-btn @click="drawer = !drawer" class="full-width" label="Report Menu" outline />
    </div>

    <div class="report-page q-pa-lg">
      <div class="row items-center justify-between q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md">
          <div class="row items-center q-gutter-sm">
            <q-icon name="language" size="28px" color="blue-grey-9" />

            <div class="text-h4 text-weight-bold">
              {{ title }}
            </div>

            <div class="text-subtitle1 text-grey-8">
              {{ subtitle }}
            </div>
          </div>

          <div class="row items-center q-gutter-md q-mt-sm">
            <RouterLink
              v-for="tag in tags"
              :key="tag"
              :to="Tr.i18nRoute({ name: 'tag', params: { tag: tag }, hash: '#Autonomous-Systems' })"
            >
              <q-chip dense size="md" color="info" text-color="white">
                {{ tag }}
              </q-chip>
            </RouterLink>
          </div>
        </div>

        <div class="col-12 col-md-auto">
          <div class="row items-center q-gutter-sm">
            <q-btn-toggle
              v-model="period"
              no-caps
              unelevated
              toggle-color="primary"
              color="white"
              text-color="grey-8"
              :options="[
                { label: '3d', value: 3 },
                { label: '7d', value: 7 }
              ]"
            />

            <q-btn
              outline
              no-caps
              color="grey-7"
              label="Custom"
              icon-right="calendar_month"
              :disable="period == 7"
            >
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="days" range :options="dateOptions" />
              </q-popup-proxy>
            </q-btn>

            <q-select
              v-model="addressFamily"
              dense
              outlined
              :options="['IPv4', 'IPv6']"
              class="select-box"
              popup-content-class="ip-select-dropdown"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <span class="text-white">{{ scope.opt }}</span>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-btn unelevated color="primary" icon-right="share" label="Share" no-caps />
          </div>
        </div>
      </div>

      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.nav-active {
  background: white;
  color: #263238;
}
.report-page {
  max-width: 1700px;
  margin: 0 auto;
}
.select-box {
  width: 100px;
}
</style>
