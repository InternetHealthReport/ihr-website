<script setup>
import { QSpace } from 'quasar'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AS from '@/components/networks/AS.vue'
import IXP from '@/components/networks/IXP.vue'
import Prefix from '@/components/networks/Prefix.vue'
import * as ipAddress from 'ip-address'
import { isoCountries } from '@/plugins/countryName'
import Country from '@/components/networks/Country.vue'
import HostName from '@/components/networks/HostName.vue'
import Rank from '@/components/networks/Rank.vue'

const route = useRoute()

const report = route.params.report
const param1 = route.params.param1
const param2 = route.params.param2

const pageTitle = ref()

const asNumber = ref(null)
const ixpNumber = ref(null)
const prefixHostString = ref(null)
const prefixLengthNumber = ref(null)
const countryString = ref(null)
const hostName = ref(null)
const rankName = ref(null)

const Address4 = ipAddress.Address4
const Address6 = ipAddress.Address6

const setPageTitle = (title) => {
	pageTitle.value = title
}

const network = () => {
	if (!param2) {
	asNumber.value = param1.includes('AS') ? Number(param1.replace('AS', '')) : null
	ixpNumber.value = param1.includes('IXP') ? Number(param1.replace('IXP', '')) : null
	prefixHostString.value = null
	prefixLengthNumber.value = null
  } else if (param1 && param2) {
    let prefixMatch
    try {
      prefixMatch = (new Address4(param1)).isCorrect()
    } catch (e) {
      prefixMatch = null
    }
    if (!prefixMatch) {
      try {
        prefixMatch = (new Address6(param1)).isCorrect()
      } catch (e) {
        prefixMatch = null
      }
    }
    prefixHostString.value = prefixMatch ? param1 : null
    prefixLengthNumber.value = !isNaN(param2) ? Number(param2) : null
    asNumber.value = null
    ixpNumber.value = null
  }
}

const country = () => {
  if (param1) {
    countryString.value = param1 in isoCountries ? param1 : null
  }
}

const hostname = () => {
  if (param1) {
    hostName.value = param1
  }
}

const rank = () => {
  if (param1) {
    rankName.value = param1
  }
}


onMounted(() => {
	if (report === 'network' || report === 'prefix') {
		network()
	} else if (report === 'country') {
		country()
	} else if (report === 'hostname') {
		hostname()
	} else if (report === 'rank') {
		rank()
	}
  console.log(report, param1, param2)
})

</script>

<template>
	<div :class="route.path.includes('embedded-full') ? '' : 'embedded'">
		<AS v-if="asNumber" :asNumber="asNumber" @set-embedded-page-title="setPageTitle" />
		<IXP v-if="ixpNumber" :ixpNumber="ixpNumber" @set-embedded-page-title="setPageTitle"/>
		<Prefix v-if="prefixHostString && prefixLengthNumber" :host="prefixHostString" :prefixLength="prefixLengthNumber" @set-embedded-page-title="setPageTitle" />
		<Country v-if="countryString" :countryCode="countryString" @set-embedded-page-title="setPageTitle" />
		<HostName v-if="hostName" :domain="hostName" @set-embedded-page-title="setPageTitle" />
		<Rank v-if="rankName" :rank="rankName" @set-embedded-page-title="setPageTitle" />
	</div>
	<div class="row embedded-credit">
		<div style="text-align: center;">{{ pageTitle }}</div>
		<QSpace />
		<img src="@/assets/imgs/ihr_logo.svg" style="width: 25px" />
		<div style="margin-left: 5px; align-content: center;">Internet Health Report</div>
	</div>
</template>

<style lang="stylus" scoped>
.embedded
		margin-top -20px
.embedded-credit
		margin 10px 10px 0px 10px
</style>