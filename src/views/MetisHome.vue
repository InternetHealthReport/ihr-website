<template>
  <div>
    <h1 class="text-center">Metis</h1>
    <div class="row justify-center">
      <div class="IHR_description">
        <p style="color: #3b4151">Welcome to Metis! A data-driven method to select diverse vantage points.</p>
        <p style="color: #3b4151">
          Metis is a tool that can help researchers, network administrators, basically everyone working with large-scale measurement
          platforms, make a diverse selection of vantage points (VPs).
        </p>
        <p style="color: #3b4151">
          We developed Metis to solve a problem that we faced while running experiments with RIPE's
          <a href="https://atlas.ripe.net/" target="_blank">Atlas</a> measurement platform: How can we be certain that the measurement
          results are not skewed by the distribution of available VPs?
        </p>
        <p style="color: #3b4151">
          Looking at the <a href="https://atlas.ripe.net/results/maps/network-coverage/" target="_blank">probe map</a> already makes it
          clear, that simply using all probes will yield unbalanced results. Now, one approach might be to try and somehow adjust the
          results to account for this imbalance, however, it might be difficult.
        </p>
        <p style="color: #3b4151">
          Instead, we propose to limit the selection of VPs before even starting any measurements. The idea is to select a set of diverse,
          representative VPs from the pool of all available VPs, that will yield results which are less influenced by the VP distribution.
        </p>
        <p style="color: #3b4151">
          The approach is described in detail in our paper <a href="https://tma.ifip.org/2022/wp-content/uploads/sites/11/2022/06/tma2022-paper18.pdf">"Metis: Better Atlas Vantage Point Selection for Everyone”</a>. We are also working on a high-level explanation for the
          <router-link to="documentation/">documentation</router-link>.
        </p>
        <p style="color: #3b4151">Although the approach is applicable to any kind of measurement platform, we currently only provide data for RIPE Atlas.</p>
        <h2 style="color: #3b4151">Atlas Probe Selection and Deployment Recommendations</h2>
        <p style="color: #3b4151">The first data set is for anyone who wants to start measurements and needs to select a suitable set of probes:</p>
        <div class="row justify-center q-pb-lg">
          <q-btn color="secondary" label="Atlas probe selection" to="metis/selection" />
        </div>
        <p style="color: #3b4151">The second data set shows recommendations on where to deploy new probes to increase the diversity of the probe pool:</p>
        <div class="row justify-center">
          <q-btn color="secondary" label="Atlas probe deployment" to="metis/deployment" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MetisHome',
  methods: {
    pushRoute() {},
  },
}
</script>

<style lang="stylus">
@import '../styles/quasar.variables';

.IHR_description
    max-width 900px
    padding 0 1rem
h1
  font-size 32pt
  @media screen and (max-width: 600px)
    font-size 24pt
    line-height 2
h2
  font-size 20pt
  line-height 1.5
  margin-bottom 1rem
  @media screen and (max-width: 600px)
    font-size 14pt
</style>
