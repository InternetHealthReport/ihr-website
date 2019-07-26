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
    getCellValue(props, columnName) {
      let col = props.colsMap[columnName];
      return col.format(col.field(props.row));
    }
  }
}
</script>
