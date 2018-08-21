<template>
  <svg
    :class="actived?'f-active':'f-inactive'"
    class="i-effect"
    viewBox="0 0 32 32"
    width="32"
    height="32">
    <path d="M21,5.5 C24.8659932,5.5 28,8.63400675 28,12.5 C28,18.2694439 24.2975093,23.1517313 17.2206059,27.1100183 C16.4622493,27.5342993 15.5379984,27.5343235 14.779626,27.110148 C7.70250208,23.1517462 4,18.2694529 4,12.5 C4,8.63400691 7.13400681,5.5 11,5.5 C12.829814,5.5 14.6210123,6.4144028 16,7.8282366 C17.3789877,6.4144028 19.170186,5.5 21,5.5 Z"/>
    <path d="M16,11.3317089 C15.0857201,9.28334665 13.0491506,7.5 11,7.5 C8.23857625,7.5 6,9.73857647 6,12.5 C6,17.4386065 9.2519779,21.7268174 15.7559337,25.3646328 C15.9076021,25.4494645 16.092439,25.4494644 16.2441073,25.3646326 C22.7480325,21.7268037 26,17.4385986 26,12.5 C26,9.73857625 23.7614237,7.5 21,7.5 C18.9508494,7.5 16.9142799,9.28334665 16,11.3317089 Z"/>
  </svg>
</template>

<script>
export default {
  props: {
    actived: {
      default: false,
      type: Boolean,
    },
  },
};
</script>

<style scoped>
.f-active {
  fill: #ff4060;
}
.f-inactive {
  fill: #fff;
}
.f-inactive > path:first-child {
  fill: #333;
}
.i-effect {
  box-sizing: border-box;
  font-size: 0;
  line-height: 0;
  -webkit-transition: fill 0.2s, stroke 0.2s;
  transition: fill 0.2s, stroke 0.2s;
  vertical-align: top;
}
</style>



