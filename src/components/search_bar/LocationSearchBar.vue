<template>
    <q-select
        :dark="dark"
        use-input
        clearable
        dense
        outlined
        :label="label"
        :options="options"
        v-model="model"
        @filter="filter"
        hide-dropdown-icon
        input-debounce="1000"
        class="IHR_search-bar"
        :hint="hint"
    >
        <template v-slot:append>
            <div v-if="!loading">
                <q-icon name="fas fa-search" style="font-size: 0.82em; margin-rigth: 4px" />
            </div>
            <div v-else>
                <q-spinner color="primary" size="0.82em" />
            </div>
        </template>
        <template v-slot:loading> </template>
        <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps" v-on="scope.itemEvents" @click="selectLocation(scope.opt.value)">
                <q-item-section side color="accent">{{ scope.opt.type | readableType }}</q-item-section>
                <q-item-section class="IHR_asn-element-name">{{ scope.opt.name }}</q-item-section>
            </q-item>
        </template>
    </q-select>
</template>

<script>
import { NetworkDelayLocation, NetworkQuery } from '@/plugins/IhrApi'

const MIN_CHARACTERS = 3
const MAX_RESULTS = 100

export default {
    props: {
        dark: {
            type: Boolean,
            default: false,
        },
        label: {
            type: String,
            default: '',
        },
        hint: {
            type: String,
            default: '',
        },
        selected: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            options: [],
            model: this.selected,
            loading: false,
            always: false,
            networkDelayLocation: new NetworkDelayLocation().orderedByName(),
            networkQuery: new NetworkQuery().orderedByNumber(),
        }
    },
    methods: {
        search(value, update) {
            this.loading = true
            this.options = []
            this.networkQuery.mixedContentSearch(value)
            this.$ihr_api.network(
                this.networkQuery,
                result => {
                    result.results.some(element => {
                        let elem = {
                            value: elem,
                            type: element.number < 0 ? 'IX' : 'AS',
                            name: Math.abs(element.number),
                            af: 4,
                        }
                        this.options.push({
                            value: elem,
                            type: elem.type,
                            name: element.name + ' (' + elem.type + elem.name + ')',
                            label: elem.type + elem.name,
                            asFamily: elem.af,
                        })
                        update()
                        return this.options.length > MAX_RESULTS
                    })
                },
                error => {
                    console.error(error)
                }
            )
            this.networkDelayLocation.name(value)
            this.$ihr_api.network_delay_location(
                this.networkDelayLocation,
                result => {
                    result.results.some(element => {
                        if (element.type != 'AS' && element.type != 'IX') {
                            this.options.push({
                                value: element,
                                type: element.type,
                                name: element.name,
                                label: element.name,
                                asFamily: element.af,
                            })
                            update()
                        }
                        return this.options.length > MAX_RESULTS
                    })
                    this.loading = false
                },
                error => {
                    console.error(error)
                }
            )
        },
        selectLocation(loc) {
            this.$emit('select', loc)
        },
        filter(value, update, abort) {
            if (value.length < MIN_CHARACTERS) {
                abort()
            } else {
                this.search(value, update)
            }
        },
    },
    watch: {
        selected(newValue) {
            this.model = newValue
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
