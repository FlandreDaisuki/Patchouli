<template>
  <div
    v-show="xm.mode"
    id="patchouli-big-component"
    @click.left="clickBase">
    mode{{ xm.mode }}data{{ xm.data }}
  </div>
</template>

<script>
export default {
  computed: {
    // vue'x' state 'm'odule
    xm() {
      return this.$store.state.bigComponent;
    }
  },
  methods: {
    clickBase() {
      this.$store.commit("closeBigComponent");
    }
  }
};
</script>

<style scoped>
#patchouli-big-component {
  background-color: #000a;
  position: fixed;
  height: 100%;
  width: 100%;
  z-index: 5;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>


