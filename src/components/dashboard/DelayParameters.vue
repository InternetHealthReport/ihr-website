<template>
  <div>
    <h1></h1>
    <!-- Selected Source Network start -->
    <div id="IHR_contact-page">
      <div class="Subscribe">
        <p v-if="tags.length == 0" class="IHR_description">Select Source Networks</p>
        <div v-else class="tag">
          <p class="IHR_description">Selected Source:</p>
          <el-tag v-for="(item, index) in tags" :key="index" type="warning" style="margin: 5px 8px" @close="handleClose(item)" closable>
            {{ item.channel.split(',')[0] }}
          </el-tag>
        </div>
      </div>
      <div class="select">
        <q-btn-toggle
          v-model="panel"
          rounded
          @click="changePanel(panel)"
          toggle-color="blue"
          no-caps
          :options="[
            { label: 'counties', value: 'country' },
            { label: 'cities', value: 'city' },
            { label: 'networks', value: 'network' },
          ]"
        />
        <search-bar class="col-3 q-px-sm" :type="panel" @searchRes="searchChange" style="margin: 20px 0" />
        <q-tab-panels v-model="panel" animated style="border-top: 1px solid #ccc">
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
        </q-tab-panels>
      </div>
    </div>
    <!-- Selected Source Network Search Bar End -->
    <!-- Selected Destination Search Bar start -->
    <div id="IHR_contact-page">
      <div class="Subscribe">
        <p v-if="tagsEnd.length == 0" class="IHR_description">Select Destination Networks</p>
        <div v-else class="tag">
          <p class="IHR_description">Selected Destination:</p>
          <el-tag
            v-for="(item, index) in tagsEnd"
            :key="index"
            type="warning"
            style="margin: 5px 8px"
            @close="destinationHandleClose(item)"
            closable
          >
            {{ item.channel.split(',')[0] }}
          </el-tag>
        </div>
      </div>
      <div class="select">
        <q-btn-toggle
          v-model="destinationPanel"
          rounded
          @click="destinationChangePanel(destinationPanel)"
          toggle-color="blue"
          no-caps
          :options="[
            { label: 'counties', value: 'country' },
            { label: 'cities', value: 'city' },
            { label: 'networks', value: 'network' },
          ]"
        />
        <search-bar class="col-3 q-px-sm" :type="destinationPanel" @searchRes="destinationSearchChange" style="margin: 20px 0" />
        <q-tab-panels v-model="destinationPanel" animated style="border-top: 1px solid #ccc">
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
        </q-tab-panels>
      </div>
    </div>
    <!-- Selected Destination Search Bar end -->
    <div class="col-5" align="center">
      <q-date v-model="dateRange" range />
    </div>
    <h6 align="center">{{ dateRange }}</h6>
    <div class="col-2">
      <button @click="addPlot()">Add Plot</button>
    </div>
    <!--<network-delay-chart
      :start-time="getFrom(dateRange)"
      :end-time="getTo(dateRange)"
      :startPointName="'2914'"
      startPointType="AS"
      :endPointNames="['AS174', 'AS15169']"
      ref="networkDelayChart"
      :fetch="fetch"
      :clear="clear"
      @max-value="updateYaxis"
      :yMax="yMax"
      v-if="dateRange"
    />-->
    <div class="col-12">
      <div class="q-pa-md">
        <div v-for="(tag, i) in sourceNetworks.length" :key="tag">
          <q-card class="IHR_charts-body">
            <q-card-section v-if="sourceNetworks[i]">
              <h5 align="center">{{ sourceNetworks[i].channel }}</h5>
              <div v-for="(destinationNetwork, j) in destinationNetworks.length" :key="destinationNetwork">
                <h6 align="center">{{ destinationNetworks[j].channel }}</h6>
              </div>
              <h1 @click="deletePlot(i)">x</h1>
              <h3>{{ getFrom(dateRange) }}</h3>
              <h3>{{ getTo(dateRange) }}</h3>
              <h2>{{ getASN(sourceNetworks[i].channel) }}</h2>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NetworkDelayChart from '../../views/charts/NetworkDelayChart.vue'
import searchBar from './middleware/searchBar.vue'
import DateRangePicker from './middleware/dateRangePicker.vue'
export default {
  name: 'DelayCharts',
  components: {
    searchBar,
    NetworkDelayChart,
    DateRangePicker,
  },
  data() {
    let dateRange
    return {
      dateRange: dateRange,
      tags: [],
      tagsEnd: [],
      sourceNetworks: [],
      destinationNetworks: [],
      panel: 'network',
      destinationPanel: 'network',
      word: '',
      emailSent: false,
      dataList: [],
      fetch: false,
      clear: 1,
      yMax: 0,
      searchBar: false,
      destinationDataList: [],
      country: [
        'Japan',
        'France',
        'United States',
        'Brazil',
        'Germany',
        'China',
        'Singapore',
        'Canada',
        'Netherlands',
        'United Kingdom',
        'Russia',
        'Australia',
      ],
      city: [
        'Amsterdam, North Holland NL',
        'Ashburn, Virginia US',
        'London, England GB',
        'Singapore, Central Singapore SG',
        'Hong Kong, Central and Western HK',
        'Frankfurt am Main, Hesse DE',
        'Paris, Île - de - France FR',
        'Los Angeles, California US',
        'Tokyo, Tokyo JP',
        'Sydney, New South Wales AU',
        'New York City, New York US',
        'Toronto, Ontario CA',
      ],
      network: [
        'AS3356 - Lumen',
        'AS2914 - NTT',
        'AS6939 - HE',
        'AS1299 - Telia',
        'AS174  - Cogent',
        'AS15169 - Google',
        'AS20940 - Akamai',
        'AS16509 - Amazon',
        'AS13335 - Cloudflare',
        'AS32934 - Facebook',
        'AS7922  - Comcast',
        'AS8075  - Microsoft',
      ],
    }
  },
  mounted() {
    this.oldChannel()
    this.destinationChannel()
    this.dataList = this.country
    this.destinationDataList = this.network
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
      let ASN = tagNumber.substring(2, tagNumber.indexOf(''))
      return ASN
    },
    oldChannel() {
      this.$ihr_api.getChannel(
        res => {
          console.log(res)
          if (res.hasOwnProperty('data')) {
            this.tags = res.data.channel
          }
        },
        error => {
          console.log(error)
        }
      )
    },
    destinationChannel() {
      this.$ihr_api.getChannel(
        res => {
          console.log(res)
          if (res.hasOwnProperty('data')) {
            this.tagsEnd = res.data.channel
          }
        },
        error => {
          console.log(error)
        }
      )
    },
    select(label) {
      let flag = true
      flag = this.tags.find(item => item.channel === label)
      if (!flag) {
        this.tags.push({ channel: label, frequency: 'normal' })
      }
    },
    selectDestination(label) {
      let flag = true
      flag = this.tagsEnd.find(item => item.channel === label)
      if (!flag) {
        this.tagsEnd.push({ channel: label, frequency: 'normal' })
      }
    },
    destinationHandleClose(tag) {
      this.tagsEnd.splice(this.tagsEnd.indexOf(tag), 1)
    },
    handleClose(tag) {
      this.tags.splice(this.tags.indexOf(tag), 1)
    },
    searchChange(data) {
      if (data) {
        this.dataList = [data]
      } else {
        switch (this.panel) {
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
      }
    },
    destinationSearchChange(data) {
      if (data) {
        this.destinationDataList = [data]
      } else {
        switch (this.panel) {
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
      }
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
    addPlot() {
      this.sourceNetworks = this.tags
      this.destinationNetworks = this.tagsEnd
      console.log(this.sourceNetworks, this.destinationNetworks)
    },
    deletePlot(index) {
      this.sourceNetworks.splice(index, 1)
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
  min-height: 46px;
}

.el-tag {
  /* width: 100px!important; */
  text-align: center !important;
  height: 36px !important;
  line-height: 36px !important;
  font-size: 16px !important;
}
</style>
