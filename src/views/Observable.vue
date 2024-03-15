<script setup>
import { ref, onMounted } from 'vue'
import { QSplitter, QTree, QTabPanels, QTabPanel } from 'quasar'

const splitterModel = ref(30)
const selected = ref('Root')

const tree = [
	{
		label: 'Root',
		children: [
			{
				label: 'RIPE NCC',
				children: [
					{ label: 'Internet outages as seen by RIPE Atlas' },
					{ label: 'Atlas Latency World Map' }
				]
			},
			{
				label: 'Google Summer of Code',
				children: [
					{ label: 'Plug and Plot with Internet data' }
				]
			}
		]
	}
]
</script>

<template>
	<div>
		<QSplitter
			v-model="splitterModel"
			style="height: 100vh"
		>
			<template v-slot:before>
				<div class="q-pa-md">
					<QTree 
						:nodes="tree"
						node-key="label"
						selected-color="primary"
						v-model:selected="selected"
						default-expand-all
						no-selection-unset
					/>
				</div>
			</template>
			<template v-slot:after>
				<QTabPanels
					v-model="selected"
					animated
					transition-prev="jump-up"
					transition-next="jump-up"
				>
					<QTabPanel name="Root">
						<h1>Community Observable Notebook Showcase</h1>
						<p>Welcome to our community Observable notebook showcase! Below, you'll find a curated selection of 
							interactive data visualizations, code demos, and exploratory analyses created by members of our community.</p>
						<h2>About Observable</h2>
						<p><a href="https://observablehq.com/">Observable</a> is a platform for creating and sharing 
							interactive data visualizations and analyses. It allows users to write JavaScript-based 
							notebooks that combine code, visualizations, and explanatory text, making it easy to explore data and share insights.</p>
					</QTabPanel>
					<QTabPanel name="RIPE NCC">
						<h1>RIPE NCC</h1>
						<p>RIPE NCC (Réseaux IP Européens Network Coordination Centre) is one of the five Regional Internet Registries 
							(RIRs) responsible for the allocation and registration of Internet number resources—such as IP addresses and Autonomous 
							System Numbers (ASNs)—in Europe, the Middle East, and parts of Central Asia. Established in 1992, RIPE NCC serves as 
							a neutral and independent organization, facilitating the stable and secure operation of the Internet through its 
							coordination and support activities. It engages with its members and the broader Internet community to develop policies, 
							provide training and educational resources, conduct research, and promote collaboration on matters related to Internet 
							governance, infrastructure, and security.</p>
					</QTabPanel>
					<QTabPanel name="Internet outages as seen by RIPE Atlas" style="height: 100vh;">
						<iframe
							width="100%"
							height="100%"
							frameborder="0"
  						src="https://observablehq.com/embed/@ripencc/internet-outages-as-seen-by-ripe-atlas?cell=*"
						></iframe>
					</QTabPanel>
					<QTabPanel name="Atlas Latency World Map" style="height: 100vh;">
						<iframe
							width="100%"
							height="100%"
							frameborder="0"
  						src="https://observablehq.com/embed/@ripencc/atlas-latency-worldmap?cell=*"
						></iframe>
					</QTabPanel>
					<QTabPanel name="Google Summer of Code">
						<h1>Google Summer of Code</h1>
						<p>Google Summer of Code (GSoC) is an annual program sponsored by Google that offers stipends to university students for 
							working on open-source projects during the summer. Since its inception in 2005, GSoC has provided opportunities for 
							students to gain real-world software development experience while contributing to various open-source organizations. 
							Participants work remotely under the guidance of mentors from the participating organizations, collaborating on coding 
							projects ranging from software development and documentation to user interface design and testing. GSoC not only benefits 
							students by enhancing their coding skills and expanding their professional networks but also enriches the open-source community 
							by fostering innovation and collaboration.</p>
					</QTabPanel>
					<QTabPanel name="Plug and Plot with Internet data" style="height: 100vh;">
						<iframe
							width="100%"
							height="100%"
							frameborder="0"
  						src="https://observablehq.com/embed/57d2ee478ddd0170?cell=*"
						></iframe>
					</QTabPanel>
				</QTabPanels>
			</template>
		</QSplitter>
	</div>
</template>