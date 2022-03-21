<template>
    <div class="DC_base shadow-2">
        <div v-if="label != null" class="DC_label" v-resize-text="{ ratio: 1 }">
            {{ label }}
        </div>
        <div class="DC_counter row justify-around items-center">
            <span class="col-grow vertical-middle">{{ counter }}</span>
            <span class="col-1 DC_icon">&nbsp;</span>
            <span class="col-4 DC_icon" v-resize-text="{ ratio: 0.23 }"><q-icon :name="icon" /></span>
        </div>
    </div>
</template>

<script>
import ResizeText from 'vue-resize-text'

const animationDuration = 500 // magick number

export default {
    directives: {
        ResizeText,
    },
    props: {
        label: {
            type: String,
        },
        incon: {
            type: String,
            required: true,
        },
        value: {
            type: Number,
            require: true,
            default: null,
        },
    },
    data() {
        return {
            counter: '--',
            intervalHandler: null,
            icon: this.incon,
        }
    },
    watch: {
        value(newValue, oldValue) {
            //start from 0 if first call
            if (this.counter == '--') this.counter = 0

            //clear previouse cals
            if (this.intervalHandler != null) clearInterval(this.intervalHandler)

            //set the interval and the increment to fit animation duration
            let timeInterval = Math.ceil(animationDuration / Math.abs(newValue - this.counter))
            //if it can fit 500ms increment will be one otherwise will be more
            let increment = Math.ceil((newValue - this.counter) / animationDuration)
            this.intervalHandler = setInterval(() => {
                this.counter += increment
                // stop interval and ensure no overflow
                if (this.counter >= newValue) {
                    clearInterval(this.intervalHandler)
                    this.counter = newValue
                }
            }, timeInterval)
        },
    },
    mounted() {},
}
</script>

<style lang="stylus">
@import '~quasar-variables'

.DC_base
  display inline-block
  padding 4pt 12pt
  border-radius 14pt
  width 100%
  height 100%

  .DC_label
    text-align center
    text-transform capitalize
    font-weight bold
    height 25%

  .DC_counter
    margin-top 5%
    height 65%
    margin-bottom 5%
    color: $primary
    span
      line-height 1
      &:first-child
        text-align right
        font-size 32pt

      &:last-child
        text-align left

    .DC_icon
      color $secondary
</style>
