<script setup>
import { QSpinner, uid } from 'quasar'
import { ref, onMounted, inject, watch } from 'vue'

const library_delayer = inject('library_delayer')

const props = defineProps({
  ip: {
    type: String,
    required: true,
  },
  removeStyle: {
    type: Boolean,
    default: true,
  }
})

const myId = ref(`reverseDnsContainer${uid()}`)
const loaded = ref(null)
const ripeWidget = ref(null)

const navigateAndRemove = () => {
  if (!props.removeStyle) {
    return
  }
  library_delayer.getRidOfInlineStyle(myId.value, '*')
  // this.$refs[this.myId].style.width = '100%'
  loaded.value = true
}

watch(() => props.ip, (oldValue, newValue) => {
  if (oldValue == newValue) {
    return
  }
  ripeWidget.value.update({ resource: props.ip })
  ripeWidget.value.reload()
})

onMounted(() => {
  library_delayer.load('ripe_widget_api', () => {
    ripeWidget.value = ripestat.init(
        'reverse-dns-ip',
        { resource: props.ip },
        myId.value,
        {
          size: 'small',
          disable: ['footer-buttons', 'info', 'controls', 'maximize'],
        },
        navigateAndRemove
      )
  })
})
</script>

<template>
  <div>
    <div v-if="loaded === null" class="IHR_loading-spin">
      <QSpinner color="secondary" size="2em" />
      Loading RIPEstat widgets...
    </div>
    <div :id="myId"></div>
  </div>
</template>

<style lang="stylus">
</style>