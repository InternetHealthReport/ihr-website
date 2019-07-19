<template>
  <div id="home">
    <div class="IHR_home-content row">
      <div class="col-8 row justify-around">
        <q-card
          class="IHR_feature-card col-xs-12 col-sm-12 col-md-5"
          v-bind:key="feature.name"
          v-for="feature in features"
        >
          <q-card-section>
            <div class="text-h6">{{feature.name}}</div>
            <q-img :src="feature.img" class="IHR_feature-preview">
              <template v-slot:error>
                <div class="absolute-full flex flex-center bg-negative text-white">
                  Cannot load {{feature.img}}
                </div>
              </template>
            </q-img>
          </q-card-section>

          <q-tabs v-model="tab" class="text-teal">
            <q-tab label="Description" name="one" />
            <q-tab label="API" name="two" />
            <q-tab label="Events" name="three" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="tab" animated>
            <q-tab-panel
              name="one"
            >The QCard component is a great way to display important pieces of grouped content.</q-tab-panel>

            <q-tab-panel name="two">
              With so much content to display at once, and often so little screen real-estate,
              Cards have fast become the design pattern of choice for many companies, including
              the likes of Google and Twitter.
            </q-tab-panel>
          </q-tab-panels>
        </q-card>
      </div>
      <div class="col-4 row justify-around IHR_counter-container">
        <div class="col-12">
          <delayed-counter
            incon="fas fa-flag"
            :label="$t('home.monitoredCountries')"
            :value="countriesNumber"/>
        </div>
        <div class="col-12">
          <delayed-counter
            incon="fas fa-network-wired"
            :label="$t('home.monitoredNetworks')"
            :value="networksNumber"/>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import DelayedCounter from "@/components/DelayedCounter"
import { NetworkQuery } from "@/plugins/IhrApi"

const features = [
  {
    name: "AS interdependece",
    img: require("@/assets/imgs/AS-interdependece.png")
  },
  {
    name: "Delay and Forwarding anomalies",
    img: require("@/assets/imgs/DF-anomalies.png")
  },
  {
    name: "Network Disconnections",
    img: require("@/assets/imgs/Net-disconnections.png")
  }
];

export default {
  name: "Home",
  components: {
    DelayedCounter
  },
  data() {
    return {
      tab: "",
      countriesNumber: null,
      networksNumber: null,
      features: features
    };
  },
  mounted(){
    this.$ihr_api.network(NetworkQuery.NO_FILTER, (result)=>{
      this.networksNumber = result.count;
    });
    this.countriesNumber = 10;
  }
};
</script>
<style lang="stylus" scoped>
.IHR_
  &counter-container,
  &feature-card
    margin-top 5em

  &feature-card
    min-width 200px
    margin-top 5em
    width 40vh

  &home-content
    margin 0 auto
    position relative
    width 90%

  &feature-preview
    width 100%

  &counter-container
    text-align center

    & > div
      width 240px
      height 80px

</style>

