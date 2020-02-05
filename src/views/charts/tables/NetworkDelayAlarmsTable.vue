<template>
  <q-table
    :data="dataSummary"
    :columns="columns"
    :pagination.sync="pagination"
    :loading="loading"
    :filter="filter"
    binary-state-sort
    flat
    row-key="asNumber"
    selection="single"
    :selected.sync="selectedRow"
    loading-label="Fetching the latest network delay alarms..."
  >
    <template v-slot:top-right>
      <q-input debounce="300" v-model="filter" placeholder="Search">
        <template v-slot:append>
          <q-icon name="fas fa-search" />
        </template>
      </q-input>
    </template>

    <template v-slot:body-cell-asNumber="props">
        <q-td :props="props" auto-width>
          <a @click="newWindow({name : 'as_and_ixp', params:{asn: props.value}})" href="javascript:void(0)">
            {{props.value}}
          </a>
        </q-td>
    </template>
    <template v-slot:body-cell-destinations="props">
        <q-td :props="props" auto-width>
            <div> {{destinationsSubtitle(props.value)}}</div>
            <div class='IHR_ndelay_table_cell'>
            {{destinationsBody(props.value)}}
            </div>
        </q-td>
    </template>
  </q-table>
</template>

<script>

export default {
  components: {
  },
  props: {
    data: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    stopTime: {
      type: Date,
      required: true
    },
  },
  data() {
    return {
      filter: '',
      selectedRow: [],
      dataSummary: [],
      pagination: {
        sortBy: "nbalarms",
        descending: true,
        page: 1,
        rowsPerPage: 10
      },
      columns: [
        {
          name: "asNumber",
          required: true,
          label: "Source",
          align: "left",
          field: row => row.asNumber,
          format: val => this.$options.filters.ihr_NumberToAsOrIxp(val),
          sortable: true
        },
        {
          name: "destinations",
          required: false,
          label: "Destinations",
          align: "left",
          field: row => row.endpoints,
          format: val => this.$options.filters.sortedKeys(val),
          sortable: false
        },
        {
          name: "nbalarms",
          required: true,
          label: "Nb. Alarms",
          align: "center",
          field: row => row.nbalarms,
          format: val => val,
          sortable: true
        },
        {
          name: "avgdev",
          required: true,
          label: "Average Deviation",
          align: "center",
          field: row => row.cumdev/row.nbalarms,
          format: val => val.toFixed(2),
          sortable: true
        }
      ],
    };
  },
  mounted(){
      this.computeDataSummary()
  },
  methods: {
      computeDataSummary(){
        if(!this.data.length) return;

        var datasum = {};
        this.data.forEach( alarm => {
            var start = alarm.startpoint_type+alarm.startpoint_name
            var asNumber = alarm.type == 'IX' ? -parseInt(alarm.startpoint_name) : parseInt(alarm.startpoint_name)
            if(asNumber!=0){
                if(start in datasum){ 
                    datasum[start].nbalarms += 1;
                    datasum[start].cumdev += alarm.deviation;
                }
                else{
                datasum[start] = {
                    asNumber: asNumber, 
                    nbalarms: 1,
                    cumdev: alarm.deviation,
                    endpoints: {}
                  }
                }

                // Add destination
                var end = alarm.endpoint_type+alarm.endpoint_name
                if(end in datasum[start].endpoints){
                    datasum[start].endpoints[end] += alarm.deviation;
                }
                else{
                    datasum[start].endpoints[end] = alarm.deviation;
                }
            }
        })        

        // Select the AS with the largest number of alarms
        const values = Object.values(datasum);
        var first_row = values.reduce((prev, current) => (prev.nbalarms > current.nbalarms) ? prev : current);
          console.log(first_row)
        this.selectedRow = [first_row];
        
        this.dataSummary = values
      },
      destinationsSubtitle(val){
          return String(val.length)+this.$t('charts.networkDelayAlarms.table.destinations');
      },
      destinationsBody(val){
          var body = '';
          val.forEach( dest => {
              var loc = dest.startsWith('CT') ? dest.substring(2) : dest;
              body += loc+', '; 
          })
          
          body = body.substring(0,body.length-1)
          return body
      }
  },
  watch: { 
    data(){ 
        this.computeDataSummary()
    },
    selectedRow(newValue){
        this.$emit('selectedRow', newValue)
    }
  }
};
</script>
<style lang="stylus">
.IHR_ndelay_table_cell
    text-overflow ellipsis
    /* Required for text-overflow to do anything */
    white-space nowrap
    overflow hidden
    font-style italic
    max-width 700px 
    color #555

</style>
