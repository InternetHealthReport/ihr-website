<template>
    <div>
        <div :id="divid"> </div>
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
    data() {
        return {
            divid: "ihr-dl-latencymon-"+this.linkStr()
        }
    }, 
    created() {
       this.loadLatencymon() 
    },
    methods: {
        linkStr() {
            var l = this.rowData.link.replace(/\./g,"-");
            l = l.replace("(","").replace(")","")
            l = l.replace(",","_")
            return l
        },
        loadLatencymon() {
            console.log("in detailForwarding click")
            var lm_grp = [];
            var lm_msmid = [];
            var timebin = new Date(this.rowData.timebin);
            var msmdict = {};

            // Put msm-probe pairs in a dict
            for(var j=0; j<this.rowData.msmid.length; j++){
                var ids = this.rowData.msmid[j].split(" ");
                var mid = parseInt(ids[0]);
                var pid = parseInt(ids[1]);
                if(mid in msmdict){
                    msmdict[mid].push(pid)
                }
                else{
                    msmdict[mid] = []
                    msmdict[mid].push(pid)
                }
            }

            // Make latencymon groups
            var msms = Object.entries(msmdict)
            for(var i=0; i<msms.length; i++){
                lm_grp.push({ 
                    id: msms[i][0].toString(),
                    measurementId: msms[i][0],
                    probes: msms[i][1],
                    type: 'multi-probes',
                });
            }
            try{
                initLatencymon(
                    '#'+this.divid,
                    {
                        dev: false,
                        autoStart: true
                    }, // Tool options, see table below for more info
                    { 
                        measurements: Object.keys(msmdict),
                        startTimestamp:  timebin.getTime()/1000-(5*3600),
                        stopTimestamp: timebin.getTime()/1000+(5*3600),
                        groups: lm_grp,
                    } // Query options, see table below for more info
                );
            }
            catch(err) {
                console.log("error: ");
                console.log(err);
            }
        }
    },
  }
  </script>
