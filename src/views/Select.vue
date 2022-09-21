<template>
    <div>
        <div id="IHR_contact-page">
            <div class="Subscribe">
                <h6>Subscribe resources</h6>
                <p v-if="tags.length == 0" class="IHR_description">Your resources</p>
                <div v-else class="tag">
                    <el-tag v-for="(item, index) in tags" :key="index" type="warning" style="margin: 5px 8px"
                        @close="handleClose(item)" closable>
                        {{ item.channel.split(',')[0] }}
                    </el-tag>
                </div>
                <div class="group_select">
                    <q-btn style="width:120px" outline color="orange-5" label="save resource" @click="saveResource()"
                        no-caps />
                    <q-btn color="orange-5" unelevated label="setting" @click="toSetting()" no-caps />

                </div>
            </div>
            <div class="select">
                <q-btn-toggle v-model="panel" rounded @click="changePanel(panel)" toggle-color="blue" no-caps :options="[
                    { label: 'counties', value: 'country' },
                    { label: 'cities', value: 'city' },
                    { label: 'networks', value: 'network' },
                ]" />
                <!-- <q-input v-model="word" outlined style="width: 40%; margin: 30px 0 20px 0" placeholder="search resource"
                    @keyup.enter="searchChange(word)">
                    <template v-slot:append>
                        <q-icon name="search" @click="searchChange(word)" color="blue" style="cursor: pointer" />
                    </template>
                </q-input> -->
                <select-search-bar class="col-3 q-px-sm" :type="panel" @searchRes="searchChange"
                    style="margin: 20px 0;" />
                <q-tab-panels v-model="panel" animated style="border-top: 1px solid #ccc">
                    <q-tab-panel name="country">
                        <div class="btn_list">
                            <q-btn outline v-for="(item, index) in dataList" :key="index" color="white"
                                style="width:150px!important;" text-color="black" :label="item.split(',')[0]"
                                @click="select(item)" no-caps>
                                <q-tooltip class="bg-accent">{{ item }}</q-tooltip>
                            </q-btn>
                        </div>
                    </q-tab-panel>

                    <q-tab-panel name="city">
                        <div class="btn_list">
                            <q-btn outline v-for="(item, index) in dataList" :key="index" color="white"
                                style="width:150px!important;" text-color="black" :label="item.split(',')[0]"
                                @click="select(item)" no-caps>
                                <q-tooltip class="bg-accent">{{ item }}</q-tooltip>
                            </q-btn>
                        </div>
                    </q-tab-panel>

                    <q-tab-panel name="network">
                        <div class="btn_list">
                            <q-btn outline v-for="(item, index) in dataList" :key="index" color="white"
                                style="width:175px!important;" text-color="black" :label="item.split(',')[0]"
                                @click="select(item)" no-caps>
                                <q-tooltip class="bg-accent">{{ item }}</q-tooltip>
                            </q-btn>
                        </div>
                    </q-tab-panel>
                </q-tab-panels>
            </div>
        </div>
        <div class="IHR_background" :style="{
            backgroundImage: 'url(' + require('@/assets/imgs/ihr_logo.svg') + ')',
        }"></div>
        <q-dialog v-model="emailSent">
            <q-card style="width: 300px">
                <q-card-section>
                    <div class="text-h6">Alert</div>
                </q-card-section>

                <q-card-section class="q-pt-none">
                    {{ message }}
                </q-card-section>

                <q-card-actions align="right" class="bg-white text-teal">
                    <q-btn flat label="OK" v-close-popup />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </div>
</template>
<script>
import SelectSearchBar from "@/components/search_bar/SelectSearchBar";
export default {
    name: 'SelectPage',
    components: {
        SelectSearchBar
    },
    data() {
        return {
            tags: [],
            panel: 'country',
            word: '',
            emailSent: false,
            dataList: [],
            message: '',
            country: ['Japan',
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
                'Australia'
            ],
            city: ['Amsterdam, North Holland NL',
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
            network: ['AS3356 - Lumen',
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
                'AS8075  - Microsoft'
            ]
        }
    },
    mounted() {
        this.oldChannel()
        this.dataList = this.country
    },
    methods: {
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
                });
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
        saveResource() {
            this.$ihr_api.saveChannel(this.tags,
                res => {
                    if (res.code === 200) {
                        this.emailSent = true
                        this.message = 'save successfully!'
                    } else {
                        this.emailSent = true
                        this.message = res.msg
                    }
                },
                error => {
                    console.log(error)
                });
        },
        toSetting() {
            this.$router.push({
                path: '/en-us/setting',
                query: { data: JSON.stringify(this.tags) },
            })
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
