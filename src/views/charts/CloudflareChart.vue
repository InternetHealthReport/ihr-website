<template>
    <div>
        <h1>Cloudflare Chart</h1>
        <reactive-chart :layout="layout" :traces="traces" :noData="noData" :chartTitle="CloudflareNetflow" />
        <button @click="getInfo()">Search</button>
    </div>
</template>

<script>
import axios from "axios"
import ReactiveChart from "../../components/ReactiveChart.vue"
export default{
    name:"Cloudflare Chart",
    components:{
        ReactiveChart
    },
    props:{
        AS:String,
        Date: String
    },
    data(){
        var layout = {
            title:"Cloudflare dataset of time vs Netflow Change",
            xaxis:{
                title:"Timeline",
            },
            yaxis:{
                title:"Netflow Change"
            }
        }
        return{
            networks:[],
            errorMsg:"",
            layout:layout,
            traces:[],
        }
    },
    methods:{
        getInfo(){
            axios.get("https://radar.cloudflare.com/api/netrep/net/netflowchangerange?date_token=last_30_days&location=UA")
            .then(response =>{
                this.networks = response.data 
                this.getChart(this.networks)
            })
            .catch(error=>{
                console.log(error)
                this.errorMsg = "Cloudflare API end point not working"
            })
        },
        getChart(networks){
            console.log("*************************************")
            console.log(networks)
            console.log("*************************************")
        },
        mounted:function(){
            this.getInfo()
        }
    }
}
</script>

<style lang="stylus">
@import '../../styles/quasar.variables';
</style>