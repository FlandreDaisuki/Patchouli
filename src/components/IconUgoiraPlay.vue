<template>
  <svg :style="inlineStyle" viewBox="0 0 24 24" class="iup">
    <circle class="iup-circle" cx="12" cy="12" r="10" />
    <path
      d="M9,8.74841664 L9,15.2515834 C9,15.8038681 9.44771525,16.2515834 10,16.2515834 C10.1782928,16.2515834 10.3533435,16.2039156 10.5070201,16.1135176 L16.0347118,12.8619342 C16.510745,12.5819147 16.6696454,11.969013 16.3896259,11.4929799 C16.3034179,11.3464262 16.1812655,11.2242738 16.0347118,11.1380658 L10.5070201,7.88648243 C10.030987,7.60646294 9.41808527,7.76536339 9.13806578,8.24139652 C9.04766776,8.39507316 9,8.57012386 9,8.74841664 Z"
    />
  </svg>
</template>

<script>
export default {
  props: {
    size: {
      default: 48,
      type: Number,
    },
  },
  // eslint-disable-next-line sort-keys
  computed: {
    inlineStyle() {
      return `height: ${this.size}px; width: ${this.size}px;`;
    },
  },
};
</script>

<style scoped>
.iup-circle {
  fill: #000;
  fill-opacity: 0.4;
}
.iup {
  fill: #fff;
  font-size: 0;
  line-height: 0;
  stroke: none;
  vertical-align: middle;
}
</style>



