<template>
  <div
    v-show="xm.mode"
    id="patchouli-big-component"
    @click.left="clickBase"
    @scroll="focusForeground"
    @wheel="focusForeground">
    <div
      v-show="xm.mode === 'config'"
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
      v-show="xm.mode === 'row-flow-preview'"
      id="row-flow-preview-mode"
      @click.stop="0">
      [{{ xm.mode }}] [{{ xm.data }}]
    </div>
    <div
      v-show="xm.mode === 'col-flow-preview'"
      id="col-flow-preview-mode"
      @click.stop="0">
      [{{ xm.mode }}] [{{ xm.data }}]
    </div>
  </div>
</template>

<script>
import { $, $print } from "../lib/utils";

export default {
  computed: {
    // vue'x' state 'm'odule
    xm() {
      return this.$store.state.bigComponent;
    },
    // vue'x' state 'c'onfig
    xc() {
      return this.$store.state.config;
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
#patchouli-big-component > div {
  min-width: 100px;
  min-height: 100px;
  background-color: #a5b6fa;
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
</style>
