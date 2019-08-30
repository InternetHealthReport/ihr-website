<template>
  <div>
    <q-card v-if="loaded === false" negative>
      <q-card-section>
        {{ $t('genericErrors.cloudNotLoad') }} {{name}}
      </q-card-section>
    </q-card>
    <div v-if="loaded === null" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="15em" />
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
    },
    removeStyle: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      myId: `prefixMixin${this._uid}`,
      name: "prefixMixin",
      prefixWidget: null,
      loaded: null,
    };
  },
  beforeMount() {
    this.myId = this.name + this._uid;
  },
  methods: {
    navigateAndRemove() {
       if(!this.removeStyle)
          return;
        this.$libraryDelayer.getRidOfInlineStyle(this.myId, "*");
        var elemt = document.getElementById(this.myId);
        elemt.style.width = "100%";
        this.loaded = true;
    }
  },
  watch: {
    ip(oldValue, newValue) {
      if (oldValue == newValue) return;
      this.prefixWidget.update({ resource: this.ip });
      this.prefixWidget.reload();
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
</style>
