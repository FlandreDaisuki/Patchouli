<template>
  <div
    v-show="mode"
    id="patchouli-big-component"
    ref="patchouliBigComponentRoot"
    tabindex="0"
    @keyup="jumpByKeyup"
    @click.left="clickBase"
    @scroll="focusForeground"
    @wheel="focusForeground">
    <div
      v-show="mode === 'config'"
      id="config-mode"
      @click.stop="0">
      <a id="config-context-menu-switch" @click.left="clickSwitch">
        <a
          v-show="xc.contextMenu"
          id="config-context-menu-switch-on"
          role="button">
          <i class="fas fa-toggle-on"/>
        </a>
        <a
          v-show="!xc.contextMenu"
          id="config-context-menu-switch-off"
          role="button">
          <i class="fas fa-toggle-off"/>
        </a>
        <span id="config-context-menu-label">{{ $t('config.contextMenuExtension') }}</span>
      </a>
      <a id="config-user-tooltip-switch" @click.left="clickSwitch">
        <a
          v-show="xc.userTooltip"
          id="config-user-tooltip-switch-on"
          role="button">
          <i class="fas fa-toggle-on"/>
        </a>
        <a
          v-show="!xc.userTooltip"
          id="config-user-tooltip-switch-off"
          role="button">
          <i class="fas fa-toggle-off"/>
        </a>
        <span id="config-user-tooltip-label">{{ $t('config.userTooltip') }}</span>
      </a>
      <a id="config-hover-play-switch" @click.left="clickSwitch">
        <a
          v-show="xc.hoverPlay"
          id="config-hover-play-switch-on"
          role="button">
          <i class="fas fa-toggle-on"/>
        </a>
        <a
          v-show="!xc.hoverPlay"
          id="config-hover-play-switch-off"
          role="button">
          <i class="fas fa-toggle-off"/>
        </a>
        <span id="config-hover-play-label">{{ $t('config.hoverPlay') }}</span>
      </a>
      <a id="config-blacklist-label">
        <i class="far fa-eye-slash"/>{{ $t('config.blacklist') }}
      </a>
      <textarea
        id="config-blacklist-textarea"
        :value="xc.blacklist.join('\n')"
        spellcheck="false"
        rows="5"/>
    </div>
    <div
      v-show="mode === 'preview'"
      id="preview-mode"
      @click.stop="0">
      <div id="preview-display-area">
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
      <ul v-show="previewSrcList.length > 1" id="preview-thumbnails-area">
        <li v-for="(pSrc, index) in previewSrcList" :key="pSrc">
          <a
            :class="(index === previewCurrentIndex) ? 'current-preview' : ''"
            @click.left="jumpPreview(index)" >
            <img :src="pSrc">
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { PixivAPI } from '../lib/pixiv';
import { $, $print, toInt } from '../lib/utils';

export default {
  data() {
    return {
      previewSrcList: [],
      previewCurrentIndex: 0,
      previewUgoiraMetaData: null,
      ugoiraPlayers: [],
    };
  },
  computed: {
    // vue'x' state 'm'odule
    xm() {
      return this.$store.state.bigComponent;
    },
    // vue'x' state 'c'onfig
    xc() {
      return this.$store.state.config;
    },
    mode() {
      return this.xm.mode;
    },
  },
  watch: {
    async mode(value) {
      $print.debug('watch mode change:', value);

      if (value === 'preview') {
        const imageItem = this.xm.data;
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
  updated() {
    if (this.mode === 'preview') {
      this.$refs.patchouliBigComponentRoot.focus();
    }
  },
  methods: {
    clickBase(event) {
      $print.debug('BigComponent#clickBase: event', event);
      this.$store.commit('closeBigComponent');

      this.xc.blacklist = [
        ...new Set(
          $('#config-blacklist-textarea')
            .value.split('\n')
            .filter(Boolean)
            .map(s => s.trim())
        ),
      ];
      this.xc.blacklist.sort((a, b) => a - b);

      this.$store.commit('saveConfig');
    },
    focusForeground(event) {
      if (event.target.id === 'patchouli-big-component') {
        event.preventDefault();
      }
    },
    clickSwitch(event) {
      $print.debug('BigComponent#clickSwitch: event', event);

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
    jumpPreview(index) {
      this.previewCurrentIndex = index;
    },
    initZipImagePlayer() {
      const meta = this.previewUgoiraMetaData;
      // resize as clear
      this.$refs.previewOriginalUgoiraCanvas.width = 0;
      this.$refs.previewUgoiraCanvas.width = 0;

      this.ugoiraPlayers.push(
        new ZipImagePlayer({
          canvas: this.$refs.previewOriginalUgoiraCanvas,
          source: meta.originalSrc,
          metadata: meta,
          chunkSize: 300000,
          loop: true,
          autoStart: true,
          autosize: true,
        })
      );
      this.ugoiraPlayers.push(
        new ZipImagePlayer({
          canvas: this.$refs.previewUgoiraCanvas,
          source: meta.src,
          metadata: meta,
          chunkSize: 300000,
          loop: true,
          autoStart: true,
          autosize: true,
        })
      );
    },
    jumpByKeyup(event) {
      $print.debug('BigComponent#jumpByKeyup: event', event);

      if (this.mode === 'preview') {
        const imageItem = this.xm.data;
        if (event.key === 'ArrowLeft') {
          this.jumpPreview(Math.max(this.previewCurrentIndex - 1, 0));
        } else if (event.key === 'ArrowRight') {
          this.jumpPreview(
            Math.min(
              this.previewCurrentIndex + 1,
              imageItem.illustPageCount - 1
            )
          );
        }
      }
    },
  },
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
#config-mode,
#preview-mode {
  min-width: 100px;
  min-height: 100px;
  background-color: #eef;
}
#config-mode {
  display: flex;
  flex-flow: column;
  padding: 10px;
  border-radius: 10px;
  font-size: 18px;
  white-space: nowrap;
}
#config-mode a {
  color: #00186c;
  text-decoration: none;
}
#config-mode [id$="switch"] {
  text-align: center;
}
#config-mode [id$="switch"]:hover {
  cursor: pointer;
}
#config-mode [id$="label"] {
  text-align: center;
  margin: 0 5px;
}
#config-blacklist-label > .fa-eye-slash {
  margin: 0 4px;
}
#config-blacklist-textarea {
  box-sizing: border-box;
  flex: 1;
  resize: none;
  font-size: 11pt;
  height: 90px;
}
#preview-mode {
  width: 70%;
  height: 100%;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: minmax(0, auto) max-content;
}
#preview-display-area {
  border: 2px #00186c solid;
  box-sizing: border-box;
  text-align: center;
}
#preview-display-area > a,
#preview-display-area > div {
  display: inline-flex;
  height: 100%;
  justify-content: center;
  align-items: center;
}
#preview-display-area > a > img,
#preview-display-area > div > canvas {
  object-fit: contain;
  max-width: 100%;
  max-height: 100%;
}
#preview-thumbnails-area {
  background-color: ghostwhite;
  display: flex;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  height: 100%;
  border: 2px solid #014;
  box-sizing: border-box;
  border-top: 0;
}
#preview-thumbnails-area > li {
  padding: 0 10px;
}
#preview-thumbnails-area > li > a {
  cursor: pointer;
  display: inline-block;
}
.current-preview {
  border: 3px solid palevioletred;
}
#preview-thumbnails-area > li > a > img {
  max-height: 100px;
  box-sizing: border-box;
  display: inline-block;
}
</style>
