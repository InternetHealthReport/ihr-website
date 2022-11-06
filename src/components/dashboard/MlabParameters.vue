<template>
  <div>
    <div class="row justify-center">
      <h1>Mlab plots will appear here</h1>
      <div class="col-12">
        <div class="row justify-center">
          <!-- Search Bar Start -->
          <div class="searchbar_div">
            <div class="Subscribe">
              <p v-if="tags.length == 0" class="IHR_description">Selected Networks</p>
              <div v-else class="tag">
                <el-tag
                  v-for="(item, index) in tags"
                  :key="index"
                  type="warning"
                  style="margin: 5px 8px"
                  @close="handleClose(item)"
                  closable
                >
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
                :options="[{ label: 'networks', value: 'network' }]"
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
        </div>
        <!-- Search Bar End -->
        <div class="col-5">
          <year-selector @clicked="onClickChild" />
        </div>
        <div class="col-2">
          <button @click="addPlot()">Add Plot</button>
        </div>
      </div>
      <div class="col-12">
        <div class="q-pa-md">
          <div v-for="index in mlabChartArray.length" :key="index">
            <q-card class="IHR_charts-body">
              <q-card-section v-if="mlabChartArray[index]">
                <h6 align="center">{{ tags[index - 1].channel }}</h6>
                <h1 @click="deletePlot(index)">x</h1>
                <measurement-lab :ASN="getASN(tags[index - 1].channel)" :year="YearPicker" />
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NetworkSearchBar from './middleware/networkSearchBar.vue'
import MeasurementLab from './charts/MlabChart.vue'
import YearSelector from './middleware/yearSelector.vue'
import searchBar from './middleware/searchBar.vue'
export default {
  components: {
    NetworkSearchBar,
    MeasurementLab,
    YearSelector,
    searchBar,
  },
  data() {
    let YearPicker = ''
    let mlabChartArray = []
    return {
      YearPicker: YearPicker,
      mlabChartArray: mlabChartArray,
      tags: [],
      panel: 'network',
      word: '',
      dataList: [],
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
    this.dataList = this.country
  },
  methods: {
    onClickChild(value) {
      this.YearPicker = value
    },
    addPlot() {
      this.mlabChartArray.push(this.YearPicker)
      console.log(this.mlabChartArray)
    },
    deletePlot(index) {
      this.mlabChartArray.splice(index)
    },
    getASN(tagNumber) {
      let ASN = tagNumber.substring(2, tagNumber.indexOf(' '))
      console.log('*************' + ASN)
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
    select(label) {
      let flag = true
      flag = this.tags.find(item => item.channel === label)
      if (!flag) {
        this.tags.push({ channel: label, frequency: 'normal' })
      }
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
    result(fromSquare) {
      console.log('haha', fromSquare)
      this.YearPicker = fromSquare
    },
  },
}
</script>

<style lang="stylus">
@import '../../styles/quasar.variables';
.searchbar_div {
  width: 60%;
  margin: 0 auto;
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
  text-align: center !important;
  height: 36px !important;
  line-height: 36px !important;
  font-size: 16px !important;
}
</style>
