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
// @require           https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.17/vue.min.js
// @require           https://cdnjs.cloudflare.com/ajax/libs/vuex/3.0.1/vuex.min.js
// @require           https://cdnjs.cloudflare.com/ajax/libs/vue-i18n/8.0.0/vue-i18n.min.js
// @require           https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min.js
// @require           https://cdn.rawgit.com/FlandreDaisuki/zip_player/ecf3751317079fcabef70af4bd0e92411288303d/dist/zip_player.iife.min.js
// @icon              http://i.imgur.com/VwoYc5w.png
// @connect           i.pximg.net
// @noframes
// @author            FlandreDaisuki
// @license           The MIT License (MIT) Copyright (c) 2016-2018 FlandreDaisuki
// @compatible        firefox >=52
// @compatible        chrome >=55
// @version           4.1.10
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
          return this.$t('koakuma.buttonEnd');
        } else if (this.status.isPaused) {
          return this.$t('koakuma.buttonGo');
        } else {
          return this.$t('koakuma.buttonPause');
        }
      },
      sortingOrderMsg() {
        const p = this.$t('koakuma.sortByPopularity');
        const d = this.$t('koakuma.sortByDate');
        const ml = Math.max(p.length, d.length);
        const [xp, xd] = [p, d].map(s => {
          if (s.length < ml) {
            const ps = ml - s.length;
            const hps = Math.floor(ps / 2);
            return '&nbsp;'.repeat(hps) + s + '&nbsp;'.repeat(ps - hps);
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
          this.$store.dispatch('start');
        } else {
          this.$store.commit('pause');
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
        if (event.target.id === 'koakuma-options-width-compress') {
          this.config.fitwidth = false;
        } else if (event.target.id === 'koakuma-options-width-expand') {
          this.config.fitwidth = true;
        }
        this.$store.commit('saveConfig');
        this.$store.commit('applyConfig');
      },
      tagsFilterInput(event) {
        if (this.debounceId4tagsFilter) {
          clearTimeout(this.debounceId4tagsFilter);
        }
        this.debounceId4tagsFilter = setTimeout(() => {
          this.debounceId4tagsFilter = null;
          this.filters.tag = new RegExp(event.target.value, 'ig');
        }, 1500);
      },
      clickSortingOrder(event) {
        if (event.target.id === 'koakuma-sorting-order-by-popularity') {
          this.config.sort = 1;
        } else {
          this.config.sort = 0;
        }
        this.$store.commit('saveConfig');
        this.$store.commit('applyConfig');
        this.sortingOrderSwitchOn = false;
      },
      openBigComponentInConfigMode() {
        this.$store.commit('openBigComponent', { mode: 'config', data: null });
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
    const __vue_inject_styles__ = function (inject) {
      if (!inject) return
      inject("data-v-c18a7d98_0", { source: "\n@keyframes slidedown-data-v-c18a7d98 {\nfrom {\n    transform: translateY(-100%);\n}\nto {\n    transform: translateY(0);\n}\n}\na[role=\"button\"][data-v-c18a7d98] {\n  text-decoration: none;\n}\na[role=\"button\"] > .fa-angle-down[data-v-c18a7d98] {\n  padding: 2px;\n}\n#koakuma[data-v-c18a7d98] {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  position: sticky;\n  top: 0;\n  z-index: 3;\n  background-color: #e5e4ff;\n  box-shadow: 0 2px 2px #777;\n  padding: 4px;\n  color: #00186c;\n  font-size: 16px;\n  animation: slidedown-data-v-c18a7d98 0.7s linear;\n}\n#koakuma > div[data-v-c18a7d98] {\n  margin: 0 10px;\n  display: inline-flex;\n}\n.bookmark-count[data-v-c18a7d98] {\n  display: inline-flex !important;\n  align-items: center;\n  margin-right: 0;\n  border-radius: 3px 0 0 3px;\n}\n#koakuma-bookmark-sort-block[data-v-c18a7d98],\n#koakuma-sorting-order-block[data-v-c18a7d98] {\n  position: relative;\n  height: 20px;\n  box-shadow: 0 0 1px #069;\n  border-radius: 4px;\n}\n#koakuma-sorting-order-block[data-v-c18a7d98] {\n  background-color: #cef;\n}\n#koakuma-bookmark-sort-input[data-v-c18a7d98] {\n  -moz-appearance: textfield;\n  border: none;\n  background-color: transparent;\n  padding: 0;\n  color: inherit;\n  font-size: 16px;\n  display: inline-block;\n  cursor: ns-resize;\n  text-align: center;\n  max-width: 50px;\n}\n#koakuma-bookmark-sort-input[data-v-c18a7d98]::-webkit-inner-spin-button,\n#koakuma-bookmark-sort-input[data-v-c18a7d98]::-webkit-outer-spin-button {\n  /* https://css-tricks.com/numeric-inputs-a-comparison-of-browser-defaults/ */\n  -webkit-appearance: none;\n  margin: 0;\n}\n#koakuma-bookmark-tags-filter-input[data-v-c18a7d98] {\n  min-width: 300px;\n}\n#koakuma-bookmark-input-usual-switch[data-v-c18a7d98],\n#koakuma-sorting-order-select-switch[data-v-c18a7d98] {\n  background-color: #cef;\n  padding: 1px;\n  border-left: 1px solid #888;\n  border-radius: 0 3px 3px 0;\n  cursor: pointer;\n  display: inline-flex;\n  align-items: center;\n}\n#koakuma-sorting-order-select-switch[data-v-c18a7d98] {\n  border: none;\n  border-radius: 3px;\n}\n#koakuma-bookmark-input-usual-list[data-v-c18a7d98],\n#koakuma-sorting-order-select-list[data-v-c18a7d98] {\n  border-radius: 3px;\n  background-color: #cef;\n  box-shadow: 0 0 2px #069;\n  position: absolute;\n  top: 100%;\n  width: 100%;\n  margin-top: 1px;\n}\n#koakuma-bookmark-input-usual-list > li[data-v-c18a7d98]::after,\n#koakuma-sorting-order-select-list > li[data-v-c18a7d98]::after {\n  content: \"\";\n  box-shadow: 0 0 0 1px #89d8ff;\n  display: inline-block;\n  margin: 0;\n  height: 0;\n  line-height: 0;\n  font-size: 0;\n  position: absolute;\n  width: 100%;\n  transform: scaleX(0.8);\n}\n#koakuma-bookmark-input-usual-list > li[data-v-c18a7d98]:last-child::after,\n#koakuma-sorting-order-select-list > li[data-v-c18a7d98]:last-child::after {\n  box-shadow: none;\n}\n.usual-list-link[data-v-c18a7d98]:hover::before,\n.sorting-order-link[data-v-c18a7d98]:hover::before {\n  content: \"⮬\";\n  position: absolute;\n  left: 6px;\n  font-weight: bolder;\n}\n.usual-list-link[data-v-c18a7d98],\n.sorting-order-link[data-v-c18a7d98] {\n  display: block;\n  cursor: pointer;\n  text-align: center;\n}\n#koakuma-sorting-order-select-output[data-v-c18a7d98] {\n  padding: 0 16px;\n  display: flex;\n  align-items: center;\n}\n#koakuma-sorting-order-select[data-v-c18a7d98] {\n  font-size: 14px;\n}\n#koakuma-options-block > *[data-v-c18a7d98] {\n  margin: 0 5px;\n}\n#koakuma-main-button[data-v-c18a7d98] {\n  border: none;\n  padding: 2px 14px;\n  border-radius: 3px;\n  font-size: 16px;\n}\n#koakuma-main-button[data-v-c18a7d98]:enabled {\n  transform: translate(-1px, -1px);\n  box-shadow: 1px 1px 1px hsl(60, 0%, 30%);\n  cursor: pointer;\n}\n#koakuma-main-button[data-v-c18a7d98]:enabled:hover {\n  transform: translate(0);\n  box-shadow: none;\n}\n#koakuma-main-button[data-v-c18a7d98]:enabled:active {\n  transform: translate(1px, 1px);\n  box-shadow: -1px -1px 1px hsl(60, 0%, 30%);\n}\n#koakuma-main-button.go[data-v-c18a7d98] {\n  background-color: hsl(141, 100%, 50%);\n}\n#koakuma-main-button.paused[data-v-c18a7d98] {\n  background-color: hsl(60, 100%, 50%);\n}\n#koakuma-main-button.end[data-v-c18a7d98] {\n  background-color: #878787;\n  color: #fff;\n  opacity: 0.87;\n}\n#koakuma-options-width-compress[data-v-c18a7d98],\n#koakuma-options-width-expand[data-v-c18a7d98],\n#koakuma-options-config[data-v-c18a7d98] {\n  cursor: pointer;\n}\n", map: {"version":3,"sources":["/home/flandre/dev/Patchouli/src/components/Koakuma.vue"],"names":[],"mappings":";AAwNA;AACA;IACA,6BAAA;CACA;AACA;IACA,yBAAA;CACA;CACA;AACA;EACA,sBAAA;CACA;AACA;EACA,aAAA;CACA;AACA;EACA,cAAA;EACA,wBAAA;EACA,oBAAA;EACA,iBAAA;EACA,OAAA;EACA,WAAA;EACA,0BAAA;EACA,2BAAA;EACA,aAAA;EACA,eAAA;EACA,gBAAA;EACA,iDAAA;CACA;AACA;EACA,eAAA;EACA,qBAAA;CACA;AACA;EACA,gCAAA;EACA,oBAAA;EACA,gBAAA;EACA,2BAAA;CACA;AACA;;EAEA,mBAAA;EACA,aAAA;EACA,yBAAA;EACA,mBAAA;CACA;AACA;EACA,uBAAA;CACA;AACA;EACA,2BAAA;EACA,aAAA;EACA,8BAAA;EACA,WAAA;EACA,eAAA;EACA,gBAAA;EACA,sBAAA;EACA,kBAAA;EACA,mBAAA;EACA,gBAAA;CACA;AACA;;EAEA,6EAAA;EACA,yBAAA;EACA,UAAA;CACA;AACA;EACA,iBAAA;CACA;AACA;;EAEA,uBAAA;EACA,aAAA;EACA,4BAAA;EACA,2BAAA;EACA,gBAAA;EACA,qBAAA;EACA,oBAAA;CACA;AACA;EACA,aAAA;EACA,mBAAA;CACA;AACA;;EAEA,mBAAA;EACA,uBAAA;EACA,yBAAA;EACA,mBAAA;EACA,UAAA;EACA,YAAA;EACA,gBAAA;CACA;AACA;;EAEA,YAAA;EACA,8BAAA;EACA,sBAAA;EACA,UAAA;EACA,UAAA;EACA,eAAA;EACA,aAAA;EACA,mBAAA;EACA,YAAA;EACA,uBAAA;CACA;AACA;;EAEA,iBAAA;CACA;AACA;;EAEA,aAAA;EACA,mBAAA;EACA,UAAA;EACA,oBAAA;CACA;AACA;;EAEA,eAAA;EACA,gBAAA;EACA,mBAAA;CACA;AACA;EACA,gBAAA;EACA,cAAA;EACA,oBAAA;CACA;AACA;EACA,gBAAA;CACA;AACA;EACA,cAAA;CACA;AACA;EACA,aAAA;EACA,kBAAA;EACA,mBAAA;EACA,gBAAA;CACA;AACA;EACA,iCAAA;EACA,yCAAA;EACA,gBAAA;CACA;AACA;EACA,wBAAA;EACA,iBAAA;CACA;AACA;EACA,+BAAA;EACA,2CAAA;CACA;AACA;EACA,sCAAA;CACA;AACA;EACA,qCAAA;CACA;AACA;EACA,0BAAA;EACA,YAAA;EACA,cAAA;CACA;AACA;;;EAGA,gBAAA;CACA","file":"Koakuma.vue","sourcesContent":["<template>\n  <div id=\"koakuma\" >\n    <div class=\"processed\">{{ $t('koakuma.processed', { count: $store.state.pixiv.imgLibrary.length }) }}</div>\n    <div id=\"koakuma-bookmark-sort-block\">\n      <label for=\"koakuma-bookmark-sort-input\" class=\"bookmark-count\">\n        <i class=\"_icon _bookmark-icon-inline\"/>\n        <input\n          id=\"koakuma-bookmark-sort-input\"\n          :value=\"filters.limit\"\n          type=\"number\"\n          min=\"0\"\n          step=\"1\"\n          @wheel.stop.prevent=\"sortInputWheel\"\n          @input=\"sortInputInput\">\n      </label>\n      <a\n        id=\"koakuma-bookmark-input-usual-switch\"\n        role=\"button\"\n        @click.left=\"usualSwitchOn = !usualSwitchOn\">\n        <i class=\"fas fa-angle-down\"/>\n      </a>\n      <ul v-show=\"usualSwitchOn\" id=\"koakuma-bookmark-input-usual-list\">\n        <li v-for=\"usual in usualList\" :key=\"usual\">\n          <a\n            role=\"button\"\n            class=\"usual-list-link\"\n            @click.left=\"filters.limit = usual; usualSwitchOn = false\">{{ usual }}</a>\n        </li>\n      </ul>\n    </div>\n    <div>\n      <input\n        id=\"koakuma-bookmark-tags-filter-input\"\n        :placeholder=\"$t('koakuma.tagsPlaceholder')\"\n        type=\"text\"\n        @input=\"tagsFilterInput\">\n    </div>\n    <div>\n      <button\n        id=\"koakuma-main-button\"\n        :disabled=\"status.isEnded\"\n        :class=\"statusClass\"\n        @mouseup=\"clickMainButton\">\n        {{ buttonMsg }}\n      </button>\n    </div>\n    <div id=\"koakuma-sorting-order-block\">\n      <a\n        id=\"koakuma-sorting-order-select-switch\"\n        role=\"button\"\n        @click.left=\"sortingOrderSwitchOn = !sortingOrderSwitchOn\">\n        <output id=\"koakuma-sorting-order-select-output\" v-html=\"sortingOrderMsg\"/>\n        <i class=\"fas fa-angle-down\"/>\n      </a>\n      <ul v-show=\"sortingOrderSwitchOn\" id=\"koakuma-sorting-order-select-list\">\n        <li>\n          <a\n            id=\"koakuma-sorting-order-by-popularity\"\n            class=\"sorting-order-link\"\n            role=\"button\"\n            @click.left=\"clickSortingOrder\">{{ $t(\"koakuma.sortByPopularity\") }}</a>\n        </li>\n        <li>\n          <a\n            id=\"koakuma-sorting-order-by-date\"\n            class=\"sorting-order-link\"\n            role=\"button\"\n            @click.left=\"clickSortingOrder\">{{ $t(\"koakuma.sortByDate\") }}</a>\n        </li>\n      </ul>\n    </div>\n    <div id=\"koakuma-options-block\">\n      <div>\n        <i\n          v-show=\"config.fitwidth\"\n          id=\"koakuma-options-width-compress\"\n          class=\"fas fa-compress\"\n          @click.left=\"optionsChange\"/>\n        <i\n          v-show=\"!config.fitwidth\"\n          id=\"koakuma-options-width-expand\"\n          class=\"fas fa-expand\"\n          @click.left=\"optionsChange\"/>\n      </div>\n      <div>\n        <i\n          id=\"koakuma-options-config\"\n          class=\"fas fa-cog\"\n          @click.left=\"openBigComponentInConfigMode\"/>\n      </div>\n    </div>\n  </div>\n</template>\n\n<script>\nimport { $print, toInt } from '../lib/utils';\nexport default {\n  data() {\n    return {\n      debounceId4sortInput: null,\n      debounceId4tagsFilter: null,\n      usualSwitchOn: false,\n      sortingOrderSwitchOn: false,\n      usualList: [100, 500, 1000, 3000, 5000, 10000],\n    };\n  },\n  computed: {\n    status() {\n      return this.$store.state.pixiv;\n    },\n    config() {\n      return this.$store.state.config;\n    },\n    statusClass() {\n      return {\n        end: this.status.isEnded,\n        paused: !this.status.isPaused && !this.status.isEnded,\n        go: this.status.isPaused && !this.status.isEnded,\n      };\n    },\n    filters() {\n      return this.$store.state.filters;\n    },\n    buttonMsg() {\n      if (this.status.isEnded) {\n        return this.$t('koakuma.buttonEnd');\n      } else if (this.status.isPaused) {\n        return this.$t('koakuma.buttonGo');\n      } else {\n        return this.$t('koakuma.buttonPause');\n      }\n    },\n    sortingOrderMsg() {\n      const p = this.$t('koakuma.sortByPopularity');\n      const d = this.$t('koakuma.sortByDate');\n      const ml = Math.max(p.length, d.length);\n      const [xp, xd] = [p, d].map(s => {\n        if (s.length < ml) {\n          const ps = ml - s.length; // padding space\n          const hps = Math.floor(ps / 2);\n          return '&nbsp;'.repeat(hps) + s + '&nbsp;'.repeat(ps - hps);\n        }\n        return s;\n      });\n      if (this.config.sort) {\n        return xp;\n      } else {\n        return xd;\n      }\n    },\n  },\n  methods: {\n    clickMainButton() {\n      if (this.status.isPaused) {\n        this.$store.dispatch('start');\n      } else {\n        this.$store.commit('pause');\n      }\n    },\n    sortInputWheel(event) {\n      if (event.deltaY < 0) {\n        this.filters.limit = toInt(event.target.value) + 20;\n      } else {\n        this.filters.limit = Math.max(0, toInt(event.target.value) - 20);\n      }\n    },\n    sortInputInput(event) {\n      if (this.debounceId4sortInput) {\n        clearTimeout(this.debounceId4sortInput);\n      }\n      this.debounceId4sortInput = setTimeout(() => {\n        this.debounceId4sortInput = null;\n        this.filters.limit = Math.max(0, toInt(event.target.value));\n      }, 500);\n    },\n    optionsChange(event) {\n      $print.debug('Koakuma#optionsChange: event', event);\n      if (event.target.id === 'koakuma-options-width-compress') {\n        this.config.fitwidth = false;\n      } else if (event.target.id === 'koakuma-options-width-expand') {\n        this.config.fitwidth = true;\n      }\n      this.$store.commit('saveConfig');\n      this.$store.commit('applyConfig');\n    },\n    tagsFilterInput(event) {\n      if (this.debounceId4tagsFilter) {\n        clearTimeout(this.debounceId4tagsFilter);\n      }\n      this.debounceId4tagsFilter = setTimeout(() => {\n        this.debounceId4tagsFilter = null;\n        this.filters.tag = new RegExp(event.target.value, 'ig');\n      }, 1500);\n    },\n    clickSortingOrder(event) {\n      $print.debug('Koakuma#clickSortingOrder: event', event);\n\n      if (event.target.id === 'koakuma-sorting-order-by-popularity') {\n        this.config.sort = 1;\n      } else {\n        this.config.sort = 0;\n      }\n\n      this.$store.commit('saveConfig');\n      this.$store.commit('applyConfig');\n\n      this.sortingOrderSwitchOn = false;\n    },\n    openBigComponentInConfigMode() {\n      this.$store.commit('openBigComponent', { mode: 'config', data: null });\n    },\n  },\n};\n</script>\n\n<style scoped>\n@keyframes slidedown {\n  from {\n    transform: translateY(-100%);\n  }\n  to {\n    transform: translateY(0);\n  }\n}\na[role=\"button\"] {\n  text-decoration: none;\n}\na[role=\"button\"] > .fa-angle-down {\n  padding: 2px;\n}\n#koakuma {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  position: sticky;\n  top: 0;\n  z-index: 3;\n  background-color: #e5e4ff;\n  box-shadow: 0 2px 2px #777;\n  padding: 4px;\n  color: #00186c;\n  font-size: 16px;\n  animation: slidedown 0.7s linear;\n}\n#koakuma > div {\n  margin: 0 10px;\n  display: inline-flex;\n}\n.bookmark-count {\n  display: inline-flex !important;\n  align-items: center;\n  margin-right: 0;\n  border-radius: 3px 0 0 3px;\n}\n#koakuma-bookmark-sort-block,\n#koakuma-sorting-order-block {\n  position: relative;\n  height: 20px;\n  box-shadow: 0 0 1px #069;\n  border-radius: 4px;\n}\n#koakuma-sorting-order-block {\n  background-color: #cef;\n}\n#koakuma-bookmark-sort-input {\n  -moz-appearance: textfield;\n  border: none;\n  background-color: transparent;\n  padding: 0;\n  color: inherit;\n  font-size: 16px;\n  display: inline-block;\n  cursor: ns-resize;\n  text-align: center;\n  max-width: 50px;\n}\n#koakuma-bookmark-sort-input::-webkit-inner-spin-button,\n#koakuma-bookmark-sort-input::-webkit-outer-spin-button {\n  /* https://css-tricks.com/numeric-inputs-a-comparison-of-browser-defaults/ */\n  -webkit-appearance: none;\n  margin: 0;\n}\n#koakuma-bookmark-tags-filter-input {\n  min-width: 300px;\n}\n#koakuma-bookmark-input-usual-switch,\n#koakuma-sorting-order-select-switch {\n  background-color: #cef;\n  padding: 1px;\n  border-left: 1px solid #888;\n  border-radius: 0 3px 3px 0;\n  cursor: pointer;\n  display: inline-flex;\n  align-items: center;\n}\n#koakuma-sorting-order-select-switch {\n  border: none;\n  border-radius: 3px;\n}\n#koakuma-bookmark-input-usual-list,\n#koakuma-sorting-order-select-list {\n  border-radius: 3px;\n  background-color: #cef;\n  box-shadow: 0 0 2px #069;\n  position: absolute;\n  top: 100%;\n  width: 100%;\n  margin-top: 1px;\n}\n#koakuma-bookmark-input-usual-list > li::after,\n#koakuma-sorting-order-select-list > li::after {\n  content: \"\";\n  box-shadow: 0 0 0 1px #89d8ff;\n  display: inline-block;\n  margin: 0;\n  height: 0;\n  line-height: 0;\n  font-size: 0;\n  position: absolute;\n  width: 100%;\n  transform: scaleX(0.8);\n}\n#koakuma-bookmark-input-usual-list > li:last-child::after,\n#koakuma-sorting-order-select-list > li:last-child::after {\n  box-shadow: none;\n}\n.usual-list-link:hover::before,\n.sorting-order-link:hover::before {\n  content: \"⮬\";\n  position: absolute;\n  left: 6px;\n  font-weight: bolder;\n}\n.usual-list-link,\n.sorting-order-link {\n  display: block;\n  cursor: pointer;\n  text-align: center;\n}\n#koakuma-sorting-order-select-output {\n  padding: 0 16px;\n  display: flex;\n  align-items: center;\n}\n#koakuma-sorting-order-select {\n  font-size: 14px;\n}\n#koakuma-options-block > * {\n  margin: 0 5px;\n}\n#koakuma-main-button {\n  border: none;\n  padding: 2px 14px;\n  border-radius: 3px;\n  font-size: 16px;\n}\n#koakuma-main-button:enabled {\n  transform: translate(-1px, -1px);\n  box-shadow: 1px 1px 1px hsl(60, 0%, 30%);\n  cursor: pointer;\n}\n#koakuma-main-button:enabled:hover {\n  transform: translate(0);\n  box-shadow: none;\n}\n#koakuma-main-button:enabled:active {\n  transform: translate(1px, 1px);\n  box-shadow: -1px -1px 1px hsl(60, 0%, 30%);\n}\n#koakuma-main-button.go {\n  background-color: hsl(141, 100%, 50%);\n}\n#koakuma-main-button.paused {\n  background-color: hsl(60, 100%, 50%);\n}\n#koakuma-main-button.end {\n  background-color: #878787;\n  color: #fff;\n  opacity: 0.87;\n}\n#koakuma-options-width-compress,\n#koakuma-options-width-expand,\n#koakuma-options-config {\n  cursor: pointer;\n}\n</style>\n"]}, media: undefined });
    };
    const __vue_scope_id__ = "data-v-c18a7d98";
    const __vue_module_identifier__ = undefined;
    const __vue_is_functional_template__ = false;
    function __vue_normalize__(
      template, style, script$$1,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script$$1 === 'function' ? script$$1.options : script$$1) || {};
      component.__file = "/home/flandre/dev/Patchouli/src/components/Koakuma.vue";
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
      { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
      __vue_inject_styles__,
      __vue_script__,
      __vue_scope_id__,
      __vue_is_functional_template__,
      __vue_module_identifier__,
      __vue_create_injector__,
      undefined
    );
  var script$1 = {
    props: {
      imgUrl: {
        type: String,
        default: '',
      },
      illustId: {
        type: String,
        default: '',
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
        default: '',
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
            type: 'image-item-image',
          };
          this.$store.commit('activateContextMenu', payload);
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
          if (event.type === 'mouseenter') {
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
    const __vue_inject_styles__$1 = function (inject) {
      if (!inject) return
      inject("data-v-7f7fa2ee_0", { source: "\n.image-item-image[data-v-7f7fa2ee] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  position: relative;\n}\n.image-flexbox[data-v-7f7fa2ee] {\n  display: flex;\n  flex-flow: column;\n  justify-content: center;\n  align-items: center;\n  z-index: 0;\n  border: 1px solid rgba(0, 0, 0, 0.04);\n  position: relative;\n  height: 200px;\n}\n.image-flexbox[data-v-7f7fa2ee]:hover {\n  text-decoration: none;\n}\n.top-right-slot[data-v-7f7fa2ee] {\n  flex: none;\n  display: flex;\n  align-items: center;\n  z-index: 1;\n  box-sizing: border-box;\n  margin: 0 0 -24px auto;\n  padding: 6px;\n  height: 24px;\n  background: #000;\n  background: rgba(0, 0, 0, 0.4);\n  border-radius: 0 0 0 4px;\n  color: #fff;\n  font-size: 12px;\n  line-height: 1;\n  font-weight: 700;\n}\n.ugoira-icon[data-v-7f7fa2ee] {\n  position: absolute;\n  flex: none;\n  width: 40px;\n  height: 40px;\n  background: url(https://s.pximg.net/www/images/icon/playable-icon.svg) 50%\n    no-repeat;\n  top: 50%;\n  left: 50%;\n  margin: -20px 0 0 -20px;\n}\nimg[data-v-7f7fa2ee],\ncanvas[data-v-7f7fa2ee] {\n  max-height: 100%;\n  max-width: 100%;\n}\n._one-click-bookmark[data-v-7f7fa2ee] {\n  right: 0;\n  width: 24px;\n  height: 24px;\n  line-height: 24px;\n  z-index: 2;\n  text-align: center;\n  cursor: pointer;\n  background: url(https://s.pximg.net/www/images/bookmark-heart-off.svg) center\n    transparent;\n  background-repeat: no-repeat;\n  background-size: cover;\n  opacity: 0.8;\n  filter: alpha(opacity=80);\n  transition: opacity 0.2s ease-in-out;\n}\n._one-click-bookmark.on[data-v-7f7fa2ee] {\n  background-image: url(https://s.pximg.net/www/images/bookmark-heart-on.svg);\n}\n.bookmark-input-container[data-v-7f7fa2ee] {\n  position: absolute;\n  left: 0;\n  top: 0;\n  background: rgba(0, 0, 0, 0.4);\n  padding: 6px;\n  border-radius: 0 0 4px 0;\n}\n", map: {"version":3,"sources":["/home/flandre/dev/Patchouli/src/components/DefaultImageItemImage.vue"],"names":[],"mappings":";AAwKA;EACA,cAAA;EACA,oBAAA;EACA,wBAAA;EACA,mBAAA;CACA;AACA;EACA,cAAA;EACA,kBAAA;EACA,wBAAA;EACA,oBAAA;EACA,WAAA;EACA,sCAAA;EACA,mBAAA;EACA,cAAA;CACA;AACA;EACA,sBAAA;CACA;AACA;EACA,WAAA;EACA,cAAA;EACA,oBAAA;EACA,WAAA;EACA,uBAAA;EACA,uBAAA;EACA,aAAA;EACA,aAAA;EACA,iBAAA;EACA,+BAAA;EACA,yBAAA;EACA,YAAA;EACA,gBAAA;EACA,eAAA;EACA,iBAAA;CACA;AACA;EACA,mBAAA;EACA,WAAA;EACA,YAAA;EACA,aAAA;EACA;cACA;EACA,SAAA;EACA,UAAA;EACA,wBAAA;CACA;AACA;;EAEA,iBAAA;EACA,gBAAA;CACA;AACA;EACA,SAAA;EACA,YAAA;EACA,aAAA;EACA,kBAAA;EACA,WAAA;EACA,mBAAA;EACA,gBAAA;EACA;gBACA;EACA,6BAAA;EACA,uBAAA;EACA,aAAA;EACA,0BAAA;EACA,qCAAA;CACA;AACA;EACA,4EAAA;CACA;AACA;EACA,mBAAA;EACA,QAAA;EACA,OAAA;EACA,+BAAA;EACA,aAAA;EACA,yBAAA;CACA","file":"DefaultImageItemImage.vue","sourcesContent":["<template>\n  <div class=\"image-item-image\">\n    <a\n      :href=\"illustPageUrl\"\n      class=\"image-flexbox\"\n      rel=\"noopener\"\n      @click.right=\"activateContextMenu\"\n      @mouseenter=\"controlUgoira\"\n      @mouseleave=\"controlUgoira\">\n\n      <div v-if=\"illustPageCount > 1\" class=\"top-right-slot\">\n        <span><i class=\"far fa-images\"/>\n          {{ illustPageCount }}</span>\n      </div>\n\n      <img\n        v-show=\"!ugoiraPlayed\"\n        :data-src=\"imgUrl\"\n        :src=\"imgUrl\">\n      <div\n        v-if=\"isUgoira\"\n        v-show=\"!ugoiraPlayed\"\n        class=\"ugoira-icon\"/>\n      <canvas\n        v-if=\"isUgoira\"\n        v-show=\"ugoiraPlayed\"\n        ref=\"smallUgoiraPreview\"/>\n    </a>\n    <div\n      :class=\"{on:selfIsBookmarked}\"\n      :title=\"selfIsBookmarked\"\n      class=\"_one-click-bookmark\"\n      @click.left.prevent.stop=\"oneClickBookmarkAdd\"/>\n    <div v-if=\"bookmarkId\" class=\"bookmark-input-container\">\n      <input\n        :value=\"bookmarkId\"\n        type=\"checkbox\"\n        name=\"book_id[]\">\n    </div>\n  </div>\n</template>\n\n<script>\nimport { $print } from '../lib/utils';\nimport { PixivAPI } from '../lib/pixiv';\n\nexport default {\n  props: {\n    imgUrl: {\n      type: String,\n      default: '',\n    },\n    illustId: {\n      type: String,\n      default: '',\n    },\n    illustPageCount: {\n      type: Number,\n      default: 1,\n    },\n    isUgoira: {\n      type: Boolean,\n      default: false,\n    },\n    isBookmarked: {\n      type: Boolean,\n      default: false,\n    },\n    bookmarkId: {\n      type: String,\n      default: '',\n    },\n  },\n  data() {\n    return {\n      selfIsBookmarked: this.isBookmarked,\n      ugoiraPlayed: false,\n      ugoiraPlayer: null,\n      ugoiraMeta: null,\n    };\n  },\n  computed: {\n    illustPageUrl() {\n      return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;\n    },\n    canHoverPlay() {\n      return this.$store.state.config.hoverPlay;\n    },\n  },\n  mounted() {\n    this.$nextTick(async() => {\n      if (this.isUgoira && this.canHoverPlay) {\n        this.ugoiraMeta = await PixivAPI.getIllustUgoiraMetaData(this.illustId);\n      }\n    });\n  },\n  methods: {\n    async oneClickBookmarkAdd() {\n      if (!this.selfIsBookmarked) {\n        if (await PixivAPI.postRPCAddBookmark(this.illustId)) {\n          this.selfIsBookmarked = true;\n        }\n      } else {\n        // this.bookmarkId might be empty...\n        // Because RPC API has no bookmarkId returned...\n        let bookmarkId = this.bookmarkId;\n        if (!bookmarkId) {\n          const data = await PixivAPI.getIllustBookmarkData(this.illustId);\n          bookmarkId = data.bookmarkData.id;\n        }\n        if (await PixivAPI.postRPCDeleteBookmark(bookmarkId)) {\n          this.selfIsBookmarked = false;\n        }\n      }\n    },\n    activateContextMenu(event) {\n      $print.debug('DefaultImageItemImage#activateContextMenu', event);\n      if (this.$store.state.config.contextMenu) {\n        event.preventDefault();\n        const payload = {};\n\n        payload.position = {\n          x: event.clientX,\n          y: event.clientY,\n        };\n\n        payload.data = {\n          illustId: this.illustId,\n          type: 'image-item-image',\n        };\n\n        this.$store.commit('activateContextMenu', payload);\n      }\n    },\n    controlUgoira(event) {\n      if (!this.ugoiraMeta) {\n        return;\n      }\n      if (!this.ugoiraPlayer) {\n        try {\n          this.ugoiraPlayer = new ZipImagePlayer({\n            canvas: this.$refs.smallUgoiraPreview,\n            source: this.ugoiraMeta.src,\n            metadata: this.ugoiraMeta,\n            chunkSize: 300000,\n            loop: true,\n            autosize: true,\n          });\n        } catch (error) {\n          $print.error(error);\n        }\n      }\n      if (this.canHoverPlay) {\n        if (event.type === 'mouseenter') {\n          this.ugoiraPlayed = true;\n          this.ugoiraPlayer.play();\n        } else {\n          this.ugoiraPlayed = false;\n          this.ugoiraPlayer.pause();\n          this.ugoiraPlayer.rewind();\n        }\n      }\n    },\n  },\n};\n</script>\n\n<style scoped>\n.image-item-image {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  position: relative;\n}\n.image-flexbox {\n  display: flex;\n  flex-flow: column;\n  justify-content: center;\n  align-items: center;\n  z-index: 0;\n  border: 1px solid rgba(0, 0, 0, 0.04);\n  position: relative;\n  height: 200px;\n}\n.image-flexbox:hover {\n  text-decoration: none;\n}\n.top-right-slot {\n  flex: none;\n  display: flex;\n  align-items: center;\n  z-index: 1;\n  box-sizing: border-box;\n  margin: 0 0 -24px auto;\n  padding: 6px;\n  height: 24px;\n  background: #000;\n  background: rgba(0, 0, 0, 0.4);\n  border-radius: 0 0 0 4px;\n  color: #fff;\n  font-size: 12px;\n  line-height: 1;\n  font-weight: 700;\n}\n.ugoira-icon {\n  position: absolute;\n  flex: none;\n  width: 40px;\n  height: 40px;\n  background: url(https://s.pximg.net/www/images/icon/playable-icon.svg) 50%\n    no-repeat;\n  top: 50%;\n  left: 50%;\n  margin: -20px 0 0 -20px;\n}\nimg,\ncanvas {\n  max-height: 100%;\n  max-width: 100%;\n}\n._one-click-bookmark {\n  right: 0;\n  width: 24px;\n  height: 24px;\n  line-height: 24px;\n  z-index: 2;\n  text-align: center;\n  cursor: pointer;\n  background: url(https://s.pximg.net/www/images/bookmark-heart-off.svg) center\n    transparent;\n  background-repeat: no-repeat;\n  background-size: cover;\n  opacity: 0.8;\n  filter: alpha(opacity=80);\n  transition: opacity 0.2s ease-in-out;\n}\n._one-click-bookmark.on {\n  background-image: url(https://s.pximg.net/www/images/bookmark-heart-on.svg);\n}\n.bookmark-input-container {\n  position: absolute;\n  left: 0;\n  top: 0;\n  background: rgba(0, 0, 0, 0.4);\n  padding: 6px;\n  border-radius: 0 0 4px 0;\n}\n</style>\n"]}, media: undefined });
    };
    const __vue_scope_id__$1 = "data-v-7f7fa2ee";
    const __vue_module_identifier__$1 = undefined;
    const __vue_is_functional_template__$1 = false;
    function __vue_normalize__$1(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "/home/flandre/dev/Patchouli/src/components/DefaultImageItemImage.vue";
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
      { render: __vue_render__$1, staticRenderFns: __vue_staticRenderFns__$1 },
      __vue_inject_styles__$1,
      __vue_script__$1,
      __vue_scope_id__$1,
      __vue_is_functional_template__$1,
      __vue_module_identifier__$1,
      __vue_create_injector__$1,
      undefined
    );
  var script$2 = {
    props: {
      illustId: {
        type: String,
        default: '',
      },
      illustTitle: {
        type: String,
        default: '',
      },
      userName: {
        type: String,
        default: '',
      },
      userId: {
        type: String,
        default: '',
      },
      profileImgUrl: {
        type: String,
        default: '',
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
        return this.$t('patchouli.bookmarkTooltip', {
          count: this.bookmarkCount,
        });
      },
      profileImgStyle() {
        return {
          backgroundImage: `url(${this.profileImgUrl})`,
        };
      },
      isMemberIllistPage() {
        return this.$store.state.pageType === 'MEMBER_ILLIST';
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
          if (ct.classList.contains('user-info')) {
            payload.data = {
              illustId: this.illustId,
              type: 'image-item-title-user',
            };
          } else {
            payload.data = {
              illustId: this.illustId,
              type: 'image-item-image',
            };
          }
          this.$store.commit('activateContextMenu', payload);
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
    const __vue_inject_styles__$2 = function (inject) {
      if (!inject) return
      inject("data-v-1e7bebdc_0", { source: "\n.image-item-title-user[data-v-1e7bebdc] {\n  max-width: 100%;\n  margin: 8px auto;\n  text-align: center;\n  color: #333;\n  font-size: 12px;\n  line-height: 1;\n}\n.title-text[data-v-1e7bebdc] {\n  margin: 4px 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-weight: 700;\n}\n.user-info[data-v-1e7bebdc] {\n  display: inline-flex;\n  align-items: center;\n}\n.user-link[data-v-1e7bebdc] {\n  font-size: 12px;\n  display: inline-flex;\n  align-items: center;\n}\n.user-img[data-v-1e7bebdc] {\n  width: 20px;\n  height: 20px;\n  display: inline-block;\n  background-size: cover;\n  border-radius: 50%;\n  margin-right: 4px;\n}\ni.fa-rss[data-v-1e7bebdc] {\n  display: inline-block;\n  margin-left: 4px;\n  width: 16px;\n  height: 16px;\n  color: dodgerblue;\n}\n", map: {"version":3,"sources":["/home/flandre/dev/Patchouli/src/components/DefaultImageItemTitle.vue"],"names":[],"mappings":";AAsIA;EACA,gBAAA;EACA,iBAAA;EACA,mBAAA;EACA,YAAA;EACA,gBAAA;EACA,eAAA;CACA;AACA;EACA,cAAA;EACA,iBAAA;EACA,wBAAA;EACA,oBAAA;EACA,iBAAA;CACA;AACA;EACA,qBAAA;EACA,oBAAA;CACA;AACA;EACA,gBAAA;EACA,qBAAA;EACA,oBAAA;CACA;AACA;EACA,YAAA;EACA,aAAA;EACA,sBAAA;EACA,uBAAA;EACA,mBAAA;EACA,kBAAA;CACA;AACA;EACA,sBAAA;EACA,iBAAA;EACA,YAAA;EACA,aAAA;EACA,kBAAA;CACA","file":"DefaultImageItemTitle.vue","sourcesContent":["<template>\n  <figcaption class=\"image-item-title-user\">\n    <ul>\n      <li class=\"title-text\" @click.right=\"activateContextMenu\">\n        <a :href=\"illustPageUrl\" :title=\"illustTitle\">{{ illustTitle }}</a>\n      </li>\n      <li\n        v-if=\"!isMemberIllistPage\"\n        class=\"user-info\"\n        @click.right=\"activateContextMenu\">\n        <a\n          :href=\"userPageUrl\"\n          :title=\"userName\"\n          :data-user_id=\"userId\"\n          :data-user_name=\"userName\"\n          :class=\"isEnableUserTooltip ? 'ui-profile-popup' : ''\"\n          class=\"user-link\"\n          target=\"_blank\">\n          <span :style=\"profileImgStyle\" class=\"user-img\"/>\n          <span>{{ userName }}</span>\n        </a>\n        <i v-if=\"isFollowed\" class=\"fas fa-rss\"/>\n      </li>\n      <li v-if=\"bookmarkCount > 0\">\n        <ul class=\"count-list\">\n          <li>\n            <a\n              :href=\"bookmarkDetailUrl\"\n              :data-tooltip=\"$t('patchouli.bookmarkTooltip', { count: bookmarkCount })\"\n              class=\"_ui-tooltip bookmark-count\">\n              <i class=\"_icon _bookmark-icon-inline\"/>\n              {{ bookmarkCount }}\n            </a>\n          </li>\n        </ul>\n      </li>\n    </ul>\n  </figcaption>\n</template>\n\n<script>\nimport { $print } from '../lib/utils';\n\nexport default {\n  props: {\n    illustId: {\n      type: String,\n      default: '',\n    },\n    illustTitle: {\n      type: String,\n      default: '',\n    },\n    userName: {\n      type: String,\n      default: '',\n    },\n    userId: {\n      type: String,\n      default: '',\n    },\n    profileImgUrl: {\n      type: String,\n      default: '',\n    },\n    bookmarkCount: {\n      type: Number,\n      default: 0,\n    },\n    isFollowed: {\n      type: Boolean,\n      default: false,\n    },\n  },\n  computed: {\n    illustPageUrl() {\n      return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;\n    },\n    userPageUrl() {\n      return `/member_illust.php?id=${this.userId}`;\n    },\n    bookmarkDetailUrl() {\n      return `/bookmark_detail.php?illust_id=${this.illustId}`;\n    },\n    bookmarkTooltipMsg() {\n      return this.$t('patchouli.bookmarkTooltip', {\n        count: this.bookmarkCount,\n      });\n    },\n    profileImgStyle() {\n      return {\n        backgroundImage: `url(${this.profileImgUrl})`,\n      };\n    },\n    isMemberIllistPage() {\n      return this.$store.state.pageType === 'MEMBER_ILLIST';\n    },\n    isEnableUserTooltip() {\n      return this.$store.state.config.userTooltip;\n    },\n  },\n  methods: {\n    activateContextMenu(event) {\n      $print.debug('DefaultImageItemTitle#activateContextMenu', event);\n      if (this.$store.state.config.contextMenu) {\n        event.preventDefault();\n        const payload = {};\n\n        payload.position = {\n          x: event.clientX,\n          y: event.clientY,\n        };\n        const ct = event.currentTarget;\n\n        if (ct.classList.contains('user-info')) {\n          payload.data = {\n            illustId: this.illustId,\n            type: 'image-item-title-user',\n          };\n        } else {\n          payload.data = {\n            illustId: this.illustId,\n            type: 'image-item-image',\n          };\n        }\n\n        this.$store.commit('activateContextMenu', payload);\n      }\n    },\n  },\n};\n</script>\n\n<style scoped>\n.image-item-title-user {\n  max-width: 100%;\n  margin: 8px auto;\n  text-align: center;\n  color: #333;\n  font-size: 12px;\n  line-height: 1;\n}\n.title-text {\n  margin: 4px 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-weight: 700;\n}\n.user-info {\n  display: inline-flex;\n  align-items: center;\n}\n.user-link {\n  font-size: 12px;\n  display: inline-flex;\n  align-items: center;\n}\n.user-img {\n  width: 20px;\n  height: 20px;\n  display: inline-block;\n  background-size: cover;\n  border-radius: 50%;\n  margin-right: 4px;\n}\ni.fa-rss {\n  display: inline-block;\n  margin-left: 4px;\n  width: 16px;\n  height: 16px;\n  color: dodgerblue;\n}\n</style>\n"]}, media: undefined });
    };
    const __vue_scope_id__$2 = "data-v-1e7bebdc";
    const __vue_module_identifier__$2 = undefined;
    const __vue_is_functional_template__$2 = false;
    function __vue_normalize__$2(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "/home/flandre/dev/Patchouli/src/components/DefaultImageItemTitle.vue";
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
      { render: __vue_render__$2, staticRenderFns: __vue_staticRenderFns__$2 },
      __vue_inject_styles__$2,
      __vue_script__$2,
      __vue_scope_id__$2,
      __vue_is_functional_template__$2,
      __vue_module_identifier__$2,
      __vue_create_injector__$2,
      undefined
    );
  var script$3 = {
    components: { DefaultImageItemImage, DefaultImageItemTitle },
    props: {
      imgUrl: {
        type: String,
        default: '',
      },
      illustId: {
        type: String,
        default: '',
      },
      illustTitle: {
        type: String,
        default: '',
      },
      illustPageCount: {
        type: Number,
        default: 1,
      },
      userName: {
        type: String,
        default: '',
      },
      userId: {
        type: String,
        default: '',
      },
      profileImgUrl: {
        type: String,
        default: '',
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
        default: '',
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
    const __vue_inject_styles__$3 = function (inject) {
      if (!inject) return
      inject("data-v-566068a8_0", { source: "\n.image-item[data-v-566068a8] {\n  display: flex;\n  justify-content: center;\n  margin: 0 0 30px 0;\n  padding: 10px;\n  height: auto;\n  width: 200px;\n}\n.image-item-inner[data-v-566068a8] {\n  display: flex;\n  flex-flow: column;\n  max-width: 100%;\n  max-height: 300px;\n}\n", map: {"version":3,"sources":["/home/flandre/dev/Patchouli/src/components/DefaultImageItem.vue"],"names":[],"mappings":";AAkFA;EACA,cAAA;EACA,wBAAA;EACA,mBAAA;EACA,cAAA;EACA,aAAA;EACA,aAAA;CACA;AACA;EACA,cAAA;EACA,kBAAA;EACA,gBAAA;EACA,kBAAA;CACA","file":"DefaultImageItem.vue","sourcesContent":["<template>\n  <div class=\"image-item\">\n    <figure class=\"image-item-inner\">\n      <DefaultImageItemImage\n        :img-url=\"imgUrl\"\n        :illust-id=\"illustId\"\n        :illust-page-count=\"illustPageCount\"\n        :is-ugoira=\"isUgoira\"\n        :is-bookmarked=\"isBookmarked\"\n        :bookmark-id=\"bookmarkId\"/>\n      <DefaultImageItemTitle\n        :illust-id=\"illustId\"\n        :illust-title=\"illustTitle\"\n        :user-name=\"userName\"\n        :user-id=\"userId\"\n        :is-followed=\"isFollowed\"\n        :profile-img-url=\"profileImgUrl\"\n        :bookmark-count=\"bookmarkCount\"/>\n    </figure>\n  </div>\n</template>\n\n<script>\nimport DefaultImageItemImage from './DefaultImageItemImage.vue';\nimport DefaultImageItemTitle from './DefaultImageItemTitle.vue';\n\nexport default {\n  components: { DefaultImageItemImage, DefaultImageItemTitle },\n  props: {\n    imgUrl: {\n      type: String,\n      default: '',\n    },\n    illustId: {\n      type: String,\n      default: '',\n    },\n    illustTitle: {\n      type: String,\n      default: '',\n    },\n    illustPageCount: {\n      type: Number,\n      default: 1,\n    },\n    userName: {\n      type: String,\n      default: '',\n    },\n    userId: {\n      type: String,\n      default: '',\n    },\n    profileImgUrl: {\n      type: String,\n      default: '',\n    },\n    isUgoira: {\n      type: Boolean,\n      default: false,\n    },\n    isBookmarked: {\n      type: Boolean,\n      default: false,\n    },\n    isFollowed: {\n      type: Boolean,\n      default: false,\n    },\n    bookmarkId: {\n      type: String,\n      default: '',\n    },\n    bookmarkCount: {\n      type: Number,\n      default: 0,\n    },\n  },\n};\n</script>\n\n<style scoped>\n.image-item {\n  display: flex;\n  justify-content: center;\n  margin: 0 0 30px 0;\n  padding: 10px;\n  height: auto;\n  width: 200px;\n}\n.image-item-inner {\n  display: flex;\n  flex-flow: column;\n  max-width: 100%;\n  max-height: 300px;\n}\n</style>\n"]}, media: undefined });
    };
    const __vue_scope_id__$3 = "data-v-566068a8";
    const __vue_module_identifier__$3 = undefined;
    const __vue_is_functional_template__$3 = false;
    function __vue_normalize__$3(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "/home/flandre/dev/Patchouli/src/components/DefaultImageItem.vue";
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
      { render: __vue_render__$3, staticRenderFns: __vue_staticRenderFns__$3 },
      __vue_inject_styles__$3,
      __vue_script__$3,
      __vue_scope_id__$3,
      __vue_is_functional_template__$3,
      __vue_module_identifier__$3,
      __vue_create_injector__$3,
      undefined
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
          return '';
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
          return '#';
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
        const a = $el('a', { href: imgUrl });
        const filename = a.pathname.split('/').pop();
        const ext = filename
          .split('.')
          .pop()
          .toLowerCase();
        const response = await GMC.XHR({
          method: 'GET',
          url: imgUrl,
          responseType: 'arraybuffer',
          binary: true,
          headers: {
            Referer: `https://www.pixiv.net/member_illust.php?mode=medium&illust_id=${illustId}`,
          },
        });
        if (ext === 'jpg' || ext === 'jpeg') {
          saveAs(new File([response.response], filename, { type: 'image/jpeg' }));
        } else if (ext === 'png') {
          saveAs(new File([response.response], filename, { type: 'image/png' }));
        }
      },
      addToBlacklist() {
        if (this.currentImageItem) {
          const userId = this.currentImageItem.userId;
          this.$store.state.config.blacklist.push(userId);
          this.$store.state.config.blacklist.sort((a, b) => a - b);
          this.$store.commit('saveConfig');
        }
      },
      openPreview() {
        this.$store.commit('openBigComponent', {
          mode: 'preview',
          data: this.currentImageItem,
        });
      },
      async followUser() {
        if (this.currentImageItem) {
          const userId = this.currentImageItem.userId;
          if (await PixivAPI.postFollowUser(userId)) {
            this.$store.commit('editImgItem', {
              type: 'follow-user',
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
    const __vue_inject_styles__$4 = function (inject) {
      if (!inject) return
      inject("data-v-9dc05d10_0", { source: "\n#patchouli-context-menu[data-v-9dc05d10] {\n  box-sizing: border-box;\n  border: 1px solid #b28fce;\n  position: fixed;\n  z-index: 10;\n  background-color: #fff;\n  font-size: 16px;\n  overflow: hidden;\n  border-radius: 6px;\n}\n#patchouli-context-menu > ul > li[data-v-9dc05d10] {\n  display: flex;\n  align-items: center;\n}\n#patchouli-context-menu > ul a[data-v-9dc05d10] {\n  color: #85a;\n  padding: 3px;\n  flex: 1;\n  border-radius: 5px;\n  text-decoration: none;\n  white-space: nowrap;\n  display: inline-flex;\n  align-items: center;\n  text-align: center;\n}\n#patchouli-context-menu > ul a[data-v-9dc05d10]:hover {\n  background-color: #b28fce;\n  color: #fff;\n  cursor: pointer;\n}\n#patchouli-context-menu > ul i.far[data-v-9dc05d10],\n#patchouli-context-menu > ul i.fas[data-v-9dc05d10] {\n  height: 18px;\n  width: 18px;\n  margin: 0 4px;\n}\n", map: {"version":3,"sources":["/home/flandre/dev/Patchouli/src/components/ContextMenu.vue"],"names":[],"mappings":";AAgLA;EACA,uBAAA;EACA,0BAAA;EACA,gBAAA;EACA,YAAA;EACA,uBAAA;EACA,gBAAA;EACA,iBAAA;EACA,mBAAA;CACA;AACA;EACA,cAAA;EACA,oBAAA;CACA;AACA;EACA,YAAA;EACA,aAAA;EACA,QAAA;EACA,mBAAA;EACA,sBAAA;EACA,oBAAA;EACA,qBAAA;EACA,oBAAA;EACA,mBAAA;CACA;AACA;EACA,0BAAA;EACA,YAAA;EACA,gBAAA;CACA;AACA;;EAEA,aAAA;EACA,YAAA;EACA,cAAA;CACA","file":"ContextMenu.vue","sourcesContent":["<template>\n  <div id=\"patchouli-context-menu\" :style=\"inlineStyle\">\n    <ul v-show=\"currentType === 'image-item-image'\" id=\"patchouli-context-menu-list-image-item-image\" >\n      <li>\n        <a role=\"button\" @click.left=\"thumbUp\">\n          <i class=\"far fa-thumbs-up\"/>\n          {{ $t('contextMenu.thumbUp') }}\n        </a>\n      </li>\n      <li v-show=\"isDownloadable\">\n        <a role=\"button\" @click.left=\"downloadOne\">\n          <i class=\"fas fa-download\"/>\n          {{ $t('contextMenu.download') }}\n        </a>\n      </li>\n      <li>\n        <a role=\"button\" @click.left=\"openPreview\">\n          <i class=\"fas fa-search-plus\"/>\n          {{ $t('contextMenu.preview') }}\n        </a>\n      </li>\n      <li>\n        <a\n          :href=\"bookmarkPageLink\"\n          role=\"button\"\n          target=\"_blank\">\n          <i class=\"far fa-bookmark\"/>\n          {{ $t('contextMenu.openBookmarkPage') }}\n        </a>\n      </li>\n    </ul>\n    <ul v-show=\"currentType === 'image-item-title-user'\" id=\"patchouli-context-menu-list-image-item-title-user\" >\n      <li>\n        <a role=\"button\" @click.left=\"addToBlacklist\">\n          <i class=\"far fa-eye-slash\"/>\n          {{ $t('contextMenu.addToBlacklist') }}\n        </a>\n      </li>\n      <li v-show=\"currentImageItem && !currentImageItem.isFollowed\">\n        <a role=\"button\" @click.left=\"followUser\">\n          <i class=\"fas fa-rss\"/>\n          {{ $t('contextMenu.followUser') }}\n        </a>\n      </li>\n    </ul>\n  </div>\n</template>\n\n\n<script>\nimport { PixivAPI } from '../lib/pixiv';\nimport { $el } from '../lib/utils';\nimport GMC from '../lib/gmc';\n\nexport default {\n  computed: {\n    // vue'x' state 'm'odule\n    xm() {\n      return this.$store.state.contextMenu;\n    },\n    xmd() {\n      return this.xm.data;\n    },\n    currentType() {\n      if (!this.xmd) {\n        return '';\n      }\n      return this.xmd.type;\n    },\n    currentImageItem() {\n      if (!this.xmd) {\n        return null;\n      }\n      const illustId = this.xmd.illustId;\n      const found = this.$store.state.pixiv.imgLibrary.find(\n        i => i.illustId === illustId\n      );\n      return found ? found : null;\n    },\n    inlineStyle() {\n      const RIGHT_BOUND = 200; // Magic Number ~\n      const position = this.xm.position;\n      const ow = document.body.offsetWidth;\n\n      let style = `top: ${position.y}px;`;\n      if (ow - position.x < RIGHT_BOUND) {\n        style += `right: ${ow - position.x}px;`;\n      } else {\n        style += `left: ${position.x}px;`;\n      }\n      return style;\n    },\n    bookmarkPageLink() {\n      if (!this.xmd) {\n        return '#';\n      }\n      const illustId = this.xmd.illustId;\n      return `bookmark_add.php?type=illust&illust_id=${illustId}`;\n    },\n    isDownloadable() {\n      return (\n        this.currentImageItem &&\n        this.currentImageItem.illustPageCount === 1 &&\n        !this.currentImageItem.isUgoira // unsupport ugoira currently\n      );\n    },\n    isUgoira() {\n      return this.currentImageItem && this.currentImageItem.isUgoira;\n    },\n  },\n  methods: {\n    thumbUp() {\n      if (this.currentImageItem) {\n        PixivAPI.postIllustLike(this.currentImageItem.illustId);\n      }\n    },\n    async downloadOne() {\n      const imgUrl = this.currentImageItem.urls.original;\n      const illustId = this.currentImageItem.illustId;\n      const a = $el('a', { href: imgUrl });\n\n      const filename = a.pathname.split('/').pop();\n      const ext = filename\n        .split('.')\n        .pop()\n        .toLowerCase();\n\n      const response = await GMC.XHR({\n        method: 'GET',\n        url: imgUrl,\n        // greasemonkey has no this API\n        responseType: 'arraybuffer',\n        // for greasemonkey\n        binary: true,\n        headers: {\n          Referer: `https://www.pixiv.net/member_illust.php?mode=medium&illust_id=${illustId}`,\n        },\n      });\n\n      if (ext === 'jpg' || ext === 'jpeg') {\n        saveAs(new File([response.response], filename, { type: 'image/jpeg' }));\n      } else if (ext === 'png') {\n        saveAs(new File([response.response], filename, { type: 'image/png' }));\n      }\n    },\n    addToBlacklist() {\n      if (this.currentImageItem) {\n        const userId = this.currentImageItem.userId;\n        this.$store.state.config.blacklist.push(userId);\n        this.$store.state.config.blacklist.sort((a, b) => a - b);\n        this.$store.commit('saveConfig');\n      }\n    },\n    openPreview() {\n      this.$store.commit('openBigComponent', {\n        mode: 'preview',\n        data: this.currentImageItem,\n      });\n    },\n    async followUser() {\n      if (this.currentImageItem) {\n        const userId = this.currentImageItem.userId;\n\n        if (await PixivAPI.postFollowUser(userId)) {\n          this.$store.commit('editImgItem', {\n            type: 'follow-user',\n            userId: this.currentImageItem.userId,\n          });\n        }\n      }\n    },\n  },\n};\n</script>\n\n<style scoped>\n#patchouli-context-menu {\n  box-sizing: border-box;\n  border: 1px solid #b28fce;\n  position: fixed;\n  z-index: 10;\n  background-color: #fff;\n  font-size: 16px;\n  overflow: hidden;\n  border-radius: 6px;\n}\n#patchouli-context-menu > ul > li {\n  display: flex;\n  align-items: center;\n}\n#patchouli-context-menu > ul a {\n  color: #85a;\n  padding: 3px;\n  flex: 1;\n  border-radius: 5px;\n  text-decoration: none;\n  white-space: nowrap;\n  display: inline-flex;\n  align-items: center;\n  text-align: center;\n}\n#patchouli-context-menu > ul a:hover {\n  background-color: #b28fce;\n  color: #fff;\n  cursor: pointer;\n}\n#patchouli-context-menu > ul i.far,\n#patchouli-context-menu > ul i.fas {\n  height: 18px;\n  width: 18px;\n  margin: 0 4px;\n}\n</style>\n"]}, media: undefined });
    };
    const __vue_scope_id__$4 = "data-v-9dc05d10";
    const __vue_module_identifier__$4 = undefined;
    const __vue_is_functional_template__$4 = false;
    function __vue_normalize__$4(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "/home/flandre/dev/Patchouli/src/components/ContextMenu.vue";
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
      { render: __vue_render__$4, staticRenderFns: __vue_staticRenderFns__$4 },
      __vue_inject_styles__$4,
      __vue_script__$4,
      __vue_scope_id__$4,
      __vue_is_functional_template__$4,
      __vue_module_identifier__$4,
      __vue_create_injector__$4,
      undefined
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
    const __vue_inject_styles__$5 = function (inject) {
      if (!inject) return
      inject("data-v-71f830d4_0", { source: "\n#patchouli[data-v-71f830d4] {\n  display: flex;\n  flex-flow: wrap;\n  justify-content: space-around;\n}\n", map: {"version":3,"sources":["/home/flandre/dev/Patchouli/src/components/Patchouli.vue"],"names":[],"mappings":";AAqCA;EACA,cAAA;EACA,gBAAA;EACA,8BAAA;CACA","file":"Patchouli.vue","sourcesContent":["<template>\n  <div id=\"patchouli\">\n    <DefaultImageItem\n      v-for=\"d in filteredLibrary\"\n      v-show=\"d._show\"\n      :key=\"d.illustId\"\n      :img-url=\"d.urls.thumb\"\n      :illust-id=\"d.illustId\"\n      :illust-title=\"d.illustTitle\"\n      :illust-page-count=\"d.illustPageCount\"\n      :is-ugoira=\"d.isUgoira\"\n      :user-name=\"d.userName\"\n      :user-id=\"d.userId\"\n      :profile-img-url=\"d.profileImg\"\n      :bookmark-count=\"d.bookmarkCount\"\n      :is-bookmarked=\"d.isBookmarked\"\n      :is-followed=\"d.isFollowed\"\n      :bookmark-id=\"d.bookmarkId\" />\n    <ContextMenu/>\n  </div>\n</template>\n\n<script>\nimport DefaultImageItem from './DefaultImageItem.vue';\nimport ContextMenu from './ContextMenu.vue';\n\nexport default {\n  components: { DefaultImageItem, ContextMenu },\n  computed: {\n    filteredLibrary() {\n      return this.$store.getters.filteredLibrary;\n    },\n  },\n};\n</script>\n\n<style scoped>\n#patchouli {\n  display: flex;\n  flex-flow: wrap;\n  justify-content: space-around;\n}\n</style>\n"]}, media: undefined });
    };
    const __vue_scope_id__$5 = "data-v-71f830d4";
    const __vue_module_identifier__$5 = undefined;
    const __vue_is_functional_template__$5 = false;
    function __vue_normalize__$5(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "/home/flandre/dev/Patchouli/src/components/Patchouli.vue";
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
      { render: __vue_render__$5, staticRenderFns: __vue_staticRenderFns__$5 },
      __vue_inject_styles__$5,
      __vue_script__$5,
      __vue_scope_id__$5,
      __vue_is_functional_template__$5,
      __vue_module_identifier__$5,
      __vue_create_injector__$5,
      undefined
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
    const __vue_inject_styles__$6 = function (inject) {
      if (!inject) return
      inject("data-v-63d544ae_0", { source: "\n#patchouli-big-component[data-v-63d544ae] {\n  background-color: #000a;\n  position: fixed;\n  height: 100%;\n  width: 100%;\n  z-index: 5;\n  top: 0;\n  left: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n#config-mode[data-v-63d544ae],\n#preview-mode[data-v-63d544ae] {\n  min-width: 100px;\n  min-height: 100px;\n  background-color: #eef;\n}\n#config-mode[data-v-63d544ae] {\n  display: flex;\n  flex-flow: column;\n  padding: 10px;\n  border-radius: 10px;\n  font-size: 18px;\n  white-space: nowrap;\n}\n#config-mode a[data-v-63d544ae] {\n  color: #00186c;\n  text-decoration: none;\n}\n#config-mode [id$=\"switch\"][data-v-63d544ae] {\n  text-align: center;\n}\n#config-mode [id$=\"switch\"][data-v-63d544ae]:hover {\n  cursor: pointer;\n}\n#config-mode [id$=\"label\"][data-v-63d544ae] {\n  text-align: center;\n  margin: 0 5px;\n}\n#config-blacklist-label > .fa-eye-slash[data-v-63d544ae] {\n  margin: 0 4px;\n}\n#config-blacklist-textarea[data-v-63d544ae] {\n  box-sizing: border-box;\n  flex: 1;\n  resize: none;\n  font-size: 11pt;\n  height: 90px;\n}\n#preview-mode[data-v-63d544ae] {\n  width: 70%;\n  height: 100%;\n  box-sizing: border-box;\n  display: grid;\n  grid-template-rows: minmax(0, auto) max-content;\n}\n#preview-display-area[data-v-63d544ae] {\n  border: 2px #00186c solid;\n  box-sizing: border-box;\n  text-align: center;\n}\n#preview-display-area > a[data-v-63d544ae],\n#preview-display-area > div[data-v-63d544ae] {\n  display: inline-flex;\n  height: 100%;\n  justify-content: center;\n  align-items: center;\n}\n#preview-display-area > a > img[data-v-63d544ae],\n#preview-display-area > div > canvas[data-v-63d544ae] {\n  object-fit: contain;\n  max-width: 100%;\n  max-height: 100%;\n}\n#preview-thumbnails-area[data-v-63d544ae] {\n  background-color: ghostwhite;\n  display: flex;\n  align-items: center;\n  overflow-x: auto;\n  overflow-y: hidden;\n  height: 100%;\n  border: 2px solid #014;\n  box-sizing: border-box;\n  border-top: 0;\n}\n#preview-thumbnails-area > li[data-v-63d544ae] {\n  padding: 0 10px;\n}\n#preview-thumbnails-area > li > a[data-v-63d544ae] {\n  cursor: pointer;\n  display: inline-block;\n}\n.current-preview[data-v-63d544ae] {\n  border: 3px solid palevioletred;\n}\n#preview-thumbnails-area > li > a > img[data-v-63d544ae] {\n  max-height: 100px;\n  box-sizing: border-box;\n  display: inline-block;\n}\n", map: {"version":3,"sources":["/home/flandre/dev/Patchouli/src/components/BigComponent.vue"],"names":[],"mappings":";AA4PA;EACA,wBAAA;EACA,gBAAA;EACA,aAAA;EACA,YAAA;EACA,WAAA;EACA,OAAA;EACA,QAAA;EACA,cAAA;EACA,oBAAA;EACA,wBAAA;CACA;AACA;;EAEA,iBAAA;EACA,kBAAA;EACA,uBAAA;CACA;AACA;EACA,cAAA;EACA,kBAAA;EACA,cAAA;EACA,oBAAA;EACA,gBAAA;EACA,oBAAA;CACA;AACA;EACA,eAAA;EACA,sBAAA;CACA;AACA;EACA,mBAAA;CACA;AACA;EACA,gBAAA;CACA;AACA;EACA,mBAAA;EACA,cAAA;CACA;AACA;EACA,cAAA;CACA;AACA;EACA,uBAAA;EACA,QAAA;EACA,aAAA;EACA,gBAAA;EACA,aAAA;CACA;AACA;EACA,WAAA;EACA,aAAA;EACA,uBAAA;EACA,cAAA;EACA,gDAAA;CACA;AACA;EACA,0BAAA;EACA,uBAAA;EACA,mBAAA;CACA;AACA;;EAEA,qBAAA;EACA,aAAA;EACA,wBAAA;EACA,oBAAA;CACA;AACA;;EAEA,oBAAA;EACA,gBAAA;EACA,iBAAA;CACA;AACA;EACA,6BAAA;EACA,cAAA;EACA,oBAAA;EACA,iBAAA;EACA,mBAAA;EACA,aAAA;EACA,uBAAA;EACA,uBAAA;EACA,cAAA;CACA;AACA;EACA,gBAAA;CACA;AACA;EACA,gBAAA;EACA,sBAAA;CACA;AACA;EACA,gCAAA;CACA;AACA;EACA,kBAAA;EACA,uBAAA;EACA,sBAAA;CACA","file":"BigComponent.vue","sourcesContent":["<template>\n  <div\n    v-show=\"mode\"\n    id=\"patchouli-big-component\"\n    ref=\"patchouliBigComponentRoot\"\n    tabindex=\"0\"\n    @keyup=\"jumpByKeyup\"\n    @click.left=\"clickBase\"\n    @scroll=\"focusForeground\"\n    @wheel=\"focusForeground\">\n    <div\n      v-show=\"mode === 'config'\"\n      id=\"config-mode\"\n      @click.stop=\"0\">\n      <a id=\"config-context-menu-switch\" @click.left=\"clickSwitch\">\n        <a\n          v-show=\"xc.contextMenu\"\n          id=\"config-context-menu-switch-on\"\n          role=\"button\">\n          <i class=\"fas fa-toggle-on\"/>\n        </a>\n        <a\n          v-show=\"!xc.contextMenu\"\n          id=\"config-context-menu-switch-off\"\n          role=\"button\">\n          <i class=\"fas fa-toggle-off\"/>\n        </a>\n        <span id=\"config-context-menu-label\">{{ $t('config.contextMenuExtension') }}</span>\n      </a>\n      <a id=\"config-user-tooltip-switch\" @click.left=\"clickSwitch\">\n        <a\n          v-show=\"xc.userTooltip\"\n          id=\"config-user-tooltip-switch-on\"\n          role=\"button\">\n          <i class=\"fas fa-toggle-on\"/>\n        </a>\n        <a\n          v-show=\"!xc.userTooltip\"\n          id=\"config-user-tooltip-switch-off\"\n          role=\"button\">\n          <i class=\"fas fa-toggle-off\"/>\n        </a>\n        <span id=\"config-user-tooltip-label\">{{ $t('config.userTooltip') }}</span>\n      </a>\n      <a id=\"config-hover-play-switch\" @click.left=\"clickSwitch\">\n        <a\n          v-show=\"xc.hoverPlay\"\n          id=\"config-hover-play-switch-on\"\n          role=\"button\">\n          <i class=\"fas fa-toggle-on\"/>\n        </a>\n        <a\n          v-show=\"!xc.hoverPlay\"\n          id=\"config-hover-play-switch-off\"\n          role=\"button\">\n          <i class=\"fas fa-toggle-off\"/>\n        </a>\n        <span id=\"config-hover-play-label\">{{ $t('config.hoverPlay') }}</span>\n      </a>\n      <a id=\"config-blacklist-label\">\n        <i class=\"far fa-eye-slash\"/>{{ $t('config.blacklist') }}\n      </a>\n      <textarea\n        id=\"config-blacklist-textarea\"\n        :value=\"xc.blacklist.join('\\n')\"\n        spellcheck=\"false\"\n        rows=\"5\"/>\n    </div>\n    <div\n      v-show=\"mode === 'preview'\"\n      id=\"preview-mode\"\n      @click.stop=\"0\">\n      <div id=\"preview-display-area\">\n        <a\n          v-show=\"!previewUgoiraMetaData\"\n          :href=\"previewSrcList[previewCurrentIndex]\"\n          target=\"_blank\">\n          <img :src=\"previewSrcList[previewCurrentIndex]\">\n        </a>\n        <div v-show=\"!!previewUgoiraMetaData\">\n          <canvas v-show=\"previewCurrentIndex === 0\" ref=\"previewUgoiraCanvas\"/>\n          <canvas v-show=\"previewCurrentIndex === 1\" ref=\"previewOriginalUgoiraCanvas\"/>\n        </div>\n      </div>\n      <ul v-show=\"previewSrcList.length > 1\" id=\"preview-thumbnails-area\">\n        <li v-for=\"(pSrc, index) in previewSrcList\" :key=\"pSrc\">\n          <a\n            :class=\"(index === previewCurrentIndex) ? 'current-preview' : ''\"\n            @click.left=\"jumpPreview(index)\" >\n            <img :src=\"pSrc\">\n          </a>\n        </li>\n      </ul>\n    </div>\n  </div>\n</template>\n\n<script>\nimport { PixivAPI } from '../lib/pixiv';\nimport { $, $print, toInt } from '../lib/utils';\n\nexport default {\n  data() {\n    return {\n      previewSrcList: [],\n      previewCurrentIndex: 0,\n      previewUgoiraMetaData: null,\n      ugoiraPlayers: [],\n    };\n  },\n  computed: {\n    // vue'x' state 'm'odule\n    xm() {\n      return this.$store.state.bigComponent;\n    },\n    // vue'x' state 'c'onfig\n    xc() {\n      return this.$store.state.config;\n    },\n    mode() {\n      return this.xm.mode;\n    },\n  },\n  watch: {\n    async mode(value) {\n      $print.debug('watch mode change:', value);\n\n      if (value === 'preview') {\n        const imageItem = this.xm.data;\n        if (imageItem.isUgoira) {\n          this.previewUgoiraMetaData = await PixivAPI.getIllustUgoiraMetaData(\n            imageItem.illustId\n          );\n          this.initZipImagePlayer();\n          this.previewSrcList.push(imageItem.urls.thumb);\n          this.previewSrcList.push(imageItem.urls.original);\n        } else if (imageItem.illustPageCount > 1) {\n          const indexArray = Array.from(\n            Array(imageItem.illustPageCount).keys()\n          );\n          const srcs = indexArray.map(idx =>\n            imageItem.urls.original.replace('p0', `p${idx}`)\n          );\n          this.previewSrcList.push(...srcs);\n        } else {\n          this.previewSrcList.push(imageItem.urls.original);\n        }\n      } else if (!value) {\n        this.previewSrcList.length = 0;\n        this.previewCurrentIndex = 0;\n        this.previewUgoiraMetaData = null;\n        this.ugoiraPlayers.forEach(player => player.stop());\n        this.ugoiraPlayers.length = 0;\n      }\n    },\n  },\n  updated() {\n    if (this.mode === 'preview') {\n      this.$refs.patchouliBigComponentRoot.focus();\n    }\n  },\n  methods: {\n    clickBase(event) {\n      $print.debug('BigComponent#clickBase: event', event);\n      this.$store.commit('closeBigComponent');\n\n      this.xc.blacklist = [\n        ...new Set(\n          $('#config-blacklist-textarea')\n            .value.split('\\n')\n            .filter(Boolean)\n            .map(s => s.trim())\n        ),\n      ];\n      this.xc.blacklist.sort((a, b) => a - b);\n\n      this.$store.commit('saveConfig');\n    },\n    focusForeground(event) {\n      if (event.target.id === 'patchouli-big-component') {\n        event.preventDefault();\n      }\n    },\n    clickSwitch(event) {\n      $print.debug('BigComponent#clickSwitch: event', event);\n\n      if (event.currentTarget.id === 'config-context-menu-switch') {\n        this.xc.contextMenu = toInt(!this.xc.contextMenu);\n      }\n\n      if (event.currentTarget.id === 'config-user-tooltip-switch') {\n        this.xc.userTooltip = toInt(!this.xc.userTooltip);\n      }\n\n      if (event.currentTarget.id === 'config-hover-play-switch') {\n        this.xc.hoverPlay = toInt(!this.xc.hoverPlay);\n      }\n    },\n    jumpPreview(index) {\n      this.previewCurrentIndex = index;\n    },\n    initZipImagePlayer() {\n      const meta = this.previewUgoiraMetaData;\n      // resize as clear\n      this.$refs.previewOriginalUgoiraCanvas.width = 0;\n      this.$refs.previewUgoiraCanvas.width = 0;\n\n      this.ugoiraPlayers.push(\n        new ZipImagePlayer({\n          canvas: this.$refs.previewOriginalUgoiraCanvas,\n          source: meta.originalSrc,\n          metadata: meta,\n          chunkSize: 300000,\n          loop: true,\n          autoStart: true,\n          autosize: true,\n        })\n      );\n      this.ugoiraPlayers.push(\n        new ZipImagePlayer({\n          canvas: this.$refs.previewUgoiraCanvas,\n          source: meta.src,\n          metadata: meta,\n          chunkSize: 300000,\n          loop: true,\n          autoStart: true,\n          autosize: true,\n        })\n      );\n    },\n    jumpByKeyup(event) {\n      $print.debug('BigComponent#jumpByKeyup: event', event);\n\n      if (this.mode === 'preview') {\n        const imageItem = this.xm.data;\n        if (event.key === 'ArrowLeft') {\n          this.jumpPreview(Math.max(this.previewCurrentIndex - 1, 0));\n        } else if (event.key === 'ArrowRight') {\n          this.jumpPreview(\n            Math.min(\n              this.previewCurrentIndex + 1,\n              imageItem.illustPageCount - 1\n            )\n          );\n        }\n      }\n    },\n  },\n};\n</script>\n\n<style scoped>\n#patchouli-big-component {\n  background-color: #000a;\n  position: fixed;\n  height: 100%;\n  width: 100%;\n  z-index: 5;\n  top: 0;\n  left: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n#config-mode,\n#preview-mode {\n  min-width: 100px;\n  min-height: 100px;\n  background-color: #eef;\n}\n#config-mode {\n  display: flex;\n  flex-flow: column;\n  padding: 10px;\n  border-radius: 10px;\n  font-size: 18px;\n  white-space: nowrap;\n}\n#config-mode a {\n  color: #00186c;\n  text-decoration: none;\n}\n#config-mode [id$=\"switch\"] {\n  text-align: center;\n}\n#config-mode [id$=\"switch\"]:hover {\n  cursor: pointer;\n}\n#config-mode [id$=\"label\"] {\n  text-align: center;\n  margin: 0 5px;\n}\n#config-blacklist-label > .fa-eye-slash {\n  margin: 0 4px;\n}\n#config-blacklist-textarea {\n  box-sizing: border-box;\n  flex: 1;\n  resize: none;\n  font-size: 11pt;\n  height: 90px;\n}\n#preview-mode {\n  width: 70%;\n  height: 100%;\n  box-sizing: border-box;\n  display: grid;\n  grid-template-rows: minmax(0, auto) max-content;\n}\n#preview-display-area {\n  border: 2px #00186c solid;\n  box-sizing: border-box;\n  text-align: center;\n}\n#preview-display-area > a,\n#preview-display-area > div {\n  display: inline-flex;\n  height: 100%;\n  justify-content: center;\n  align-items: center;\n}\n#preview-display-area > a > img,\n#preview-display-area > div > canvas {\n  object-fit: contain;\n  max-width: 100%;\n  max-height: 100%;\n}\n#preview-thumbnails-area {\n  background-color: ghostwhite;\n  display: flex;\n  align-items: center;\n  overflow-x: auto;\n  overflow-y: hidden;\n  height: 100%;\n  border: 2px solid #014;\n  box-sizing: border-box;\n  border-top: 0;\n}\n#preview-thumbnails-area > li {\n  padding: 0 10px;\n}\n#preview-thumbnails-area > li > a {\n  cursor: pointer;\n  display: inline-block;\n}\n.current-preview {\n  border: 3px solid palevioletred;\n}\n#preview-thumbnails-area > li > a > img {\n  max-height: 100px;\n  box-sizing: border-box;\n  display: inline-block;\n}\n</style>\n"]}, media: undefined });
    };
    const __vue_scope_id__$6 = "data-v-63d544ae";
    const __vue_module_identifier__$6 = undefined;
    const __vue_is_functional_template__$6 = false;
    function __vue_normalize__$6(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "/home/flandre/dev/Patchouli/src/components/BigComponent.vue";
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
      { render: __vue_render__$6, staticRenderFns: __vue_staticRenderFns__$6 },
      __vue_inject_styles__$6,
      __vue_script__$6,
      __vue_scope_id__$6,
      __vue_is_functional_template__$6,
      __vue_module_identifier__$6,
      __vue_create_injector__$6,
      undefined
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
