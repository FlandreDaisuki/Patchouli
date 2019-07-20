<template>
  <!-- copy from: https://github.com/tobiasahlin/SpinKit -->
  <div class="ils-grid">
    <div class="ils-cell ils-1"></div>
    <div class="ils-cell ils-2"></div>
    <div class="ils-cell ils-3"></div>
    <div class="ils-cell ils-4"></div>
    <div class="ils-cell ils-5"></div>
    <div class="ils-cell ils-6"></div>
    <div class="ils-cell ils-7"></div>
    <div class="ils-cell ils-8"></div>
    <div class="ils-cell ils-9"></div>
  </div>
</template>

<script>
export default {};
</script>

<style scoped>
.ils-grid {
  width: var(--loading-icon-size);
  height: var(--loading-icon-size);
  margin: 100px auto;
}

.ils-grid .ils-cell {
  width: 33%;
  height: 33%;
  background-color: var(--loading-icon-color);
  float: left;
  -webkit-animation: ilsGridScaleDelay 1.3s infinite ease-in-out;
  animation: ilsGridScaleDelay 1.3s infinite ease-in-out;
}
.ils-grid .ils-1 {
  -webkit-animation-delay: 0.2s;
  animation-delay: 0.2s;
}
.ils-grid .ils-2 {
  -webkit-animation-delay: 0.3s;
  animation-delay: 0.3s;
}
.ils-grid .ils-3 {
  -webkit-animation-delay: 0.4s;
  animation-delay: 0.4s;
}
.ils-grid .ils-4 {
  -webkit-animation-delay: 0.1s;
  animation-delay: 0.1s;
}
.ils-grid .ils-5 {
  -webkit-animation-delay: 0.2s;
  animation-delay: 0.2s;
}
.ils-grid .ils-6 {
  -webkit-animation-delay: 0.3s;
  animation-delay: 0.3s;
}
.ils-grid .ils-7 {
  -webkit-animation-delay: 0s;
  animation-delay: 0s;
}
.ils-grid .ils-8 {
  -webkit-animation-delay: 0.1s;
  animation-delay: 0.1s;
}
.ils-grid .ils-9 {
  -webkit-animation-delay: 0.2s;
  animation-delay: 0.2s;
}

@-webkit-keyframes ilsGridScaleDelay {
  0%,
  70%,
  100% {
    -webkit-transform: scale3D(1, 1, 1);
    transform: scale3D(1, 1, 1);
  }
  35% {
    -webkit-transform: scale3D(0, 0, 1);
    transform: scale3D(0, 0, 1);
  }
}

@keyframes ilsGridScaleDelay {
  0%,
  70%,
  100% {
    -webkit-transform: scale3D(1, 1, 1);
    transform: scale3D(1, 1, 1);
  }
  35% {
    -webkit-transform: scale3D(0, 0, 1);
    transform: scale3D(0, 0, 1);
  }
}
</style>


