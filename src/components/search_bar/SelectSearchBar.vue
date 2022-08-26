<template>
    <q-select v-model="model" outlined dense :label="placeholder" use-input :options="options" @filter="filter"
        hide-dropdown-icon input-debounce="500" :bg-color="bg" :label-color="label" :input-class="input"
        class="IHR_search-bar">
        <template v-slot:prepend>
            <div v-if="!loading">
                <q-icon :color="label" name="fas fa-search q-mb-sm" style="font-size: 0.8em" />
            </div>
            <div v-else>
                <q-spinner :color="label" size="0.82em" />
            </div>
        </template>
        <template v-if="model" v-slot:append>
            <q-icon name="cancel" @click.stop.prevent="clearModel" class="cursor-pointer" />
        </template>
        <template v-slot:loading> </template>
        <template v-slot:no-option>
            <q-item>
                <q-item-section>
                    <div v-if="loading">
                        <q-spinner color="secondary" size="2em" />
                    </div>
                    <div class="text-center" v-else>
                        {{ $t('searchBar.noResultFound') }}
                    </div>
                </q-item-section>
            </q-item>
        </template>
        <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps" v-on="scope.itemEvents" @click="searchRes(scope.opt)">
                <q-item-section side color="accent">{{ scope.opt }}</q-item-section>
            </q-item>
        </template>
    </q-select>
</template>

<script>
import { NetworkDelayLocation, CountryQuery } from '@/plugins/IhrApi'
const MIN_CHARACTERS = 1
const MAX_RESULTS = 5

export default {
    props: {
        bg: {
            type: String,
            default: 'white',
        },
        labelTxt: {
            type: String,
        },
        label: {
            type: String,
            default: 'black',
        },
        input: {
            type: String,
            default: 'text-black',
        },
        type: {
            type: String,
            default: 'country',
        }
    },
    data() {
        return {
            options: [],
            model: '',
            loading: false,
            always: false,
            networkDelayLocation: new NetworkDelayLocation().orderedByName(),
            countryQuery: new CountryQuery().orderedByCode(),
        }
    },
    methods: {
        search(value, type, update) {
            this.loading = true
            this.options = []
            if (type === 'country') {
                this.countryQuery.containsName(value)
                this.$ihr_api.country(this.countryQuery, result => {
                    setTimeout(() => {
                        this.loading = false
                        result.results.some(element => {
                            this.options.push(element.name)
                        })
                        update()
                    }, 1000)
                }, error => {
                    console.error(error)
                })
            } else {
                this.networkDelayLocation.name(value)
                if (type === 'city') {
                    this.networkDelayLocation.type('CT')
                }
                this.$ihr_api.network_delay_location(
                    this.networkDelayLocation,
                    result => {
                        setTimeout(() => {
                            this.loading = false
                            result.results.some(element => {
                                this.options.push(element.name)
                            })
                            update()
                        }, 1000)
                    },
                    error => {
                        console.error(error)
                    }
                )
            }
        },
        filter(value, update, abort) {
            if (value.length < MIN_CHARACTERS) {
                abort()
            } else {
                this.search(value, this.type, update)
            }
        },
        searchRes(value) {
            this.$emit('searchRes', value)
        },
        clearModel() {
            this.model = ''
            this.$emit('searchRes', '')
        }
    },
    computed: {
        placeholder() {
            if (this.labelTxt == null) return 'search resource'

            return this.labelTxt
        },
    },
}
</script>
<style lang="stylus" scoped>
.IHR_
  &search-bar
    width 460px

  &asn-element
    width 460px
    margin 0px
    padding 0px
    &-name
      text-align left
</style>
<style>
.select .q-field__label {
    line-height: 20px !important
}
</style>