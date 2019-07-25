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
.IHR_
  &loading-spinner
    & > *
      width 25%
      height 25%
      display inline-block
      margin auto
</style>

<style ty>
</style>
