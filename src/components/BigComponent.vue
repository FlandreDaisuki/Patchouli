<template>
  <div
    v-show="xm.mode"
    id="patchouli-big-component"
    @click.left="clickBase">
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
import { $print } from "../lib/utils";

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
    },
    clickSwitch(event) {
      $print.debug("BigComponent#clickSwitch: event", event);
      const parents = event.target.getParents();
      if (
        event.target.id.includes("config-context-menu-switch") ||
        parents.find(e => e.id.includes("config-context-menu-switch"))
      ) {
        this.xc.contextMenu = Number.toInt(!this.xc.contextMenu);
      }
      this.$store.commit("saveConfig");
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
</style>


