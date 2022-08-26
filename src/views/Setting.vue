<template>
    <div>
        <div id="IHR_contact-page">
            <div class="subscribe">
                <h6>Subscribe settings</h6>
                <div class="group_setting">
                    <q-btn outline color="orange-5" label="back" @click="$router.back()" no-caps />
                    <q-btn color="orange-5" unelevated label="save" @click="saveChannel()" no-caps />
                </div>
            </div>
            <div class="verbosity">
                <p class="title">Verbosity</p>
                <div v-for="(item, index) in dataList" :key="index" class="item">
                    <div style="width:200px">
                        <el-tag type="warning">{{ item.channel.split(' ')[0] }}</el-tag>
                    </div>
                    <q-btn-toggle v-model="item.frequency" rounded unelevated class="toggle" toggle-color="positive"
                        :options="[
                            { label: 'low', value: 'low' },
                            { label: 'normal', value: 'normal' },
                            { label: 'high', value: 'high' },
                        ]" no-caps />
                </div>
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
                    save successfully
                </q-card-section>

                <q-card-actions align="right" class="bg-white text-teal">
                    <q-btn flat label="OK" v-close-popup />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </div>
</template>
<script>
export default {
    name: 'SettingPage',
    components: {},
    data() {
        return {
            dataList: [],
            emailSent: false,
        }
    },
    created() {
        this.dataList = JSON.parse(this.$route.query.data)
    },
    methods: {
        saveChannel() {
            this.$ihr_api.saveChannel(this.dataList,
                res => {
                    if (res.code === 200) {
                        this.emailSent = true
                        // this.$router.push('/en-us')
                    }
                },
                error => {
                    console.log(error)
                });
        },
    }
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
}

.subscribe {
    position: relative;
    padding-bottom: 0px;
    border-bottom: 1px solid #ccc;
}

.title {
    margin-top: 20px;
    font-size: 20px;
    color: #000;
    font-weight: 500;
}


.group_setting {
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: flex-end;
    position: absolute;
    height: 100px;
    width: 220px;
    bottom: 25px;
    right: 0;
}

.group_setting .q-btn {
    width: 100px;
    height: 38px;
}

.item {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 20px 0;
    padding-right: 300px;
    border-bottom: 1px solid #ddd;
}

.toggle {
    border: 1px solid #d1d1d1;
}
</style>
