<template>
  <div style="width: 50vw">
    <reverse-dns-ip ip="58.138.100.6" class="IHR_reverse-dns-ip-improved"/>
    <prefix-overview ip="58.138.100.6" class="IHR_prefix-overview-improved"/>
  </div>
</template>
<script>
import PrefixOverview from "@/components/ripe/PrefixOverview";
import ReverseDnsIp from "@/components/ripe/ReverseDnsIp";

export default {
  components: {
    PrefixOverview,
    ReverseDnsIp
  },
  data() {
    return {};
  }
};
</script>

<style>
</style>
