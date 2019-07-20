<template>
  <div class="icon-multiple-indicator">
    <svg viewBox="0 0 9 10" class="icon-multiple-svg">
      <path
        d="M8,3 C8.55228475,3 9,3.44771525 9,4 L9,9 C9,9.55228475 8.55228475,10 8,10 L3,10 C2.44771525,10 2,9.55228475 2,9 L6,9 C7.1045695,9 8,8.1045695 8,7 L8,3 Z M1,1 L6,1 C6.55228475,1 7,1.44771525 7,2 L7,7 C7,7.55228475 6.55228475,8 6,8 L1,8 C0.44771525,8 0,7.55228475 0,7 L0,2 C0,1.44771525 0.44771525,1 1,1 Z"
      />
    </svg>
    <span class="illust-page-count">{{ illustPageCount }}</span>
  </div>
</template>

<script>
export default {
  props: {
    illustPageCount: {
      default: 1,
      type: Number,
    },
  },
};
</script>

<style scoped>
.icon-multiple-indicator {
  align-items: center;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 10px;
  box-sizing: border-box;
  display: flex;
  flex: none;
  height: 20px;
  margin: 2px 2px -20px auto;
  padding: 5px 6px;
  z-index: 1;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}
.icon-multiple-svg {
  fill: #fff;
  font-size: 0;
  height: 10px;
  line-height: 0;
  stroke: none;
  width: 9px;
}
.illust-page-count {
  margin-left: 2px;
}
</style>

