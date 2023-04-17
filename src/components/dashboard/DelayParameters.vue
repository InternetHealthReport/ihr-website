<template>
  <div class="row">
    <div class="col-3 IHR_dashboard-options-panel column no-wrap">
      <h1></h1>
      <!-- Selected Source Network start -->
      <div>
        <div>
          <h2 class="q-px-sm text-h6">Selected Source Networks</h2>
          <div class="tag">
            <p class="q-px-sm" v-if="tags.length === 0">no networks selected</p>
            <q-chip 
              v-for="(item, index) in tags" 
              :key="index" 
              :title="item.value"
              :label="item.value"
              removable
              @remove="tags.splice(index, 1)">
            </q-chip>
          </div>
        </div>
        <search-bar class="col-3 q-px-sm" :type="panel" @searchRes="searchChange" style="margin: 20px 0" />
        <!-- <q-tab-panels v-model="panel" animated style="border-top: 1px solid #ccc">
          <q-tab-panel name="country">
            <div class="btn_list">
              <q-btn
                outline
                v-for="(item, index) in dataList"
                :key="index"
                color="white"
                style="width: 150px !important"
                text-color="black"
                :label="item.split(',')[0]"
                @click="select(item)"
                no-caps
              >
                <q-tooltip class="bg-accent">{{ item }}</q-tooltip>
              </q-btn>
            </div>
          </q-tab-panel>

          <q-tab-panel name="city">
            <div class="btn_list">
              <q-btn
                outline
                v-for="(item, index) in dataList"
                :key="index"
                color="white"
                style="width: 150px !important"
                text-color="black"
                :label="item.split(',')[0]"
                @click="select(item)"
                no-caps
              >
                <q-tooltip class="bg-accent">{{ item }}</q-tooltip>
              </q-btn>
            </div>
          </q-tab-panel>

          <q-tab-panel keep-alive name="network">
            <div class="btn_list">
              <q-btn
                outline
                v-for="(item, index) in dataList"
                :key="index"
                color="white"
                style="width: 175px !important"
                text-color="black"
                :label="item.split(',')[0]"
                @click="select(item)"
                no-caps
              >
                <q-tooltip class="bg-accent">{{ item }}</q-tooltip>
              </q-btn>
            </div>
          </q-tab-panel>
        </q-tab-panels> -->
      </div>
      <!-- Selected Source Network Search Bar End -->
      <!-- Selected Destination Search Bar start -->
      <div>
        <div class="Subscribe">
          <h2 class="q-px-sm text-h6">Selected Destination Networks</h2>
          <div class="tag">
            <p class="q-px-sm"  v-if="tagsEnd.length === 0">no networks selected</p>
            <q-chip 
              v-for="(item, index) in tagsEnd" 
              :key="index" 
              :title="item.value"
              :label="item.value"
              removable
              @remove="removeDestinationNetwork(index)">
            </q-chip>
          </div>
        </div>
        <div class="select">
          <!-- <q-tab-panels v-model="destinationPanel" animated style="border-top: 1px solid #ccc">
            <q-tab-panel name="country">
              <div class="btn_list">
                <q-btn
                  outline
                  v-for="(item, index) in destinationDataList"
                  :key="index"
                  color="white"
                  style="width: 150px !important"
                  text-color="black"
                  :label="item.split(',')[0]"
                  @click="selectDestination(item)"
                  no-caps
                >
                  <q-tooltip class="bg-accent">{{ item }}</q-tooltip>
                </q-btn>
              </div>
            </q-tab-panel>

            <q-tab-panel name="city">
              <div class="btn_list">
                <q-btn
                  outline
                  v-for="(item, index) in destinationDataList"
                  :key="index"
                  color="white"
                  style="width: 150px !important"
                  text-color="black"
                  :label="item.split(',')[0]"
                  @click="selectDestination(item)"
                  no-caps
                >
                  <q-tooltip class="bg-accent">{{ item }}</q-tooltip>
                </q-btn>
              </div>
            </q-tab-panel>

            <q-tab-panel keep-alive name="network">
              <div class="btn_list">
                <q-btn
                  outline
                  v-for="(item, index) in destinationDataList"
                  :key="index"
                  color="white"
                  style="width: 175px !important"
                  text-color="black"
                  :label="item.split(',')[0]"
                  @click="selectDestination(item)"
                  no-caps
                >
                  <q-tooltip class="bg-accent">{{ item }}</q-tooltip>
                </q-btn>
              </div>
            </q-tab-panel>
          </q-tab-panels> -->
          <search-bar class="col-3 q-px-sm" :type="destinationPanel" @searchRes="destinationSearchChange" style="margin: 20px 0" />
        </div>
      </div>
      <!-- Selected Destination Search Bar end -->
      <q-btn class="IHR_button-secondary" label="select date interval" @click="$event => toggleDatePicker()" />
        <div class="row justify-center q-mt-lg">
          <q-btn class="IHR_button-primary" @click="addPlot()">Add Plot</q-btn>
      </div>
    </div>
    <div class="col-8 IHR_dashboard-graph-panel">
      <div class="col-12">
        <div class="q-pa-md" v-if="dateRange && destinationNetworks.length !== 0 && sourceNetworks.length !== 0">
          <div v-for="(tag, i) in sourceNetworks.length" :key="tag">
            <q-card class="IHR_charts-body">
              <q-card-section v-if="sourceNetworks[i]">
                <div class="row justify-end q-mb-xs">
                    <q-btn round @click="deletePlot" size="0.7em" color="red" center>
                      <q-icon name="fa fa-times" left style="font-size: 1.5em; margin:0" />
                    </q-btn>
                </div>
                <network-delay-chart
                  :start-time="getFrom(dateRange)"
                  :end-time="getTo(dateRange)"
                  :startPointName="sourceNetworks[i].value"
                  :startPointType="sourceNetworks[i].name"
                  :endPointNames="destinationNetworks"
                  ref="networkDelayChart"
                  :fetch="fetch"
                  :clear="clear"
                  @max-value="updateYaxis"
                  :yMax="yMax"
                  v-if="dateRange"
                />
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>
    <div class="column" v-if="showDatePicker">
        <q-date class="date-picker" v-model="dateRange" range @range-end="toggleDatePicker" />
      </div>
  </div>
</template>

<script>
import NetworkDelayChart from '../../views/charts/NetworkDelayChart.vue'
import searchBar from './middleware/searchBar.vue'
export default {
  name: 'DelayCharts',
  components: {
    NetworkDelayChart,
    searchBar,
  },
  data() {
    let dateRange
    return {
      dateRange: dateRange,
      showDatePicker: false,
      tags: [],
      tagsEnd: [],
      sourceNetworks: [],
      destinationNetworks: [],
      destinationNetworksASN: [],
      panel: 'network',
      destinationPanel: 'network',
      word: '',
      emailSent: false,
      dataList: [],
      fetch: true,
      clear: 1,
      yMax: 0,
      searchBar: false,
      destinationDataList: [],
      // country: [
      //   'Japan',
      //   'France',
      //   'United States',
      //   'Brazil',
      //   'Germany',
      //   'China',
      //   'Singapore',
      //   'Canada',
      //   'Netherlands',
      //   'United Kingdom',
      //   'Russia',
      //   'Australia',
      // ],
      // city: [
      //   'Amsterdam, North Holland NL',
      //   'Ashburn, Virginia US',
      //   'London, England GB',
      //   'Singapore, Central Singapore SG',
      //   'Hong Kong, Central and Western HK',
      //   'Frankfurt am Main, Hesse DE',
      //   'Paris, Île - de - France FR',
      //   'Los Angeles, California US',
      //   'Tokyo, Tokyo JP',
      //   'Sydney, New South Wales AU',
      //   'New York City, New York US',
      //   'Toronto, Ontario CA',
      // ],
      // network: [
      //   'AS3356 - Lumen',
      //   'AS2914 - NTT',
      //   'AS6939 - HE',
      //   'AS1299 - Telia',
      //   'AS174  - Cogent',
      //   'AS15169 - Google',
      //   'AS20940 - Akamai',
      //   'AS16509 - Amazon',
      //   'AS13335 - Cloudflare',
      //   'AS32934 - Facebook',
      //   'AS7922  - Comcast',
      //   'AS8075  - Microsoft',
      // ],
    }
  },
  mounted() {
    this.dataList = []
    this.destinationDataList = []
  },
  methods: {
    updateYaxis(newMaxY) {
      this.yMax = this.yMax > newMaxY ? this.yMax : newMaxY
    },
    getFrom(dateRange) {
      let from = new Date(dateRange.from)
      return from
    },
    getTo(dateRange) {
      let to = new Date(dateRange.to)
      return to
    },
    getASN(tagNumber) {
      console.log(tagNumber);
      // let ASN = tagNumber.substring(2, tagNumber.indexOf(' '))
      return ASN
    },
    getNetworkCode(data) {
      const {af, name, value} = data;
      return name + af + value;
    },
    // select(label) {
    //   let flag = true
    //   flag = this.tags.find(item => item.channel === label)
    //   if (!flag) {
    //     this.tags.push({ channel: label, frequency: 'normal' })
    //   }
    // },
    // selectDestination(label) {
    //   let flag = true
    //   flag = this.tagsEnd.find(item => item.channel === label)
    //   if (!flag) {
    //     this.tagsEnd.push({ channel: label, frequency: 'normal' })
    //   }
    // },
    destinationHandleClose(tag) {
      this.tagsEnd.splice(this.tagsEnd.indexOf(tag), 1)
    },
    handleClose(tag) {
      this.tags.splice(this.tags.indexOf(tag), 1)
    },
    searchChange(data) {
      if (data !== '') {
        this.tags.push(data);
      }
      // this.sourceNetwork.push(data)
      // if (data) {
      // this.dataList = data
      // } else {
      //   switch (this.panel) {
      //     case 'country':
      //       this.dataList = this.country
      //       break
      //     case 'city':
      //       this.dataList = this.city
      //       break
      //     case 'network':
      //       this.dataList = this.network
      //       break
      //   }
      // }
    },
    destinationSearchChange(data) {
      if (data !== '') {
        this.tagsEnd.push(data);
      }
      // if (data) {
      //   this.destinationDataList = [data]
      // } else {
      //   switch (this.panel) {
      //     case 'country':
      //       this.destinationDataList = this.country
      //       break
      //     case 'city':
      //       this.destinationDataList = this.city
      //       break
      //     case 'network':
      //       this.destinationDataList = this.network
      //       break
      //   }
      // }
    },
    changePanel(val) {
      this.word = ''
      console.log(val)
      switch (val) {
        case 'country':
          this.dataList = this.country
          break
        case 'city':
          this.dataList = this.city
          break
        case 'network':
          this.dataList = this.network
          break
      }
    },
    destinationChangePanel(val) {
      this.word = ''
      console.log(val)
      switch (val) {
        case 'country':
          this.destinationDataList = this.country
          break
        case 'city':
          this.destinationDataList = this.city
          break
        case 'network':
          this.destinationDataList = this.network
          break
      }
    },
    removeDestinationNetwork(index) {
      this.destinationNetworks.splice(index, 1);
      this.tagsEnd.splice(index, 1);
    },
    addPlot() {
      this.sourceNetworks = this.tags
      this.destinationNetworks = []
      this.tagsEnd.forEach(item => {
        this.destinationNetworks.push(this.getNetworkCode(item));
      })
      this.destinationNetworksASN = []
      for (let i = 0; i < this.destinationNetworks.length; i++) {
        let ASN = this.destinationNetworks[i].channel.substring(2, this.destinationNetworks[i].channel.indexOf(' '))
        this.destinationNetworksASN[i] = 'AS4' + ASN
      }
    },
    deletePlot(index) {
      this.sourceNetworks.splice(index, 1)
    },
    toggleDatePicker() {
      this.showDatePicker = !this.showDatePicker
    },
  },
}
</script>

<style>
#IHR_contact-page {
  width: 60%;
  margin: 0 auto;
}

.IHR_background {
  width: 1000px;
  height: 1000px;
  background-repeat: no-repeat;
  background-position: left top;
  background-size: 1000px 1000px;
  opacity: 0.1;
  position: absolute;
  left: 60%;
  top: 450px;
  overflow-x: hidden;
  position: fixed;
  pointer-events: none;
}
.IHR_dashboard-graph-panel {
  height: 75vh !important;
  overflow: scroll;
  padding: 1em;
}
.IHR_dashboard-options-panel {
  height: 75vh !important;
  overflow: scroll;
  padding: 1em;
  /* background-color: #efefef; */
}
.Subscribe {
  position: relative;
  padding-bottom: 20px;
  border-bottom: 1px solid #ccc;
}

.IHR_description {
  font-size: 20px;
  color: #d6d6d6;
}

.subbnt {
  position: absolute;
  height: 38px;
  bottom: 25px;
  right: 0;
}

.group_select {
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: flex-end;
  position: absolute;
  height: 100px;
  width: 240px;
  bottom: 25px;
  right: 0;
}

.group_select .q-btn {
  width: 100px;
  height: 38px;
}

.select {
  margin-top: 20px;
}

.select .q-btn {
  width: 102px;
}

.select .q-field__control {
  height: 40px;
}

.select .q-field__label {
  line-height: 10px;
}

.select .q-field__marginal {
  height: 40px;
}

.btn_list {
  height: 150px;
  display: flex;
  justify-content: flex-start;
  align-content: flex-start;
  flex-wrap: wrap;
}

.btn_list .q-btn {
  margin: 10px 5px;
  overflow: hidden;
}

.tag {
  display: flex;
  justify-content: flex-start;
  align-content: space-between;
  flex-wrap: wrap;
  width: 78%;
  min-height: 120px;
}

.el-tag {
  /* width: 100px!important; */
  text-align: center !important;
  height: 36px !important;
  line-height: 36px !important;
  font-size: 16px !important;
}

.date-picker {
  position: absolute;
  left: 25%;
}
</style>
