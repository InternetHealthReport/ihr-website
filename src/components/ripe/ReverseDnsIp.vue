<script>
import PrefixMixin from "./mixins/PrefixMixin"

export default {
  mixins: [PrefixMixin],
  data() {
    return {
      name: "reverse-dns-ip",
    };
  },
  mounted() {
    this.$libraryDelayer.load("ripe_widget_api", ()=>{
      ripestat.init(
        "reverse-dns-ip",
        {"resource": this.ip},
        this.myId,
        {
          "size":"small",
          "disable":["controls","footer-buttons","logo","maximize"]
        },
        this.navigateAndRemove
        );
    });
  }
};
</script>

<style lang="stylus">
@import '~quasar-variables'

.IHR_
  &loading-spinner
    & > *
      width 25%
      height 25%
      display inline-block
      margin auto

.IHR_reverse-dns-ip-improved
  margin-bottom 0pt
  & > div:first-child
    background-color white
    border-radius 0px
    border none
    margin-bottom 0px
    & > .box-content
      background-color white
      border-radius 0px
      padding 0 10px
      border none
      & > h2:first-of-type
        margin 0px !important
        font-size 13pt
        & > a > span
          color black !important
          cursor default
          & > span
            color $accent !important
            cursor pointer

      & > .controls-container
        display none
      & > div:last-child
        & > .res_info_holder
          margin-top 0px
          & > a
            color $accent !important
</style>
