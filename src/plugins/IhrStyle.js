const BASE_CLASS = "IHR_Style_"; //
const DATETIME_FORMAT = "YYYY-MM-DDTHH:mm.SSS";
const EMAIL_REGEXP = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function padWith0(strNumber) {
  strNumber = `00${strNumber}`;
  return strNumber.substring(strNumber.length - 2, strNumber.length);
}

export default {
  install(Vue) {
    let ihrStyle = new Vue({
      data() {
        return {
          dateTimeFormat: DATETIME_FORMAT
        };
      },
      mounted() {},
      methods: {
        //style
        rotateItem(val) {
          return `${BASE_CLASS}rotate-item-${val ? "on" : "off"}`;
        },
        //validation
        validateEmail(email) {
          return EMAIL_REGEXP.test(email);
        },
        validatePassword(password) {
          return password.length >= 8; //the bare minimum...
        }
      }
    });

    Vue.mixin({
      beforeCreate() {
        this.$ihrStyle = ihrStyle;
      },
      filters: {
        // utilities
        /**
         * Print the date into utc format YYYY-MM-DDTHH:MMZ
         * @param {Date|String|timestamp} date date to be converted
         */
        ihrUtcString(date) {
          let actualDate = new Date(date);
          let result = actualDate.getUTCFullYear() + "-";
          result += padWith0(actualDate.getUTCMonth() + 1) + "-";
          result += padWith0(actualDate.getUTCDate()) + "T";
          result += padWith0(actualDate.getUTCHours()) + ":";
          result += padWith0(actualDate.getUTCMinutes()) + "Z";
          return result;
        }
      }
    });
  }
};
