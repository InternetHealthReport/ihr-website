<template>
  <div>
    <q-card v-if="loaded === false" negative>
      <q-card-section>
        {{ $t('genericErrors.cloudNotLoad') }} BGPlay
      </q-card-section>
    </q-card>
    <div v-if="loaded === null" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="4em" />
    </div>
    <div :id="myId">
    </div>
  </div>
</template>

<script>


export default {
  props: {
    ip: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      myId: `prefix-overview-${this._uid}`,
      prefixOverview: null,
      loaded: null,
      widgetPromise: null,
    };
  },
  beforeCreate() {
    this.widgetPromise = null;
  },
  mounted() {
    this.$libraryDelayer.load("ripe_widget_api", ()=>{
       ripestat.init(
      "prefix-overview",
      { max_related: 50, resource: this.ip },
      this.myId,
      {
        size: "small",
        disable: ["controls", "footer-buttons", "logo", "maximize"]
      },
      () => {
        this.$libraryDelayer.getRidOfInlineStyle(this.myId, "*");
        var elemt = document.getElementById(this.myId);
        elemt.style.width = "100%";
        this.loaded = true;
      }
    );
    })
  },
  watch: {
    ip(oldValue, newValue) {
      if (oldValue == newValue) return;
      this.prefixOverview.update({ resource: this.ip });
      this.prefixOverview.reload();
    }
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

.IHR_prefix-overview-container
  & > div:first-child
    border none
    & > .box-content
      border none
      padding-top 0px
      padding 0 10px
      & > .widget-drag-icon
        margin 0 auto !important
        width 96%

        & .widget-title
          color black !important
          font-size 13pt

      & > .controls-container
        display none

      & > .prefix-overview
        & > div:first-child
          margin-bottom 12pt
          font-size 10pt
          & > ul
            & > li:first-child
              display none

        & > .detailed-content
          background-color white
          padding 0px
          border-style solid
          border-color gray
          border-width 2px 0px 2px 0px
          border-radius 0px

          & > h6:first-child  //RIR information
            margin 1px 0px 8px 0px
            font-size 15pt
            font-weight 500

          & > div:first-of-type
            & > table
              width 100%
              font-size 10pt
              & th
                font-size 10pt
              & a
                color $accent !important
            & > hr
              border-style solid
              border-color gray
              border-width 2px 0px 0px 0px
              width 100%

          & > .iana-info
            & > button:first-child
              background-color $secondary
              border none
              color white
              padding 5px 8px
              font-weight 600
              text-transform uppercase
              box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
              transition: all 0.3s cubic-bezier(.25,.8,.25,1);

              &:hover
                box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 6px 6px rgba(0,0,0,0.22);
            & > .panel
              & > .panel-body //Real body of IANA information
                & > h5:first-child
                  margin 0px
                  font-size 14pt
                  & > a
                    display block
                    text-align center
                    color $accent !important
                    & > i:last-child
                      display none
                & > table:last-child
                  & a
                    color $accent !important
                  & > tbody
                    & > tr
                      & > td:first-child
                        width 40%
                      & > td:last-child
                        width 60%
                        & a
                          font-size 7pt
                          & > i
                            display none

        & > .advanced-settings  //TODO hiding beacouse breaks SPA
          display none
</style>
