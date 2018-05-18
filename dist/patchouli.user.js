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
// @require           https://cdnjs.cloudflare.com/ajax/libs/vue-i18n/7.6.0/vue-i18n.min.js
// @require           https://cdnjs.cloudflare.com/ajax/libs/axios/0.18.0/axios.min.js
// @require           https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min.js
// @icon              http://i.imgur.com/VwoYc5w.png
// @connect           i.pximg.net
// @noframes
// @author            FlandreDaisuki
// @license           The MIT License (MIT) Copyright (c) 2016-2018 FlandreDaisuki
// @compatible        firefox >=52
// @compatible        chrome >=55
// @version           4.1.0-beta.2
// @grant             GM_getValue
// @grant             GM.getValue
// @grant             GM_setValue
// @grant             GM.setValue
// @grant             GM_xmlhttpRequest
// @grant             GM.xmlhttpRequest
// ==/UserScript==

(function (Vue,Vuex,VueI18n) {
  'use strict';

  function __$styleInject( css ) {
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

  __$styleInject("._global-header {\n  /* FIXME: Chrome will show #koakuma on top of header */\n  z-index: 4;\n  transform: translate(0);\n}\n._global-header.koakuma-placeholder {\n  /* I don't know why #koakuma just 32px\n     but it should preserve 42px to keep all spacing correct */\n  margin-bottom: 42px;\n}\n.ω {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-orient: horizontal;\n  -webkit-box-direction: normal;\n      -ms-flex-flow: row wrap;\n          flex-flow: row wrap;\n  -webkit-box-pack: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n}\n.ω,\n.ω .layout-a,\n.ω .layout-body {\n  -webkit-transition: width 0.2s;\n  transition: width 0.2s;\n}\n.ω.↔,\n.ω.↔ .layout-a,\n.ω.↔ .layout-body {\n  width: 100% !important;\n}\n.ω.↔ .layout-a {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-orient: horizontal;\n  -webkit-box-direction: reverse;\n  -ms-flex-direction: row-reverse;\n  flex-direction: row-reverse;\n}\n.ω.↔ .layout-column-2 {\n  -webkit-box-flex: 1;\n  -ms-flex: 1;\n  flex: 1;\n  margin-left: 20px;\n}\n.ω.↔ .layout-body,\n.ω.↔ .layout-a {\n  margin: 10px 20px;\n}\n");

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
    }
  };
  (() => {
    Math.clamp = (val, min, max) => Math.min(Math.max(min, val), max);
    Number.toInt = (s) => (isNaN(~~s) ? 0 : ~~s);
    (function(arr) {
      arr.forEach(function(item) {
        if (item.hasOwnProperty('after')) {
          return;
        }
        Object.defineProperty(item, 'after', {
          configurable: true,
          enumerable: true,
          writable: true,
          value: function after() {
            const argArr = Array.prototype.slice.call(arguments);
            const docFrag = document.createDocumentFragment();
            argArr.forEach(function(argItem) {
              const isNode = argItem instanceof Node;
              docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
            });
            this.parentNode.insertBefore(docFrag, this.nextSibling);
          }
        });
      });
    })([Element.prototype, CharacterData.prototype, DocumentType.prototype]);
  })();
  class Pixiv {
    constructor() {
      try {
        this.tt = $('input[name="tt"]').value;
      } catch (error) {
        this.tt = pixiv.context.token;
      }
    }
    async fetch(url) {
      try {
        if (url) {
          const res = await axios.get(url);
          if (res.status !== 200) {
            throw new Error(`${res.status} ${res.statusText}`);
          } else {
            return res.data;
          }
        } else {
          $print.error('Pixiv#fetch has no url');
        }
      } catch (error) {
        $print.error('Pixiv#fetch: error:', error);
      }
    }
    async getLegacyPageHTMLIllustIds(url, { needBookmarkId } = { needBookmarkId: false }) {
      try {
        const html = await this.fetch(url);
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
          illustIds
        };
        if (needBookmarkId) {
          ret.bookmarkIds = {};
          const bimHTMLs = html.match(/name="book_id[^;]+;illust_id=\d+/g) || [];
          for (const bim of bimHTMLs) {
            const [illustId, bookmarkId] = bim.replace(/\D+(\d+)\D+(\d+)/, '$2 $1').split(' ');
            if (illustIds.includes(illustId)) {
              ret.bookmarkIds[illustId] = { illustId, bookmarkId };
            }
          }
        }
        return ret;
      } catch (error) {
        $print.error('Pixiv#getLegacyPageHTMLIllustIds: error:', error);
      }
    }
    async getPageHTMLIllustIds(url) {
      try {
        const html = await this.fetch(url);
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
          illustIds
        };
        return ret;
      } catch (error) {
        $print.error('Pixiv#getPageHTMLIllustIds: error:', error);
      }
    }
    async getBookmarkHTMLDetails(illustIds) {
      const bookmarkHTMLDetails = illustIds.map(id => this.getBookmarkHTMLDetail(id));
      const bookmarkDetails = await Promise.all(bookmarkHTMLDetails);
      const detail = {};
      for (const d of bookmarkDetails) {
        detail[d.illustId] = d;
      }
      return detail;
    }
    async getBookmarkHTMLDetail(illustId) {
      const url = `/bookmark_detail.php?illust_id=${illustId}`;
      try {
        const html = await this.fetch(url);
        const bkMatches = html.match(/<i class="_icon _bookmark-icon-inline"><\/i>(\d+)/);
        const bookmarkCount = bkMatches ? parseInt(bkMatches[1]) : 0;
        const tagsListHTML = html.match(/<ul class="tags[^>]+>.*?(?=<\/ul>)/);
        const tagHTMLs = tagsListHTML ? tagsListHTML[0].match(/>[^<]+?(?=<\/a>)/g) : [];
        const tags = tagHTMLs ? tagHTMLs.map(x => x.slice(1)) : [];
        return {
          bookmarkCount,
          illustId,
          tags
        };
      } catch (error) {
        $print.error('Pixiv#getBookmarkHTMLDetail: error:', error);
      }
    }
    async getIllustsAPIDetail(illustIds) {
      const iids = illustIds.join(',');
      const url = `/rpc/index.php?mode=get_illust_detail_by_ids&illust_ids=${iids}&tt=${this.tt}`;
      try {
        const json = await this.fetch(url);
        if (json.error) {
          throw new Error(json.message);
        }
        const details = json.body;
        for (const [key, detail] of Object.entries(details)) {
          if (detail.error) {
            delete details[key];
          }
        }
        return details;
      } catch (error) {
        $print.error('Pixiv#getIllustsAPIDetail: error:', error);
      }
    }
    async getUsersAPIDetail(userIds) {
      const uids = [...new Set(userIds)].join(',');
      const url = `/rpc/get_profile.php?user_ids=${uids}&tt=${this.tt}`;
      try {
        const json = await this.fetch(url);
        if (json.error) {
          throw new Error(json.message);
        }
        const details = {};
        for (const u of json.body) {
          details[u.user_id] = {
            userId: u.user_id,
            isFollow: u.is_follow
          };
        }
        return details;
      } catch (error) {
        $print.error('Pixiv#getUsersAPIDetail: error:', error);
      }
    }
    async getRecommendationsAPIDetails(illustIds = 'auto', numRecommendations = 500) {
      const searchParams = {
        type: 'illust',
        sample_illusts: illustIds,
        num_recommendations: numRecommendations,
        tt: this.tt
      };
      const url = `/rpc/recommender.php?${searchParams.entries.map(p => p.join('=')).join('&')}`;
      try {
        const data = await this.fetch(url);
        return data.recommendations.map(x => `${x}`);
      } catch (error) {
        $print.error('Pixiv#getRecommendationsAPIDetails: error:', error);
      }
    }
    async postBookmarkAdd(illustId) {
      const searchParams = {
        mode: 'save_illust_bookmark',
        illust_id: illustId,
        restrict: 0,
        comment: '',
        tags: '',
        tt: this.tt
      };
      const data = Object.entries(searchParams).map(p => p.join('=')).join('&');
      const config = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      };
      try {
        const res = await axios.post('/rpc/index.php', data, config);
        if (res.statusText === 'OK') {
          return !res.data.error;
        } else {
          throw new Error(res.statusText);
        }
      } catch (error) {
        $print.error('Pixiv#postBookmarkAdd: error:', error);
      }
    }
    async postThumbUp(illustId, userId) {
      const searchParams = {
        mode: 'save',
        i_id: illustId,
        u_id: userId,
        qr: 0,
        score: 10,
        tt: this.tt
      };
      const data = Object.entries(searchParams).map(p => p.join('=')).join('&');
      const config = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      };
      try {
        const res = await axios.post('/rpc_rating.php', data, config);
        if (res.statusText === 'OK') {
          return !!res.data.score;
        } else {
          throw new Error(res.statusText);
        }
      } catch (error) {
        $print.error('Pixiv#postThumbUp: error:', error);
      }
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
      '._premium-lead-popular-d-body'
    ];
    for (const selector of annoyings) {
      for (const el of $$find(doc, selector)) {
        el.remove();
      }
    }
  }
  const PixivAPI = new Pixiv();
  function makeLibraryData({ pageType, illustAPIDetails, bookmarkHTMLDetails, userAPIDetails }) {
    if (!illustAPIDetails || !Object.keys(illustAPIDetails).length) {
      throw new Error('makeLibraryData: illustAPIDetails is falsy.');
    }
    const vLibrary = [];
    for (const [illustId, illustDetail] of Object.entries(illustAPIDetails)) {
      const d = {
        illustId,
        bookmarkCount: bookmarkHTMLDetails[illustId].bookmarkCount,
        tags: bookmarkHTMLDetails[illustId].tags.join(', '),
        illustTitle: illustDetail.illust_title,
        illustPageCount: Number.toInt(illustDetail.illust_page_count),
        userId: illustDetail.user_id,
        userName: illustDetail.user_name,
        isFollow: userAPIDetails[illustDetail.user_id].isFollow,
        isBookmarked: illustDetail.is_bookmarked,
        isUgoira: !!illustDetail.ugoira_meta,
        profileImg: illustDetail.profile_img,
        url: {
          big: illustDetail.url.big,
          sq240: illustDetail.url['240mw'].replace('240x480', '240x240')
        }
      };
      if (pageType === 'MY_BOOKMARK') {
        d.bookmarkId = illustDetail.bookmarkId;
      }
      vLibrary.push(d);
    }
    return vLibrary;
  }
  var pixiv$1 = {
    state: {
      imgLibrary: [],
      isPaused: true,
      isEnded: false,
      nextUrl: location.href
    },
    mutations: {
      pause(state) {
        state.isPaused = true;
      },
      stop(state) {
        state.isPaused = true;
        state.isEnded = true;
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
            page = await PixivAPI.getPageHTMLIllustIds(state.nextUrl);
          } else {
            page = await PixivAPI.getLegacyPageHTMLIllustIds(state.nextUrl, {
              needBookmarkId: rootState.pageType === 'MY_BOOKMARK'
            });
          }
          state.nextUrl = page.nextUrl;
          const illustAPIDetails = await PixivAPI.getIllustsAPIDetail(page.illustIds);
          if (rootState.pageType === 'MY_BOOKMARK') {
            const myBookmarkAPIDetails = page.bookmarkIds;
            for (const [illustId, illustDetail] of Object.entries(illustAPIDetails)) {
              const bookmarkId = myBookmarkAPIDetails[illustId].bookmarkId;
              if (bookmarkId) {
                illustDetail.bookmarkId = bookmarkId;
              }
            }
          }
          const bookmarkHTMLDetails = await PixivAPI.getBookmarkHTMLDetails(Object.keys(illustAPIDetails));
          const userIds = Object.values(illustAPIDetails).map(d => d.user_id);
          const userAPIDetails = await PixivAPI.getUsersAPIDetail(userIds);
          const libraryData = makeLibraryData({ pageType: rootState.pageType, illustAPIDetails, bookmarkHTMLDetails, userAPIDetails });
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
      }
    },
    getters: {
      filteredLibrary(state, getters, rootState) {
        const cloneLibrary = state.imgLibrary.slice();
        const dateOrder = (new URLSearchParams(location.href)).get('order') === 'date';
        return cloneLibrary
          .filter(el => el.bookmarkCount >= rootState.filters.limit)
          .filter(el => el.tags.match(rootState.filters.tag))
          .sort(
            (a, b) => {
              const av = Number.toInt(a[rootState.filters.orderBy]);
              const bv = Number.toInt(b[rootState.filters.orderBy]);
              const c = bv - av;
              return dateOrder ? -c : c;
            }
          );
      }
    }
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
      }
    }
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
    modules: { pixiv: pixiv$1, contextMenu },
    state: {
      locale: document.documentElement.lang,
      pageType,
      koakumaMountPoint: null,
      patchouliMountPoint: null,
      VERSION: GM_info.script.version,
      NAME: GM_info.script.name,
      filters: {
        limit: 0,
        tag: new RegExp('', 'i'),
        orderBy: 'illustId'
      },
      config: {
        fitwidth: 1,
        sort: 0
      }
    },
    mutations: {
      prepareMountPoint(state) {
        if (pageType !== 'NO_SUPPORT') {
          $('#wrapper').classList.add('ω');
          state.koakumaMountPoint = $el('div', { className: 'koakumaMountPoint' }, (el) => {
            $('header._global-header').after(el);
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
        }
      },
      applyConfig(state) {
        if (state.pageType !== 'NO_SUPPORT') {
          if (state.config.fitwidth) {
            $('.ω').classList.add('↔');
          } else {
            $('.ω').classList.remove('↔');
          }
          if (state.config.sort) {
            state.filters.orderBy = 'bookmarkCount';
          } else {
            state.filters.orderBy = 'illustId';
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
      }
    }
  });
  var script = {
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
            class: _vm.usualSwitchOn ? "switch-on" : "switch-off",
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
          [_vm._v(_vm._s(_vm.usualSwitchMsg))]
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
            staticClass: "main-button",
            class: _vm.statusClass,
            attrs: { disabled: _vm.status.isEnded },
            on: { mouseup: _vm.clickMainButton }
          },
          [_vm._v("\n      " + _vm._s(_vm.buttonMsg) + "\n    ")]
        )
      ]),
      _vm._v(" "),
      _c("div", { attrs: { id: "koakuma-options-block" } }, [
        _c("div", [
          _c("input", {
            attrs: {
              id: "koakuma-options-fit-browser-width-checkbox",
              type: "checkbox"
            },
            domProps: { checked: _vm.config.fitwidth },
            on: { change: _vm.optionsChange }
          }),
          _vm._v(" "),
          _c(
            "label",
            { attrs: { for: "koakuma-options-fit-browser-width-checkbox" } },
            [_vm._v(_vm._s(_vm.$t("koakuma.fitWidth")))]
          )
        ]),
        _vm._v(" "),
        _c("div", [
          _c("input", {
            attrs: {
              id: "koakuma-options-sort-by-bookmark-count-checkbox",
              type: "checkbox"
            },
            domProps: { checked: _vm.config.sort },
            on: { change: _vm.optionsChange }
          }),
          _vm._v(" "),
          _c(
            "label",
            { attrs: { for: "koakuma-options-sort-by-bookmark-count-checkbox" } },
            [_vm._v(_vm._s(_vm.$t("koakuma.sortByBookmarkCount")))]
          )
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
    inject("data-v-2de9511e_0", { source: "\n@-webkit-keyframes slidedown-data-v-2de9511e {\nfrom {\n    -webkit-transform: translateY(-100%);\n    transform: translateY(-100%);\n}\nto {\n    -webkit-transform: translateY(0);\n    transform: translateY(0);\n}\n}\n@keyframes slidedown-data-v-2de9511e {\nfrom {\n    -webkit-transform: translateY(-100%);\n    transform: translateY(-100%);\n}\nto {\n    -webkit-transform: translateY(0);\n    transform: translateY(0);\n}\n}\na[role=\"button\"][data-v-2de9511e] {\n  text-decoration: none;\n}\n#koakuma[data-v-2de9511e] {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-pack: center;\n  -ms-flex-pack: center;\n  justify-content: center;\n  -webkit-box-align: center;\n  -ms-flex-align: center;\n  align-items: center;\n  position: -webkit-sticky;\n  position: sticky;\n  top: 0;\n  z-index: 3;\n  background-color: #e5e4ff;\n  -webkit-box-shadow: 0 2px 2px #777;\n  box-shadow: 0 2px 2px #777;\n  padding: 4px;\n  color: #00186c;\n  font-size: 16px;\n  -webkit-animation: slidedown-data-v-2de9511e 0.7s linear;\n  animation: slidedown-data-v-2de9511e 0.7s linear;\n}\n#koakuma > div[data-v-2de9511e] {\n  margin: 0 10px;\n  display: -webkit-inline-box;\n  display: -ms-inline-flexbox;\n  display: inline-flex;\n}\n.bookmark-count[data-v-2de9511e] {\n  display: -webkit-inline-box !important;\n  display: -ms-inline-flexbox !important;\n  display: inline-flex !important;\n  -webkit-box-align: center;\n  -ms-flex-align: center;\n  align-items: center;\n  margin-right: 0;\n  border-radius: 3px 0 0 3px;\n}\n#koakuma-bookmark-sort-block[data-v-2de9511e] {\n  position: relative;\n  height: 20px;\n  -webkit-box-shadow: 0 0 1px #069;\n  box-shadow: 0 0 1px #069;\n  border-radius: 4px;\n}\n#koakuma-bookmark-sort-input[data-v-2de9511e] {\n  -moz-appearance: textfield;\n  border: none;\n  background-color: transparent;\n  padding: 0;\n  color: inherit;\n  font-size: 16px;\n  display: inline-block;\n  cursor: ns-resize;\n  text-align: center;\n  max-width: 50px;\n}\n#koakuma-bookmark-sort-input[data-v-2de9511e]::-webkit-inner-spin-button,\n#koakuma-bookmark-sort-input[data-v-2de9511e]::-webkit-outer-spin-button {\n  /* https://css-tricks.com/numeric-inputs-a-comparison-of-browser-defaults/ */\n  -webkit-appearance: none;\n  margin: 0;\n}\n#koakuma-bookmark-tags-filter-input[data-v-2de9511e] {\n  min-width: 300px;\n}\n#koakuma-bookmark-input-usual-switch[data-v-2de9511e] {\n  background-color: #cef;\n  padding: 1px;\n  border-left: 1px solid #888;\n  border-radius: 0 3px 3px 0;\n  cursor: pointer;\n  display: -webkit-inline-box;\n  display: -ms-inline-flexbox;\n  display: inline-flex;\n  -webkit-box-align: center;\n  -ms-flex-align: center;\n  align-items: center;\n}\n#koakuma-bookmark-input-usual-list[data-v-2de9511e] {\n  border-radius: 3px;\n  border-top: 1px solid #888;\n  background-color: #cef;\n  -webkit-box-shadow: 0 0 1px #069;\n  box-shadow: 0 0 1px #069;\n  position: absolute;\n  top: 100%;\n  width: 100%;\n}\n#koakuma-bookmark-input-usual-list > li[data-v-2de9511e]::after {\n  content: \"\";\n  -webkit-box-shadow: 0 0 0 1px #89d8ff;\n  box-shadow: 0 0 0 1px #89d8ff;\n  display: inline-block;\n  margin: 0;\n  height: 0;\n  line-height: 0;\n  font-size: 0;\n  position: absolute;\n  width: 100%;\n  -webkit-transform: scaleX(0.8);\n  transform: scaleX(0.8);\n}\n#koakuma-bookmark-input-usual-list > li[data-v-2de9511e]:last-child::after {\n  -webkit-box-shadow: none;\n  box-shadow: none;\n}\n.usual-list-link[data-v-2de9511e]:hover::before {\n  content: \"⮬\";\n  position: absolute;\n  left: 6px;\n  font-weight: bolder;\n}\n.usual-list-link[data-v-2de9511e] {\n  display: block;\n  cursor: pointer;\n  text-align: center;\n}\n#koakuma-options-block > *[data-v-2de9511e] {\n  margin: 0 5px;\n}\n.main-button[data-v-2de9511e] {\n  border: none;\n  padding: 2px 14px;\n  border-radius: 3px;\n  font-size: 16px;\n}\n.main-button[data-v-2de9511e]:enabled {\n  -webkit-transform: translate(-1px, -1px);\n  transform: translate(-1px, -1px);\n  -webkit-box-shadow: 1px 1px 1px hsl(60, 0%, 30%);\n  box-shadow: 1px 1px 1px hsl(60, 0%, 30%);\n  cursor: pointer;\n}\n.main-button[data-v-2de9511e]:enabled:hover {\n  -webkit-transform: translate(0);\n  transform: translate(0);\n  -webkit-box-shadow: none;\n  box-shadow: none;\n}\n.main-button[data-v-2de9511e]:enabled:active {\n  -webkit-transform: translate(1px, 1px);\n  transform: translate(1px, 1px);\n  -webkit-box-shadow: -1px -1px 1px hsl(60, 0%, 30%);\n  box-shadow: -1px -1px 1px hsl(60, 0%, 30%);\n}\n.main-button.go[data-v-2de9511e] {\n  background-color: hsl(141, 100%, 50%);\n}\n.main-button.paused[data-v-2de9511e] {\n  background-color: hsl(60, 100%, 50%);\n}\n.main-button.end[data-v-2de9511e] {\n  background-color: #878787;\n  color: #fff;\n  opacity: 0.87;\n}\n", map: undefined, media: undefined });
  };
  const __vue_scope_id__ = "data-v-2de9511e";
  const __vue_module_identifier__ = undefined;
  const __vue_is_functional_template__ = false;
  function __vue_normalize__(
    template, style, script$$1,
    scope, functional, moduleIdentifier,
    createInjector, createInjectorSSR
  ) {
    const component = script$$1 || {};
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
        default: ""
      },
      illustId: {
        type: String,
        default: ""
      },
      illustPageCount: {
        type: Number,
        default: 1
      },
      isUgoira: {
        type: Boolean,
        default: false
      },
      isBookmarked: {
        type: Boolean,
        default: false
      },
      bookmarkId: {
        type: String,
        default: ""
      }
    },
    data() {
      return {
        selfIsBookmarked: this.isBookmarked
      };
    },
    computed: {
      illustPageUrl() {
        return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;
      }
    },
    methods: {
      oneClickBookmarkAdd() {
        if (!this.selfIsBookmarked) {
          this.selfIsBookmarked = true;
        }
      },
      activateContextMenu(event) {
        const payload = {};
        payload.position = {
          x: event.clientX,
          y: event.clientY
        };
        payload.data = {
          illustId: this.illustId
        };
        this.$store.commit("activateContextMenu", payload);
      }
    }
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
              $event.preventDefault();
              return _vm.activateContextMenu($event)
            }
          }
        },
        [
          _vm.illustPageCount > 1
            ? _c("div", { staticClass: "top-right-slot" }, [
                _c("span", [
                  _c("span", { staticClass: "multiple-icon" }),
                  _vm._v("\n        " + _vm._s(_vm.illustPageCount))
                ])
              ])
            : _vm._e(),
          _vm._v(" "),
          _c("img", { attrs: { "data-src": _vm.imgUrl, src: _vm.imgUrl } }),
          _vm._v(" "),
          _vm.isUgoira ? _c("div", { staticClass: "ugoira-icon" }) : _vm._e()
        ]
      ),
      _vm._v(" "),
      _c("div", {
        staticClass: "_one-click-bookmark",
        class: { on: _vm.selfIsBookmarked },
        attrs: {
          "data-click-label": _vm.illustId,
          "data-id": _vm.illustId,
          title: _vm.selfIsBookmarked,
          "data-type": "illust",
          "data-click-action": "illust"
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
    inject("data-v-4ca878ab_0", { source: "\n.image-item-image[data-v-4ca878ab] {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-align: center;\n  -ms-flex-align: center;\n  align-items: center;\n  -webkit-box-pack: center;\n  -ms-flex-pack: center;\n  justify-content: center;\n  position: relative;\n}\n.image-flexbox[data-v-4ca878ab] {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n  -ms-flex-flow: column;\n  flex-flow: column;\n  -webkit-box-pack: center;\n  -ms-flex-pack: center;\n  justify-content: center;\n  -webkit-box-align: center;\n  -ms-flex-align: center;\n  align-items: center;\n  z-index: 0;\n  border: 1px solid rgba(0, 0, 0, 0.04);\n  position: relative;\n  height: 200px;\n}\n.top-right-slot[data-v-4ca878ab] {\n  -webkit-box-flex: 0;\n  -ms-flex: none;\n  flex: none;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-align: center;\n  -ms-flex-align: center;\n  align-items: center;\n  z-index: 1;\n  -webkit-box-sizing: border-box;\n  box-sizing: border-box;\n  margin: 0 0 -24px auto;\n  padding: 6px;\n  height: 24px;\n  background: #000;\n  background: rgba(0, 0, 0, 0.4);\n  border-radius: 0 0 0 4px;\n  color: #fff;\n  font-size: 12px;\n  line-height: 1;\n  font-weight: 700;\n}\n.multiple-icon[data-v-4ca878ab] {\n  display: inline-block;\n  margin-right: 4px;\n  width: 10px;\n  height: 10px;\n  background: url(https://source.pixiv.net/www/js/bundle/3b9b0b9e331e13c46aeadaea83132203.svg);\n}\n.ugoira-icon[data-v-4ca878ab] {\n  position: absolute;\n  -webkit-box-flex: 0;\n  -ms-flex: none;\n  flex: none;\n  width: 40px;\n  height: 40px;\n  background: url(https://source.pixiv.net/www/js/bundle/f608d897f389e8161e230b817068526d.svg)\n    50% no-repeat;\n  top: 50%;\n  left: 50%;\n  margin: -20px 0 0 -20px;\n}\nimg[data-v-4ca878ab] {\n  max-height: 100%;\n  max-width: 100%;\n}\n._one-click-bookmark[data-v-4ca878ab] {\n  right: 0;\n  width: 24px;\n  height: 24px;\n  line-height: 24px;\n  z-index: 2;\n  text-align: center;\n  cursor: pointer;\n  background: url(https://source.pixiv.net/www/images/bookmark-heart-off.svg)\n    center transparent;\n  background-repeat: no-repeat;\n  background-size: cover;\n  opacity: 0.8;\n  filter: alpha(opacity=80);\n  -webkit-transition: opacity 0.2s ease-in-out;\n  transition: opacity 0.2s ease-in-out;\n}\n._one-click-bookmark.on[data-v-4ca878ab] {\n  background-image: url(https://source.pixiv.net/www/images/bookmark-heart-on.svg);\n}\n.bookmark-input-container[data-v-4ca878ab] {\n  position: absolute;\n  left: 0;\n  top: 0;\n  background: rgba(0, 0, 0, 0.4);\n  padding: 6px;\n  border-radius: 0 0 4px 0;\n}\n", map: undefined, media: undefined });
  };
  const __vue_scope_id__$1 = "data-v-4ca878ab";
  const __vue_module_identifier__$1 = undefined;
  const __vue_is_functional_template__$1 = false;
  function __vue_normalize__$1(
    template, style, script,
    scope, functional, moduleIdentifier,
    createInjector, createInjectorSSR
  ) {
    const component = script || {};
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
        default: ""
      },
      illustTitle: {
        type: String,
        default: ""
      },
      userName: {
        type: String,
        default: ""
      },
      userId: {
        type: String,
        default: ""
      },
      profileImgUrl: {
        type: String,
        default: ""
      },
      bookmarkCount: {
        type: Number,
        default: 0
      },
      isFollow: {
        type: Boolean,
        default: false
      }
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
          count: this.bookmarkCount
        });
      },
      profileImgStyle() {
        return {
          backgroundImage: `url(${this.profileImgUrl})`
        };
      },
      isMemberIllistPage() {
        return this.$store.state.pageType === "MEMBER_ILLIST";
      }
    }
  };
  const __vue_script__$2 = script$2;
  var __vue_render__$2 = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c("figcaption", { staticClass: "image-item-title" }, [
      _c("ul", [
        _c("li", { staticClass: "title-text" }, [
          _c(
            "a",
            { attrs: { href: _vm.illustPageUrl, title: _vm.illustTitle } },
            [_vm._v(_vm._s(_vm.illustTitle))]
          )
        ]),
        _vm._v(" "),
        !_vm.isMemberIllistPage
          ? _c("li", { staticClass: "user-info" }, [
              _c(
                "a",
                {
                  staticClass: "user-link ui-profile-popup",
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
              _vm.isFollow ? _c("i", { staticClass: "fas fa-rss" }) : _vm._e()
            ])
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
    inject("data-v-18a3e923_0", { source: "\n.image-item-title[data-v-18a3e923] {\n  max-width: 100%;\n  margin: 8px auto;\n  text-align: center;\n  color: #333;\n  font-size: 12px;\n  line-height: 1;\n}\n.title-text[data-v-18a3e923] {\n  margin: 4px 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-weight: 700;\n}\n.user-info[data-v-18a3e923] {\n  display: -webkit-inline-box;\n  display: -ms-inline-flexbox;\n  display: inline-flex;\n  -webkit-box-align: center;\n  -ms-flex-align: center;\n  align-items: center;\n}\n.user-link[data-v-18a3e923] {\n  font-size: 12px;\n  display: -webkit-inline-box;\n  display: -ms-inline-flexbox;\n  display: inline-flex;\n  -webkit-box-align: center;\n  -ms-flex-align: center;\n  align-items: center;\n}\n.user-img[data-v-18a3e923] {\n  width: 20px;\n  height: 20px;\n  display: inline-block;\n  background-size: cover;\n  border-radius: 50%;\n  margin-right: 4px;\n}\ni.fa-rss[data-v-18a3e923] {\n  display: inline-block;\n  margin-left: 4px;\n  width: 16px;\n  height: 16px;\n  color: dodgerblue;\n}\n", map: undefined, media: undefined });
  };
  const __vue_scope_id__$2 = "data-v-18a3e923";
  const __vue_module_identifier__$2 = undefined;
  const __vue_is_functional_template__$2 = false;
  function __vue_normalize__$2(
    template, style, script,
    scope, functional, moduleIdentifier,
    createInjector, createInjectorSSR
  ) {
    const component = script || {};
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
        default: ""
      },
      illustId: {
        type: String,
        default: ""
      },
      illustTitle: {
        type: String,
        default: ""
      },
      illustPageCount: {
        type: Number,
        default: 1
      },
      userName: {
        type: String,
        default: ""
      },
      userId: {
        type: String,
        default: ""
      },
      profileImgUrl: {
        type: String,
        default: ""
      },
      isUgoira: {
        type: Boolean,
        default: false
      },
      isBookmarked: {
        type: Boolean,
        default: false
      },
      isFollow: {
        type: Boolean,
        default: false
      },
      bookmarkId: {
        type: String,
        default: ""
      },
      bookmarkCount: {
        type: Number,
        default: 0
      }
    },
    computed: {
      pageType() {
        return this.$store.state.pageType;
      }
    }
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
              "is-follow": _vm.isFollow,
              "profile-img-url": _vm.profileImgUrl,
              "bookmark-count": _vm.bookmarkCount,
              "page-type": _vm.pageType
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
    inject("data-v-7736ae16_0", { source: "\n.image-item[data-v-7736ae16] {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-pack: center;\n  -ms-flex-pack: center;\n  justify-content: center;\n  margin: 0 0 30px 0;\n  padding: 10px;\n  height: auto;\n  width: 200px;\n}\n.image-item-inner[data-v-7736ae16] {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n  -ms-flex-flow: column;\n  flex-flow: column;\n  max-width: 100%;\n  max-height: 300px;\n}\n", map: undefined, media: undefined });
  };
  const __vue_scope_id__$3 = "data-v-7736ae16";
  const __vue_module_identifier__$3 = undefined;
  const __vue_is_functional_template__$3 = false;
  function __vue_normalize__$3(
    template, style, script,
    scope, functional, moduleIdentifier,
    createInjector, createInjectorSSR
  ) {
    const component = script || {};
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
    async xmlhttpRequest(details) {
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
    }
  };
  var script$4 = {
    computed: {
      status() {
        return this.$store.state.contextMenu;
      },
      currentData() {
        if (!this.status.data) {
          return null;
        }
        const illustId = this.status.data.illustId;
        const found = this.$store.state.pixiv.imgLibrary.find(
          i => i.illustId === illustId
        );
        return found ? found : null;
      },
      inlineStyle() {
        const RIGHT_BOUND = 200;
        const position = this.status.position;
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
        if (!this.status.data) {
          return "#";
        }
        const illustId = this.status.data.illustId;
        return `bookmark_add.php?type=illust&illust_id=${illustId}`;
      }
    },
    methods: {
      thumbUp() {
        if (this.currentData) {
          PixivAPI.postThumbUp(
            this.currentData.illustId,
            this.currentData.userId
          );
        }
      },
      async downloadOne() {
        const imgUrl = this.currentData.url.big;
        const illustId = this.currentData.illustId;
        const a = $el("a", { href: imgUrl });
        const filename = a.pathname.split("/").pop();
        const ext = filename
          .split(".")
          .pop()
          .toLowerCase();
        const response = await GMC.xmlhttpRequest({
          method: "GET",
          url: imgUrl,
          responseType: "arraybuffer",
          headers: {
            Referer: `https://www.pixiv.net/member_illust.php?mode=medium&illust_id=${illustId}`
          }
        });
        if (ext === "jpg" || ext === "jpeg") {
          saveAs(new File([response.response], filename, { type: "image/jpeg" }));
        } else if (ext === "png") {
          saveAs(new File([response.response], filename, { type: "image/png" }));
        }
      }
    }
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
        _c("ul", { attrs: { id: "patchouli-context-menu-list" } }, [
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
                  value: _vm.currentData && _vm.currentData.illustPageCount === 1,
                  expression: "currentData && currentData.illustPageCount === 1"
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
        ])
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
    inject("data-v-680ff136_0", { source: "\n#patchouli-context-menu[data-v-680ff136] {\n  box-sizing: border-box;\n  border: 1px solid #b28fce;\n  position: fixed;\n  z-index: 10;\n  background-color: #fff;\n  font-size: 16px;\n  overflow: hidden;\n  border-radius: 6px;\n}\n#patchouli-context-menu-list > li[data-v-680ff136] {\n  display: flex;\n  align-items: center;\n}\n#patchouli-context-menu-list a[data-v-680ff136] {\n  color: #85a;\n  padding: 3px;\n  flex: 1;\n  border-radius: 5px;\n  text-decoration: none;\n  white-space: nowrap;\n  display: inline-flex;\n  align-items: center;\n}\n#patchouli-context-menu-list a[data-v-680ff136]:hover {\n  background-color: #b28fce;\n  color: #fff;\n  cursor: pointer;\n}\n#patchouli-context-menu-list i.far[data-v-680ff136],\n#patchouli-context-menu-list i.fas[data-v-680ff136] {\n  height: 18px;\n  width: 18px;\n  margin: 0 4px;\n}\n", map: undefined, media: undefined });
  };
  const __vue_scope_id__$4 = "data-v-680ff136";
  const __vue_module_identifier__$4 = undefined;
  const __vue_is_functional_template__$4 = false;
  function __vue_normalize__$4(
    template, style, script,
    scope, functional, moduleIdentifier,
    createInjector, createInjectorSSR
  ) {
    const component = script || {};
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
      }
    }
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
            key: d.illustId,
            attrs: {
              "img-url": d.url.sq240,
              "illust-id": d.illustId,
              "illust-title": d.illustTitle,
              "illust-page-count": d.illustPageCount,
              "is-ugoira": d.isUgoira,
              "user-name": d.userName,
              "user-id": d.userId,
              "profile-img-url": d.profileImg,
              "bookmark-count": d.bookmarkCount,
              "is-bookmarked": d.isBookmarked,
              "is-follow": d.isFollow,
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
    inject("data-v-7b1e7b33_0", { source: "\n#patchouli[data-v-7b1e7b33] {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -ms-flex-flow: wrap;\n  flex-flow: wrap;\n  -ms-flex-pack: distribute;\n  justify-content: space-around;\n}\n", map: undefined, media: undefined });
  };
  const __vue_scope_id__$5 = "data-v-7b1e7b33";
  const __vue_module_identifier__$5 = undefined;
  const __vue_is_functional_template__$5 = false;
  function __vue_normalize__$5(
    template, style, script,
    scope, functional, moduleIdentifier,
    createInjector, createInjectorSSR
  ) {
    const component = script || {};
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
  Vue.use(VueI18n);
  var i18n = new VueI18n({
    locale: document.documentElement.lang,
    fallbackLocale: 'ja',
    messages: {
      'en': {
        patchouli: {
          bookmarkTooltip: '{count} bookmarks'
        },
        koakuma: {
          processed: '{count} imgs processed',
          tagsPlaceholder: 'tags filter example: flandre|sister',
          buttonGo: 'Go',
          buttonPause: 'Pause',
          buttonEnd: 'End',
          fitWidth: 'fit browser width',
          sortByBookmarkCount: 'sort by bookmark count'
        },
        contextMenu: {
          thumbUp: 'Like',
          openBookmarkPage: 'Add Bookmark Page',
          download: 'Download'
        }
      },
      'ja': {
        patchouli: {
          bookmarkTooltip: '{count} 件のブックマーク'
        },
        koakuma: {
          processed: '{count} 件が処理された',
          tagsPlaceholder: 'タグフィルター 例: フランドール|妹様',
          buttonGo: '捜す',
          buttonPause: '中断',
          buttonEnd: '終了',
          fitWidth: '全幅',
          sortByBookmarkCount: 'ブックマーク数順'
        },
        contextMenu: {
          thumbUp: 'いいね',
          openBookmarkPage: 'ブックマーク追加ページ',
          download: 'ダウンロード'
        }
      },
      'zh': {
        patchouli: {
          bookmarkTooltip: '{count} 个收藏'
        },
        koakuma: {
          processed: '已处理 {count} 张',
          tagsPlaceholder: '标签过滤 例: 芙兰朵露|二小姐',
          buttonGo: '找',
          buttonPause: '停',
          buttonEnd: '完',
          fitWidth: '自适应浏览器宽度',
          sortByBookmarkCount: '书签数排序'
        },
        contextMenu: {
          thumbUp: '赞',
          openBookmarkPage: '开启添加收藏页',
          download: '下载'
        }
      },
      'zh-tw': {
        patchouli: {
          bookmarkTooltip: '{count} 個收藏'
        },
        koakuma: {
          processed: '已處理 {count} 張',
          tagsPlaceholder: '標籤過濾 例: 芙蘭朵露|二小姐',
          buttonGo: '找',
          buttonPause: '停',
          buttonEnd: '完',
          fitWidth: '自適應瀏覽器寬度',
          sortByBookmarkCount: '書籤數排序'
        },
        contextMenu: {
          thumbUp: '讚',
          openBookmarkPage: '開啟添加收藏頁',
          download: '下載'
        }
      }
    }
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
    $('._global-header').classList.add('koakuma-placeholder');
    const Patchouli = new Vue({
      i18n,
      store,
      computed: {
        currentLocale() {
          return this.$store.state.locale;
        }
      },
      watch: {
        currentLocale(newValue) {
          this.$i18n.locale = newValue;
        }
      },
      render: h => h(patchouli)
    });
    const Koakuma = new Vue({
      i18n,
      store,
      computed: {
        currentLocale() {
          return this.$store.state.locale;
        }
      },
      watch: {
        currentLocale(newValue) {
          this.$i18n.locale = newValue;
        }
      },
      render: h => h(koakuma)
    });
    store.dispatch('start', { times: 1 }).then(() => {
      Patchouli.$mount(store.state.patchouliMountPoint);
      Koakuma.$mount(store.state.koakumaMountPoint);
      $('._global-header').classList.remove('koakuma-placeholder');
    }).catch(error => {
      $print.error('Fail to first mount', error);
    });
    document.body.addEventListener('click', (event) => {
      if (event.target.id !== 'koakuma-bookmark-input-usual-switch') {
        Koakuma.$children[0].usualSwitchOn = false;
      }
      if (store.state.contextMenu.active) {
        store.commit('deactivateContextMenu');
      }
    });
    window.Patchouli = Patchouli;
    window.Koakuma = Koakuma;
  }

}(Vue,Vuex,VueI18n));
