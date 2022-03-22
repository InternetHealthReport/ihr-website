<template>
    <base-search-bar :dark="false" :placeholder="placeholder" v-model="retrievedValues" @search="search">
        <template v-slot:default="scope">
            <slot :asn="scope.elem">
                <q-btn @click="gotoASN(scope.elem.number)" flat>
                    <q-item-section side>{{ scope.elem.type }}</q-item-section>
                    <q-item-section>{{ scope.elem.name }}</q-item-section>
                    <q-item-section side>IPv{{ scope.elem.asFamily }}</q-item-section>
                </q-btn>
            </slot>
        </template>
    </base-search-bar>
</template>

<script>
import BaseSearchBar, { MAX_RESULTS } from './BaseSearchBar'
import { NetworkDelayLocation } from '@/plugins/IhrApi'

export default {
    components: { BaseSearchBar },
    data() {
        return {
            retrievedValues: [],
            networkDelayLocation: new NetworkDelayLocation().orderedByName(),
        }
    },
    methods: {
        search(value) {
            this.networkDelayLocation.name(value)
            this.$ihr_api.network_delay_location(
                this.networkDelayLocation,
                result => {
                    result.results.some(element => {
                        this.retrievedValues.push({
                            label: element.type + element.af + element.name,
                            type: element.type,
                            name: element.name,
                            asFamily: element.af,
                        })
                        return this.retrievedValues.length > MAX_RESULTS
                    })
                    console.log(result)
                },
                error => {
                    console.error(error)
                }
            )
        },
    },
    computed: {
        placeholder() {
            const filter_type = NetworkDelayLocation.EDGE_TYPE
            return Object.keys(filter_type)
                .map(key => filter_type[key])
                .join(', ')
        },
    },
}
</script>
<style lang="stylus" scoped>
.IHR_
  &asn-element
    width 100%
    margin 0px
    padding 0px
    &-name
      text-align left
</style>
