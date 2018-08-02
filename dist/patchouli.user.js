// ==UserScript==
// @name              Patchouli
// @name:en           Patchouli
// @name:ja           パチュリー
// @name:zh-CN        帕秋莉
// @name:zh-TW        帕秋莉
// @namespace         https://github.com/FlandreDaisuki
// @description       An image searching/browsing tool on pixiv
// @description:en    An image searching/browsing tool on pixiv
// @description:ja    pixiv 検索機能強化
// @description:zh-CN pixiv 搜寻/浏览 工具
// @description:zh-TW pixiv 搜尋/瀏覽 工具
// @include           *://www.pixiv.net/*
// @require           https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.16/vue.min.js
// @require           https://cdnjs.cloudflare.com/ajax/libs/vuex/3.0.1/vuex.min.js
// @require           https://cdnjs.cloudflare.com/ajax/libs/vue-i18n/7.8.0/vue-i18n.min.js
// @require           https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min.js
// @require           https://cdn.rawgit.com/FlandreDaisuki/zip_player/ecf3751317079fcabef70af4bd0e92411288303d/dist/zip_player.iife.min.js
// @icon              http://i.imgur.com/VwoYc5w.png
// @connect           i.pximg.net
// @noframes
// @author            FlandreDaisuki
// @license           The MIT License (MIT) Copyright (c) 2016-2018 FlandreDaisuki
// @compatible        firefox >=52
// @compatible        chrome >=55
// @version           4.1.9
// @grant             GM_getValue
// @grant             GM.getValue
// @grant             GM_setValue
// @grant             GM.setValue
// @grant             GM_xmlhttpRequest
// @grant             GM.xmlHttpRequest
// ==/UserScript==

(function (Vue,Vuex,VueI18n) {
  'use strict';

  function __$styleInject ( css ) {
      if(!css) return ;

      if(typeof(window) == 'undefined') return ;
      let style = document.createElement('style');

      style.innerHTML = css;
      document.head.appendChild(style);
      return css;
  }

  Vue = Vue && Vue.hasOwnProperty('default') ? Vue['default'] : Vue;
  Vuex = Vuex && Vuex.hasOwnProperty('default') ? Vuex['default'] : Vuex;
  VueI18n = VueI18n && VueI18n.hasOwnProperty('default') ? VueI18n['default'] : VueI18n;

  __$styleInject("._global-header {\n  z-index: 4;\n  position: relative;\n}\n._global-header .ui-search {\n  z-index: auto;\n}\n._global-header.koakuma-placeholder {\n  /* I don't know why #koakuma just 32px\n     but it should preserve 42px to keep all spacing correct */\n  margin-bottom: 42px;\n}\n#toolbar-items {\n  z-index: 5;\n}\n.ω {\n  display: flex;\n  flex-flow: row wrap;\n  justify-content: center;\n  position: relative;\n}\n.ω,\n.ω .layout-a,\n.ω .layout-body {\n  transition: width 0.2s;\n}\n.ω.↔,\n.ω.↔ .layout-a,\n.ω.↔ .layout-body {\n  width: 100% !important;\n}\n.ω.↔ .layout-a {\n  display: flex;\n  flex-direction: row-reverse;\n}\n.ω.↔ .layout-column-2 {\n  flex: 1;\n  margin-left: 20px;\n}\n.ω.↔ .layout-body,\n.ω.↔ .layout-a {\n  margin: 10px 20px;\n}\n");

  function $(selector) {
    return document.querySelector(selector);
  }
  function $$(selector) {
    return [...document.querySelectorAll(selector)];
  }
  function $$find(doc, selector) {
    return [...doc.querySelectorAll(selector)];
  }
  function $el(tag, attr = {}, cb = () => {}) {
    const el = document.createElement(tag);
    Object.assign(el, attr);
    cb(el);
    return el;
  }
  const $print = {
    log(...args) {
      console.log.apply(console, [...args]);
    },
    error(...args) {
      console.error.apply(console, [...args]);
    },
    debug(...args) {
      console.debug.apply(console, [...args]);
    },
  };
  const toInt = (x) => {
    const t = Number(x);
    return isNaN(t) ? 0 : Math.floor(t);
  };
  function $after(el, target) {
    el.parentNode.insertBefore(target, el.nextSibling);
  }
  function $parents(el) {
    let cur = el;
    const collection = [];
    while (cur.parentElement) {
      collection.push(cur.parentElement);
      cur = cur.parentElement;
    }
    return collection;
  }
  function toFormUrlencoded(o) {
    return Object.entries(o)
      .map(p => p.map(encodeURIComponent).join('='))
      .join('&');
  }
  class Pixiv {
    constructor() {
      this._tt = null;
    }
    get tt() {
      if (this._tt) {
        return this._tt;
      }
      const inputTT = $('input[name="tt"]');
      if (inputTT) {
        this._tt = inputTT.value;
      } else if (window.pixiv) {
        this._tt = window.pixiv.context.token;
      } else if (window.globalInitData) {
        this._tt = window.globalInitData.token;
      } else {
        $print.error('Pixiv#tt getter');
      }
      return this._tt;
    }
    async fetch(url, options = {}) {
      const opt = Object.assign({ credentials: 'same-origin' }, options);
      try {
        if (url) {
          const a = $el('a', { href: url });
          const resp = await fetch(a.href, opt);
          if (!resp.ok) {
            throw new Error(`${resp.status} ${resp.statusText}`);
          }
          return resp;
        } else {
          $print.error('Pixiv#fetch without url');
        }
      } catch (error) {
        $print.error('Pixiv#fetch: error:', error);
      }
    }
    async fetchJSON(url, options = {}) {
      try {
        const resp = await this.fetch(url, options);
        const data = await resp.json();
        const properties = Object.keys(data);
        if (properties.includes('error') && properties.includes('body')) {
          if (data.error) {
            $print.error('Pixiv#fetchJSON: JSON has error:', data.message);
            return null;
          } else {
            return data.body;
          }
        } else {
          return data;
        }
      } catch (error) {
        $print.error('Pixiv#fetchJSON: error:', error);
      }
    }
    async fetchHTML(url, options = {}) {
      try {
        const resp = await this.fetch(url, options);
        const data = await resp.text();
        return data;
      } catch (error) {
        $print.error('Pixiv#fetchHTML: error:', error);
      }
    }
    rpcCall(mode, params = {}) {
      return this.fetchJSON('/rpc/index.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: toFormUrlencoded({ ...params, mode, tt: this.tt }),
      });
    }
    async getIllustData(illustId) {
      const url = `/ajax/illust/${illustId}`;
      const data = await this.fetchJSON(url);
      return data;
    }
    async getIllustBookmarkData(illustId) {
      const url = `/ajax/illust/${illustId}/bookmarkData`;
      const data = await this.fetchJSON(url);
      return data;
    }
    async getIllustDataGroup(illustIds) {
      const uniqIllustIds = [...new Set(illustIds)];
      const illustDataGroup = await Promise.all(uniqIllustIds.map(id => this.getIllustData(id)));
      return illustDataGroup
        .filter(Boolean)
        .reduce((collect, d) => {
          collect[d.illustId] = d;
          return collect;
        }, {});
    }
    async getUserData(userId) {
      const url = `/ajax/user/${userId}`;
      const data = await this.fetchJSON(url);
      return data;
    }
    async getUserDataGroup(userIds) {
      const uniqUserIds = [...new Set(userIds)];
      const userDataGroup = await Promise.all(uniqUserIds.map(id => this.getUserData(id)));
      return userDataGroup
        .filter(Boolean)
        .reduce((collect, d) => {
          collect[d.userId] = d;
          return collect;
        }, {});
    }
    async getIllustUgoiraMetaData(illustId) {
      const url = `/ajax/illust/${illustId}/ugoira_meta`;
      const data = await this.fetchJSON(url);
      return data;
    }
    async getIllustIdsInLegacyPageHTML(url) {
      try {
        const html = await this.fetchHTML(url);
        const nextTag = html.match(/class="next"[^/]*/);
        let nextUrl = '';
        if (nextTag) {
          const nextHref = nextTag[0].match(/href="([^"]+)"/);
          if (nextHref) {
            const query = nextHref[1].replace(/&amp;/g, '&');
            if (query) {
              nextUrl = `${location.pathname}${query}`;
            }
          }
        }
        const iidHTMLs = html.match(/;illust_id=\d+"\s*class="work/g) || [];
        const illustIds = [];
        for (const dataid of iidHTMLs) {
          const iid = dataid.replace(/\D+(\d+).*/, '$1');
          if (!illustIds.includes(iid) && iid !== '0') {
            illustIds.push(iid);
          }
        }
        const ret = {
          nextUrl,
          illustIds,
        };
        return ret;
      } catch (error) {
        $print.error('Pixiv#getIllustIdsInLegacyPageHTML: error:', error);
      }
    }
    async getIllustIdsInPageHTML(url) {
      try {
        const html = await this.fetchHTML(url);
        const nextTag = html.match(/class="next"[^/]*/);
        let nextUrl = '';
        if (nextTag) {
          const nextHref = nextTag[0].match(/href="([^"]+)"/);
          if (nextHref) {
            const query = nextHref[1].replace(/&amp;/g, '&');
            if (query) {
              nextUrl = `${location.pathname}${query}`;
            }
          }
        }
        const iidHTMLs = html.match(/illustId&quot;:&quot;(\d+)&quot;/g) || [];
        const illustIds = [];
        for (const dataid of iidHTMLs) {
          const iid = dataid.replace(/\D+(\d+).*/, '$1');
          if (!illustIds.includes(iid) && iid !== '0') {
            illustIds.push(iid);
          }
        }
        const ret = {
          nextUrl,
          illustIds,
        };
        return ret;
      } catch (error) {
        $print.error('Pixiv#getIllustIdsInPageHTML: error:', error);
      }
    }
    async postIllustLike(illustId) {
      const url = '/ajax/illusts/like';
      const data = await this.fetchJSON(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': this.tt,
        },
        body: JSON.stringify({
          illust_id: illustId,
        }),
      });
      return Boolean(data);
    }
    async postFollowUser(userId) {
      const url = '/bookmark_add.php';
      const searchParams = {
        mode: 'add',
        user_id: userId,
        format: 'json',
        type: 'user',
        restrict: 0,
        tt: this.tt,
      };
      const data = await this.fetchJSON(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: toFormUrlencoded(searchParams),
      });
      return Boolean(data);
    }
    async postRPCAddBookmark(illustId) {
      const searchParams = {
        illust_id: illustId,
        restrict: 0,
        comment: '',
        tags: '',
      };
      await this.rpcCall('save_illust_bookmark', searchParams);
      return true;
    }
    async postRPCDeleteBookmark(bookmarkId) {
      const searchParams = { bookmark_id: bookmarkId };
      await this.rpcCall('delete_illust_bookmark', searchParams);
      return true;
    }
  }
  function removeAnnoyings(doc = document) {
    const annoyings = [
      'iframe',
      '.ad',
      '.ads_area',
      '.ad-footer',
      '.ads_anchor',
      '.ads-top-info',
      '.comic-hot-works',
      '.user-ad-container',
      '.ads_area_no_margin',
      '.hover-item',
      '.ad-printservice',
      '.bookmark-ranges',
      '.require-premium',
      '.showcase-reminder',
      '.sample-user-search',
      '.popular-introduction',
      '._premium-lead-tag-search-bar',
      '._premium-lead-popular-d-body',
      '._premium-lead-promotion-banner',
    ];
    for (const selector of annoyings) {
      for (const el of $$find(doc, selector)) {
        el.remove();
      }
    }
  }
  const PixivAPI = new Pixiv();
  function makeNewTag(tag) {
    if (tag.translation) {
      const trs = Object.values(tag.translation);
      return [tag.tag, ...trs].filter(Boolean).join(', ');
    }
    return [tag.tag, tag.romaji].filter(Boolean).join(', ');
  }
  function makeLibraryData({ pageType, illustDataGroup, userDataGroup }) {
    if (!illustDataGroup || !Object.keys(illustDataGroup).length) {
      throw new Error('makeLibraryData: illustDataGroup is falsy.');
    }
    const vLibrary = [];
    for (const [illustId, illustData] of Object.entries(illustDataGroup)) {
      const allTags = illustData.tags.tags.map(makeNewTag).join(', ');
      const d = {
        illustId,
        bookmarkCount: illustData.bookmarkCount,
        tags: allTags,
        illustTitle: illustData.illustTitle,
        illustPageCount: toInt(illustData.pageCount),
        userId: illustData.userId,
        userName: illustData.userName,
        isFollowed: userDataGroup[illustData.userId].isFollowed,
        isBookmarked: Boolean(illustData.bookmarkData),
        isUgoira: illustData.illustType === 2,
        profileImg: userDataGroup[illustData.userId].image,
        urls: {
          original: illustData.urls.original,
          thumb: illustData.urls.thumb,
        },
        _show: true,
      };
      if (pageType === 'MY_BOOKMARK') {
        d.bookmarkId = illustData.bookmarkData.id;
      }
      vLibrary.push(d);
    }
    return vLibrary;
  }
  var pixiv = {
    state: {
      imgLibrary: [],
      isPaused: true,
      isEnded: false,
      nextUrl: location.href,
    },
    mutations: {
      pause(state) {
        state.isPaused = true;
      },
      stop(state) {
        state.isPaused = true;
        state.isEnded = true;
      },
      editImgItem(state, options = {}) {
        const DEFAULT_OPT = {
          type: null,
          illustId: '',
          userId: '',
        };
        const opt = Object.assign({}, DEFAULT_OPT, options);
        if (opt.type === 'follow-user' && opt.userId) {
          state.imgLibrary
            .filter(i => i.userId === opt.userId)
            .forEach(i => {
              i.isFollowed = true;
            });
        }
      },
    },
    actions: {
      async start({ state, dispatch, rootState }, { times } = {}) {
        times = times || Infinity;
        if (state.isEnded || times <= 0) {
          return;
        }
        switch (rootState.pageType) {
        case 'SEARCH':
        case 'NEW_ILLUST':
        case 'MY_BOOKMARK':
        case 'MEMBER_ILLIST':
        case 'MEMBER_BOOKMARK':
        case 'ANCIENT_NEW_ILLUST':
          await dispatch('startNextUrlBased', { times });
          break;
        default:
          break;
        }
      },
      async startNextUrlBased({ state, commit, rootState }, { times } = {}) {
        state.isPaused = false;
        while (!state.isPaused && !state.isEnded && times) {
          let page = null;
          if (['SEARCH', 'NEW_ILLUST'].includes(rootState.pageType)) {
            page = await PixivAPI.getIllustIdsInPageHTML(state.nextUrl);
          } else {
            page = await PixivAPI.getIllustIdsInLegacyPageHTML(state.nextUrl);
          }
          state.nextUrl = page.nextUrl;
          const illustDataGroup = await PixivAPI.getIllustDataGroup(page.illustIds);
          const userIds = Object.values(illustDataGroup).map(d => d.userId);
          const userDataGroup = await PixivAPI.getUserDataGroup(userIds);
          const libraryData = makeLibraryData({
            pageType: rootState.pageType,
            illustDataGroup,
            userDataGroup,
          });
          for (const d of libraryData) {
            if (!state.imgLibrary.find(x => x.illustId === d.illustId)) {
              state.imgLibrary.push(d);
            }
          }
          times -= 1;
          if (!times) {
            commit('pause');
          }
          if (!state.nextUrl) {
            commit('stop');
          }
        }
      },
    },
    getters: {
      filteredLibrary(state, getters, rootState) {
        const cloneLibrary = state.imgLibrary.slice();
        const dateOrder = (new URLSearchParams(location.href)).get('order') === 'date';
        const imgToShow = (el) => {
          return el.bookmarkCount >= rootState.filters.limit &&
            el.tags.match(rootState.filters.tag) &&
            !rootState.config.blacklist.includes(el.userId);
        };
        return cloneLibrary
          .map(el => {
            el._show = imgToShow(el);
            return el;
          })
          .sort((a, b) => {
            const av = toInt(a[getters.orderBy]);
            const bv = toInt(b[getters.orderBy]);
            const c = bv - av;
            return dateOrder && getters.orderBy === 'illustId' ? -c : c;
          });
      },
    },
  };
  var contextMenu = {
    state: {
      active: false,
      position: { x: -1e7, y: -1e7 },
      data: null,
    },
    mutations: {
      activateContextMenu(state, payload) {
        state.active = true;
        state.position = payload.position;
        state.data = payload.data;
      },
      deactivateContextMenu(state) {
        state.active = false;
        state.position = { x: -1e7, y: -1e7 };
      },
    },
  };
  var bigComponent = {
    state: {
      mode: null,
      data: null,
    },
    mutations: {
      openBigComponent(state, payload) {
        Object.assign(state, payload);
      },
      closeBigComponent(state) {
        state.mode = null;
      },
    },
  };
  Vue.use(Vuex);
  const pageType = (() => {
    const path = location.pathname;
    const searchParam = new URLSearchParams(location.search);
    const spId = searchParam.get('id');
    const spType = searchParam.get('type');
    switch (path) {
    case '/search.php':
      return 'SEARCH';
    case '/bookmark_new_illust_r18.php':
    case '/bookmark_new_illust.php':
      return 'NEW_ILLUST';
    case '/new_illust.php':
    case '/mypixiv_new_illust.php':
    case '/new_illust_r18.php':
      return 'ANCIENT_NEW_ILLUST';
    case '/member_illust.php':
      return spId ? 'MEMBER_ILLIST' : 'NO_SUPPORT';
    case '/bookmark.php': {
      if (spId && spType !== 'user') {
        return 'MEMBER_BOOKMARK';
      } else if (!spType || spType === 'illust_all') {
        return 'MY_BOOKMARK';
      } else {
        return 'NO_SUPPORT';
      }
    }
    default:
      return 'NO_SUPPORT';
    }
  })();
  var store = new Vuex.Store({
    modules: { pixiv, contextMenu, bigComponent },
    state: {
      locale: document.documentElement.lang,
      pageType,
      koakumaMountPoint: null,
      patchouliMountPoint: null,
      bigComponentMountPoint: null,
      VERSION: GM_info.script.version,
      NAME: GM_info.script.name,
      filters: {
        limit: 0,
        tag: new RegExp('', 'i'),
      },
      config: {
        fitwidth: 1,
        sort: 0,
        contextMenu: 1,
        userTooltip: 1,
        blacklist: [],
        hoverPlay: 1,
      },
    },
    mutations: {
      prepareMountPoint(state) {
        if (pageType !== 'NO_SUPPORT') {
          $('#wrapper').classList.add('ω');
          state.koakumaMountPoint = $el('div', { className: 'koakumaMountPoint' }, (el) => {
            $after($('header._global-header'), el);
          });
          if (pageType === 'SEARCH') {
            state.patchouliMountPoint = $('#js-react-search-mid');
          } else if (pageType === 'NEW_ILLUST') {
            state.patchouliMountPoint = $('#js-mount-point-latest-following');
          } else {
            const li = $('li.image-item');
            const ul = $('ul._image-items');
            state.patchouliMountPoint = li ? li.parentElement : ul;
          }
          state.bigComponentMountPoint = $el('div', null, (el) => {
            document.body.appendChild(el);
          });
        }
      },
      applyConfig(state) {
        if (state.pageType !== 'NO_SUPPORT') {
          if (state.config.fitwidth) {
            $('.ω').classList.add('↔');
          } else {
            $('.ω').classList.remove('↔');
          }
          if (state.pageType === 'MY_BOOKMARK') {
            for (const marker of $$('.js-legacy-mark-all, .js-legacy-unmark-all')) {
              marker.addEventListener('click', () => {
                $$('input[name="book_id[]"]').forEach(el => {
                  el.checked = marker.classList.contains('js-legacy-mark-all');
                });
              });
            }
          }
        }
      },
      saveConfig(state) {
        const storable = JSON.stringify(state.config);
        localStorage.setItem(state.NAME, storable);
      },
      loadConfig(state) {
        const config = JSON.parse(localStorage.getItem(state.NAME) || '{}');
        Object.assign(state.config, config);
      },
    },
    getters: {
      orderBy(state) {
        if (state.config.sort) {
          return 'bookmarkCount';
        } else {
          return 'illustId';
        }
      },
    },
  });
  var script = {
    data() {
      return {
        debounceId4sortInput: null,
        debounceId4tagsFilter: null,
        usualSwitchOn: false,
        sortingOrderSwitchOn: false,
        usualList: [100, 500, 1000, 3000, 5000, 10000],
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
          go: this.status.isPaused && !this.status.isEnded,
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
            const ps = ml - s.length;
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
      },
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
          this.filters.limit = toInt(event.target.value) + 20;
        } else {
          this.filters.limit = Math.max(0, toInt(event.target.value) - 20);
        }
      },
      sortInputInput(event) {
        if (this.debounceId4sortInput) {
          clearTimeout(this.debounceId4sortInput);
        }
        this.debounceId4sortInput = setTimeout(() => {
          this.debounceId4sortInput = null;
          this.filters.limit = Math.max(0, toInt(event.target.value));
        }, 500);
      },
      optionsChange(event) {
        if (event.target.id === "koakuma-options-width-compress") {
          this.config.fitwidth = false;
        } else if (event.target.id === "koakuma-options-width-expand") {
          this.config.fitwidth = true;
        }
        this.$store.commit("saveConfig");
        this.$store.commit("applyConfig");
      },
      tagsFilterInput(event) {
        if (this.debounceId4tagsFilter) {
          clearTimeout(this.debounceId4tagsFilter);
        }
        this.debounceId4tagsFilter = setTimeout(() => {
          this.debounceId4tagsFilter = null;
          this.filters.tag = new RegExp(event.target.value, "ig");
        }, 1500);
      },
      clickSortingOrder(event) {
        if (event.target.id === "koakuma-sorting-order-by-popularity") {
          this.config.sort = 1;
        } else {
          this.config.sort = 0;
        }
        this.$store.commit("saveConfig");
        this.$store.commit("applyConfig");
        this.sortingOrderSwitchOn = false;
      },
      openBigComponentInConfigMode() {
        this.$store.commit("openBigComponent", { mode: "config", data: null });
      },
    },
  };
  const __vue_script__ = script;
  var __vue_render__ = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c("div", { attrs: { id: "koakuma" } }, [
      _c("div", { staticClass: "processed" }, [
        _vm._v(
          _vm._s(
            _vm.$t("koakuma.processed", {
              count: _vm.$store.state.pixiv.imgLibrary.length
            })
          )
        )
      ]),
      _vm._v(" "),
      _c("div", { attrs: { id: "koakuma-bookmark-sort-block" } }, [
        _c(
          "label",
          {
            staticClass: "bookmark-count",
            attrs: { for: "koakuma-bookmark-sort-input" }
          },
          [
            _c("i", { staticClass: "_icon _bookmark-icon-inline" }),
            _vm._v(" "),
            _c("input", {
              attrs: {
                id: "koakuma-bookmark-sort-input",
                type: "number",
                min: "0",
                step: "1"
              },
              domProps: { value: _vm.filters.limit },
              on: {
                wheel: function($event) {
                  $event.stopPropagation();
                  $event.preventDefault();
                  return _vm.sortInputWheel($event)
                },
                input: _vm.sortInputInput
              }
            })
          ]
        ),
        _vm._v(" "),
        _c(
          "a",
          {
            attrs: { id: "koakuma-bookmark-input-usual-switch", role: "button" },
            on: {
              click: function($event) {
                if (
                  !("button" in $event) &&
                  _vm._k($event.keyCode, "left", 37, $event.key, [
                    "Left",
                    "ArrowLeft"
                  ])
                ) {
                  return null
                }
                if ("button" in $event && $event.button !== 0) {
                  return null
                }
                _vm.usualSwitchOn = !_vm.usualSwitchOn;
              }
            }
          },
          [_c("i", { staticClass: "fas fa-angle-down" })]
        ),
        _vm._v(" "),
        _c(
          "ul",
          {
            directives: [
              {
                name: "show",
                rawName: "v-show",
                value: _vm.usualSwitchOn,
                expression: "usualSwitchOn"
              }
            ],
            attrs: { id: "koakuma-bookmark-input-usual-list" }
          },
          _vm._l(_vm.usualList, function(usual) {
            return _c("li", { key: usual }, [
              _c(
                "a",
                {
                  staticClass: "usual-list-link",
                  attrs: { role: "button" },
                  on: {
                    click: function($event) {
                      if (
                        !("button" in $event) &&
                        _vm._k($event.keyCode, "left", 37, $event.key, [
                          "Left",
                          "ArrowLeft"
                        ])
                      ) {
                        return null
                      }
                      if ("button" in $event && $event.button !== 0) {
                        return null
                      }
                      _vm.filters.limit = usual;
                      _vm.usualSwitchOn = false;
                    }
                  }
                },
                [_vm._v(_vm._s(usual))]
              )
            ])
          })
        )
      ]),
      _vm._v(" "),
      _c("div", [
        _c("input", {
          attrs: {
            id: "koakuma-bookmark-tags-filter-input",
            placeholder: _vm.$t("koakuma.tagsPlaceholder"),
            type: "text"
          },
          on: { input: _vm.tagsFilterInput }
        })
      ]),
      _vm._v(" "),
      _c("div", [
        _c(
          "button",
          {
            class: _vm.statusClass,
            attrs: { id: "koakuma-main-button", disabled: _vm.status.isEnded },
            on: { mouseup: _vm.clickMainButton }
          },
          [_vm._v("\n      " + _vm._s(_vm.buttonMsg) + "\n    ")]
        )
      ]),
      _vm._v(" "),
      _c("div", { attrs: { id: "koakuma-sorting-order-block" } }, [
        _c(
          "a",
          {
            attrs: { id: "koakuma-sorting-order-select-switch", role: "button" },
            on: {
              click: function($event) {
                if (
                  !("button" in $event) &&
                  _vm._k($event.keyCode, "left", 37, $event.key, [
                    "Left",
                    "ArrowLeft"
                  ])
                ) {
                  return null
                }
                if ("button" in $event && $event.button !== 0) {
                  return null
                }
                _vm.sortingOrderSwitchOn = !_vm.sortingOrderSwitchOn;
              }
            }
          },
          [
            _c("output", {
              attrs: { id: "koakuma-sorting-order-select-output" },
              domProps: { innerHTML: _vm._s(_vm.sortingOrderMsg) }
            }),
            _vm._v(" "),
            _c("i", { staticClass: "fas fa-angle-down" })
          ]
        ),
        _vm._v(" "),
        _c(
          "ul",
          {
            directives: [
              {
                name: "show",
                rawName: "v-show",
                value: _vm.sortingOrderSwitchOn,
                expression: "sortingOrderSwitchOn"
              }
            ],
            attrs: { id: "koakuma-sorting-order-select-list" }
          },
          [
            _c("li", [
              _c(
                "a",
                {
                  staticClass: "sorting-order-link",
                  attrs: {
                    id: "koakuma-sorting-order-by-popularity",
                    role: "button"
                  },
                  on: {
                    click: function($event) {
                      if (
                        !("button" in $event) &&
                        _vm._k($event.keyCode, "left", 37, $event.key, [
                          "Left",
                          "ArrowLeft"
                        ])
                      ) {
                        return null
                      }
                      if ("button" in $event && $event.button !== 0) {
                        return null
                      }
                      return _vm.clickSortingOrder($event)
                    }
                  }
                },
                [_vm._v(_vm._s(_vm.$t("koakuma.sortByPopularity")))]
              )
            ]),
            _vm._v(" "),
            _c("li", [
              _c(
                "a",
                {
                  staticClass: "sorting-order-link",
                  attrs: { id: "koakuma-sorting-order-by-date", role: "button" },
                  on: {
                    click: function($event) {
                      if (
                        !("button" in $event) &&
                        _vm._k($event.keyCode, "left", 37, $event.key, [
                          "Left",
                          "ArrowLeft"
                        ])
                      ) {
                        return null
                      }
                      if ("button" in $event && $event.button !== 0) {
                        return null
                      }
                      return _vm.clickSortingOrder($event)
                    }
                  }
                },
                [_vm._v(_vm._s(_vm.$t("koakuma.sortByDate")))]
              )
            ])
          ]
        )
      ]),
      _vm._v(" "),
      _c("div", { attrs: { id: "koakuma-options-block" } }, [
        _c("div", [
          _c("i", {
            directives: [
              {
                name: "show",
                rawName: "v-show",
                value: _vm.config.fitwidth,
                expression: "config.fitwidth"
              }
            ],
            staticClass: "fas fa-compress",
            attrs: { id: "koakuma-options-width-compress" },
            on: {
              click: function($event) {
                if (
                  !("button" in $event) &&
                  _vm._k($event.keyCode, "left", 37, $event.key, [
                    "Left",
                    "ArrowLeft"
                  ])
                ) {
                  return null
                }
                if ("button" in $event && $event.button !== 0) {
                  return null
                }
                return _vm.optionsChange($event)
              }
            }
          }),
          _vm._v(" "),
          _c("i", {
            directives: [
              {
                name: "show",
                rawName: "v-show",
                value: !_vm.config.fitwidth,
                expression: "!config.fitwidth"
              }
            ],
            staticClass: "fas fa-expand",
            attrs: { id: "koakuma-options-width-expand" },
            on: {
              click: function($event) {
                if (
                  !("button" in $event) &&
                  _vm._k($event.keyCode, "left", 37, $event.key, [
                    "Left",
                    "ArrowLeft"
                  ])
                ) {
                  return null
                }
                if ("button" in $event && $event.button !== 0) {
                  return null
                }
                return _vm.optionsChange($event)
              }
            }
          })
        ]),
        _vm._v(" "),
        _c("div", [
          _c("i", {
            staticClass: "fas fa-cog",
            attrs: { id: "koakuma-options-config" },
            on: {
              click: function($event) {
                if (
                  !("button" in $event) &&
                  _vm._k($event.keyCode, "left", 37, $event.key, [
                    "Left",
                    "ArrowLeft"
                  ])
                ) {
                  return null
                }
                if ("button" in $event && $event.button !== 0) {
                  return null
                }
                return _vm.openBigComponentInConfigMode($event)
              }
            }
          })
        ])
      ])
    ])
  };
  var __vue_staticRenderFns__ = [];
  __vue_render__._withStripped = true;
  const __vue_template__ = typeof __vue_render__ !== 'undefined'
    ? { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ }
    : {};
  const __vue_inject_styles__ = function (inject) {
    if (!inject) return
    inject("data-v-f506966c_0", { source: "\n@keyframes slidedown-data-v-f506966c {\nfrom {\n    transform: translateY(-100%);\n}\nto {\n    transform: translateY(0);\n}\n}\na[role=\"button\"][data-v-f506966c] {\n  text-decoration: none;\n}\na[role=\"button\"] > .fa-angle-down[data-v-f506966c] {\n  padding: 2px;\n}\n#koakuma[data-v-f506966c] {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  position: sticky;\n  top: 0;\n  z-index: 3;\n  background-color: #e5e4ff;\n  box-shadow: 0 2px 2px #777;\n  padding: 4px;\n  color: #00186c;\n  font-size: 16px;\n  animation: slidedown-data-v-f506966c 0.7s linear;\n}\n#koakuma > div[data-v-f506966c] {\n  margin: 0 10px;\n  display: inline-flex;\n}\n.bookmark-count[data-v-f506966c] {\n  display: inline-flex !important;\n  align-items: center;\n  margin-right: 0;\n  border-radius: 3px 0 0 3px;\n}\n#koakuma-bookmark-sort-block[data-v-f506966c],\n#koakuma-sorting-order-block[data-v-f506966c] {\n  position: relative;\n  height: 20px;\n  box-shadow: 0 0 1px #069;\n  border-radius: 4px;\n}\n#koakuma-sorting-order-block[data-v-f506966c] {\n  background-color: #cef;\n}\n#koakuma-bookmark-sort-input[data-v-f506966c] {\n  -moz-appearance: textfield;\n  border: none;\n  background-color: transparent;\n  padding: 0;\n  color: inherit;\n  font-size: 16px;\n  display: inline-block;\n  cursor: ns-resize;\n  text-align: center;\n  max-width: 50px;\n}\n#koakuma-bookmark-sort-input[data-v-f506966c]::-webkit-inner-spin-button,\n#koakuma-bookmark-sort-input[data-v-f506966c]::-webkit-outer-spin-button {\n  /* https://css-tricks.com/numeric-inputs-a-comparison-of-browser-defaults/ */\n  -webkit-appearance: none;\n  margin: 0;\n}\n#koakuma-bookmark-tags-filter-input[data-v-f506966c] {\n  min-width: 300px;\n}\n#koakuma-bookmark-input-usual-switch[data-v-f506966c],\n#koakuma-sorting-order-select-switch[data-v-f506966c] {\n  background-color: #cef;\n  padding: 1px;\n  border-left: 1px solid #888;\n  border-radius: 0 3px 3px 0;\n  cursor: pointer;\n  display: inline-flex;\n  align-items: center;\n}\n#koakuma-sorting-order-select-switch[data-v-f506966c] {\n  border: none;\n  border-radius: 3px;\n}\n#koakuma-bookmark-input-usual-list[data-v-f506966c],\n#koakuma-sorting-order-select-list[data-v-f506966c] {\n  border-radius: 3px;\n  background-color: #cef;\n  box-shadow: 0 0 2px #069;\n  position: absolute;\n  top: 100%;\n  width: 100%;\n  margin-top: 1px;\n}\n#koakuma-bookmark-input-usual-list > li[data-v-f506966c]::after,\n#koakuma-sorting-order-select-list > li[data-v-f506966c]::after {\n  content: \"\";\n  box-shadow: 0 0 0 1px #89d8ff;\n  display: inline-block;\n  margin: 0;\n  height: 0;\n  line-height: 0;\n  font-size: 0;\n  position: absolute;\n  width: 100%;\n  transform: scaleX(0.8);\n}\n#koakuma-bookmark-input-usual-list > li[data-v-f506966c]:last-child::after,\n#koakuma-sorting-order-select-list > li[data-v-f506966c]:last-child::after {\n  box-shadow: none;\n}\n.usual-list-link[data-v-f506966c]:hover::before,\n.sorting-order-link[data-v-f506966c]:hover::before {\n  content: \"⮬\";\n  position: absolute;\n  left: 6px;\n  font-weight: bolder;\n}\n.usual-list-link[data-v-f506966c],\n.sorting-order-link[data-v-f506966c] {\n  display: block;\n  cursor: pointer;\n  text-align: center;\n}\n#koakuma-sorting-order-select-output[data-v-f506966c] {\n  padding: 0 16px;\n  display: flex;\n  align-items: center;\n}\n#koakuma-sorting-order-select[data-v-f506966c] {\n  font-size: 14px;\n}\n#koakuma-options-block > *[data-v-f506966c] {\n  margin: 0 5px;\n}\n#koakuma-main-button[data-v-f506966c] {\n  border: none;\n  padding: 2px 14px;\n  border-radius: 3px;\n  font-size: 16px;\n}\n#koakuma-main-button[data-v-f506966c]:enabled {\n  transform: translate(-1px, -1px);\n  box-shadow: 1px 1px 1px hsl(60, 0%, 30%);\n  cursor: pointer;\n}\n#koakuma-main-button[data-v-f506966c]:enabled:hover {\n  transform: translate(0);\n  box-shadow: none;\n}\n#koakuma-main-button[data-v-f506966c]:enabled:active {\n  transform: translate(1px, 1px);\n  box-shadow: -1px -1px 1px hsl(60, 0%, 30%);\n}\n#koakuma-main-button.go[data-v-f506966c] {\n  background-color: hsl(141, 100%, 50%);\n}\n#koakuma-main-button.paused[data-v-f506966c] {\n  background-color: hsl(60, 100%, 50%);\n}\n#koakuma-main-button.end[data-v-f506966c] {\n  background-color: #878787;\n  color: #fff;\n  opacity: 0.87;\n}\n#koakuma-options-width-compress[data-v-f506966c],\n#koakuma-options-width-expand[data-v-f506966c],\n#koakuma-options-config[data-v-f506966c] {\n  cursor: pointer;\n}\n", map: undefined, media: undefined });
  };
  const __vue_scope_id__ = "data-v-f506966c";
  const __vue_module_identifier__ = undefined;
  const __vue_is_functional_template__ = false;
  function __vue_normalize__(
    template, style, script$$1,
    scope, functional, moduleIdentifier,
    createInjector, createInjectorSSR
  ) {
    const component = (typeof script$$1 === 'function' ? script$$1.options : script$$1) || {};
    {
      component.__file = "/home/flandre/dev/Patchouli/src/components/Koakuma.vue";
    }
    if (!component.render) {
      component.render = template.render;
      component.staticRenderFns = template.staticRenderFns;
      component._compiled = true;
      if (functional) component.functional = true;
    }
    component._scopeId = scope;
    {
      let hook;
      if (style) {
        hook = function(context) {
          style.call(this, createInjector(context));
        };
      }
      if (hook !== undefined) {
        if (component.functional) {
          const originalRender = component.render;
          component.render = function renderWithStyleInjection(h, context) {
            hook.call(context);
            return originalRender(h, context)
          };
        } else {
          const existing = component.beforeCreate;
          component.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
      }
    }
    return component
  }
  function __vue_create_injector__() {
    const head = document.head || document.getElementsByTagName('head')[0];
    const styles = __vue_create_injector__.styles || (__vue_create_injector__.styles = {});
    const isOldIE =
      typeof navigator !== 'undefined' &&
      /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
    return function addStyle(id, css) {
      if (document.querySelector('style[data-vue-ssr-id~="' + id + '"]')) return
      const group = isOldIE ? css.media || 'default' : id;
      const style = styles[group] || (styles[group] = { ids: [], parts: [], element: undefined });
      if (!style.ids.includes(id)) {
        let code = css.source;
        let index = style.ids.length;
        style.ids.push(id);
        if (isOldIE) {
          style.element = style.element || document.querySelector('style[data-group=' + group + ']');
        }
        if (!style.element) {
          const el = style.element = document.createElement('style');
          el.type = 'text/css';
          if (css.media) el.setAttribute('media', css.media);
          if (isOldIE) {
            el.setAttribute('data-group', group);
            el.setAttribute('data-next-index', '0');
          }
          head.appendChild(el);
        }
        if (isOldIE) {
          index = parseInt(style.element.getAttribute('data-next-index'));
          style.element.setAttribute('data-next-index', index + 1);
        }
        if (style.element.styleSheet) {
          style.parts.push(code);
          style.element.styleSheet.cssText = style.parts
            .filter(Boolean)
            .join('\n');
        } else {
          const textNode = document.createTextNode(code);
          const nodes = style.element.childNodes;
          if (nodes[index]) style.element.removeChild(nodes[index]);
          if (nodes.length) style.element.insertBefore(textNode, nodes[index]);
          else style.element.appendChild(textNode);
        }
      }
    }
  }
  var koakuma = __vue_normalize__(
    __vue_template__,
    __vue_inject_styles__,
    typeof __vue_script__ === 'undefined' ? {} : __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    typeof __vue_create_injector__ !== 'undefined' ? __vue_create_injector__ : function () {},
    typeof __vue_create_injector_ssr__ !== 'undefined' ? __vue_create_injector_ssr__ : function () {}
  );
  var script$1 = {
    props: {
      imgUrl: {
        type: String,
        default: "",
      },
      illustId: {
        type: String,
        default: "",
      },
      illustPageCount: {
        type: Number,
        default: 1,
      },
      isUgoira: {
        type: Boolean,
        default: false,
      },
      isBookmarked: {
        type: Boolean,
        default: false,
      },
      bookmarkId: {
        type: String,
        default: "",
      },
    },
    data() {
      return {
        selfIsBookmarked: this.isBookmarked,
        ugoiraPlayed: false,
        ugoiraPlayer: null,
        ugoiraMeta: null,
      };
    },
    computed: {
      illustPageUrl() {
        return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;
      },
      canHoverPlay() {
        return this.$store.state.config.hoverPlay;
      },
    },
    mounted() {
      this.$nextTick(async() => {
        if (this.isUgoira && this.canHoverPlay) {
          this.ugoiraMeta = await PixivAPI.getIllustUgoiraMetaData(this.illustId);
        }
      });
    },
    methods: {
      async oneClickBookmarkAdd() {
        if (!this.selfIsBookmarked) {
          if (await PixivAPI.postRPCAddBookmark(this.illustId)) {
            this.selfIsBookmarked = true;
          }
        } else {
          let bookmarkId = this.bookmarkId;
          if (!bookmarkId) {
            const data = await PixivAPI.getIllustBookmarkData(this.illustId);
            bookmarkId = data.bookmarkData.id;
          }
          if (await PixivAPI.postRPCDeleteBookmark(bookmarkId)) {
            this.selfIsBookmarked = false;
          }
        }
      },
      activateContextMenu(event) {
        if (this.$store.state.config.contextMenu) {
          event.preventDefault();
          const payload = {};
          payload.position = {
            x: event.clientX,
            y: event.clientY,
          };
          payload.data = {
            illustId: this.illustId,
            type: "image-item-image",
          };
          this.$store.commit("activateContextMenu", payload);
        }
      },
      controlUgoira(event) {
        if (!this.ugoiraMeta) {
          return;
        }
        if (!this.ugoiraPlayer) {
          try {
            this.ugoiraPlayer = new ZipImagePlayer({
              canvas: this.$refs.smallUgoiraPreview,
              source: this.ugoiraMeta.src,
              metadata: this.ugoiraMeta,
              chunkSize: 300000,
              loop: true,
              autosize: true,
            });
          } catch (error) {
            $print.error(error);
          }
        }
        if (this.canHoverPlay) {
          if (event.type === "mouseenter") {
            this.ugoiraPlayed = true;
            this.ugoiraPlayer.play();
          } else {
            this.ugoiraPlayed = false;
            this.ugoiraPlayer.pause();
            this.ugoiraPlayer.rewind();
          }
        }
      },
    },
  };
  const __vue_script__$1 = script$1;
  var __vue_render__$1 = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c("div", { staticClass: "image-item-image" }, [
      _c(
        "a",
        {
          staticClass: "image-flexbox",
          attrs: { href: _vm.illustPageUrl, rel: "noopener" },
          on: {
            contextmenu: function($event) {
              return _vm.activateContextMenu($event)
            },
            mouseenter: _vm.controlUgoira,
            mouseleave: _vm.controlUgoira
          }
        },
        [
          _vm.illustPageCount > 1
            ? _c("div", { staticClass: "top-right-slot" }, [
                _c("span", [
                  _c("i", { staticClass: "far fa-images" }),
                  _vm._v("\n        " + _vm._s(_vm.illustPageCount))
                ])
              ])
            : _vm._e(),
          _vm._v(" "),
          _c("img", {
            directives: [
              {
                name: "show",
                rawName: "v-show",
                value: !_vm.ugoiraPlayed,
                expression: "!ugoiraPlayed"
              }
            ],
            attrs: { "data-src": _vm.imgUrl, src: _vm.imgUrl }
          }),
          _vm._v(" "),
          _vm.isUgoira
            ? _c("div", {
                directives: [
                  {
                    name: "show",
                    rawName: "v-show",
                    value: !_vm.ugoiraPlayed,
                    expression: "!ugoiraPlayed"
                  }
                ],
                staticClass: "ugoira-icon"
              })
            : _vm._e(),
          _vm._v(" "),
          _vm.isUgoira
            ? _c("canvas", {
                directives: [
                  {
                    name: "show",
                    rawName: "v-show",
                    value: _vm.ugoiraPlayed,
                    expression: "ugoiraPlayed"
                  }
                ],
                ref: "smallUgoiraPreview"
              })
            : _vm._e()
        ]
      ),
      _vm._v(" "),
      _c("div", {
        staticClass: "_one-click-bookmark",
        class: { on: _vm.selfIsBookmarked },
        attrs: { title: _vm.selfIsBookmarked },
        on: {
          click: function($event) {
            if (
              !("button" in $event) &&
              _vm._k($event.keyCode, "left", 37, $event.key, [
                "Left",
                "ArrowLeft"
              ])
            ) {
              return null
            }
            if ("button" in $event && $event.button !== 0) {
              return null
            }
            $event.preventDefault();
            $event.stopPropagation();
            return _vm.oneClickBookmarkAdd($event)
          }
        }
      }),
      _vm._v(" "),
      _vm.bookmarkId
        ? _c("div", { staticClass: "bookmark-input-container" }, [
            _c("input", {
              attrs: { type: "checkbox", name: "book_id[]" },
              domProps: { value: _vm.bookmarkId }
            })
          ])
        : _vm._e()
    ])
  };
  var __vue_staticRenderFns__$1 = [];
  __vue_render__$1._withStripped = true;
  const __vue_template__$1 = typeof __vue_render__$1 !== 'undefined'
    ? { render: __vue_render__$1, staticRenderFns: __vue_staticRenderFns__$1 }
    : {};
  const __vue_inject_styles__$1 = function (inject) {
    if (!inject) return
    inject("data-v-249ec48c_0", { source: "\n.image-item-image[data-v-249ec48c] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  position: relative;\n}\n.image-flexbox[data-v-249ec48c] {\n  display: flex;\n  flex-flow: column;\n  justify-content: center;\n  align-items: center;\n  z-index: 0;\n  border: 1px solid rgba(0, 0, 0, 0.04);\n  position: relative;\n  height: 200px;\n}\n.image-flexbox[data-v-249ec48c]:hover {\n  text-decoration: none;\n}\n.top-right-slot[data-v-249ec48c] {\n  flex: none;\n  display: flex;\n  align-items: center;\n  z-index: 1;\n  box-sizing: border-box;\n  margin: 0 0 -24px auto;\n  padding: 6px;\n  height: 24px;\n  background: #000;\n  background: rgba(0, 0, 0, 0.4);\n  border-radius: 0 0 0 4px;\n  color: #fff;\n  font-size: 12px;\n  line-height: 1;\n  font-weight: 700;\n}\n.ugoira-icon[data-v-249ec48c] {\n  position: absolute;\n  flex: none;\n  width: 40px;\n  height: 40px;\n  background: url(https://s.pximg.net/www/images/icon/playable-icon.svg) 50%\n    no-repeat;\n  top: 50%;\n  left: 50%;\n  margin: -20px 0 0 -20px;\n}\nimg[data-v-249ec48c],\ncanvas[data-v-249ec48c] {\n  max-height: 100%;\n  max-width: 100%;\n}\n._one-click-bookmark[data-v-249ec48c] {\n  right: 0;\n  width: 24px;\n  height: 24px;\n  line-height: 24px;\n  z-index: 2;\n  text-align: center;\n  cursor: pointer;\n  background: url(https://s.pximg.net/www/images/bookmark-heart-off.svg) center\n    transparent;\n  background-repeat: no-repeat;\n  background-size: cover;\n  opacity: 0.8;\n  filter: alpha(opacity=80);\n  transition: opacity 0.2s ease-in-out;\n}\n._one-click-bookmark.on[data-v-249ec48c] {\n  background-image: url(https://s.pximg.net/www/images/bookmark-heart-on.svg);\n}\n.bookmark-input-container[data-v-249ec48c] {\n  position: absolute;\n  left: 0;\n  top: 0;\n  background: rgba(0, 0, 0, 0.4);\n  padding: 6px;\n  border-radius: 0 0 4px 0;\n}\n", map: undefined, media: undefined });
  };
  const __vue_scope_id__$1 = "data-v-249ec48c";
  const __vue_module_identifier__$1 = undefined;
  const __vue_is_functional_template__$1 = false;
  function __vue_normalize__$1(
    template, style, script,
    scope, functional, moduleIdentifier,
    createInjector, createInjectorSSR
  ) {
    const component = (typeof script === 'function' ? script.options : script) || {};
    {
      component.__file = "/home/flandre/dev/Patchouli/src/components/DefaultImageItemImage.vue";
    }
    if (!component.render) {
      component.render = template.render;
      component.staticRenderFns = template.staticRenderFns;
      component._compiled = true;
      if (functional) component.functional = true;
    }
    component._scopeId = scope;
    {
      let hook;
      if (style) {
        hook = function(context) {
          style.call(this, createInjector(context));
        };
      }
      if (hook !== undefined) {
        if (component.functional) {
          const originalRender = component.render;
          component.render = function renderWithStyleInjection(h, context) {
            hook.call(context);
            return originalRender(h, context)
          };
        } else {
          const existing = component.beforeCreate;
          component.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
      }
    }
    return component
  }
  function __vue_create_injector__$1() {
    const head = document.head || document.getElementsByTagName('head')[0];
    const styles = __vue_create_injector__$1.styles || (__vue_create_injector__$1.styles = {});
    const isOldIE =
      typeof navigator !== 'undefined' &&
      /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
    return function addStyle(id, css) {
      if (document.querySelector('style[data-vue-ssr-id~="' + id + '"]')) return
      const group = isOldIE ? css.media || 'default' : id;
      const style = styles[group] || (styles[group] = { ids: [], parts: [], element: undefined });
      if (!style.ids.includes(id)) {
        let code = css.source;
        let index = style.ids.length;
        style.ids.push(id);
        if (isOldIE) {
          style.element = style.element || document.querySelector('style[data-group=' + group + ']');
        }
        if (!style.element) {
          const el = style.element = document.createElement('style');
          el.type = 'text/css';
          if (css.media) el.setAttribute('media', css.media);
          if (isOldIE) {
            el.setAttribute('data-group', group);
            el.setAttribute('data-next-index', '0');
          }
          head.appendChild(el);
        }
        if (isOldIE) {
          index = parseInt(style.element.getAttribute('data-next-index'));
          style.element.setAttribute('data-next-index', index + 1);
        }
        if (style.element.styleSheet) {
          style.parts.push(code);
          style.element.styleSheet.cssText = style.parts
            .filter(Boolean)
            .join('\n');
        } else {
          const textNode = document.createTextNode(code);
          const nodes = style.element.childNodes;
          if (nodes[index]) style.element.removeChild(nodes[index]);
          if (nodes.length) style.element.insertBefore(textNode, nodes[index]);
          else style.element.appendChild(textNode);
        }
      }
    }
  }
  var DefaultImageItemImage = __vue_normalize__$1(
    __vue_template__$1,
    __vue_inject_styles__$1,
    typeof __vue_script__$1 === 'undefined' ? {} : __vue_script__$1,
    __vue_scope_id__$1,
    __vue_is_functional_template__$1,
    __vue_module_identifier__$1,
    typeof __vue_create_injector__$1 !== 'undefined' ? __vue_create_injector__$1 : function () {},
    typeof __vue_create_injector_ssr__ !== 'undefined' ? __vue_create_injector_ssr__ : function () {}
  );
  var script$2 = {
    props: {
      illustId: {
        type: String,
        default: "",
      },
      illustTitle: {
        type: String,
        default: "",
      },
      userName: {
        type: String,
        default: "",
      },
      userId: {
        type: String,
        default: "",
      },
      profileImgUrl: {
        type: String,
        default: "",
      },
      bookmarkCount: {
        type: Number,
        default: 0,
      },
      isFollowed: {
        type: Boolean,
        default: false,
      },
    },
    computed: {
      illustPageUrl() {
        return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;
      },
      userPageUrl() {
        return `/member_illust.php?id=${this.userId}`;
      },
      bookmarkDetailUrl() {
        return `/bookmark_detail.php?illust_id=${this.illustId}`;
      },
      bookmarkTooltipMsg() {
        return this.$t("patchouli.bookmarkTooltip", {
          count: this.bookmarkCount,
        });
      },
      profileImgStyle() {
        return {
          backgroundImage: `url(${this.profileImgUrl})`,
        };
      },
      isMemberIllistPage() {
        return this.$store.state.pageType === "MEMBER_ILLIST";
      },
      isEnableUserTooltip() {
        return this.$store.state.config.userTooltip;
      },
    },
    methods: {
      activateContextMenu(event) {
        if (this.$store.state.config.contextMenu) {
          event.preventDefault();
          const payload = {};
          payload.position = {
            x: event.clientX,
            y: event.clientY,
          };
          const ct = event.currentTarget;
          if (ct.classList.contains("user-info")) {
            payload.data = {
              illustId: this.illustId,
              type: "image-item-title-user",
            };
          } else {
            payload.data = {
              illustId: this.illustId,
              type: "image-item-image",
            };
          }
          this.$store.commit("activateContextMenu", payload);
        }
      },
    },
  };
  const __vue_script__$2 = script$2;
  var __vue_render__$2 = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c("figcaption", { staticClass: "image-item-title-user" }, [
      _c("ul", [
        _c(
          "li",
          {
            staticClass: "title-text",
            on: {
              contextmenu: function($event) {
                return _vm.activateContextMenu($event)
              }
            }
          },
          [
            _c(
              "a",
              { attrs: { href: _vm.illustPageUrl, title: _vm.illustTitle } },
              [_vm._v(_vm._s(_vm.illustTitle))]
            )
          ]
        ),
        _vm._v(" "),
        !_vm.isMemberIllistPage
          ? _c(
              "li",
              {
                staticClass: "user-info",
                on: {
                  contextmenu: function($event) {
                    return _vm.activateContextMenu($event)
                  }
                }
              },
              [
                _c(
                  "a",
                  {
                    staticClass: "user-link",
                    class: _vm.isEnableUserTooltip ? "ui-profile-popup" : "",
                    attrs: {
                      href: _vm.userPageUrl,
                      title: _vm.userName,
                      "data-user_id": _vm.userId,
                      "data-user_name": _vm.userName,
                      target: "_blank"
                    }
                  },
                  [
                    _c("span", {
                      staticClass: "user-img",
                      style: _vm.profileImgStyle
                    }),
                    _vm._v(" "),
                    _c("span", [_vm._v(_vm._s(_vm.userName))])
                  ]
                ),
                _vm._v(" "),
                _vm.isFollowed ? _c("i", { staticClass: "fas fa-rss" }) : _vm._e()
              ]
            )
          : _vm._e(),
        _vm._v(" "),
        _vm.bookmarkCount > 0
          ? _c("li", [
              _c("ul", { staticClass: "count-list" }, [
                _c("li", [
                  _c(
                    "a",
                    {
                      staticClass: "_ui-tooltip bookmark-count",
                      attrs: {
                        href: _vm.bookmarkDetailUrl,
                        "data-tooltip": _vm.$t("patchouli.bookmarkTooltip", {
                          count: _vm.bookmarkCount
                        })
                      }
                    },
                    [
                      _c("i", { staticClass: "_icon _bookmark-icon-inline" }),
                      _vm._v(
                        "\n            " +
                          _vm._s(_vm.bookmarkCount) +
                          "\n          "
                      )
                    ]
                  )
                ])
              ])
            ])
          : _vm._e()
      ])
    ])
  };
  var __vue_staticRenderFns__$2 = [];
  __vue_render__$2._withStripped = true;
  const __vue_template__$2 = typeof __vue_render__$2 !== 'undefined'
    ? { render: __vue_render__$2, staticRenderFns: __vue_staticRenderFns__$2 }
    : {};
  const __vue_inject_styles__$2 = function (inject) {
    if (!inject) return
    inject("data-v-2bbfcc7c_0", { source: "\n.image-item-title-user[data-v-2bbfcc7c] {\n  max-width: 100%;\n  margin: 8px auto;\n  text-align: center;\n  color: #333;\n  font-size: 12px;\n  line-height: 1;\n}\n.title-text[data-v-2bbfcc7c] {\n  margin: 4px 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-weight: 700;\n}\n.user-info[data-v-2bbfcc7c] {\n  display: inline-flex;\n  align-items: center;\n}\n.user-link[data-v-2bbfcc7c] {\n  font-size: 12px;\n  display: inline-flex;\n  align-items: center;\n}\n.user-img[data-v-2bbfcc7c] {\n  width: 20px;\n  height: 20px;\n  display: inline-block;\n  background-size: cover;\n  border-radius: 50%;\n  margin-right: 4px;\n}\ni.fa-rss[data-v-2bbfcc7c] {\n  display: inline-block;\n  margin-left: 4px;\n  width: 16px;\n  height: 16px;\n  color: dodgerblue;\n}\n", map: undefined, media: undefined });
  };
  const __vue_scope_id__$2 = "data-v-2bbfcc7c";
  const __vue_module_identifier__$2 = undefined;
  const __vue_is_functional_template__$2 = false;
  function __vue_normalize__$2(
    template, style, script,
    scope, functional, moduleIdentifier,
    createInjector, createInjectorSSR
  ) {
    const component = (typeof script === 'function' ? script.options : script) || {};
    {
      component.__file = "/home/flandre/dev/Patchouli/src/components/DefaultImageItemTitle.vue";
    }
    if (!component.render) {
      component.render = template.render;
      component.staticRenderFns = template.staticRenderFns;
      component._compiled = true;
      if (functional) component.functional = true;
    }
    component._scopeId = scope;
    {
      let hook;
      if (style) {
        hook = function(context) {
          style.call(this, createInjector(context));
        };
      }
      if (hook !== undefined) {
        if (component.functional) {
          const originalRender = component.render;
          component.render = function renderWithStyleInjection(h, context) {
            hook.call(context);
            return originalRender(h, context)
          };
        } else {
          const existing = component.beforeCreate;
          component.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
      }
    }
    return component
  }
  function __vue_create_injector__$2() {
    const head = document.head || document.getElementsByTagName('head')[0];
    const styles = __vue_create_injector__$2.styles || (__vue_create_injector__$2.styles = {});
    const isOldIE =
      typeof navigator !== 'undefined' &&
      /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
    return function addStyle(id, css) {
      if (document.querySelector('style[data-vue-ssr-id~="' + id + '"]')) return
      const group = isOldIE ? css.media || 'default' : id;
      const style = styles[group] || (styles[group] = { ids: [], parts: [], element: undefined });
      if (!style.ids.includes(id)) {
        let code = css.source;
        let index = style.ids.length;
        style.ids.push(id);
        if (isOldIE) {
          style.element = style.element || document.querySelector('style[data-group=' + group + ']');
        }
        if (!style.element) {
          const el = style.element = document.createElement('style');
          el.type = 'text/css';
          if (css.media) el.setAttribute('media', css.media);
          if (isOldIE) {
            el.setAttribute('data-group', group);
            el.setAttribute('data-next-index', '0');
          }
          head.appendChild(el);
        }
        if (isOldIE) {
          index = parseInt(style.element.getAttribute('data-next-index'));
          style.element.setAttribute('data-next-index', index + 1);
        }
        if (style.element.styleSheet) {
          style.parts.push(code);
          style.element.styleSheet.cssText = style.parts
            .filter(Boolean)
            .join('\n');
        } else {
          const textNode = document.createTextNode(code);
          const nodes = style.element.childNodes;
          if (nodes[index]) style.element.removeChild(nodes[index]);
          if (nodes.length) style.element.insertBefore(textNode, nodes[index]);
          else style.element.appendChild(textNode);
        }
      }
    }
  }
  var DefaultImageItemTitle = __vue_normalize__$2(
    __vue_template__$2,
    __vue_inject_styles__$2,
    typeof __vue_script__$2 === 'undefined' ? {} : __vue_script__$2,
    __vue_scope_id__$2,
    __vue_is_functional_template__$2,
    __vue_module_identifier__$2,
    typeof __vue_create_injector__$2 !== 'undefined' ? __vue_create_injector__$2 : function () {},
    typeof __vue_create_injector_ssr__ !== 'undefined' ? __vue_create_injector_ssr__ : function () {}
  );
  var script$3 = {
    components: { DefaultImageItemImage, DefaultImageItemTitle },
    props: {
      imgUrl: {
        type: String,
        default: "",
      },
      illustId: {
        type: String,
        default: "",
      },
      illustTitle: {
        type: String,
        default: "",
      },
      illustPageCount: {
        type: Number,
        default: 1,
      },
      userName: {
        type: String,
        default: "",
      },
      userId: {
        type: String,
        default: "",
      },
      profileImgUrl: {
        type: String,
        default: "",
      },
      isUgoira: {
        type: Boolean,
        default: false,
      },
      isBookmarked: {
        type: Boolean,
        default: false,
      },
      isFollowed: {
        type: Boolean,
        default: false,
      },
      bookmarkId: {
        type: String,
        default: "",
      },
      bookmarkCount: {
        type: Number,
        default: 0,
      },
    },
  };
  const __vue_script__$3 = script$3;
  var __vue_render__$3 = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c("div", { staticClass: "image-item" }, [
      _c(
        "figure",
        { staticClass: "image-item-inner" },
        [
          _c("DefaultImageItemImage", {
            attrs: {
              "img-url": _vm.imgUrl,
              "illust-id": _vm.illustId,
              "illust-page-count": _vm.illustPageCount,
              "is-ugoira": _vm.isUgoira,
              "is-bookmarked": _vm.isBookmarked,
              "bookmark-id": _vm.bookmarkId
            }
          }),
          _vm._v(" "),
          _c("DefaultImageItemTitle", {
            attrs: {
              "illust-id": _vm.illustId,
              "illust-title": _vm.illustTitle,
              "user-name": _vm.userName,
              "user-id": _vm.userId,
              "is-followed": _vm.isFollowed,
              "profile-img-url": _vm.profileImgUrl,
              "bookmark-count": _vm.bookmarkCount
            }
          })
        ],
        1
      )
    ])
  };
  var __vue_staticRenderFns__$3 = [];
  __vue_render__$3._withStripped = true;
  const __vue_template__$3 = typeof __vue_render__$3 !== 'undefined'
    ? { render: __vue_render__$3, staticRenderFns: __vue_staticRenderFns__$3 }
    : {};
  const __vue_inject_styles__$3 = function (inject) {
    if (!inject) return
    inject("data-v-32b7baf0_0", { source: "\n.image-item[data-v-32b7baf0] {\n  display: flex;\n  justify-content: center;\n  margin: 0 0 30px 0;\n  padding: 10px;\n  height: auto;\n  width: 200px;\n}\n.image-item-inner[data-v-32b7baf0] {\n  display: flex;\n  flex-flow: column;\n  max-width: 100%;\n  max-height: 300px;\n}\n", map: undefined, media: undefined });
  };
  const __vue_scope_id__$3 = "data-v-32b7baf0";
  const __vue_module_identifier__$3 = undefined;
  const __vue_is_functional_template__$3 = false;
  function __vue_normalize__$3(
    template, style, script,
    scope, functional, moduleIdentifier,
    createInjector, createInjectorSSR
  ) {
    const component = (typeof script === 'function' ? script.options : script) || {};
    {
      component.__file = "/home/flandre/dev/Patchouli/src/components/DefaultImageItem.vue";
    }
    if (!component.render) {
      component.render = template.render;
      component.staticRenderFns = template.staticRenderFns;
      component._compiled = true;
      if (functional) component.functional = true;
    }
    component._scopeId = scope;
    {
      let hook;
      if (style) {
        hook = function(context) {
          style.call(this, createInjector(context));
        };
      }
      if (hook !== undefined) {
        if (component.functional) {
          const originalRender = component.render;
          component.render = function renderWithStyleInjection(h, context) {
            hook.call(context);
            return originalRender(h, context)
          };
        } else {
          const existing = component.beforeCreate;
          component.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
      }
    }
    return component
  }
  function __vue_create_injector__$3() {
    const head = document.head || document.getElementsByTagName('head')[0];
    const styles = __vue_create_injector__$3.styles || (__vue_create_injector__$3.styles = {});
    const isOldIE =
      typeof navigator !== 'undefined' &&
      /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
    return function addStyle(id, css) {
      if (document.querySelector('style[data-vue-ssr-id~="' + id + '"]')) return
      const group = isOldIE ? css.media || 'default' : id;
      const style = styles[group] || (styles[group] = { ids: [], parts: [], element: undefined });
      if (!style.ids.includes(id)) {
        let code = css.source;
        let index = style.ids.length;
        style.ids.push(id);
        if (isOldIE) {
          style.element = style.element || document.querySelector('style[data-group=' + group + ']');
        }
        if (!style.element) {
          const el = style.element = document.createElement('style');
          el.type = 'text/css';
          if (css.media) el.setAttribute('media', css.media);
          if (isOldIE) {
            el.setAttribute('data-group', group);
            el.setAttribute('data-next-index', '0');
          }
          head.appendChild(el);
        }
        if (isOldIE) {
          index = parseInt(style.element.getAttribute('data-next-index'));
          style.element.setAttribute('data-next-index', index + 1);
        }
        if (style.element.styleSheet) {
          style.parts.push(code);
          style.element.styleSheet.cssText = style.parts
            .filter(Boolean)
            .join('\n');
        } else {
          const textNode = document.createTextNode(code);
          const nodes = style.element.childNodes;
          if (nodes[index]) style.element.removeChild(nodes[index]);
          if (nodes.length) style.element.insertBefore(textNode, nodes[index]);
          else style.element.appendChild(textNode);
        }
      }
    }
  }
  var DefaultImageItem = __vue_normalize__$3(
    __vue_template__$3,
    __vue_inject_styles__$3,
    typeof __vue_script__$3 === 'undefined' ? {} : __vue_script__$3,
    __vue_scope_id__$3,
    __vue_is_functional_template__$3,
    __vue_module_identifier__$3,
    typeof __vue_create_injector__$3 !== 'undefined' ? __vue_create_injector__$3 : function () {},
    typeof __vue_create_injector_ssr__ !== 'undefined' ? __vue_create_injector_ssr__ : function () {}
  );
  const GMC = {
    async getValue(name, failv = null) {
      if (window.GM_getValue) {
        return Promise.resolve(GM_getValue(name) || failv);
      } else {
        return (await GM.getValue(name)) || failv;
      }
    },
    async setValue(name, value) {
      if (window.GM_setValue) {
        GM_setValue(name, value);
      } else {
        GM.setValue(name, value);
      }
    },
    async XHR(details) {
      const xhr = window.GM_xmlhttpRequest || (GM ? GM.xmlHttpRequest : null);
      if (!xhr) {
        return Promise.reject();
      }
      return new Promise((resolve, reject) => {
        Object.assign(details, {
          onload: resolve,
          onabort: reject,
          onerror: reject,
          ontimeout: reject,
        });
        xhr(details);
      });
    },
  };
  var script$4 = {
    computed: {
      xm() {
        return this.$store.state.contextMenu;
      },
      xmd() {
        return this.xm.data;
      },
      currentType() {
        if (!this.xmd) {
          return "";
        }
        return this.xmd.type;
      },
      currentImageItem() {
        if (!this.xmd) {
          return null;
        }
        const illustId = this.xmd.illustId;
        const found = this.$store.state.pixiv.imgLibrary.find(
          i => i.illustId === illustId
        );
        return found ? found : null;
      },
      inlineStyle() {
        const RIGHT_BOUND = 200;
        const position = this.xm.position;
        const ow = document.body.offsetWidth;
        let style = `top: ${position.y}px;`;
        if (ow - position.x < RIGHT_BOUND) {
          style += `right: ${ow - position.x}px;`;
        } else {
          style += `left: ${position.x}px;`;
        }
        return style;
      },
      bookmarkPageLink() {
        if (!this.xmd) {
          return "#";
        }
        const illustId = this.xmd.illustId;
        return `bookmark_add.php?type=illust&illust_id=${illustId}`;
      },
      isDownloadable() {
        return (
          this.currentImageItem &&
          this.currentImageItem.illustPageCount === 1 &&
          !this.currentImageItem.isUgoira
        );
      },
      isUgoira() {
        return this.currentImageItem && this.currentImageItem.isUgoira;
      },
    },
    methods: {
      thumbUp() {
        if (this.currentImageItem) {
          PixivAPI.postIllustLike(this.currentImageItem.illustId);
        }
      },
      async downloadOne() {
        const imgUrl = this.currentImageItem.urls.original;
        const illustId = this.currentImageItem.illustId;
        const a = $el("a", { href: imgUrl });
        const filename = a.pathname.split("/").pop();
        const ext = filename
          .split(".")
          .pop()
          .toLowerCase();
        const response = await GMC.XHR({
          method: "GET",
          url: imgUrl,
          responseType: "arraybuffer",
          binary: true,
          headers: {
            Referer: `https://www.pixiv.net/member_illust.php?mode=medium&illust_id=${illustId}`,
          },
        });
        if (ext === "jpg" || ext === "jpeg") {
          saveAs(new File([response.response], filename, { type: "image/jpeg" }));
        } else if (ext === "png") {
          saveAs(new File([response.response], filename, { type: "image/png" }));
        }
      },
      addToBlacklist() {
        if (this.currentImageItem) {
          const userId = this.currentImageItem.userId;
          this.$store.state.config.blacklist.push(userId);
          this.$store.state.config.blacklist.sort((a, b) => a - b);
          this.$store.commit("saveConfig");
        }
      },
      openPreview() {
        this.$store.commit("openBigComponent", {
          mode: "preview",
          data: this.currentImageItem,
        });
      },
      async followUser() {
        if (this.currentImageItem) {
          const userId = this.currentImageItem.userId;
          if (await PixivAPI.postFollowUser(userId)) {
            this.$store.commit("editImgItem", {
              type: "follow-user",
              userId: this.currentImageItem.userId,
            });
          }
        }
      },
    },
  };
  const __vue_script__$4 = script$4;
  var __vue_render__$4 = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c(
      "div",
      { style: _vm.inlineStyle, attrs: { id: "patchouli-context-menu" } },
      [
        _c(
          "ul",
          {
            directives: [
              {
                name: "show",
                rawName: "v-show",
                value: _vm.currentType === "image-item-image",
                expression: "currentType === 'image-item-image'"
              }
            ],
            attrs: { id: "patchouli-context-menu-list-image-item-image" }
          },
          [
            _c("li", [
              _c(
                "a",
                {
                  attrs: { role: "button" },
                  on: {
                    click: function($event) {
                      if (
                        !("button" in $event) &&
                        _vm._k($event.keyCode, "left", 37, $event.key, [
                          "Left",
                          "ArrowLeft"
                        ])
                      ) {
                        return null
                      }
                      if ("button" in $event && $event.button !== 0) {
                        return null
                      }
                      return _vm.thumbUp($event)
                    }
                  }
                },
                [
                  _c("i", { staticClass: "far fa-thumbs-up" }),
                  _vm._v(
                    "\n        " +
                      _vm._s(_vm.$t("contextMenu.thumbUp")) +
                      "\n      "
                  )
                ]
              )
            ]),
            _vm._v(" "),
            _c(
              "li",
              {
                directives: [
                  {
                    name: "show",
                    rawName: "v-show",
                    value: _vm.isDownloadable,
                    expression: "isDownloadable"
                  }
                ]
              },
              [
                _c(
                  "a",
                  {
                    attrs: { role: "button" },
                    on: {
                      click: function($event) {
                        if (
                          !("button" in $event) &&
                          _vm._k($event.keyCode, "left", 37, $event.key, [
                            "Left",
                            "ArrowLeft"
                          ])
                        ) {
                          return null
                        }
                        if ("button" in $event && $event.button !== 0) {
                          return null
                        }
                        return _vm.downloadOne($event)
                      }
                    }
                  },
                  [
                    _c("i", { staticClass: "fas fa-download" }),
                    _vm._v(
                      "\n        " +
                        _vm._s(_vm.$t("contextMenu.download")) +
                        "\n      "
                    )
                  ]
                )
              ]
            ),
            _vm._v(" "),
            _c("li", [
              _c(
                "a",
                {
                  attrs: { role: "button" },
                  on: {
                    click: function($event) {
                      if (
                        !("button" in $event) &&
                        _vm._k($event.keyCode, "left", 37, $event.key, [
                          "Left",
                          "ArrowLeft"
                        ])
                      ) {
                        return null
                      }
                      if ("button" in $event && $event.button !== 0) {
                        return null
                      }
                      return _vm.openPreview($event)
                    }
                  }
                },
                [
                  _c("i", { staticClass: "fas fa-search-plus" }),
                  _vm._v(
                    "\n        " +
                      _vm._s(_vm.$t("contextMenu.preview")) +
                      "\n      "
                  )
                ]
              )
            ]),
            _vm._v(" "),
            _c("li", [
              _c(
                "a",
                {
                  attrs: {
                    href: _vm.bookmarkPageLink,
                    role: "button",
                    target: "_blank"
                  }
                },
                [
                  _c("i", { staticClass: "far fa-bookmark" }),
                  _vm._v(
                    "\n        " +
                      _vm._s(_vm.$t("contextMenu.openBookmarkPage")) +
                      "\n      "
                  )
                ]
              )
            ])
          ]
        ),
        _vm._v(" "),
        _c(
          "ul",
          {
            directives: [
              {
                name: "show",
                rawName: "v-show",
                value: _vm.currentType === "image-item-title-user",
                expression: "currentType === 'image-item-title-user'"
              }
            ],
            attrs: { id: "patchouli-context-menu-list-image-item-title-user" }
          },
          [
            _c("li", [
              _c(
                "a",
                {
                  attrs: { role: "button" },
                  on: {
                    click: function($event) {
                      if (
                        !("button" in $event) &&
                        _vm._k($event.keyCode, "left", 37, $event.key, [
                          "Left",
                          "ArrowLeft"
                        ])
                      ) {
                        return null
                      }
                      if ("button" in $event && $event.button !== 0) {
                        return null
                      }
                      return _vm.addToBlacklist($event)
                    }
                  }
                },
                [
                  _c("i", { staticClass: "far fa-eye-slash" }),
                  _vm._v(
                    "\n        " +
                      _vm._s(_vm.$t("contextMenu.addToBlacklist")) +
                      "\n      "
                  )
                ]
              )
            ]),
            _vm._v(" "),
            _c(
              "li",
              {
                directives: [
                  {
                    name: "show",
                    rawName: "v-show",
                    value:
                      _vm.currentImageItem && !_vm.currentImageItem.isFollowed,
                    expression: "currentImageItem && !currentImageItem.isFollowed"
                  }
                ]
              },
              [
                _c(
                  "a",
                  {
                    attrs: { role: "button" },
                    on: {
                      click: function($event) {
                        if (
                          !("button" in $event) &&
                          _vm._k($event.keyCode, "left", 37, $event.key, [
                            "Left",
                            "ArrowLeft"
                          ])
                        ) {
                          return null
                        }
                        if ("button" in $event && $event.button !== 0) {
                          return null
                        }
                        return _vm.followUser($event)
                      }
                    }
                  },
                  [
                    _c("i", { staticClass: "fas fa-rss" }),
                    _vm._v(
                      "\n        " +
                        _vm._s(_vm.$t("contextMenu.followUser")) +
                        "\n      "
                    )
                  ]
                )
              ]
            )
          ]
        )
      ]
    )
  };
  var __vue_staticRenderFns__$4 = [];
  __vue_render__$4._withStripped = true;
  const __vue_template__$4 = typeof __vue_render__$4 !== 'undefined'
    ? { render: __vue_render__$4, staticRenderFns: __vue_staticRenderFns__$4 }
    : {};
  const __vue_inject_styles__$4 = function (inject) {
    if (!inject) return
    inject("data-v-10ff41e4_0", { source: "\n#patchouli-context-menu[data-v-10ff41e4] {\n  box-sizing: border-box;\n  border: 1px solid #b28fce;\n  position: fixed;\n  z-index: 10;\n  background-color: #fff;\n  font-size: 16px;\n  overflow: hidden;\n  border-radius: 6px;\n}\n#patchouli-context-menu > ul > li[data-v-10ff41e4] {\n  display: flex;\n  align-items: center;\n}\n#patchouli-context-menu > ul a[data-v-10ff41e4] {\n  color: #85a;\n  padding: 3px;\n  flex: 1;\n  border-radius: 5px;\n  text-decoration: none;\n  white-space: nowrap;\n  display: inline-flex;\n  align-items: center;\n  text-align: center;\n}\n#patchouli-context-menu > ul a[data-v-10ff41e4]:hover {\n  background-color: #b28fce;\n  color: #fff;\n  cursor: pointer;\n}\n#patchouli-context-menu > ul i.far[data-v-10ff41e4],\n#patchouli-context-menu > ul i.fas[data-v-10ff41e4] {\n  height: 18px;\n  width: 18px;\n  margin: 0 4px;\n}\n", map: undefined, media: undefined });
  };
  const __vue_scope_id__$4 = "data-v-10ff41e4";
  const __vue_module_identifier__$4 = undefined;
  const __vue_is_functional_template__$4 = false;
  function __vue_normalize__$4(
    template, style, script,
    scope, functional, moduleIdentifier,
    createInjector, createInjectorSSR
  ) {
    const component = (typeof script === 'function' ? script.options : script) || {};
    {
      component.__file = "/home/flandre/dev/Patchouli/src/components/ContextMenu.vue";
    }
    if (!component.render) {
      component.render = template.render;
      component.staticRenderFns = template.staticRenderFns;
      component._compiled = true;
      if (functional) component.functional = true;
    }
    component._scopeId = scope;
    {
      let hook;
      if (style) {
        hook = function(context) {
          style.call(this, createInjector(context));
        };
      }
      if (hook !== undefined) {
        if (component.functional) {
          const originalRender = component.render;
          component.render = function renderWithStyleInjection(h, context) {
            hook.call(context);
            return originalRender(h, context)
          };
        } else {
          const existing = component.beforeCreate;
          component.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
      }
    }
    return component
  }
  function __vue_create_injector__$4() {
    const head = document.head || document.getElementsByTagName('head')[0];
    const styles = __vue_create_injector__$4.styles || (__vue_create_injector__$4.styles = {});
    const isOldIE =
      typeof navigator !== 'undefined' &&
      /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
    return function addStyle(id, css) {
      if (document.querySelector('style[data-vue-ssr-id~="' + id + '"]')) return
      const group = isOldIE ? css.media || 'default' : id;
      const style = styles[group] || (styles[group] = { ids: [], parts: [], element: undefined });
      if (!style.ids.includes(id)) {
        let code = css.source;
        let index = style.ids.length;
        style.ids.push(id);
        if (isOldIE) {
          style.element = style.element || document.querySelector('style[data-group=' + group + ']');
        }
        if (!style.element) {
          const el = style.element = document.createElement('style');
          el.type = 'text/css';
          if (css.media) el.setAttribute('media', css.media);
          if (isOldIE) {
            el.setAttribute('data-group', group);
            el.setAttribute('data-next-index', '0');
          }
          head.appendChild(el);
        }
        if (isOldIE) {
          index = parseInt(style.element.getAttribute('data-next-index'));
          style.element.setAttribute('data-next-index', index + 1);
        }
        if (style.element.styleSheet) {
          style.parts.push(code);
          style.element.styleSheet.cssText = style.parts
            .filter(Boolean)
            .join('\n');
        } else {
          const textNode = document.createTextNode(code);
          const nodes = style.element.childNodes;
          if (nodes[index]) style.element.removeChild(nodes[index]);
          if (nodes.length) style.element.insertBefore(textNode, nodes[index]);
          else style.element.appendChild(textNode);
        }
      }
    }
  }
  var ContextMenu = __vue_normalize__$4(
    __vue_template__$4,
    __vue_inject_styles__$4,
    typeof __vue_script__$4 === 'undefined' ? {} : __vue_script__$4,
    __vue_scope_id__$4,
    __vue_is_functional_template__$4,
    __vue_module_identifier__$4,
    typeof __vue_create_injector__$4 !== 'undefined' ? __vue_create_injector__$4 : function () {},
    typeof __vue_create_injector_ssr__ !== 'undefined' ? __vue_create_injector_ssr__ : function () {}
  );
  var script$5 = {
    components: { DefaultImageItem, ContextMenu },
    computed: {
      filteredLibrary() {
        return this.$store.getters.filteredLibrary;
      },
    },
  };
  const __vue_script__$5 = script$5;
  var __vue_render__$5 = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c(
      "div",
      { attrs: { id: "patchouli" } },
      [
        _vm._l(_vm.filteredLibrary, function(d) {
          return _c("DefaultImageItem", {
            directives: [
              {
                name: "show",
                rawName: "v-show",
                value: d._show,
                expression: "d._show"
              }
            ],
            key: d.illustId,
            attrs: {
              "img-url": d.urls.thumb,
              "illust-id": d.illustId,
              "illust-title": d.illustTitle,
              "illust-page-count": d.illustPageCount,
              "is-ugoira": d.isUgoira,
              "user-name": d.userName,
              "user-id": d.userId,
              "profile-img-url": d.profileImg,
              "bookmark-count": d.bookmarkCount,
              "is-bookmarked": d.isBookmarked,
              "is-followed": d.isFollowed,
              "bookmark-id": d.bookmarkId
            }
          })
        }),
        _vm._v(" "),
        _c("ContextMenu")
      ],
      2
    )
  };
  var __vue_staticRenderFns__$5 = [];
  __vue_render__$5._withStripped = true;
  const __vue_template__$5 = typeof __vue_render__$5 !== 'undefined'
    ? { render: __vue_render__$5, staticRenderFns: __vue_staticRenderFns__$5 }
    : {};
  const __vue_inject_styles__$5 = function (inject) {
    if (!inject) return
    inject("data-v-4c25537e_0", { source: "\n#patchouli[data-v-4c25537e] {\n  display: flex;\n  flex-flow: wrap;\n  justify-content: space-around;\n}\n", map: undefined, media: undefined });
  };
  const __vue_scope_id__$5 = "data-v-4c25537e";
  const __vue_module_identifier__$5 = undefined;
  const __vue_is_functional_template__$5 = false;
  function __vue_normalize__$5(
    template, style, script,
    scope, functional, moduleIdentifier,
    createInjector, createInjectorSSR
  ) {
    const component = (typeof script === 'function' ? script.options : script) || {};
    {
      component.__file = "/home/flandre/dev/Patchouli/src/components/Patchouli.vue";
    }
    if (!component.render) {
      component.render = template.render;
      component.staticRenderFns = template.staticRenderFns;
      component._compiled = true;
      if (functional) component.functional = true;
    }
    component._scopeId = scope;
    {
      let hook;
      if (style) {
        hook = function(context) {
          style.call(this, createInjector(context));
        };
      }
      if (hook !== undefined) {
        if (component.functional) {
          const originalRender = component.render;
          component.render = function renderWithStyleInjection(h, context) {
            hook.call(context);
            return originalRender(h, context)
          };
        } else {
          const existing = component.beforeCreate;
          component.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
      }
    }
    return component
  }
  function __vue_create_injector__$5() {
    const head = document.head || document.getElementsByTagName('head')[0];
    const styles = __vue_create_injector__$5.styles || (__vue_create_injector__$5.styles = {});
    const isOldIE =
      typeof navigator !== 'undefined' &&
      /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
    return function addStyle(id, css) {
      if (document.querySelector('style[data-vue-ssr-id~="' + id + '"]')) return
      const group = isOldIE ? css.media || 'default' : id;
      const style = styles[group] || (styles[group] = { ids: [], parts: [], element: undefined });
      if (!style.ids.includes(id)) {
        let code = css.source;
        let index = style.ids.length;
        style.ids.push(id);
        if (isOldIE) {
          style.element = style.element || document.querySelector('style[data-group=' + group + ']');
        }
        if (!style.element) {
          const el = style.element = document.createElement('style');
          el.type = 'text/css';
          if (css.media) el.setAttribute('media', css.media);
          if (isOldIE) {
            el.setAttribute('data-group', group);
            el.setAttribute('data-next-index', '0');
          }
          head.appendChild(el);
        }
        if (isOldIE) {
          index = parseInt(style.element.getAttribute('data-next-index'));
          style.element.setAttribute('data-next-index', index + 1);
        }
        if (style.element.styleSheet) {
          style.parts.push(code);
          style.element.styleSheet.cssText = style.parts
            .filter(Boolean)
            .join('\n');
        } else {
          const textNode = document.createTextNode(code);
          const nodes = style.element.childNodes;
          if (nodes[index]) style.element.removeChild(nodes[index]);
          if (nodes.length) style.element.insertBefore(textNode, nodes[index]);
          else style.element.appendChild(textNode);
        }
      }
    }
  }
  var patchouli = __vue_normalize__$5(
    __vue_template__$5,
    __vue_inject_styles__$5,
    typeof __vue_script__$5 === 'undefined' ? {} : __vue_script__$5,
    __vue_scope_id__$5,
    __vue_is_functional_template__$5,
    __vue_module_identifier__$5,
    typeof __vue_create_injector__$5 !== 'undefined' ? __vue_create_injector__$5 : function () {},
    typeof __vue_create_injector_ssr__ !== 'undefined' ? __vue_create_injector_ssr__ : function () {}
  );
  var script$6 = {
    data() {
      return {
        previewSrcList: [],
        previewCurrentIndex: 0,
        previewUgoiraMetaData: null,
        ugoiraPlayers: [],
      };
    },
    computed: {
      xm() {
        return this.$store.state.bigComponent;
      },
      xc() {
        return this.$store.state.config;
      },
      mode() {
        return this.xm.mode;
      },
    },
    watch: {
      async mode(value) {
        if (value === "preview") {
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
              imageItem.urls.original.replace("p0", `p${idx}`)
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
      if (this.mode === "preview") {
        this.$refs.patchouliBigComponentRoot.focus();
      }
    },
    methods: {
      clickBase(event) {
        this.$store.commit("closeBigComponent");
        this.xc.blacklist = [
          ...new Set(
            $("#config-blacklist-textarea")
              .value.split("\n")
              .filter(Boolean)
              .map(s => s.trim())
          ),
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
        if (event.currentTarget.id === "config-context-menu-switch") {
          this.xc.contextMenu = toInt(!this.xc.contextMenu);
        }
        if (event.currentTarget.id === "config-user-tooltip-switch") {
          this.xc.userTooltip = toInt(!this.xc.userTooltip);
        }
        if (event.currentTarget.id === "config-hover-play-switch") {
          this.xc.hoverPlay = toInt(!this.xc.hoverPlay);
        }
      },
      jumpPreview(index) {
        this.previewCurrentIndex = index;
      },
      initZipImagePlayer() {
        const meta = this.previewUgoiraMetaData;
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
        if (this.mode === "preview") {
          const imageItem = this.xm.data;
          if (event.key === "ArrowLeft") {
            this.jumpPreview(Math.max(this.previewCurrentIndex - 1, 0));
          } else if (event.key === "ArrowRight") {
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
  const __vue_script__$6 = script$6;
  var __vue_render__$6 = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c(
      "div",
      {
        directives: [
          { name: "show", rawName: "v-show", value: _vm.mode, expression: "mode" }
        ],
        ref: "patchouliBigComponentRoot",
        attrs: { id: "patchouli-big-component", tabindex: "0" },
        on: {
          keyup: _vm.jumpByKeyup,
          click: function($event) {
            if (
              !("button" in $event) &&
              _vm._k($event.keyCode, "left", 37, $event.key, [
                "Left",
                "ArrowLeft"
              ])
            ) {
              return null
            }
            if ("button" in $event && $event.button !== 0) {
              return null
            }
            return _vm.clickBase($event)
          },
          scroll: _vm.focusForeground,
          wheel: _vm.focusForeground
        }
      },
      [
        _c(
          "div",
          {
            directives: [
              {
                name: "show",
                rawName: "v-show",
                value: _vm.mode === "config",
                expression: "mode === 'config'"
              }
            ],
            attrs: { id: "config-mode" },
            on: {
              click: function($event) {
                $event.stopPropagation();
              }
            }
          },
          [
            _c(
              "a",
              {
                attrs: { id: "config-context-menu-switch" },
                on: {
                  click: function($event) {
                    if (
                      !("button" in $event) &&
                      _vm._k($event.keyCode, "left", 37, $event.key, [
                        "Left",
                        "ArrowLeft"
                      ])
                    ) {
                      return null
                    }
                    if ("button" in $event && $event.button !== 0) {
                      return null
                    }
                    return _vm.clickSwitch($event)
                  }
                }
              },
              [
                _c(
                  "a",
                  {
                    directives: [
                      {
                        name: "show",
                        rawName: "v-show",
                        value: _vm.xc.contextMenu,
                        expression: "xc.contextMenu"
                      }
                    ],
                    attrs: { id: "config-context-menu-switch-on", role: "button" }
                  },
                  [_c("i", { staticClass: "fas fa-toggle-on" })]
                ),
                _vm._v(" "),
                _c(
                  "a",
                  {
                    directives: [
                      {
                        name: "show",
                        rawName: "v-show",
                        value: !_vm.xc.contextMenu,
                        expression: "!xc.contextMenu"
                      }
                    ],
                    attrs: {
                      id: "config-context-menu-switch-off",
                      role: "button"
                    }
                  },
                  [_c("i", { staticClass: "fas fa-toggle-off" })]
                ),
                _vm._v(" "),
                _c("span", { attrs: { id: "config-context-menu-label" } }, [
                  _vm._v(_vm._s(_vm.$t("config.contextMenuExtension")))
                ])
              ]
            ),
            _vm._v(" "),
            _c(
              "a",
              {
                attrs: { id: "config-user-tooltip-switch" },
                on: {
                  click: function($event) {
                    if (
                      !("button" in $event) &&
                      _vm._k($event.keyCode, "left", 37, $event.key, [
                        "Left",
                        "ArrowLeft"
                      ])
                    ) {
                      return null
                    }
                    if ("button" in $event && $event.button !== 0) {
                      return null
                    }
                    return _vm.clickSwitch($event)
                  }
                }
              },
              [
                _c(
                  "a",
                  {
                    directives: [
                      {
                        name: "show",
                        rawName: "v-show",
                        value: _vm.xc.userTooltip,
                        expression: "xc.userTooltip"
                      }
                    ],
                    attrs: { id: "config-user-tooltip-switch-on", role: "button" }
                  },
                  [_c("i", { staticClass: "fas fa-toggle-on" })]
                ),
                _vm._v(" "),
                _c(
                  "a",
                  {
                    directives: [
                      {
                        name: "show",
                        rawName: "v-show",
                        value: !_vm.xc.userTooltip,
                        expression: "!xc.userTooltip"
                      }
                    ],
                    attrs: {
                      id: "config-user-tooltip-switch-off",
                      role: "button"
                    }
                  },
                  [_c("i", { staticClass: "fas fa-toggle-off" })]
                ),
                _vm._v(" "),
                _c("span", { attrs: { id: "config-user-tooltip-label" } }, [
                  _vm._v(_vm._s(_vm.$t("config.userTooltip")))
                ])
              ]
            ),
            _vm._v(" "),
            _c(
              "a",
              {
                attrs: { id: "config-hover-play-switch" },
                on: {
                  click: function($event) {
                    if (
                      !("button" in $event) &&
                      _vm._k($event.keyCode, "left", 37, $event.key, [
                        "Left",
                        "ArrowLeft"
                      ])
                    ) {
                      return null
                    }
                    if ("button" in $event && $event.button !== 0) {
                      return null
                    }
                    return _vm.clickSwitch($event)
                  }
                }
              },
              [
                _c(
                  "a",
                  {
                    directives: [
                      {
                        name: "show",
                        rawName: "v-show",
                        value: _vm.xc.hoverPlay,
                        expression: "xc.hoverPlay"
                      }
                    ],
                    attrs: { id: "config-hover-play-switch-on", role: "button" }
                  },
                  [_c("i", { staticClass: "fas fa-toggle-on" })]
                ),
                _vm._v(" "),
                _c(
                  "a",
                  {
                    directives: [
                      {
                        name: "show",
                        rawName: "v-show",
                        value: !_vm.xc.hoverPlay,
                        expression: "!xc.hoverPlay"
                      }
                    ],
                    attrs: { id: "config-hover-play-switch-off", role: "button" }
                  },
                  [_c("i", { staticClass: "fas fa-toggle-off" })]
                ),
                _vm._v(" "),
                _c("span", { attrs: { id: "config-hover-play-label" } }, [
                  _vm._v(_vm._s(_vm.$t("config.hoverPlay")))
                ])
              ]
            ),
            _vm._v(" "),
            _c("a", { attrs: { id: "config-blacklist-label" } }, [
              _c("i", { staticClass: "far fa-eye-slash" }),
              _vm._v(_vm._s(_vm.$t("config.blacklist")) + "\n    ")
            ]),
            _vm._v(" "),
            _c("textarea", {
              attrs: {
                id: "config-blacklist-textarea",
                spellcheck: "false",
                rows: "5"
              },
              domProps: { value: _vm.xc.blacklist.join("\n") }
            })
          ]
        ),
        _vm._v(" "),
        _c(
          "div",
          {
            directives: [
              {
                name: "show",
                rawName: "v-show",
                value: _vm.mode === "preview",
                expression: "mode === 'preview'"
              }
            ],
            attrs: { id: "preview-mode" },
            on: {
              click: function($event) {
                $event.stopPropagation();
              }
            }
          },
          [
            _c("div", { attrs: { id: "preview-display-area" } }, [
              _c(
                "a",
                {
                  directives: [
                    {
                      name: "show",
                      rawName: "v-show",
                      value: !_vm.previewUgoiraMetaData,
                      expression: "!previewUgoiraMetaData"
                    }
                  ],
                  attrs: {
                    href: _vm.previewSrcList[_vm.previewCurrentIndex],
                    target: "_blank"
                  }
                },
                [
                  _c("img", {
                    attrs: { src: _vm.previewSrcList[_vm.previewCurrentIndex] }
                  })
                ]
              ),
              _vm._v(" "),
              _c(
                "div",
                {
                  directives: [
                    {
                      name: "show",
                      rawName: "v-show",
                      value: !!_vm.previewUgoiraMetaData,
                      expression: "!!previewUgoiraMetaData"
                    }
                  ]
                },
                [
                  _c("canvas", {
                    directives: [
                      {
                        name: "show",
                        rawName: "v-show",
                        value: _vm.previewCurrentIndex === 0,
                        expression: "previewCurrentIndex === 0"
                      }
                    ],
                    ref: "previewUgoiraCanvas"
                  }),
                  _vm._v(" "),
                  _c("canvas", {
                    directives: [
                      {
                        name: "show",
                        rawName: "v-show",
                        value: _vm.previewCurrentIndex === 1,
                        expression: "previewCurrentIndex === 1"
                      }
                    ],
                    ref: "previewOriginalUgoiraCanvas"
                  })
                ]
              )
            ]),
            _vm._v(" "),
            _c(
              "ul",
              {
                directives: [
                  {
                    name: "show",
                    rawName: "v-show",
                    value: _vm.previewSrcList.length > 1,
                    expression: "previewSrcList.length > 1"
                  }
                ],
                attrs: { id: "preview-thumbnails-area" }
              },
              _vm._l(_vm.previewSrcList, function(pSrc, index) {
                return _c("li", { key: pSrc }, [
                  _c(
                    "a",
                    {
                      class:
                        index === _vm.previewCurrentIndex
                          ? "current-preview"
                          : "",
                      on: {
                        click: function($event) {
                          if (
                            !("button" in $event) &&
                            _vm._k($event.keyCode, "left", 37, $event.key, [
                              "Left",
                              "ArrowLeft"
                            ])
                          ) {
                            return null
                          }
                          if ("button" in $event && $event.button !== 0) {
                            return null
                          }
                          _vm.jumpPreview(index);
                        }
                      }
                    },
                    [_c("img", { attrs: { src: pSrc } })]
                  )
                ])
              })
            )
          ]
        )
      ]
    )
  };
  var __vue_staticRenderFns__$6 = [];
  __vue_render__$6._withStripped = true;
  const __vue_template__$6 = typeof __vue_render__$6 !== 'undefined'
    ? { render: __vue_render__$6, staticRenderFns: __vue_staticRenderFns__$6 }
    : {};
  const __vue_inject_styles__$6 = function (inject) {
    if (!inject) return
    inject("data-v-9926eea0_0", { source: "\n#patchouli-big-component[data-v-9926eea0] {\n  background-color: #000a;\n  position: fixed;\n  height: 100%;\n  width: 100%;\n  z-index: 5;\n  top: 0;\n  left: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n#config-mode[data-v-9926eea0],\n#preview-mode[data-v-9926eea0] {\n  min-width: 100px;\n  min-height: 100px;\n  background-color: #eef;\n}\n#config-mode[data-v-9926eea0] {\n  display: flex;\n  flex-flow: column;\n  padding: 10px;\n  border-radius: 10px;\n  font-size: 18px;\n  white-space: nowrap;\n}\n#config-mode a[data-v-9926eea0] {\n  color: #00186c;\n  text-decoration: none;\n}\n#config-mode [id$=\"switch\"][data-v-9926eea0] {\n  text-align: center;\n}\n#config-mode [id$=\"switch\"][data-v-9926eea0]:hover {\n  cursor: pointer;\n}\n#config-mode [id$=\"label\"][data-v-9926eea0] {\n  text-align: center;\n  margin: 0 5px;\n}\n#config-blacklist-label > .fa-eye-slash[data-v-9926eea0] {\n  margin: 0 4px;\n}\n#config-blacklist-textarea[data-v-9926eea0] {\n  box-sizing: border-box;\n  flex: 1;\n  resize: none;\n  font-size: 11pt;\n  height: 90px;\n}\n#preview-mode[data-v-9926eea0] {\n  width: 70%;\n  height: 100%;\n  box-sizing: border-box;\n  display: grid;\n  grid-template-rows: minmax(0, auto) max-content;\n}\n#preview-display-area[data-v-9926eea0] {\n  border: 2px #00186c solid;\n  box-sizing: border-box;\n  text-align: center;\n}\n#preview-display-area > a[data-v-9926eea0],\n#preview-display-area > div[data-v-9926eea0] {\n  display: inline-flex;\n  height: 100%;\n  justify-content: center;\n  align-items: center;\n}\n#preview-display-area > a > img[data-v-9926eea0],\n#preview-display-area > div > canvas[data-v-9926eea0] {\n  object-fit: contain;\n  max-width: 100%;\n  max-height: 100%;\n}\n#preview-thumbnails-area[data-v-9926eea0] {\n  background-color: ghostwhite;\n  display: flex;\n  align-items: center;\n  overflow-x: auto;\n  overflow-y: hidden;\n  height: 100%;\n  border: 2px solid #014;\n  box-sizing: border-box;\n  border-top: 0;\n}\n#preview-thumbnails-area > li[data-v-9926eea0] {\n  padding: 0 10px;\n}\n#preview-thumbnails-area > li > a[data-v-9926eea0] {\n  cursor: pointer;\n  display: inline-block;\n}\n.current-preview[data-v-9926eea0] {\n  border: 3px solid palevioletred;\n}\n#preview-thumbnails-area > li > a > img[data-v-9926eea0] {\n  max-height: 100px;\n  box-sizing: border-box;\n  display: inline-block;\n}\n", map: undefined, media: undefined });
  };
  const __vue_scope_id__$6 = "data-v-9926eea0";
  const __vue_module_identifier__$6 = undefined;
  const __vue_is_functional_template__$6 = false;
  function __vue_normalize__$6(
    template, style, script,
    scope, functional, moduleIdentifier,
    createInjector, createInjectorSSR
  ) {
    const component = (typeof script === 'function' ? script.options : script) || {};
    {
      component.__file = "/home/flandre/dev/Patchouli/src/components/BigComponent.vue";
    }
    if (!component.render) {
      component.render = template.render;
      component.staticRenderFns = template.staticRenderFns;
      component._compiled = true;
      if (functional) component.functional = true;
    }
    component._scopeId = scope;
    {
      let hook;
      if (style) {
        hook = function(context) {
          style.call(this, createInjector(context));
        };
      }
      if (hook !== undefined) {
        if (component.functional) {
          const originalRender = component.render;
          component.render = function renderWithStyleInjection(h, context) {
            hook.call(context);
            return originalRender(h, context)
          };
        } else {
          const existing = component.beforeCreate;
          component.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
      }
    }
    return component
  }
  function __vue_create_injector__$6() {
    const head = document.head || document.getElementsByTagName('head')[0];
    const styles = __vue_create_injector__$6.styles || (__vue_create_injector__$6.styles = {});
    const isOldIE =
      typeof navigator !== 'undefined' &&
      /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
    return function addStyle(id, css) {
      if (document.querySelector('style[data-vue-ssr-id~="' + id + '"]')) return
      const group = isOldIE ? css.media || 'default' : id;
      const style = styles[group] || (styles[group] = { ids: [], parts: [], element: undefined });
      if (!style.ids.includes(id)) {
        let code = css.source;
        let index = style.ids.length;
        style.ids.push(id);
        if (isOldIE) {
          style.element = style.element || document.querySelector('style[data-group=' + group + ']');
        }
        if (!style.element) {
          const el = style.element = document.createElement('style');
          el.type = 'text/css';
          if (css.media) el.setAttribute('media', css.media);
          if (isOldIE) {
            el.setAttribute('data-group', group);
            el.setAttribute('data-next-index', '0');
          }
          head.appendChild(el);
        }
        if (isOldIE) {
          index = parseInt(style.element.getAttribute('data-next-index'));
          style.element.setAttribute('data-next-index', index + 1);
        }
        if (style.element.styleSheet) {
          style.parts.push(code);
          style.element.styleSheet.cssText = style.parts
            .filter(Boolean)
            .join('\n');
        } else {
          const textNode = document.createTextNode(code);
          const nodes = style.element.childNodes;
          if (nodes[index]) style.element.removeChild(nodes[index]);
          if (nodes.length) style.element.insertBefore(textNode, nodes[index]);
          else style.element.appendChild(textNode);
        }
      }
    }
  }
  var bigComponent$1 = __vue_normalize__$6(
    __vue_template__$6,
    __vue_inject_styles__$6,
    typeof __vue_script__$6 === 'undefined' ? {} : __vue_script__$6,
    __vue_scope_id__$6,
    __vue_is_functional_template__$6,
    __vue_module_identifier__$6,
    typeof __vue_create_injector__$6 !== 'undefined' ? __vue_create_injector__$6 : function () {},
    typeof __vue_create_injector_ssr__ !== 'undefined' ? __vue_create_injector_ssr__ : function () {}
  );
  Vue.use(VueI18n);
  var i18n = new VueI18n({
    locale: document.documentElement.lang,
    fallbackLocale: 'ja',
    messages: {
      'en': {
        patchouli: {
          bookmarkTooltip: '{count} bookmarks',
        },
        koakuma: {
          processed: '{count} imgs processed',
          tagsPlaceholder: 'tags filter example: flandre|sister',
          buttonGo: 'Go',
          buttonPause: 'Pause',
          buttonEnd: 'End',
          fitWidth: 'fit browser width',
          sortByPopularity: 'sort by popularity',
          sortByDate: 'sort by date',
        },
        contextMenu: {
          thumbUp: 'Like',
          openBookmarkPage: 'Add Bookmark Page',
          download: 'Download',
          addToBlacklist: 'Add to Blacklist',
          preview: 'Preview',
          followUser: 'Follow',
        },
        config: {
          contextMenuExtension: 'Right click extension',
          blacklist: 'Blacklist',
          userTooltip: 'Illustrator tooltip',
          hoverPlay: 'Mouse hover play ugoira',
        },
      },
      'ja': {
        patchouli: {
          bookmarkTooltip: '{count} 件のブックマーク',
        },
        koakuma: {
          processed: '{count} 件が処理された',
          tagsPlaceholder: 'タグフィルター 例: フランドール|妹様',
          buttonGo: '捜す',
          buttonPause: '中断',
          buttonEnd: '終了',
          fitWidth: '全幅',
          sortByPopularity: '人気順',
          sortByDate: '投稿順',
        },
        contextMenu: {
          thumbUp: 'いいね',
          openBookmarkPage: 'ブックマーク追加ページ',
          download: 'ダウンロード',
          addToBlacklist: 'ブラックリストへ',
          preview: 'プレビュー',
          followUser: 'フォローする',
        },
        config: {
          contextMenuExtension: '右クリックの拡張機能',
          blacklist: 'ブラックリスト',
          userTooltip: 'イラストレーターツールチップ',
          hoverPlay: 'マウスオーバーでうごイラ再生',
        },
      },
      'zh': {
        patchouli: {
          bookmarkTooltip: '{count} 个收藏',
        },
        koakuma: {
          processed: '已处理 {count} 张',
          tagsPlaceholder: '标签过滤 例: 芙兰朵露|二小姐',
          buttonGo: '找',
          buttonPause: '停',
          buttonEnd: '完',
          fitWidth: '自适应浏览器宽度',
          sortByPopularity: '以人气排序',
          sortByDate: '以日期排序',
        },
        contextMenu: {
          thumbUp: '赞',
          openBookmarkPage: '开启添加收藏页',
          download: '下载',
          addToBlacklist: '拉黑',
          preview: '原图预览',
          followUser: '加关注',
        },
        config: {
          contextMenuExtension: '右键扩展',
          blacklist: '黑名單',
          userTooltip: '绘师提示框',
          hoverPlay: '鼠标播放动图',
        },
      },
      'zh-tw': {
        patchouli: {
          bookmarkTooltip: '{count} 個收藏',
        },
        koakuma: {
          processed: '已處理 {count} 張',
          tagsPlaceholder: '標籤過濾 例: 芙蘭朵露|二小姐',
          buttonGo: '找',
          buttonPause: '停',
          buttonEnd: '完',
          fitWidth: '自適應瀏覽器寬度',
          sortByPopularity: '以人氣排序',
          sortByDate: '以日期排序',
        },
        contextMenu: {
          thumbUp: '讚',
          openBookmarkPage: '開啟添加收藏頁',
          download: '下載',
          addToBlacklist: '加入黑名單',
          preview: '原圖預覽',
          followUser: '加關注',
        },
        config: {
          contextMenuExtension: '擴充右鍵',
          blacklist: '黑名單',
          userTooltip: '繪師提示框',
          hoverPlay: '滑鼠播放動圖',
        },
      },
    },
  });
  store.commit('prepareMountPoint');
  store.commit('loadConfig');
  store.commit('applyConfig');
  if (store.state.pageType !== 'NO_SUPPORT') {
    removeAnnoyings();
    const fontawesome = $el('link', {
      rel: 'stylesheet',
      href: 'https://use.fontawesome.com/releases/v5.0.13/css/all.css',
      integrity: 'sha384-DNOHZ68U8hZfKXOrtjWvjxusGo9WQnrNx2sqG0tfsghAvtVlRW3tvkXWZh58N9jp',
      crossOrigin: 'anonymous' });
    document.head.appendChild(fontawesome);
    window.DataView = unsafeWindow.DataView;
    window.ArrayBuffer = unsafeWindow.ArrayBuffer;
    $('._global-header').classList.add('koakuma-placeholder');
    const Patchouli = new Vue({
      i18n,
      store,
      computed: {
        currentLocale() {
          return this.$store.state.locale;
        },
      },
      watch: {
        currentLocale(newValue) {
          this.$i18n.locale = newValue;
        },
      },
      render: h => h(patchouli),
    });
    const Koakuma = new Vue({
      i18n,
      store,
      computed: {
        currentLocale() {
          return this.$store.state.locale;
        },
      },
      watch: {
        currentLocale(newValue) {
          this.$i18n.locale = newValue;
        },
      },
      render: h => h(koakuma),
    });
    const BigComponent = new Vue({
      i18n,
      store,
      computed: {
        currentLocale() {
          return this.$store.state.locale;
        },
      },
      watch: {
        currentLocale(newValue) {
          this.$i18n.locale = newValue;
        },
      },
      render: h => h(bigComponent$1),
    });
    store.dispatch('start', { times: 1 }).then(() => {
      Patchouli.$mount(store.state.patchouliMountPoint);
      Koakuma.$mount(store.state.koakumaMountPoint);
      BigComponent.$mount(store.state.bigComponentMountPoint);
      $('._global-header').classList.remove('koakuma-placeholder');
    }).catch(error => {
      $print.error('Fail to first mount', error);
    });
    document.body.addEventListener('click', (event) => {
      if (!$parents(event.target).find((el) => el.id === 'koakuma-bookmark-input-usual-switch')) {
        Koakuma.$children[0].usualSwitchOn = false;
      }
      if (!$parents(event.target).find((el) => el.id === 'koakuma-sorting-order-select-switch')) {
        Koakuma.$children[0].sortingOrderSwitchOn = false;
      }
      if (store.state.contextMenu.active) {
        store.commit('deactivateContextMenu');
      }
    });
    Object.assign(unsafeWindow, {
      Patchouli,
      Koakuma,
      BigComponent,
    });
  }

}(Vue,Vuex,VueI18n));
