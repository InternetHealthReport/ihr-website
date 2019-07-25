const BASE_CLASS = "IHR_Style_"; //

export default {
  install(Vue) {
    let ihrStyle = new Vue({
      data() {
        return {};
      },
      mounted() {},
      methods: {
        rotateItem(val) {
          return `${BASE_CLASS}rotate-item-${val ? "on" : "off"}`;
        }
      }
    });

    Vue.mixin({
      beforeCreate() {
        this.$ihrStyle = ihrStyle;
      }
    });
  }
};
