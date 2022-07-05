<script>
import PrefixMixin from './mixins/PrefixMixin'

export default {
    mixins: [PrefixMixin],
    data() {
        return {
            myId: `reverseDnsContainer${this._uid}`,
            name: 'reverse-dns-ip',
        }
    },
    mounted() {
        this.$libraryDelayer.load('ripe_widget_api', () => {
            ripestat.init(
                'reverse-dns-ip',
                { resource: this.ip },
                this.myId,
                {
                    size: 'small',
                    disable: ['footer-buttons', 'info', 'controls', 'maximize'],
                },
                this.navigateAndRemove
            )
        })
    },
}
</script>

<style lang="stylus">
@import '~quasar-variables'

.IHR_reverse-dns-ip-improved
  min-width 250px
  margin-bottom 0px
  padding-bottom 0px
  & > div:first-child
    margin 0px
    & > .stat-widget.full-box
        margin 0px
    & > .box-content
      border none
      padding 0 10px
      margin 0px
      & > .controls-container
        display none
      & > div:last-child
        & > .res_info_holder
          margin 0px
          padding-bottom 10px
          & > a
            color $accent !important
</style>
