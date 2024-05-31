<script setup>
import { QBtn, QSelect, QInput } from 'quasar'
import { ref } from 'vue' 

const ipOptions = ref(['IPv4', 'IPv6'])
const ipModel = ref('IPv4')
const asn = ref('')

</script>

<template>

	<div>
	
		<h1 class="text-center q-pa-xl">Network Topology Overview</h1>

		<div class="justify-center q-pa-md flex pb-0">
			<QInput style="max-width: 120px"  outlined v-model="asn" placeholder="ASN" :dense="true" />
			<QSelect
        	style="min-width: 100px; margin-left: 22px;"
			filled
			v-model="ipModel"
			:options="ipOptions"
			label="IP"
			:dense="true"
      		/>
			<QBtn style="margin-left:22px" color="secondary" label="Search" />
		</div>

	</div>

</template>

<style lang="stylus" scoped>
</style>