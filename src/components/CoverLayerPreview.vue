<template>
  <div
    ref="coverLayerPreviewRoot"
    tabindex="0"
    @keyup="jumpByKeyup"
    @wheel.stop.prevent="jumpByWheel"
    @click.stop="0">
    <div id="marisa-preview-display-area">
      <a
        v-show="!previewUgoiraMetaData"
        :href="previewSrcList[previewCurrentIndex]"
        target="_blank">
        <img :src="previewSrcList[previewCurrentIndex]">
      </a>
      <div v-show="!!previewUgoiraMetaData">
        <canvas v-show="previewCurrentIndex === 0" ref="previewUgoiraCanvas"/>
        <canvas v-show="previewCurrentIndex === 1" ref="previewOriginalUgoiraCanvas"/>
      </div>
    </div>
    <ul v-show="previewSrcList.length > 1" id="marisa-preview-thumbnails-area">
      <li v-for="(pSrc, index) in previewSrcList" :key="pSrc">
        <a
          :class="(index === previewCurrentIndex) ? 'current-preview' : ''"
          @click.left="jumpTo(index)" >
          <img :src="pSrc">
        </a>
      </li>
    </ul>
  </div>
</template>

<script>
import { PixivAPI } from '../lib/pixiv';
import { $print } from '../lib/utils';

export default {
  props: {
    active: {
      default: false,
      type: Boolean,
    },
  },
  // eslint-disable-next-line sort-keys
  data() {
    return {
      previewCurrentIndex: 0,
      previewSrcList: [],
      previewUgoiraMetaData: null,
      ugoiraPlayers: [],
    };
  },
  // eslint-disable-next-line sort-keys
  computed: {
    xdata() {
      return this.$store.getters['coverLayer/data'];
    },
  },
  // eslint-disable-next-line sort-keys
  watch: {
    async active(value) {
      if (value) {
        const imageItem = this.xdata;
        if (imageItem.isUgoira) {
          this.previewUgoiraMetaData = await PixivAPI.getIllustUgoiraMetaData(
            imageItem.illustId
          );
          this.initZipImagePlayer();
          this.previewSrcList.push(imageItem.urls.thumb);
          this.previewSrcList.push(imageItem.urls.original);
        } else if (imageItem.illustPageCount > 1) {
          const indexArray = Array.from(
            Array(imageItem.illustPageCount).keys()
          );
          const srcs = indexArray.map(idx =>
            imageItem.urls.original.replace('p0', `p${idx}`)
          );
          this.previewSrcList.push(...srcs);
        } else {
          this.previewSrcList.push(imageItem.urls.original);
        }
      } else {
        $print.debug('CoverLayerPreview#deactive');

        this.previewSrcList = [];
        this.previewCurrentIndex = 0;
        this.previewUgoiraMetaData = null;
        this.ugoiraPlayers.forEach(player => player.stop());
        this.ugoiraPlayers = [];
      }
    },
  },
  // eslint-disable-next-line sort-keys
  updated() {
    if (this.active) {
      this.$refs.coverLayerPreviewRoot.focus();
    }
  },
  // eslint-disable-next-line sort-keys
  methods: {
    initZipImagePlayer() {
      const meta = this.previewUgoiraMetaData;
      // resize as clear
      this.$refs.previewOriginalUgoiraCanvas.width = 0;
      this.$refs.previewUgoiraCanvas.width = 0;

      const opt = {
        autoStart: true,
        autosize: true,
        canvas: this.$refs.previewUgoiraCanvas,
        chunkSize: 300000,
        loop: true,
        metadata: meta,
        source: meta.src,
      };

      this.ugoiraPlayers.push(new ZipImagePlayer(opt));

      this.ugoiraPlayers.push(
        new ZipImagePlayer(
          Object.assign({}, opt, {
            canvas: this.$refs.previewOriginalUgoiraCanvas,
            source: meta.originalSrc,
          })
        )
      );
    },
    jumpByKeyup(event) {
      $print.debug('CoverLayerPreview#jumpByKeyup: event', event);

      if (event.key === 'ArrowLeft') {
        this.jumpPrev();
      } else if (event.key === 'ArrowRight') {
        this.jumpNext();
      }
    },
    jumpByWheel(event) {
      $print.debug('CoverLayerPreview#jumpByWheel: event', event);

      if (event.deltaY < 0) {
        this.jumpPrev();
      } else if (event.deltaY > 0) {
        this.jumpNext();
      }
    },
    jumpNext() {
      const t = this.previewSrcList.length;
      const c = this.previewCurrentIndex;
      this.jumpTo((c + 1) % t);
    },
    jumpPrev() {
      const t = this.previewSrcList.length;
      const c = this.previewCurrentIndex;
      this.jumpTo((c + t - 1) % t);
    },
    jumpTo(index) {
      this.previewCurrentIndex = index;
    },
  },
};
</script>

<style scoped>
#marisa-preview-display-area {
  border: 2px #00186c solid;
  box-sizing: border-box;
  text-align: center;
}
#marisa-preview-display-area > a,
#marisa-preview-display-area > div {
  display: inline-flex;
  height: 100%;
  justify-content: center;
  align-items: center;
}
#marisa-preview-display-area > a > img,
#marisa-preview-display-area > div > canvas {
  object-fit: contain;
  max-width: 100%;
  max-height: 100%;
}
#marisa-preview-thumbnails-area {
  background-color: ghostwhite;
  display: flex;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  height: 100%;
  border: 2px solid #014;
  box-sizing: border-box;
  border-top: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}
#marisa-preview-thumbnails-area > li {
  margin: 0 10px;
  display: inline-flex;
}
#marisa-preview-thumbnails-area > li > a {
  cursor: pointer;
  display: inline-flex;
  border: 3px solid transparent;
}
#marisa-preview-thumbnails-area > li > a.current-preview {
  border: 3px solid palevioletred;
}
#marisa-preview-thumbnails-area > li > a > img {
  max-height: 100px;
  box-sizing: border-box;
  display: inline-block;
}
</style>
