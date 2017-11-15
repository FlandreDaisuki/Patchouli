<template>
  <div id="koakuma">
    <div class="processed">{{processedMsg}}</div>
    <div>
      <label for="koakuma-bookmark-sort-input" class="bookmark-count">
        <i class="_icon sprites-bookmark-badge"></i>
        <input id="koakuma-bookmark-sort-input" type="number" min="0" step="1" :value="filters.limit" @wheel.stop.prevent="sortInputWheel" @input="sortInputInput">↑
      </label>

    </div>
    <div>
      <input type="text" class="tag-filter" :placeholder="l10n.tagFilterPlaceholder" @input="tagFilterInput">
    </div>
    <div>
      <button class="explosion" :class="buttonClass" :disabled="crawler.isEnded" @click="clickExplosion">{{buttonMsg}}</button>
    </div>
    <div>
      <input type="checkbox" id="koakuma-options-fit-browser-width" :checked="conf.fitwidth" @change="optionsChange">
      <label for="koakuma-options-fit-browser-width">{{l10n.fitBrowserWidth}}</label>
      <input type="checkbox" id="koakuma-options-sort-by-bookmark-count" :checked="conf.sort" @change="optionsChange">
      <label for="koakuma-options-sort-by-bookmark-count">{{l10n.sortByBookmarkCount}}</label>
    </div>
  </div>
</template>

<script>
  export default {
    name: "Koakuma",
    props: ["crawler", "l10n", "filters", "store", "conf", "applyConf"],
    computed: {
      processedMsg() {
        return this.l10n.koakumaProcessed.call(
          this.l10n,
          this.crawler.library.length
        );
      },
      buttonClass() {
        return {
          end: this.crawler.isEnded,
          paused: !this.crawler.isPaused && !this.crawler.isEnded,
          go: this.crawler.isPaused && !this.crawler.isEnded
        };
      },
      buttonMsg() {
        if (this.crawler.isEnded) {
          return this.l10n.koakumaEnd;
        } else if (this.crawler.isPaused) {
          return this.l10n.koakumaGo;
        } else {
          return this.l10n.koakumaPause;
        }
      }
    },
    methods: {
      clickExplosion() {
        if (this.crawler.isPaused) {
          this.crawler.start();
        } else {
          this.crawler.pause();
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
        if (event.target.id === "koakuma-options-fit-browser-width") {
          this.conf.fitwidth = event.target.checked;
        } else {
          //koakuma-options-sort-by-bookmark-count
          this.conf.sort = Number.toInt(event.target.checked);
        }
        this.store.set(this.conf);
        this.applyConf();
      },
      tagFilterInput(event) {
        if (this.debounceId1) {
          clearTimeout(this.debounceId1);
        }
        this.debounceId1 = setTimeout(() => {
          this.debounceId1 = null;
          this.filters.tag = new RegExp(event.target.value, "ig");
        }, 1500);
      }
    },
    data() {
      return {
        debounceId0: null,
        debounceId1: null
      };
    }
  };
</script>

<style scoped>
  #koakuma {
    display: flex;
    justify-content: center;
    position: sticky;
    top: 0;
    z-index: 3;
    background-color: #e77;
    color: #fff;
    padding: 4px;
    font-size: 16px;
  }
  #koakuma > div {
    margin: 0 10px;
  }
  .bookmark-count {
    display: inline-flex !important;
    align-items: center;
  }
  #koakuma-bookmark-sort-input {
    -moz-appearance: textfield;
    border: none;
    background-color: transparent;
    padding: 0px;
    color: inherit;
    font-size: 16px;
    display: inline-block;
    cursor: ns-resize;
    text-align: center;
    max-width: 50px;
  }
  .tag-filter {
    min-width: 300px;
  }
  .explosion {
    border: none;
    padding: 2px 14px;
    border-radius: 3px;
    font-size: 16px;
  }
  .explosion:enabled:hover {
    box-shadow: 1px 1px;
  }
  .explosion:enabled:active {
    box-shadow: 1px 1px inset;
  }
  .go {
    background-color: #64ffda;
  }
  .paused {
    background-color: #ffd600;
  }
  .end {
    background-color: #455a64;
    color: #fff;
    opacity: 0.9;
  }
</style>
