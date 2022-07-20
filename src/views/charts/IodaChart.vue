<template>
<div>
    <h1>Ioda Chart</h1>
    <reactive-chart :layout="layout" :traces="traces" :noData="noData" :chartTitle="iodaChart" /> 
    <button @click="getInfo()">Search</button>
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
        getInfo(){
            axios.get("https://api.ioda.inetintel.cc.gatech.edu/v2/signals/raw/asn/2497?from=1657756780&until=1657766780&datasource=ping-slash24")
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