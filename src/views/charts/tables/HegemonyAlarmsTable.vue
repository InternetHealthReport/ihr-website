<template>
  <q-table
    :data="dataSummary"
    :columns="columns"
    :pagination.sync="pagination"
    :loading="loading"
    :filter="filter"
    binary-state-sort
    flat
    row-key="originasn"
    selection="single"
    :selected.sync="selectedRow"
    loading-label="Fetching the latest network dependency alarms..."
  >
    <template v-slot:top-right>
      <q-input debounce="300" v-model="filter" placeholder="Search">
        <template v-slot:append>
          <q-icon name="fas fa-search"/>
        </template>
      </q-input>
    </template>

    <template v-slot:body-cell-originasn="props">
        <q-td :props="props" auto-width>
          <a @click="newWindow({name : 'as_and_ixp', params:{asn: props.value}})" href="javascript:void(0)">
            {{props.value}}
          </a>
        </q-td>
    </template>
    <template v-slot:body-cell-dependencies="props">
        <q-td :props="props" auto-width>
            <div> {{dependenciesSubtitle(props.value)}}</div>
            <div class='IHR_ndelay_table_cell'>
            {{dependenciesBody(props.value)}}
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
          name: "originasn",
          required: true,
          label: "Origin AS",
          align: "left",
          field: row => row.originasn,
          format: val => this.$options.filters.ihr_NumberToAsOrIxp(val),
          sortable: true
        },
        {
          name: "dependencies",
          required: false,
          label: "Anomalous Dependencies",
          align: "left",
          field: row => row.dependencies,
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
            var originasn = alarm.originasn
            if(originasn!=0){
                if(originasn in datasum){ 
                    datasum[originasn].nbalarms += 1;
                    datasum[originasn].cumdev += alarm.deviation;
                }
                else{
                    datasum[originasn] = {
                        originasn: originasn, 
                        nbalarms: 1,
                        cumdev: alarm.deviation,
                        dependencies: {}
                    }
                }

                // Add destination
                if(alarm.asn in datasum[originasn].dependencies){
                    datasum[originasn].dependencies[alarm.asn] += alarm.deviation;
                }
                else{
                    datasum[originasn].dependencies[alarm.asn] = alarm.deviation;
                }
            }
        })        

        // Select the AS with the largest number of alarms
        const values = Object.values(datasum);
        var first_row = values.reduce((prev, current) => (prev.nbalarms > current.nbalarms) ? prev : current);
        this.selectedRow = [first_row];
        
        this.dataSummary = values
      },
      dependenciesSubtitle(val){
          return String(val.length)+this.$t('charts.hegemonyAlarms.table.dependencies');
      },
      dependenciesBody(val){
          var body = '';
          val.forEach( dest => {
              body += dest+', '; 
          })

          //Remove the last comma 
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
