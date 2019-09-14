<template>
  <div
    v-show="xmode"
    :id="id"
    ref="coverLayerRoot"
    tabindex="0"
    @keyup="jumpByKeyup"
    @click.left="clickBase"
    @scroll.stop.prevent="0"
    @wheel.stop.prevent="jumpByWheel"
  >
    <div v-show="xmode === 'config'" id="marisa-config-mode" @click.stop="0">
      <a id="config-context-menu-switch" @click.left="clickSwitch">
        <a v-show="xc.contextMenu" id="config-context-menu-switch-on" role="button">
          <FontAwesomeIcon :icon="'toggle-on'" />
        </a>
        <a v-show="!xc.contextMenu" id="config-context-menu-switch-off" role="button">
          <FontAwesomeIcon :icon="'toggle-off'" />
        </a>
        <span id="config-context-menu-label">{{ $t('config.contextMenuExtension') }}</span>
      </a>
      <a id="config-user-tooltip-switch" @click.left="clickSwitch">
        <a v-show="xc.userTooltip" id="config-user-tooltip-switch-on" role="button">
          <FontAwesomeIcon :icon="'toggle-on'" />
        </a>
        <a v-show="!xc.userTooltip" id="config-user-tooltip-switch-off" role="button">
          <FontAwesomeIcon :icon="'toggle-off'" />
        </a>
        <span id="config-user-tooltip-label">{{ $t('config.userTooltip') }}</span>
      </a>
      <a id="config-hover-play-switch" @click.left="clickSwitch">
        <a v-show="xc.hoverPlay" id="config-hover-play-switch-on" role="button">
          <FontAwesomeIcon :icon="'toggle-on'" />
        </a>
        <a v-show="!xc.hoverPlay" id="config-hover-play-switch-off" role="button">
          <FontAwesomeIcon :icon="'toggle-off'" />
        </a>
        <span id="config-hover-play-label">{{ $t('config.hoverPlay') }}</span>
      </a>
      <a id="marisa-config-blacklist-label">
        <FontAwesomeIcon :icon="'eye-slash'" />
        {{ $t('config.blacklist') }}
      </a>
      <textarea
        id="marisa-config-blacklist-textarea"
        ref="blacklistTextarea"
        :value="xc.blacklist.join('\n')"
        spellcheck="false"
        rows="5"
      />
    </div>
    <div v-show="xmode === 'preview'" id="marisa-preview-mode" @click.stop="0">
      <div id="marisa-preview-display-area">
        <a
          v-show="!previewUgoiraMetaData"
          :href="previewSrcList[previewCurrentIndex]"
          target="_blank"
        >
          <img :src="previewSrcList[previewCurrentIndex]" />
        </a>
        <div v-show="!!previewUgoiraMetaData">
          <canvas v-show="previewCurrentIndex === 0" ref="previewUgoiraCanvas" />
          <canvas v-show="previewCurrentIndex === 1" ref="previewOriginalUgoiraCanvas" />
        </div>
      </div>
      <ul v-show="previewSrcList.length > 1" id="marisa-preview-thumbnails-area">
        <li v-for="(pSrc, index) in previewSrcList" :key="pSrc">
          <a
            :class="(index === previewCurrentIndex) ? 'current-preview' : ''"
            @click.left="jumpTo(index)"
          >
            <img :src="pSrc" />
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { PixivAPI } from '../lib/pixiv';
import { $print, toInt } from '../lib/utils';

import FontAwesomeIcon from './FontAwesomeIcon.vue';

export default {
  components: { FontAwesomeIcon },
  props: {
    id: {
      default: '',
      type: String,
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
    // vue'x' 'c'onfig
    xc() {
      return this.$store.getters.config;
    },
    xdata() {
      return this.$store.getters['coverLayer/data'];
    },
    xmode() {
      return this.$store.getters['coverLayer/mode'];
    },
  },
  watch: {
    async xmode(value) {
      $print.debug('watch xmode change:', value);

      if (value === 'preview') {
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
      } else if (!value) {
        this.previewSrcList.length = 0;
        this.previewCurrentIndex = 0;
        this.previewUgoiraMetaData = null;
        this.ugoiraPlayers.forEach(player => player.stop());
        this.ugoiraPlayers.length = 0;
      }
    },
  },
  // eslint-disable-next-line sort-keys
  updated() {
    if (this.xmode === 'preview') {
      this.$refs.coverLayerRoot.focus();
    }
  },
  // eslint-disable-next-line sort-keys
  methods: {
    clickBase(event) {
      $print.debug('CoverLayer#clickBase: event', event);
      this.$store.commit('coverLayer/close');

      const blacklist = [
        ...new Set(
          this.$refs.blacklistTextarea.value
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean)
        ),
      ];

      blacklist.sort((a, b) => a - b);

      this.$store.commit('setConfig', { blacklist });
      this.$store.commit('saveConfig');
    },
    clickSwitch(event) {
      $print.debug('CoverLayer#clickSwitch: event', event);

      if (event.currentTarget.id === 'config-context-menu-switch') {
        this.xc.contextMenu = toInt(!this.xc.contextMenu);
      }

      if (event.currentTarget.id === 'config-user-tooltip-switch') {
        this.xc.userTooltip = toInt(!this.xc.userTooltip);
      }

      if (event.currentTarget.id === 'config-hover-play-switch') {
        this.xc.hoverPlay = toInt(!this.xc.hoverPlay);
      }
    },
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
      $print.debug('CoverLayer#jumpByKeyup: event', event);

      if (this.xmode === 'preview') {
        if (event.key === 'ArrowLeft') {
          this.jumpPrev();
        } else if (event.key === 'ArrowRight') {
          this.jumpNext();
        }
      }
    },
    jumpByWheel(event) {
      $print.debug('CoverLayer#jumpByWheel: event', event);

      if (this.xmode === 'preview') {
        if (event.deltaY < 0) {
          this.jumpPrev();
        } else if (event.deltaY > 0) {
          this.jumpNext();
        }
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
#marisa-config-mode,
#marisa-preview-mode {
  min-width: 100px;
  min-height: 100px;
  background-color: #eef;
}
#marisa-config-mode {
  display: flex;
  flex-flow: column;
  padding: 10px;
  border-radius: 10px;
  font-size: 18px;
  white-space: nowrap;
}
#marisa-config-mode a {
  color: #00186c;
  text-decoration: none;
  display: inline-flex;
}
#marisa-config-mode > a {
  align-items: center;
  justify-content: center;
  margin: 2px 0;
}
#marisa-config-mode [id$="switch"] {
  cursor: pointer;
}
#marisa-config-mode svg {
  height: 18px;
  margin: 0 4px;
}
#marisa-config-blacklist-textarea {
  box-sizing: border-box;
  flex: 1;
  resize: none;
  font-size: 11pt;
  height: 90px;
}
#marisa-preview-mode {
  width: 70%;
  height: 100%;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: minmax(0, auto) max-content;
}
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
