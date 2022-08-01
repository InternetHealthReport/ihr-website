<template>
<div>
    <h1>Ioda Chart</h1>
    <reactive-chart :layout="layout" :traces="traces" :noData="noData" :chartTitle="iodaChart" /> 
    <button @click="getInfo(ASN,StartTime,EndTime)">Search</button>
</div>
</template>

<script>
import axios from "axios"
import ReactiveChart from "../../components/ReactiveChart.vue"
export default {
    name:"Ioda Chart",
    components:{
        ReactiveChart
    },
    props:{
        ASN:String,
        StartTime : String,
        EndTime : String
    },
    data(){
        var layout = {
            title:"Ioda dataset of time vs metadata access calls",
            xaxis:{
                title:"Timeline"
            },
            yaxis:{
                title:"Metadata access"
            }
        }
        return{
            layout:layout,
            errorMsg:""
        }
    },
    methods:{
        getInfo(ASN,StartTime,EndTime){
            const startDate = new Date(StartTime);
            const startUnixTimeStamp = Math.floor(startDate.getTime()/1000);
            const endDate = new Date(EndTime);
            const endUnixTimeStamp = Math.floor(endDate.getTime()/1000);
            axios.get(`https://api.ioda.inetintel.cc.gatech.edu/v2/signals/raw/asn/${ASN}?from=${startUnixTimeStamp}&until=${endUnixTimeStamp}&datasource=ping-slash24`)
            .then(response =>{
                this.networks = response.data              
                console.log(this.networks)
            })
            .catch(error =>{
                console.log(error)
                this.errorMsg = "Ioda API end point is not working"
            })
        }
    }
}
</script>