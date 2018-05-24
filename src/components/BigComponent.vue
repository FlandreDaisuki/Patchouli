<template>
  <div
    v-show="mode"
    id="patchouli-big-component"
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
        <a :href="previewSrcList[previewCurrentIndex]" target="_blank">
          <img :src="previewSrcList[previewCurrentIndex]">
        </a>
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
import { PixivAPI } from "../lib/pixiv";
import { $, $print } from "../lib/utils";

export default {
  data() {
    return {
      previewSrcList: [],
      previewCurrentIndex: 0
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
    }
  },
  watch: {
    async mode(value) {
      $print.debug("watch mode change:", value);
      if (value === "preview") {
        const imageItem = this.xm.data;
        if (imageItem.illustPageCount > 1) {
          const d = await PixivAPI.getMultipleIllustHTMLDetail(
            imageItem.illustId
          );
          this.previewSrcList.push(...d.imgSrcs);
        } else {
          this.previewSrcList.push(imageItem.url.big);
        }
      } else if (!value) {
        this.previewSrcList.length = 0;
        this.previewCurrentIndex = 0;
      }
    }
  },
  methods: {
    clickBase() {
      this.$store.commit("closeBigComponent");

      this.xc.blacklist = [
        ...new Set(
          $("#config-blacklist-textarea")
            .value.split("\n")
            .filter(Boolean)
            .map(s => s.trim())
        )
      ];
      this.xc.blacklist.sort((a, b) => a - b);

      this.$store.commit("saveConfig");
    },
    focusForeground(event) {
      if (event.target.id === "patchouli-big-component") {
        event.preventDefault();
      }
    },
    clickSwitch(event) {
      $print.debug("BigComponent#clickSwitch: event", event);
      const parents = event.target.getParents();
      const isClickContextMenuSwitch = [event.target, ...parents].find(e =>
        e.id.includes("config-context-menu-switch")
      );
      if (isClickContextMenuSwitch) {
        this.xc.contextMenu = Number.toInt(!this.xc.contextMenu);
      }
    },
    jumpPreview(index) {
      this.previewCurrentIndex = index;
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
  flex: 1;
  text-align: center;
}
#config-mode [id$="switch"]:hover {
  cursor: pointer;
}
#config-mode [id$="label"] {
  flex: 4;
  text-align: center;
  margin: 0 5px;
}
#config-blacklist-label > .fa-eye-slash {
  margin: 0 4px;
}
#config-blacklist-textarea {
  box-sizing: border-box;
  flex: 5;
  resize: none;
  font-size: 11pt;
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
#preview-display-area > a {
  display: inline-block;
  height: 100%;
}
#preview-display-area > a > img {
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
}
#preview-thumbnails-area > li {
  margin: 0 5px;
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
  cursor: pointer;
  box-sizing: border-box;
  display: inline-block;
}
</style>
