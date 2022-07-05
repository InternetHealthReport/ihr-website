<template>
    <div>
        <div id="IHR_contact-page">
            <div class="Subscribe">
                <h6>ressources</h6>
                <p v-if="tags.length == 0" class="IHR_description">Your resources</p>
                <div v-else class="tag">
                    <el-tag
                        v-for="(item, index) in tags"
                        :key="index"
                        type="warning"
                        style="margin: 5px 8px"
                        @close="handleClose(item)"
                        :closable="flag"
                    >
                        {{ item.value.split(' ')[0] }}
                    </el-tag>
                </div>
                <q-btn v-if="flag" class="subbnt" color="orange-5" label="subscribe" @click="subscribe()" no-caps />
                <div v-else class="group">
                    <q-btn outline color="orange-5" label="edit" @click="edit()" no-caps />
                    <q-btn color="orange-5" label="setting" @click="toSetting()" no-caps />
                </div>
            </div>
            <div class="select">
                <q-btn-toggle
                    v-model="panel"
                    rounded
                    toggle-color="blue"
                    no-caps
                    :options="[
                        { label: 'counties', value: 'counties' },
                        { label: 'cities', value: 'cities' },
                        { label: 'networks', value: 'networks' },
                    ]"
                />
                <q-input
                    v-model="word"
                    outlined
                    style="width: 40%; margin: 30px 0 20px 0"
                    placeholder="search resource"
                    @keyup.enter="searchChange(word)"
                >
                    <template v-slot:append>
                        <q-icon name="search" @click="alert = true" color="blue" style="cursor: pointer" />
                    </template>
                </q-input>
                <q-tab-panels v-model="panel" animated style="border-top: 1px solid #ccc">
                    <q-tab-panel name="counties">
                        <div class="btn_list">
                            <q-btn
                                outline
                                v-for="(item, index) in countryList"
                                :key="index"
                                color="white"
                                text-color="black"
                                :label="item.split(' ')[0]"
                                @click="select(item)"
                                no-caps
                            >
                                <q-tooltip class="bg-accent">{{ item }}</q-tooltip>
                            </q-btn>
                        </div>
                    </q-tab-panel>

                    <q-tab-panel name="cities">
                        <div class="btn_list">
                            <q-btn
                                outline
                                v-for="(item, index) in cityList"
                                :key="index"
                                color="white"
                                text-color="black"
                                :label="item.split(' ')[0]"
                                @click="select(item)"
                                no-caps
                            >
                                <q-tooltip class="bg-accent">{{ item }}</q-tooltip>
                            </q-btn>
                        </div>
                    </q-tab-panel>

                    <q-tab-panel name="networks">
                        <div class="btn_list">
                            <q-btn
                                outline
                                v-for="(item, index) in networkList"
                                :key="index"
                                color="white"
                                text-color="black"
                                :label="item.split(' ')[0]"
                                @click="select(item)"
                                no-caps
                            >
                                <q-tooltip class="bg-accent">{{ item }}</q-tooltip>
                            </q-btn>
                        </div>
                    </q-tab-panel>
                </q-tab-panels>
            </div>
            <q-dialog v-model="alert">
                <q-card style="width: 300px">
                    <q-card-section>
                        <div class="text-h6">Alert</div>
                    </q-card-section>

                    <q-card-section class="q-pt-none"> Waiting to be developed </q-card-section>

                    <q-card-actions align="right">
                        <q-btn flat label="OK" color="primary" v-close-popup />
                    </q-card-actions>
                </q-card>
            </q-dialog>
        </div>
        <div
            class="IHR_background"
            :style="{
                backgroundImage: 'url(' + require('@/assets/imgs/ihr_logo.svg') + ')',
            }"
        ></div>
    </div>
</template>
<script>
export default {
    name: 'SelectPage',
    components: {},
    data() {
        return {
            tags: [],
            panel: 'counties',
            word: '',
            flag: true,
            alert: false,
            countryList: [
                'Mauritius (MU)',
                'Virgin Islands, British (VG)',
                'Guyana (GY)',
                'French Polynesia (PF)',
                'Martinique (MQ)',
                'Cambodia (KH)',
                'Holy See (VA)',
                'Guinea (GN)',
                'Mali (ML)',
                'Oman (OM)',
                'Jamaica (JM)',
                'Bonaire Sint Eustatius and Saba (BQ)',
                'Taiwan Province of China (TW)',
                'Pakistan (PK)',
                'Afghanistan (AF)',
                'Malawi (MW)',
                'Eritrea (ER)',
                'Georgia (GE)',
                'Barbados (BB)',
                'Solomon Islands (SB)',
            ],
            cityList: [
                'Norfolk Virginia ',
                'New Orleans, Louisiana',
                'Buffalo New York',
                'Santa Fe New Mexico',
                'San Francisco California',
                'Chicago Illinois',
                'Indianapolis Indiana',
                'Nashville Tennessee',
                'Greenville South Carolina',
                'Rochester New York',
            ],
            networkList: [
                'ASN2667777',
                'ASN396411 MICROPACT-ASH-DC, US',
                'ASN140549 ',
                'ASN140813 DSTEL-AS-VN DIGITAL SOLUTION AND TELECOMMUNICATIONS SERVICE JOINT STOCK COMPANY, VN',
                'ASN210449 SKYLARNET-NL SkylarNET B.V, NL',
                'ASN149496 UKHBDLTD-AS-AP UKH BD Ltd, BD',
                'ASN64791 -Private Use AS-, ZZ',
                'ASN231 MISU-231, US',
                'ASN1 LVLT-1, US',
                'ASN39152 AS-, ZZ',
                'ASN202558 AS-, ZZ',
                'ASN266392 Agility Telecom Ltda, BR',
                'ASN394450 MCKINSEY-US-ADP, US',
                'ASN394452 MCKINSEY-US-AWP, US',
                'ASN395370 MCKINSEY-US-AMP, US',
                'ASN208373 SBFF-ASN Sodertorns Brandforsvarsforbund, SE',
                'ASN173 ERX-ECLNET Electrical Communications Laboratories, JP',
                'ASN204516 CAPLASER CAPLASER SA, FR',
                'ASN137844 SIGMAHEALTHCARE-AS-AP SIGMA HEALTHCARE LIMITED, AU',
                'ASN278 Universidad Nacional Autonoma de Mexico, MX',
            ],
        }
    },
    methods: {
        select(label) {
            if (this.flag) {
                this.tags.push({ value: label, model: 'normal' })
            }
            this.alert = true
        },
        handleClose(tag) {
            this.tags.splice(this.tags.indexOf(tag), 1)
        },
        searchChange(val) {
            if (val) {
                this.alert = true
            }
        },
        subscribe() {
            this.flag = false
        },
        edit() {
            this.flag = true
        },
        toSetting() {
            let routeUrl = this.$router.resolve({
                path: '/en-us/setting',
                query: { data: JSON.stringify(this.tags) },
            })
            window.open(routeUrl.href, '_blank')
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
    top: 0;
    bottom: 0;
    right: 0;
    margin: auto;
}
.group {
    display: flex;
    flex-wrap: wrap;
    align-content: space-between;
    position: absolute;
    height: 100px;
    width: 100px;
    top: 0;
    bottom: 0;
    right: 0;
    margin: auto;
}
.group .q-btn {
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
    width: 80%;
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
