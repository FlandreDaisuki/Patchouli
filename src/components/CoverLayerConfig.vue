<template>
  <div @click.stop="0">
    <a id="config-context-menu-switch" @click.left.stop="clickSwitch">
      <a v-show="xc.contextMenu" id="config-context-menu-switch-on" role="button">
        <FontAwesomeIcon :icon="'toggle-on'" />
      </a>
      <a v-show="!xc.contextMenu" id="config-context-menu-switch-off" role="button">
        <FontAwesomeIcon :icon="'toggle-off'" />
      </a>
      <span id="config-context-menu-label">{{ $t('config.contextMenuExtension') }}</span>
    </a>
    <a id="config-user-tooltip-switch" @click.left.stop="clickSwitch">
      <a v-show="xc.userTooltip" id="config-user-tooltip-switch-on" role="button">
        <FontAwesomeIcon :icon="'toggle-on'" />
      </a>
      <a v-show="!xc.userTooltip" id="config-user-tooltip-switch-off" role="button">
        <FontAwesomeIcon :icon="'toggle-off'" />
      </a>
      <span id="config-user-tooltip-label">{{ $t('config.userTooltip') }}</span>
    </a>
    <a id="config-hover-play-switch" @click.left.stop="clickSwitch">
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
    ></textarea>
  </div>
</template>
<script>
import { $print, toInt } from '../lib/utils';

import FontAwesomeIcon from './FontAwesomeIcon.vue';

export default {
  components: { FontAwesomeIcon },
  props: {
    active: {
      default: false,
      type: Boolean,
    },
  },
  // eslint-disable-next-line sort-keys
  computed: {
    // vue'x' 'c'onfig
    xc() {
      return this.$store.getters.config;
    },
  },
  watch: {
    active(value) {
      if (!value) {
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
      }
    },
  },
  // eslint-disable-next-line sort-keys
  methods: {
    clickSwitch(event) {
      $print.debug('CoverLayerConfig#clickSwitch: event', event);

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
  },
};
</script>

<style scoped>
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
</style>

