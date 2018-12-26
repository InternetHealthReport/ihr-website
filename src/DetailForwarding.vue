<template>
    <div>
        <div class="inline field">
            <label>details: </label>
            <span>Tracemon:</span>
        </div>
        <div class="inline field">
            <label>tracemon: </label>
            <span><div id="ihr_df_tracemon"></div></span>
        </div>
    </div>
</template>

<script>
export default {
    props: {
    rowData: {
        type: Object,
        required: true
    },
    rowIndex: {
        type: Number
      }
    },
    mounted() {
       this.loadTracemon() 
    },
    methods: {
        loadTracemon() {
            console.log("in detailForwarding click")
            var msmid = [];
            var probeid = [];
            var timebin = new Date(this.rowData.timebin);

            // Get the most prominent msm 
            for(var j=0; j<this.rowData.msmid.length; j++){
                var ids = this.rowData.msmid[j].split(" ");
                ids[0] = parseInt(ids[0]);
                ids[1] = parseInt(ids[1]);
                msmid.push(ids[0])
                probeid.push(ids[1])
            }
            console.log(msmid) 
            console.log(probeid) 
            initTracemon(
                '#ihr_df_tracemon',
                {
                                        
                }, // Tool options, see table below for more info
                { 
                // mergedMeasurements: [lm_msmid],
                    measurements: msmid,
                    sources: probeid,
                    maximumTracerouteValiditySeconds:600,
                    startTimestamp:  (timebin.getTime()/1000)-(2*3600),
                    stopTimestamp: (timebin.getTime()/1000)+(2*3600),
                } // Query options, see table below for more info
                );
      }
    },
  }
  </script>
