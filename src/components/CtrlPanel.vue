<template>
  <div
    :id="id"
    :ref="id">
    <div class="processed">{{ $t('ctrlPanel.processed', { count: processedCount }) }}</div>
    <div id="koakuma-bookmark-sort-block">
      <label id="koakuma-bookmark-sort-label" for="koakuma-bookmark-sort-input">
        <span>❤️</span>
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
          <span class="sort-order-apply-indicator">⮬</span>
          <a
            role="button"
            class="usual-list-link"
            @click.left="clickUsual">{{ usual }}</a>
        </li>
      </ul>
    </div>
    <div>
      <input
        id="koakuma-bookmark-tags-filter-input"
        :placeholder="$t('ctrlPanel.tagsPlaceholder')"
        type="text"
        @input="tagsFilterInput">
    </div>
    <div>
      <button
        id="koakuma-main-button"
        :disabled="status.isEnded"
        :class="statusClass"
        @mouseup.left="clickMainButton">
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
          <span class="sort-order-apply-indicator">⮬</span>
          <a
            id="koakuma-sorting-order-by-popularity"
            class="sorting-order-link"
            role="button"
            @click.left="clickSortingOrder">{{ $t('ctrlPanel.sortByPopularity') }}</a>
        </li>
        <li>
          <span class="sort-order-apply-indicator">⮬</span>
          <a
            id="koakuma-sorting-order-by-date"
            class="sorting-order-link"
            role="button"
            @click.left="clickSortingOrder">{{ $t('ctrlPanel.sortByDate') }}</a>
        </li>
        <li v-show="isSelfBookmarkPage">
          <span class="sort-order-apply-indicator">⮬</span>
          <a
            id="koakuma-sorting-order-by-bookmark-id"
            class="sorting-order-link"
            role="button"
            @click.left="clickSortingOrder">{{ $t('ctrlPanel.sortByBookmarkId') }}</a>
        </li>
      </ul>
    </div>
    <div id="koakuma-options-block">
      <div>
        <i
          v-show="xc.fitwidth"
          id="koakuma-options-width-compress"
          class="fas fa-compress"
          @click.left="optionsChange"/>
        <i
          v-show="!xc.fitwidth"
          id="koakuma-options-width-expand"
          class="fas fa-expand"
          @click.left="optionsChange"/>
      </div>
      <div>
        <i
          id="koakuma-options-config"
          class="fas fa-cog"
          @click.left="openCoverLayerInConfigMode"/>
      </div>
    </div>
  </div>
</template>

<script>
import { $print, toInt } from '../lib/utils';
import { SORT_TYPE as ST } from '../lib/enums';
export default {
  props: {
    id: {
      default: '',
      type: String,
    },
  },
  // eslint-disable-next-line sort-keys
  data() {
    return {
      debounceId4sortInput: null,
      debounceId4tagsFilter: null,
      sortingOrderSwitchOn: false,
      usualList: [100, 500, 1000, 3000, 5000, 10000],
      usualSwitchOn: false,
    };
  },
  // eslint-disable-next-line sort-keys
  computed: {
    buttonMsg() {
      if (this.status.isEnded) {
        return this.$t('ctrlPanel.buttonEnd');
      } else if (this.status.isPaused) {
        return this.$t('ctrlPanel.buttonGo');
      } else {
        return this.$t('ctrlPanel.buttonPause');
      }
    },
    filters() {
      return this.$store.getters.filters;
    },
    isSelfBookmarkPage() {
      return this.$store.getters.isSelfBookmarkPage;
    },
    processedCount() {
      return this.$store.getters['pixiv/imageItemLibrary'].length;
    },
    sortingOrderMsg() {
      switch (this.xc.sort) {
      case ST.BOOKMARK_COUNT:
        return this.$t('ctrlPanel.sortByPopularity');
      case ST.ILLUST_ID:
        return this.$t('ctrlPanel.sortByDate');
      default:
        //ST.BOOKMARK_ID
        return this.$t('ctrlPanel.sortByBookmarkId');
      }
    },
    status() {
      return this.$store.getters['pixiv/status'];
    },
    statusClass() {
      const _s = this.status;
      return {
        end: _s.isEnded,
        go: _s.isPaused && !_s.isEnded,
        paused: !_s.isPaused && !_s.isEnded,
      };
    },
    xc() {
      return this.$store.getters.config;
    },
  },
  methods: {
    clickMainButton() {
      if (this.status.isPaused) {
        this.$store.dispatch('pixiv/start');
      } else {
        this.$store.dispatch('pixiv/pause');
      }
    },
    clickSortingOrder(event) {
      $print.debug('Koakuma#clickSortingOrder: event', event);

      const ct = event.currentTarget;
      switch (ct.id) {
      case 'koakuma-sorting-order-by-popularity':
        this.$store.commit('setConfig', { sort: ST.BOOKMARK_COUNT });
        break;
      case 'koakuma-sorting-order-by-bookmark-id':
        this.$store.commit('setConfig', { sort: ST.BOOKMARK_ID });
        break;
      default:
        this.$store.commit('setConfig', { sort: ST.ILLUST_ID });
        break;
      }

      this.$store.commit('saveConfig');
      this.$store.commit('applyConfig');

      this.sortingOrderSwitchOn = false;
    },
    clickUsual(event) {
      this.$store.commit('setFilters', {
        limit: toInt(event.currentTarget.textContent),
      });
      this.usualSwitchOn = false;
    },
    openCoverLayerInConfigMode() {
      this.$store.commit('coverLayer/open', { data: null, mode: 'config' });
    },
    optionsChange(event) {
      $print.debug('Koakuma#optionsChange: event', event);
      if (event.target.id === 'koakuma-options-width-compress') {
        this.$store.commit('setConfig', { fitwidth: false });
      } else if (event.target.id === 'koakuma-options-width-expand') {
        this.$store.commit('setConfig', { fitwidth: true });
      }
      this.$store.commit('saveConfig');
      this.$store.commit('applyConfig');
    },
    sortInputInput(event) {
      if (this.debounceId4sortInput) {
        clearTimeout(this.debounceId4sortInput);
      }
      this.debounceId4sortInput = setTimeout(() => {
        this.debounceId4sortInput = null;
        this.$store.commit('setFilters', {
          limit: Math.max(0, toInt(event.target.value)),
        });
      }, 500);
    },
    sortInputWheel(event) {
      if (event.deltaY < 0) {
        this.$store.commit('setFilters', {
          limit: toInt(event.target.value) + 20,
        });
      } else {
        this.$store.commit('setFilters', {
          limit: Math.max(0, toInt(event.target.value) - 20),
        });
      }
    },
    tagsFilterInput(event) {
      if (this.debounceId4tagsFilter) {
        clearTimeout(this.debounceId4tagsFilter);
      }
      this.debounceId4tagsFilter = setTimeout(() => {
        this.debounceId4tagsFilter = null;
        this.$store.commit('setFilters', {
          tag: new RegExp(event.target.value, 'ig'),
        });
      }, 1500);
    },
  },
};
</script>

<style scoped>
a {
  color: #258fb8;
  text-decoration: none;
}
a[role="button"] > .fa-angle-down {
  padding: 2px;
}
#Koakuma {
  display: flex;
  justify-content: center;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 3;
  background-color: #eef;
  box-shadow: 0 1px 1px #777;
  padding: 4px;
  color: #00186c;
  font-size: 16px;
}
#Koakuma > div {
  margin: 0 10px;
  display: inline-flex;
}
#koakuma-bookmark-sort-label {
  display: inline-flex !important;
  align-items: center;
  margin-right: 0;
  border-radius: 3px 0 0 3px;
  background-color: #cef;
  color: rgb(0, 105, 177);
  margin: 0 1px;
  padding: 0 6px;
}
#koakuma-bookmark-sort-block,
#koakuma-sorting-order-block {
  position: relative;
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
  margin: 0;
  padding: 0 4px;
  color: #333;
  font-size: 12px;
  border: 1px solid #becad7;
  height: 20px;
  min-width: 300px;
}
#koakuma-bookmark-tags-filter-input:focus {
  background: #ffffcc;
  outline: none;
}
#koakuma-bookmark-input-usual-switch,
#koakuma-sorting-order-select-switch {
  background-color: #cef;
  padding: 1px;
  border-left: 1px solid #888;
  border-radius: 0 3px 3px 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}
#koakuma-sorting-order-select-switch {
  border: none;
  border-radius: 3px;
}
#koakuma-bookmark-input-usual-list,
#koakuma-sorting-order-select-list {
  border-radius: 3px;
  background-color: #cef;
  box-shadow: 0 0 2px #069;
  position: absolute;
  top: 100%;
  width: 100%;
  margin-top: 1px;
  list-style: none;
  padding: 0;
}
#koakuma-sorting-order-select-list {
  display: grid;
  grid-auto-columns: max-content;
  width: initial;
}
#koakuma-bookmark-input-usual-list > li,
#koakuma-sorting-order-select-list > li {
  display: flex;
  position: relative;
  line-height: 24px;
}
#koakuma-bookmark-input-usual-list > li::after,
#koakuma-sorting-order-select-list > li::after {
  content: "";
  box-shadow: 0 0 0 1px #89d8ff;
  display: inline-block;
  margin: 0;
  height: 0;
  line-height: 0;
  font-size: 0;
  position: absolute;
  left: 0;
  right: 0;
  width: 100%;
  transform: scaleX(0.8);
}
#koakuma-bookmark-input-usual-list > li:first-child::after,
#koakuma-sorting-order-select-list > li:first-child::after {
  box-shadow: none;
}
#koakuma-bookmark-input-usual-list .sort-order-apply-indicator,
#koakuma-sorting-order-select-list .sort-order-apply-indicator {
  visibility: hidden;
}
#koakuma-bookmark-input-usual-list .sort-order-apply-indicator {
  position: absolute;
}
#koakuma-bookmark-input-usual-list > li:hover .sort-order-apply-indicator,
#koakuma-sorting-order-select-list > li:hover .sort-order-apply-indicator {
  visibility: visible;
}
.sort-order-apply-indicator {
  display: block;
  justify-content: center;
  align-items: center;
  font-weight: bolder;
  padding: 0 4px;
}
.usual-list-link,
.sorting-order-link {
  display: block;
  cursor: pointer;
  text-align: center;
  flex: 1;
}
.sorting-order-link {
  padding-right: 18px;
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
#koakuma-main-button {
  border: none;
  padding: 2px 14px;
  border-radius: 3px;
  font-size: 16px;
}
#koakuma-main-button:enabled {
  transform: translate(-1px, -1px);
  box-shadow: 1px 1px 1px hsl(60, 0%, 30%);
  cursor: pointer;
}
#koakuma-main-button:enabled:hover {
  transform: translate(0);
  box-shadow: none;
}
#koakuma-main-button:enabled:active {
  transform: translate(1px, 1px);
  box-shadow: -1px -1px 1px hsl(60, 0%, 30%);
}
#koakuma-main-button.go {
  background-color: hsl(141, 100%, 50%);
}
#koakuma-main-button.paused {
  background-color: hsl(60, 100%, 50%);
}
#koakuma-main-button.end {
  background-color: #878787;
  color: #fff;
  opacity: 0.87;
}
#koakuma-options-width-compress,
#koakuma-options-width-expand,
#koakuma-options-config {
  cursor: pointer;
}
</style>
