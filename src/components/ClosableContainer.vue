<template>
    <div class="closable-container">
        <div @click="$emit('close-me')">x</div>
        <slot></slot>
    </div>
</template>

<script>
export default {
    data() {
        return {}
    },
}
</script>
<style lang="stylus" scoped>
.closable-container
  position relative
  & > div:first-child
    position absolute
    top 2px
    right 1px
    z-index 15
    cursor pointer
    font-family "Courier New Lucida Console", Courier, Monospace
    font-weight bolder
    font-size 13pt
    box-shadow none
    border-radius 12pt
    padding 0pt 6pt
    transition 0.3s
    &:hover
      box-shadow 1px 2px 3px 2px gray
      transition 0.3s
    &:active
      box-shadow 1px 1px 1px 1px gray inset
</style>
