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
        role="button"
        @click.left="usualSwitchOn = !usualSwitchOn">
        <i class="fas fa-angle-down"/>
      </a>
      <ul v-show="usualSwitchOn" id="koakuma-bookmark-input-usual-list">
        <li v-for="usual in usualList" :key="usual">
          <a
            role="button"
            class="usual-list-link"
            @click.left="filters.limit = usual; usualSwitchOn = false">{{ usual }}</a>
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
    <div id="koakuma-sorting-order-block">
      <a
        id="koakuma-sorting-order-select-switch"
        role="button"
        @click.left="sortingOrderSwitchOn = !sortingOrderSwitchOn">
        <output id="koakuma-sorting-order-select-output" v-html="sortingOrderMsg"/>
        <i class="fas fa-angle-down"/>
      </a>
      <ul v-show="sortingOrderSwitchOn" id="koakuma-sorting-order-select-list">
        <li>
          <a
            id="koakuma-sorting-order-by-popularity"
            class="sorting-order-link"
            role="button"
            @click.left="clickSortingOrder">{{ $t("koakuma.sortByPopularity") }}</a>
        </li>
        <li>
          <a
            id="koakuma-sorting-order-by-date"
            class="sorting-order-link"
            role="button"
            @click.left="clickSortingOrder">{{ $t("koakuma.sortByDate") }}</a>
        </li>
      </ul>
    </div>
    <div id="koakuma-options-block">
      <div>
        <i
          v-show="config.fitwidth"
          id="koakuma-options-width-compress"
          class="fas fa-compress"
          @click.left="optionsChange"/>
        <i
          v-show="!config.fitwidth"
          id="koakuma-options-width-expand"
          class="fas fa-expand"
          @click.left="optionsChange"/>
      </div>
      <div>
        <i class="fas fa-cog" @click.left="configPageOn = !configPageOn"/>
      </div>
    </div>
    <div
      v-show="configPageOn"
      id="koakuma-config-page"
      @click.left="configPageOn = false">
      <div id="koakuma-configs-block" @click.left.stop="() => {}">configs</div>
    </div>
  </div>
</template>

<script>
import { $print } from "../lib/utils";
export default {
  data() {
    return {
      debounceId0: null,
      debounceId1: null,
      usualSwitchOn: false,
      sortingOrderSwitchOn: false,
      usualList: [100, 500, 1000, 3000, 5000, 10000],
      configPageOn: false
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
    sortingOrderMsg() {
      const p = this.$t("koakuma.sortByPopularity");
      const d = this.$t("koakuma.sortByDate");
      const ml = Math.max(p.length, d.length);
      const [xp, xd] = [p, d].map(s => {
        if (s.length < ml) {
          const ps = ml - s.length; // padding space
          const hps = Math.floor(ps / 2);
          return "&nbsp;".repeat(hps) + s + "&nbsp;".repeat(ps - hps);
        }
        return s;
      });
      if (this.config.sort) {
        return xp;
      } else {
        return xd;
      }
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
      $print.debug("Koakuma#optionsChange: event", event);
      if (event.target.id === "koakuma-options-width-compress") {
        this.config.fitwidth = false;
      } else if (event.target.id === "koakuma-options-width-expand") {
        this.config.fitwidth = true;
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
    },
    clickSortingOrder(event) {
      $print.debug("Koakuma#clickSortingOrder: event", event);

      if (event.target.id === "koakuma-sorting-order-by-popularity") {
        this.config.sort = 1;
      } else {
        this.config.sort = 0;
      }

      this.$store.commit("saveConfig");
      this.$store.commit("applyConfig");

      this.sortingOrderSwitchOn = false;
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
a[role="button"] > .fa-angle-down {
  padding: 2px;
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
#koakuma-bookmark-sort-block,
#koakuma-sorting-order-block {
  position: relative;
  height: 20px;
  -webkit-box-shadow: 0 0 1px #069;
  box-shadow: 0 0 1px #069;
  border-radius: 4px;
}
#koakuma-sorting-order-block {
  background-color: #cef;
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
#koakuma-bookmark-input-usual-switch,
#koakuma-sorting-order-select-switch {
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
#koakuma-sorting-order-select-switch {
  border: none;
  border-radius: 3px;
}
#koakuma-bookmark-input-usual-list,
#koakuma-sorting-order-select-list {
  border-radius: 3px;
  border-top: 1px solid #888;
  background-color: #cef;
  -webkit-box-shadow: 0 0 1px #069;
  box-shadow: 0 0 1px #069;
  position: absolute;
  top: 100%;
  width: 100%;
}
#koakuma-bookmark-input-usual-list > li::after,
#koakuma-sorting-order-select-list > li::after {
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
#koakuma-bookmark-input-usual-list > li:last-child::after,
#koakuma-sorting-order-select-list > li:last-child::after {
  -webkit-box-shadow: none;
  box-shadow: none;
}
.usual-list-link:hover::before,
.sorting-order-link:hover::before {
  content: "⮬";
  position: absolute;
  left: 6px;
  font-weight: bolder;
}
.usual-list-link,
.sorting-order-link {
  display: block;
  cursor: pointer;
  text-align: center;
}
#koakuma-sorting-order-select-output {
  padding: 0 16px;
  display: flex;
  align-items: center;
}
#koakuma-sorting-order-select {
  font-size: 14px;
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
#koakuma-options-width-compress,
#koakuma-options-width-expand {
  cursor: pointer;
}
#koakuma > #koakuma-config-page {
  position: fixed;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  display: flex;
  background-color: #0003;
  align-items: center;
  justify-content: center;
}
#koakuma-configs-block {
  background-color: #b28fce;
  color: white;
  border-radius: 10px;
  display: flex;
}
</style>
