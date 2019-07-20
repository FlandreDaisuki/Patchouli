<template>
  <div
    v-show="showRoot"
    :id="id"
    @click.left="clickBase"
    @scroll.stop.prevent="0"
    @wheel.stop.prevent="0"
  >
    <CoverLayerConfig v-show="showConfig" id="marisa-config-mode" :active="showConfig" />
    <CoverLayerPreview v-show="showPreview" id="marisa-preview-mode" :active="showPreview" />
  </div>
</template>

<script>
import { $print } from '../lib/utils';
import { COVER_LAYER_MODE as CLM } from '../lib/enums';

import FontAwesomeIcon from './FontAwesomeIcon.vue';
import CoverLayerConfig from './CoverLayerConfig.vue';
import CoverLayerPreview from './CoverLayerPreview.vue';

export default {
  components: { CoverLayerConfig, CoverLayerPreview, FontAwesomeIcon },
  props: {
    id: {
      default: '',
      type: String,
    },
  },
  // eslint-disable-next-line sort-keys
  computed: {
    showConfig() {
      return this.xmode === CLM.CONFIG;
    },
    showPreview() {
      return this.xmode === CLM.PREVIEW;
    },
    showRoot() {
      return this.xmode !== CLM.NONE;
    },
    xmode() {
      return this.$store.getters['coverLayer/mode'];
    },
  },
  // eslint-disable-next-line sort-keys
  methods: {
    clickBase(event) {
      $print.debug('CoverLayer#clickBase: event', event);
      this.$store.commit('coverLayer/close');
    },
  },
};
</script>

<style scoped>
#Marisa {
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
#marisa-preview-mode {
  width: 70%;
  height: 100%;
  min-width: 100px;
  min-height: 100px;
  background-color: #eef;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: minmax(0, auto) max-content;
}
#marisa-config-mode {
  display: flex;
  flex-flow: column;
  padding: 10px;
  border-radius: 10px;
  font-size: 18px;
  white-space: nowrap;
  min-width: 100px;
  min-height: 100px;
  background-color: #eef;
}
</style>
