<script setup>
import { ref } from 'vue'
import { QBtn, QDialog, QCard, QCardSection, QCardActions } from 'quasar'

const showFeedbackDialog = ref(false)
</script>

<template>
	<QBtn
		class="feedback-btn"
		@click="showFeedbackDialog = true"
		no-caps
		unelevated
		label="Give Feedback"
		dense
	/>
	<QDialog v-model="showFeedbackDialog">
		<QCard>
			<QCardSection>
				<div class="text-h6">Give Feedback</div>
			</QCardSection>
			<QCardSection>
				<div>
					Please share your feedback to improve our report pages. You can either:
					<ul>
						<li>Send your feedback by email to <a href="mailto:admin@ihr.live" target="_blank">admin@ihr.live</a></li>
						<li>Join our <a href="https://join.slack.com/t/internethealthreport/shared_invite/zt-19d4e48py-~oirVwkINe01gTVEF3o4Kw">Slack workspace</a> and send your feedback as a direct message or in the #ihr-website channel</li>
						<li>Create a new <a href="https://github.com/InternetHealthReport/ihr-website/issues">GitHub issue</a> requesting a new feature</li>
					</ul>
					Thank you!
				</div>
			</QCardSection>
			<QCardActions align="right">
				<QBtn flat label="Close" v-close-popup />
			</QCardActions>
		</QCard>
	</QDialog>
</template>

<style>
.feedback-btn {
	position: fixed !important;
	top: 50%;
	right: 0px;
	writing-mode: vertical-rl;
	text-orientation: mixed;
	transform: rotate(180deg);
	background-color: #f44336 !important;
	color: white !important;
	border-radius: 0 5px 5px 0 !important;
	z-index: 2000;
}
</style>