<script>
export default {
  props: {
    data: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      required: true
    }
  },
  methods: {
    getColorChangeClass(value) {
      let colorClass;
      if (value < 0) colorClass = "decrease";
      else if (value > 0) colorClass = "increse";
      else colorClass = "stable";
      return `IHR_color-increment IHR_color-increment-${colorClass}`;
    }
  }
}
</script>
