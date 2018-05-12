<template>
  <div id="koakuma" >
    <div class="processed">{{ $t('koakuma.processed', { count: $store.state.pixiv.imgLibrary.length }) }}</div>
    <div id="koakuma-bookmark-sort-block">
      <label for="koakuma-bookmark-sort-input" class="bookmark-count">
        <i class="_icon _bookmark-icon-inline"/>
        <input
          id="koakuma-bookmark-sort-input"
          :value="filters.limit"
          type="number"
          min="0"
          step="1"
          @wheel.stop.prevent="sortInputWheel"
          @input="sortInputInput">
      </label>
      <a
        id="koakuma-bookmark-input-usual-switch"
        :class="(usualSwitchOn ? 'switch-on' : 'switch-off')"
        role="button"
        @click="usualSwitchOn = !usualSwitchOn">{{ usualSwitchMsg }}</a>
      <ul
        v-show="usualSwitchOn"
        id="koakuma-bookmark-input-usual-list">
        <li v-for="usual in usualList" :key="usual">
          <a
            role="button"
            class="usual-list-link"
            @click="filters.limit = usual; usualSwitchOn = false">{{ usual }}</a>
        </li>
      </ul>
    </div>
    <div>
      <input
        id="koakuma-bookmark-tags-filter-input"
        :placeholder="$t('koakuma.tagsPlaceholder')"
        type="text"
        @input="tagsFilterInput">
    </div>
    <div>
      <button
        :disabled="status.isEnded"
        :class="statusClass"
        class="main-button"
        @mouseup="clickMainButton">
        {{ buttonMsg }}
      </button>
    </div>
    <div id="koakuma-options-block">
      <div>
        <input
          id="koakuma-options-fit-browser-width-checkbox"
          :checked="config.fitwidth"
          type="checkbox"
          @change="optionsChange">
        <label for="koakuma-options-fit-browser-width-checkbox">{{ $t('koakuma.fitWidth') }}</label>
      </div>
      <div>
        <input
          id="koakuma-options-sort-by-bookmark-count-checkbox"
          :checked="config.sort"
          type="checkbox"
          @change="optionsChange">
        <label for="koakuma-options-sort-by-bookmark-count-checkbox">{{ $t('koakuma.sortByBookmarkCount') }}</label>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      debounceId0: null,
      debounceId1: null,
      usualSwitchOn: false,
      usualList: [100, 500, 1000, 3000, 5000, 10000]
    };
  },
  computed: {
    status() {
      return this.$store.state.pixiv;
    },
    config() {
      return this.$store.state.config;
    },
    statusClass() {
      return {
        end: this.status.isEnded,
        paused: !this.status.isPaused && !this.status.isEnded,
        go: this.status.isPaused && !this.status.isEnded
      };
    },
    filters() {
      return this.$store.state.filters;
    },
    buttonMsg() {
      if (this.status.isEnded) {
        return this.$t("koakuma.buttonEnd");
      } else if (this.status.isPaused) {
        return this.$t("koakuma.buttonGo");
      } else {
        return this.$t("koakuma.buttonPause");
      }
    },
    usualSwitchMsg() {
      return this.usualSwitchOn ? "⏶" : "⏷";
    }
  },
  methods: {
    clickMainButton() {
      if (this.status.isPaused) {
        this.$store.dispatch("start");
      } else {
        this.$store.commit("pause");
      }
    },
    sortInputWheel(event) {
      if (event.deltaY < 0) {
        this.filters.limit = Number.toInt(event.target.value) + 20;
      } else {
        this.filters.limit = Math.max(0, Number.toInt(event.target.value) - 20);
      }
    },
    sortInputInput(event) {
      if (this.debounceId0) {
        clearTimeout(this.debounceId0);
      }
      this.debounceId0 = setTimeout(() => {
        this.debounceId0 = null;
        this.filters.limit = Math.max(0, Number.toInt(event.target.value));
      }, 500);
    },
    optionsChange(event) {
      if (event.target.id === "koakuma-options-fit-browser-width-checkbox") {
        this.config.fitwidth = event.target.checked;
      } else if (
        event.target.id === "koakuma-options-sort-by-bookmark-count-checkbox"
      ) {
        this.config.sort = Number.toInt(event.target.checked);
      }
      this.$store.commit("saveConfig");
      this.$store.commit("applyConfig");
    },
    tagsFilterInput(event) {
      if (this.debounceId1) {
        clearTimeout(this.debounceId1);
      }
      this.debounceId1 = setTimeout(() => {
        this.debounceId1 = null;
        this.filters.tag = new RegExp(event.target.value, "ig");
      }, 1500);
    }
  }
};
</script>

<style scoped>
@-webkit-keyframes slidedown {
  from {
    -webkit-transform: translateY(-100%);
    transform: translateY(-100%);
  }
  to {
    -webkit-transform: translateY(0);
    transform: translateY(0);
  }
}

@keyframes slidedown {
  from {
    -webkit-transform: translateY(-100%);
    transform: translateY(-100%);
  }
  to {
    -webkit-transform: translateY(0);
    transform: translateY(0);
  }
}
a[role="button"] {
  text-decoration: none;
}
#koakuma {
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  position: -webkit-sticky;
  position: sticky;
  top: 0;
  z-index: 3;
  background-color: #e5e4ff;
  -webkit-box-shadow: 0 2px 2px #777;
  box-shadow: 0 2px 2px #777;
  padding: 4px;
  color: #00186c;
  font-size: 16px;
  -webkit-animation: slidedown 0.7s linear;
  animation: slidedown 0.7s linear;
}
#koakuma > div {
  margin: 0 10px;
  display: -webkit-inline-box;
  display: -ms-inline-flexbox;
  display: inline-flex;
}
.bookmark-count {
  display: -webkit-inline-box !important;
  display: -ms-inline-flexbox !important;
  display: inline-flex !important;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  margin-right: 0;
  border-radius: 3px 0 0 3px;
}
#koakuma-bookmark-sort-block {
  position: relative;
  height: 20px;
  -webkit-box-shadow: 0 0 1px #069;
  box-shadow: 0 0 1px #069;
  border-radius: 4px;
}
#koakuma-bookmark-sort-input {
  -moz-appearance: textfield;
  border: none;
  background-color: transparent;
  padding: 0;
  color: inherit;
  font-size: 16px;
  display: inline-block;
  cursor: ns-resize;
  text-align: center;
  max-width: 50px;
}
#koakuma-bookmark-sort-input::-webkit-inner-spin-button,
#koakuma-bookmark-sort-input::-webkit-outer-spin-button {
  /* https://css-tricks.com/numeric-inputs-a-comparison-of-browser-defaults/ */
  -webkit-appearance: none;
  margin: 0;
}
#koakuma-bookmark-tags-filter-input {
  min-width: 300px;
}
#koakuma-bookmark-input-usual-switch {
  background-color: #cef;
  padding: 1px;
  border-left: 1px solid #888;
  border-radius: 0 3px 3px 0;
  cursor: pointer;
  display: -webkit-inline-box;
  display: -ms-inline-flexbox;
  display: inline-flex;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
}
#koakuma-bookmark-input-usual-list {
  border-radius: 3px;
  border-top: 1px solid #888;
  background-color: #cef;
  -webkit-box-shadow: 0 0 1px #069;
  box-shadow: 0 0 1px #069;
  position: absolute;
  top: 100%;
  width: 100%;
}
#koakuma-bookmark-input-usual-list > li::after {
  content: "";
  -webkit-box-shadow: 0 0 0 1px #89d8ff;
  box-shadow: 0 0 0 1px #89d8ff;
  display: inline-block;
  margin: 0;
  height: 0;
  line-height: 0;
  font-size: 0;
  position: absolute;
  width: 100%;
  -webkit-transform: scaleX(0.8);
  transform: scaleX(0.8);
}
#koakuma-bookmark-input-usual-list > li:last-child::after {
  -webkit-box-shadow: none;
  box-shadow: none;
}
.usual-list-link:hover::before {
  content: "⮬";
  position: absolute;
  left: 6px;
  font-weight: bolder;
}
.usual-list-link {
  display: block;
  cursor: pointer;
  text-align: center;
}
#koakuma-options-block > * {
  margin: 0 5px;
}
.main-button {
  border: none;
  padding: 2px 14px;
  border-radius: 3px;
  font-size: 16px;
}
.main-button:enabled {
  -webkit-transform: translate(-1px, -1px);
  transform: translate(-1px, -1px);
  -webkit-box-shadow: 1px 1px 1px hsl(60, 0%, 30%);
  box-shadow: 1px 1px 1px hsl(60, 0%, 30%);
  cursor: pointer;
}
.main-button:enabled:hover {
  -webkit-transform: translate(0);
  transform: translate(0);
  -webkit-box-shadow: none;
  box-shadow: none;
}
.main-button:enabled:active {
  -webkit-transform: translate(1px, 1px);
  transform: translate(1px, 1px);
  -webkit-box-shadow: -1px -1px 1px hsl(60, 0%, 30%);
  box-shadow: -1px -1px 1px hsl(60, 0%, 30%);
}
.main-button.go {
  background-color: hsl(141, 100%, 50%);
}
.main-button.paused {
  background-color: hsl(60, 100%, 50%);
}
.main-button.end {
  background-color: #878787;
  color: #fff;
  opacity: 0.87;
}
</style>
