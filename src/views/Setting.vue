<template>
    <div>
        <div id="IHR_contact-page">
            <div class="subscribe">
                <h6>Subscribe settings</h6>
                <q-btn class="savebnt" color="orange-5" label="save" :to="{ name: 'select' }" no-caps />
            </div>
            <div class="verbosity">
                <p class="title">Verbosity</p>
                <div v-for="(item,index) in dataList" :key="index" class="item">
                    <el-tag type="warning">{{ item.value.split(' ')[0] }}</el-tag>
                    <q-btn-toggle
                        v-model="item.model"
                        rounded
                        unelevated
                        class="toggle"
                        toggle-color="positive"
                        :options="[
                            { label: 'low', value: 'low' },
                            { label: 'normal', value: 'normal' },
                            { label: 'high', value: 'high' },
                        ]"
                        no-caps
                    />
                </div>
            </div>
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
    name: 'SettingPage',
    components: {},
    data() {
        return {
            dataList:[]
        }
    },
    created(){
        this.dataList = JSON.parse(this.$route.query.data)
    },
    methods: {},
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
.savebnt {
    position: absolute;
    width: 100px;
    height: 38px;
    top: 0;
    right: 0;
}
.item {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 20px 0;
    padding-right: 300px;
    border-bottom: 1px solid #ddd;
}
.toggle{
    border: 1px solid #d1d1d1;
}
</style>
