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
// @version           4.2.0-alpha.8
// @grant             unsafeWindow
// @grant             GM_getValue
// @grant             GM.getValue
// @grant             GM_setValue
// @grant             GM.setValue
// @grant             GM_xmlhttpRequest
// @grant             GM.xmlHttpRequest
// ==/UserScript==

(function (Vue,VueI18n,Vuex) {
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
  VueI18n = VueI18n && VueI18n.hasOwnProperty('default') ? VueI18n['default'] : VueI18n;
  Vuex = Vuex && Vuex.hasOwnProperty('default') ? Vuex['default'] : Vuex;

  __$styleInject("._global-header {\n  z-index: 4;\n  position: relative;\n}\n._global-header .ui-search {\n  z-index: auto;\n}\n._global-header.koakuma-placeholder {\n  /* I don't know why #koakuma just 32px\n     but it should preserve 42px to keep all spacing correct */\n  margin-bottom: 42px;\n}\n#toolbar-items {\n  z-index: 5;\n}\n.ω {\n  display: flex;\n  flex-flow: row wrap;\n  justify-content: center;\n  position: relative;\n}\n.ω,\n.ω .layout-a,\n.ω .layout-body {\n  transition: width 0.2s;\n}\n.ω.↔,\n.ω.↔ .layout-a,\n.ω.↔ .layout-body {\n  width: 100% !important;\n}\n.ω.↔ .layout-a {\n  display: flex;\n  flex-direction: row-reverse;\n}\n.ω.↔ .layout-column-2 {\n  flex: 1;\n  margin-left: 20px;\n}\n.ω.↔ .layout-body,\n.ω.↔ .layout-a {\n  margin: 10px 20px;\n}\n\n/* annoyings, ref: lib/pixiv.js */\n\niframe,\n/* Ad */\n.ad,\n.ads_area,\n.ad-footer,\n.ads_anchor,\n.ads-top-info,\n.comic-hot-works,\n.user-ad-container,\n.ads_area_no_margin,\n/* Premium */\n.hover-item,\n.ad-printservice,\n.bookmark-ranges,\n.require-premium,\n.showcase-reminder,\n.sample-user-search,\n.popular-introduction,\n._premium-lead-tag-search-bar,\n._premium-lead-popular-d-body,\n._premium-lead-promotion-banner {\n  display: none !important;\n}\n\n:root {\n  --new-default-image-item-square-size: 184px;\n  --default-image-item-image-square-size: 200px;\n}\n\n/* dotted focus */\na::-moz-focus-inner,\nbutton::-moz-focus-inner {\n  border: 0 !important;\n  outline: 0 !important;\n}\na:focus,\nbutton:focus {\n  outline: 0 !important;\n}\n");

  const MAIN_PAGE_TYPE = {
    ANCIENT_FOLLOWED_NEWS: Symbol('ANCIENT_FOLLOWED_NEWS'),
    FOLLOWED_NEWS: Symbol('FOLLOWED_NEWS'),
    NEW_PROFILE: Symbol('NEW_PROFILE'),
    NEW_PROFILE_BOOKMARK: Symbol('NEW_PROFILE_BOOKMARK'),
    NEW_PROFILE_ILLUST: Symbol('NEW_PROFILE_ILLUST'),
    NEW_PROFILE_MANGA: Symbol('NEW_PROFILE_MANGA'),
    NO_SUPPORT: Symbol('NO_SUPPORT'),
    SEARCH: Symbol('SEARCH'),
    SELF_BOOKMARK: Symbol('SELF_BOOKMARK'),
  };
  const SORT_TYPE = {
    BOOKMARK_COUNT: 2,
    BOOKMARK_ID: 1,
    ILLUST_ID: 0,
  };
  const $ = (selector) => {
    return document.querySelector(selector);
  };
  const $$ = (selector) => {
    return [...document.querySelectorAll(selector)];
  };
  const $$find = (doc, selector) => {
    return [...doc.querySelectorAll(selector)];
  };
  const $el = (tag, attr = {}, cb = () => {}) => {
    const el = document.createElement(tag);
    Object.assign(el, attr);
    cb(el);
    return el;
  };
  const $print = {
    debug(...args) {
      console.debug.apply(console, [...args]);
    },
    error(...args) {
      console.error.apply(console, [...args]);
    },
    log(...args) {
      console.log.apply(console, [...args]);
    },
  };
  const toInt = (x) => {
    const t = Number(x);
    return isNaN(t) ? 0 : Math.floor(t);
  };
  const $after = (el, target) => {
    el.parentNode.insertBefore(target, el.nextSibling);
  };
  const $parents = (el) => {
    let cur = el;
    const collection = [];
    while (cur.parentElement) {
      collection.push(cur.parentElement);
      cur = cur.parentElement;
    }
    return collection;
  };
  const toFormUrlencoded = (o) => {
    return Object.entries(o)
      .map(p => p.map(encodeURIComponent).join('='))
      .join('&');
  };
  async function waitUntil(func, { ms = 100, maxCount = 20 } = {}) {
    return new Promise((resolve, reject) => {
      let c = maxCount;
      const i = setInterval(() => {
        const r = func();
        if (r) {
          clearInterval(i);
          resolve(r);
        } else if (c <= 0) {
          clearInterval(i);
          reject();
        } else {
          c -= 1;
        }
      }, ms);
    });
  }
  async function $ready(func) {
    return waitUntil(func, { maxCount: Infinity })
      .catch($print.error);
  }
  class ExtendableError extends Error {
    constructor(message) {
      super(message);
      this.name = this.constructor.name;
      if (typeof Error.captureStackTrace === 'function') {
        Error.captureStackTrace(this, this.constructor);
      } else {
        this.stack = (new Error(message)).stack;
      }
    }
  }
  class InitError extends ExtendableError {}
  class ConnectionError extends ExtendableError {}
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
            throw new ConnectionError(`${resp.status} ${resp.statusText}`);
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
    async rpcCall(mode, params = {}) {
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
    async getUserProfileData(userId) {
      const url = `/ajax/user/${userId}/profile/all`;
      const data = await this.fetchJSON(url);
      return data;
    }
    async getUserBookmarkData(userId, optSearchParams = {}) {
      const searchParams = Object.assign({
        limit: 24,
        offset: 0,
        rest: 'show',
        tag: '',
      }, optSearchParams);
      const url = `/ajax/user/${userId}/illusts/bookmarks?${toFormUrlencoded(searchParams)}`;
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
          illustIds,
          nextUrl,
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
          illustIds,
          nextUrl,
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
        format: 'json',
        mode: 'add',
        restrict: 0,
        tt: this.tt,
        type: 'user',
        user_id: userId,
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
        comment: '',
        illust_id: illustId,
        restrict: 0,
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
  const PixivAPI = new Pixiv();
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
  Vue.use(VueI18n);
  const en = {
    config: {
      blacklist: 'Blacklist',
      contextMenuExtension: 'Right click extension',
      hoverPlay: 'Mouse hover play ugoira',
      userTooltip: 'Illustrator tooltip',
    },
    contextMenu: {
      addToBlacklist: 'Add to Blacklist',
      download: 'Download',
      followUser: 'Follow',
      openBookmarkPage: 'Add Bookmark Page',
      preview: 'Preview',
      thumbUp: 'Like',
    },
    ctrlPanel: {
      buttonEnd: 'End',
      buttonGo: 'Go',
      buttonPause: 'Pause',
      fitWidth: 'fit browser width',
      processed: '{count} imgs processed',
      sortByBookmarkId: 'sort by bookmark id',
      sortByDate: 'sort by date',
      sortByPopularity: 'sort by popularity',
      tagsPlaceholder: 'tags filter example: flandre|sister',
    },
    mainView: {
      bookmarkTooltip: '{count} bookmarks',
      newProfilePage: {
        bookmarks: 'Bookmarks',
        contents: 'Contents',
        illustrations: 'Illustrations',
        manga: 'Manga',
        noResult: 'Not found',
        privateBookmark: 'Private',
        publicBookmark: 'Public',
      },
    },
  };
  const ja = {
    config: {
      blacklist: 'ブラックリスト',
      contextMenuExtension: '右クリックの拡張機能',
      hoverPlay: 'マウスオーバーでうごイラ再生',
      userTooltip: 'イラストレーターツールチップ',
    },
    contextMenu: {
      addToBlacklist: 'ブラックリストへ',
      download: 'ダウンロード',
      followUser: 'フォローする',
      openBookmarkPage: 'ブックマーク追加ページ',
      preview: 'プレビュー',
      thumbUp: 'いいね',
    },
    ctrlPanel: {
      buttonEnd: '終了',
      buttonGo: '捜す',
      buttonPause: '中断',
      fitWidth: '全幅',
      processed: '{count} 件が処理された',
      sortByBookmarkId: 'ブックマーク順',
      sortByDate: '投稿順',
      sortByPopularity: '人気順',
      tagsPlaceholder: 'タグフィルター 例: フランドール|妹様',
    },
    mainView: {
      bookmarkTooltip: '{count} 件のブックマーク',
      newProfilePage: {
        bookmarks: 'ブックマーク',
        contents: '作品',
        illustrations: 'イラスト',
        manga: 'マンガ',
        noResult: '作品がありません',
        privateBookmark: '非公開',
        publicBookmark: '公開',
      },
    },
  };
  const zhCN = {
    config: {
      blacklist: '黑名單',
      contextMenuExtension: '右键扩展',
      hoverPlay: '鼠标播放动图',
      userTooltip: '绘师提示框',
    },
    contextMenu: {
      addToBlacklist: '拉黑',
      download: '下载',
      followUser: '加关注',
      openBookmarkPage: '开启添加收藏页',
      preview: '原图预览',
      thumbUp: '赞',
    },
    ctrlPanel: {
      buttonEnd: '完',
      buttonGo: '找',
      buttonPause: '停',
      fitWidth: '自适应浏览器宽度',
      processed: '已处理 {count} 张',
      sortByBookmarkId: '以加入顺序排序',
      sortByDate: '以日期排序',
      sortByPopularity: '以人气排序',
      tagsPlaceholder: '标签过滤 例: 芙兰朵露|二小姐',
    },
    mainView: {
      bookmarkTooltip: '{count} 个收藏',
      newProfilePage: {
        bookmarks: '收藏',
        contents: '作品',
        illustrations: '插画',
        manga: '漫画',
        noResult: '找不到作品',
        privateBookmark: '非公开',
        publicBookmark: '公开',
      },
    },
  };
  const zhTW = {
    config: {
      blacklist: '黑名單',
      contextMenuExtension: '擴充右鍵',
      hoverPlay: '滑鼠播放動圖',
      userTooltip: '繪師提示框',
    },
    contextMenu: {
      addToBlacklist: '加入黑名單',
      download: '下載',
      followUser: '加關注',
      openBookmarkPage: '開啟添加收藏頁',
      preview: '原圖預覽',
      thumbUp: '讚',
    },
    ctrlPanel: {
      buttonEnd: '完',
      buttonGo: '找',
      buttonPause: '停',
      fitWidth: '自適應瀏覽器寬度',
      processed: '已處理 {count} 張',
      sortByBookmarkId: '以加入順序排序',
      sortByDate: '以日期排序',
      sortByPopularity: '以人氣排序',
      tagsPlaceholder: '標籤過濾 例: 芙蘭朵露|二小姐',
    },
    mainView: {
      bookmarkTooltip: '{count} 個收藏',
      newProfilePage: {
        bookmarks: '收藏',
        contents: '作品',
        illustrations: '插畫',
        manga: '漫畫',
        noResult: '找不到作品',
        privateBookmark: '非公開',
        publicBookmark: '公開',
      },
    },
  };
  var i18n = new VueI18n({
    fallbackLocale: 'ja',
    locale: document.documentElement.lang.toLowerCase(),
    messages: {
      en,
      ja,
      'zh': zhCN,
      'zh-cn': zhCN,
      'zh-tw': zhTW,
    },
  });
  function makeNewTag(tag) {
    if (tag.translation) {
      const trs = Object.values(tag.translation);
      return [tag.tag, ...trs].filter(Boolean).join('\x00');
    }
    return [tag.tag, tag.romaji].filter(Boolean).join('\x00');
  }
  function makeLibraryData({ illustDataGroup, userDataGroup }) {
    if (!illustDataGroup || !Object.keys(illustDataGroup).length) {
      return [];
    }
    const library = [];
    for (const [illustId, illustData] of Object.entries(illustDataGroup)) {
      const allTags = illustData.tags.tags.map(makeNewTag).join('\x00');
      const d = {
        _show: true,
        bookmarkCount: illustData.bookmarkCount,
        bookmarkId: '',
        illustId,
        illustPageCount: toInt(illustData.pageCount),
        illustTitle: illustData.illustTitle,
        isBookmarked: Boolean(illustData.bookmarkData),
        isFollowed: userDataGroup[illustData.userId].isFollowed,
        isManga: illustData.illustType === 1,
        isPrivateBookmark: false,
        isUgoira: illustData.illustType === 2,
        profileImg: userDataGroup[illustData.userId].image,
        tags: allTags,
        urls: {
          original: illustData.urls.original,
          thumb: illustData.urls.thumb,
        },
        userId: illustData.userId,
        userName: illustData.userName,
      };
      if (illustData.bookmarkData) {
        d.bookmarkId = illustData.bookmarkData.id;
        d.isPrivateBookmark = illustData.bookmarkData.private;
      }
      library.push(d);
    }
    return library;
  }
  const state = {
    batchSize: 40,
    imageItemLibrary: [],
    isEnded: false,
    isPaused: true,
    moveWindowIndex: 0,
    moveWindowPrivateBookmarkIndex: 0,
    nextUrl: location.href,
    prefetchPool: {
      illusts: [],
      manga: [],
    },
  };
  const getters = {
    defaultProcessedLibrary: (state, getters, rootState, rootGetters) => {
      const clonedLib = state.imageItemLibrary.slice();
      const { sp, filters, config, orderBy } = rootGetters;
      const dateOldFirst = sp.order === 'date';
      const bookmarkEarlyFirst = sp.order === 'asc';
      const isToShow = (d) => {
        return d.bookmarkCount >= filters.limit &&
          d.tags.match(filters.tag) &&
          !config.blacklist.includes(d.userId);
      };
      const shows = [], hides = [];
      for (const d of clonedLib) {
        const s = isToShow(d);
        d._show = s;
        if (s) {
          shows.push(d);
        } else {
          hides.push(d);
        }
      }
      shows.sort((a, b) => {
        const av = toInt(a[orderBy]);
        const bv = toInt(b[orderBy]);
        const c = bv - av;
        switch (orderBy) {
        case 'illustId':
          return dateOldFirst ? -c : c;
        case 'bookmarkCount':
          return c;
        case 'bookmarkId':
          return bookmarkEarlyFirst ? -c : c;
        default:
          return 0;
        }
      });
      return shows.concat(hides);
    },
    imageItemLibrary: (state) => state.imageItemLibrary,
    nppProcessedLibrary: (state, getters, rootState, rootGetters) => {
      const clonedLib = state.imageItemLibrary.slice();
      const { filters, config, orderBy, sp } = rootGetters;
      const { nppType } = getters;
      const isToShow = (d) => {
        const conds = [
          d.bookmarkCount >= filters.limit,
          d.tags.match(filters.tag),
          !config.blacklist.includes(d.userId),
        ];
        switch (nppType) {
        case 0:
          conds.push(d.userId === sp.id);
          break;
        case 1:
          conds.push(d.userId === sp.id && !d.isManga);
          break;
        case 2:
          conds.push(d.userId === sp.id && d.isManga);
          break;
        case 3:
          conds.push(d.userId !== sp.id);
          if (sp.rest === 'show') {
            conds.push(!d.isPrivateBookmark);
          } else {
            conds.push(d.isPrivateBookmark);
          }
          break;
        default:
          break;
        }
        return conds.every(Boolean);
      };
      const shows = [], hides = [];
      for (const d of clonedLib) {
        const s = isToShow(d);
        d._show = s;
        if (s) {
          shows.push(d);
        } else {
          hides.push(d);
        }
      }
      shows.sort((a, b) => {
        const av = toInt(a[orderBy]);
        const bv = toInt(b[orderBy]);
        return bv - av;
      });
      return shows.concat(hides);
    },
    nppType: (state, getters, rootState, rootGetters) => {
      const types = [
        MAIN_PAGE_TYPE.NEW_PROFILE,
        MAIN_PAGE_TYPE.NEW_PROFILE_ILLUST,
        MAIN_PAGE_TYPE.NEW_PROFILE_MANGA,
        MAIN_PAGE_TYPE.NEW_PROFILE_BOOKMARK,
      ];
      return types.indexOf(rootGetters.MPT);
    },
    status: (state) => {
      const { isEnded, isPaused } = state;
      return { isEnded, isPaused };
    },
  };
  const mutations = {
    editImgItem(state, options = {}) {
      const DEFAULT_OPT = {
        illustId: '',
        type: null,
        userId: '',
      };
      const opt = Object.assign({}, DEFAULT_OPT, options);
      if (opt.type === 'follow-user' && opt.userId) {
        state.imageItemLibrary
          .filter(i => i.userId === opt.userId)
          .forEach(i => {
            i.isFollowed = true;
          });
      }
    },
    pause(state) {
      state.isPaused = true;
    },
    relive(state) {
      state.isEnded = false;
    },
    resume(state) {
      state.isPaused = false;
    },
    stop(state) {
      state.isPaused = true;
      state.isEnded = true;
    },
  };
  const actions = {
    async delayFirstStart({ commit, dispatch }, { actionName, options }) {
      commit('resume');
      commit('relive');
      await dispatch(actionName, options);
    },
    async start({ state, commit, dispatch, getters, rootGetters }, { times = Infinity, force = false, isFirst = false } = {}) {
      commit('resume');
      if (force) {
        commit('relive');
      }
      if (state.isEnded || times <= 0) {
        return;
      }
      if (getters.nppType >= 0 && isFirst) {
        const profile = await PixivAPI.getUserProfileData(rootGetters.sp.id);
        state.prefetchPool.illusts.push(...Object.keys(profile.illusts));
        state.prefetchPool.manga.push(...Object.keys(profile.manga));
        state.prefetchPool.illusts.sort((i, j) => j - i);
        state.prefetchPool.manga.sort((i, j) => j - i);
      }
      switch (rootGetters.MPT) {
      case MAIN_PAGE_TYPE.SEARCH:
      case MAIN_PAGE_TYPE.FOLLOWED_NEWS:
      case MAIN_PAGE_TYPE.ANCIENT_FOLLOWED_NEWS:
      case MAIN_PAGE_TYPE.SELF_BOOKMARK:
        await dispatch('startNextUrlBased', { times });
        break;
      case MAIN_PAGE_TYPE.NEW_PROFILE:
        await dispatch('startPrefetchBased', { pool: 'all', times  });
        break;
      case MAIN_PAGE_TYPE.NEW_PROFILE_ILLUST:
        await dispatch('startPrefetchBased', { pool: 'illusts', times });
        break;
      case MAIN_PAGE_TYPE.NEW_PROFILE_MANGA:
        await dispatch('startPrefetchBased', { pool: 'manga', times });
        break;
      case MAIN_PAGE_TYPE.NEW_PROFILE_BOOKMARK:
        await dispatch('startMovingWindowBased', { times });
        break;
      default:
        $print.error('Unknown main page type', rootGetters.MPT);
        break;
      }
    },
    async startMovingWindowBased({ state, commit, getters, rootGetters }, { times = Infinity, rest = null } = {}) {
      while (!state.isPaused && !state.isEnded && times) {
        let illustIds = [], maxTotal = Infinity;
        const _rest = rest || rootGetters.sp.rest;
        const _uid = rootGetters.sp.id;
        let cIndex = (_rest === 'show') ? state.moveWindowIndex : state.moveWindowPrivateBookmarkIndex;
        if (getters.nppType >= 0) {
          const opt = { limit: state.batchSize, offset: cIndex, rest: _rest };
          const { works, total } = await PixivAPI.getUserBookmarkData(_uid, opt);
          if (!works) {
            commit('stop');
            break;
          }
          maxTotal = total;
          illustIds.push(...works.map((d) => d.id));
        }
        cIndex += state.batchSize;
        if (getters.nppType >= 0 && _rest === 'hide') {
          state.moveWindowPrivateBookmarkIndex = cIndex;
        } else {
          state.moveWindowIndex = cIndex;
        }
        const illustDataGroup = await PixivAPI.getIllustDataGroup(illustIds);
        const userIds = Object.values(illustDataGroup).map(d => d.userId);
        const userDataGroup = await PixivAPI.getUserDataGroup(userIds);
        const libraryData = makeLibraryData({
          illustDataGroup,
          userDataGroup,
        });
        for (const d of libraryData) {
          if (!state.imageItemLibrary.find(x => x.illustId === d.illustId)) {
            state.imageItemLibrary.push(d);
          }
        }
        times -= 1;
        if (!times) {
          commit('pause');
        }
        if (cIndex > maxTotal) {
          commit('stop');
        }
      }
    },
    async startNextUrlBased({ state, commit, rootGetters }, { times = Infinity } = {}) {
      while (!state.isPaused && !state.isEnded && times) {
        let page = null;
        if ([MAIN_PAGE_TYPE.SEARCH, MAIN_PAGE_TYPE.FOLLOWED_NEWS].includes(rootGetters.MPT)) {
          page = await PixivAPI.getIllustIdsInPageHTML(state.nextUrl);
        } else {
          page = await PixivAPI.getIllustIdsInLegacyPageHTML(state.nextUrl);
        }
        state.nextUrl = page.nextUrl;
        const illustDataGroup = await PixivAPI.getIllustDataGroup(page.illustIds);
        const userIds = Object.values(illustDataGroup).map(d => d.userId);
        const userDataGroup = await PixivAPI.getUserDataGroup(userIds);
        const libraryData = makeLibraryData({
          illustDataGroup,
          userDataGroup,
        });
        for (const d of libraryData) {
          if (!state.imageItemLibrary.find(x => x.illustId === d.illustId)) {
            state.imageItemLibrary.push(d);
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
    async startPrefetchBased({ state, commit }, { times = Infinity, pool = 'all' } = {}) {
      const pPool = state.prefetchPool;
      let todoPool = [];
      if (pool === 'all') {
        todoPool.push(...pPool.illusts);
        todoPool.push(...pPool.manga);
      } else {
        todoPool.push(...pPool[pool]);
      }
      while (!state.isPaused && !state.isEnded && times) {
        if (!todoPool.length) {
          commit('stop');
        }
        const illustIds = todoPool.splice(0, state.batchSize);
        if (pool === 'all') {
          illustIds.forEach((id) => {
            const ii = pPool.illusts.indexOf(id);
            if (ii >= 0) {
              pPool.illusts.splice(ii, 1);
            }
            const mi = pPool.manga.indexOf(id);
            if (mi >= 0) {
              pPool.manga.splice(mi, 1);
            }
          });
        }
        const illustDataGroup = await PixivAPI.getIllustDataGroup(illustIds);
        const userIds = Object.values(illustDataGroup).map(d => d.userId);
        const userDataGroup = await PixivAPI.getUserDataGroup(userIds);
        const libraryData = makeLibraryData({
          illustDataGroup,
          userDataGroup,
        });
        for (const d of libraryData) {
          if (!state.imageItemLibrary.find(x => x.illustId === d.illustId)) {
            state.imageItemLibrary.push(d);
          }
        }
        times -= 1;
        if (!times) {
          commit('pause');
        }
        if (!todoPool.length) {
          commit('stop');
        }
      }
    },
  };
  var pixiv = {
    actions,
    getters,
    mutations,
    namespaced: true,
    state,
  };
  const state$1 = {
    active: false,
    data: null,
    position: { x: -1e7, y: -1e7 },
  };
  const getters$1 = {
    active: (state) => state.active,
    data: (state) => state.data,
    pos: (state) => state.position,
  };
  const mutations$1 =  {
    activate(state, payload) {
      state.active = true;
      state.position = payload.position;
      state.data = payload.data;
    },
    deactivate(state) {
      state.active = false;
      state.position = { x: -1e7, y: -1e7 };
    },
  };
  var contextMenu = {
    getters: getters$1,
    mutations: mutations$1,
    namespaced: true,
    state: state$1,
  };
  const state$2 = {
    data: null,
    mode: null,
  };
  const mutations$2 = {
    close: (state) => {
      state.mode = null;
    },
    open: (state, payload) => {
      Object.assign(state, payload);
    },
  };
  const getters$2 = {
    data: (state) => state.data,
    mode: (state) => state.mode,
  };
  var coverLayer = {
    getters: getters$2,
    mutations: mutations$2,
    namespaced: true,
    state: state$2,
  };
  Vue.use(Vuex);
  const _isSelfBookmarkPage = (mpt, loginId, uid) => {
    return (
      mpt === MAIN_PAGE_TYPE.SELF_BOOKMARK ||
      (mpt === MAIN_PAGE_TYPE.NEW_PROFILE_BOOKMARK &&
        loginId === uid)
    );
  };
  const _getSearchParam = () => {
    const s = new URLSearchParams(location.search);
    const ret = {};
    [...s.entries()].reduce((collect, [k, v]) => {
      collect[k] = v;
      return collect;
    }, ret);
    return ret;
  };
  const modules = { contextMenu, coverLayer, pixiv };
  const state$3 = {
    NAME: GM_info.script.name,
    VERSION: GM_info.script.version,
    config: {
      blacklist: [],
      contextMenu: 1,
      fitwidth: 1,
      hoverPlay: 1,
      sort: SORT_TYPE.ILLUST_ID,
      userTooltip: 1,
    },
    ctrlPanelOffsetY: 0,
    filters: {
      limit: 0,
      tag: new RegExp('', 'i'),
    },
    locale: document.documentElement.lang.toLowerCase(),
    loginData: null,
    mainPageType: MAIN_PAGE_TYPE.NO_SUPPORT,
    mountPointCoverLayer: null,
    mountPointCtrlPanel: null,
    mountPointMainView: null,
    searchParam: {},
  };
  const getters$3 = {
    MPT: (state) => state.mainPageType,
    config: (state) => state.config,
    ctrlPanelOffsetY: (state) => state.ctrlPanelOffsetY,
    filters: (state) => state.filters,
    isSelfBookmarkPage: (state) => _isSelfBookmarkPage(state.mainPageType, state.loginData.id, state.searchParam.id),
    locale: (state) => state.locale,
    loginData: (state) => state.loginData,
    mountPointCoverLayer: (state) => state.mountPointCoverLayer,
    mountPointCtrlPanel: (state) => state.mountPointCtrlPanel,
    mountPointMainView: (state) => state.mountPointMainView,
    orderBy: (state) => {
      switch (state.config.sort) {
      case SORT_TYPE.ILLUST_ID:
        return 'illustId';
      case SORT_TYPE.BOOKMARK_ID:
        return 'bookmarkId';
      case SORT_TYPE.BOOKMARK_COUNT:
        return 'bookmarkCount';
      default:
        $print.error('VuexStore#getters.orderBy:', state.config.sort);
        return 'illustId';
      }
    },
    sp: (state) => state.searchParam,
  };
  const mutations$3 = {
    afterInit: (state) => {
      if (state.mainPageType === MAIN_PAGE_TYPE.SELF_BOOKMARK) {
        for (const marker of $$('.js-legacy-mark-all, .js-legacy-unmark-all')) {
          marker.addEventListener('click', () => {
            $$('input[name="book_id[]"]').forEach(el => {
              el.checked = marker.classList.contains('js-legacy-mark-all');
            });
          });
        }
      }
      const _sbp = _isSelfBookmarkPage(state.mainPageType, state.loginData.id, state.searchParam.id);
      if (!_sbp && state.config.sort === SORT_TYPE.BOOKMARK_ID) {
        state.config.sort = SORT_TYPE.ILLUST_ID;
      }
    },
    applyConfig: (state) => {
      if (state.mainPageType !== MAIN_PAGE_TYPE.NO_SUPPORT) {
        if (state.config.fitwidth) {
          $$('.ω').forEach(el => el.classList.add('↔'));
        } else {
          $$('.ω').forEach(el => el.classList.remove('↔'));
        }
      }
    },
    loadConfig: (state) => {
      const config = JSON.parse(localStorage.getItem(state.NAME) || '{}');
      Object.assign(state.config, config);
    },
    saveConfig: (state) => {
      const storable = JSON.stringify(state.config);
      localStorage.setItem(state.NAME, storable);
    },
    setConfig: (state, payload) => {
      Object.assign(state.config, payload);
    },
    setFilters: (state, payload) => {
      Object.assign(state.filters, payload);
    },
    setMainPageType: (state, payload = {}) => {
      if (payload.forceSet) {
        state.mainPageType = payload.forceSet;
        const _sbp = _isSelfBookmarkPage(state.mainPageType, state.loginData.id, state.searchParam.id);
        if (!_sbp && state.config.sort === SORT_TYPE.BOOKMARK_ID) {
          state.config.sort = SORT_TYPE.ILLUST_ID;
        }
        return;
      }
      const path = location.pathname;
      const _id = state.searchParam.id;
      const _type = state.searchParam.type;
      const _mode = state.searchParam.mode;
      switch (path) {
      case '/search.php':
        state.mainPageType = MAIN_PAGE_TYPE.SEARCH;
        break;
      case '/bookmark_new_illust_r18.php':
      case '/bookmark_new_illust.php':
        state.mainPageType = MAIN_PAGE_TYPE.FOLLOWED_NEWS;
        break;
      case '/new_illust.php':
      case '/mypixiv_new_illust.php':
      case '/new_illust_r18.php':
        state.mainPageType = MAIN_PAGE_TYPE.ANCIENT_FOLLOWED_NEWS;
        break;
      case '/member.php':
        state.mainPageType = MAIN_PAGE_TYPE.NEW_PROFILE;
        break;
      case '/member_illust.php':
        if (_mode) {
          state.mainPageType = MAIN_PAGE_TYPE.NO_SUPPORT;
          break;
        }
        if (_type === 'manga') {
          state.mainPageType = MAIN_PAGE_TYPE.NEW_PROFILE_MANGA;
        } else if (_type === 'illust') {
          state.mainPageType = MAIN_PAGE_TYPE.NEW_PROFILE_ILLUST;
        } else {
          state.mainPageType = MAIN_PAGE_TYPE.NEW_PROFILE;
        }
        break;
      case '/bookmark.php': {
        state.mainPageType = (!_id) ? MAIN_PAGE_TYPE.SELF_BOOKMARK : MAIN_PAGE_TYPE.NEW_PROFILE_BOOKMARK;
        break;
      }
      default:
        state.mainPageType = MAIN_PAGE_TYPE.NO_SUPPORT;
        break;
      }
      const _sbp = _isSelfBookmarkPage(state.mainPageType, state.loginData.id, state.searchParam.id);
      if (!_sbp && state.config.sort === SORT_TYPE.BOOKMARK_ID) {
        state.config.sort = SORT_TYPE.ILLUST_ID;
      }
    },
    updateSearchParam: (state) => {
      state.searchParam = _getSearchParam();
    },
  };
  const actions$1 = {
    init: async({ state, commit, dispatch }) => {
      if (window.globalInitData && window.globalInitData.userData) {
        const u = window.globalInitData.userData;
        state.loginData = { id: u.id };
      } else if (window.pixiv && window.pixiv.user) {
        const u = window.pixiv.user;
        state.loginData = { id: u.id };
      } else {
        throw new InitError('The page has no any login user data.');
      }
      commit('updateSearchParam');
      commit('setMainPageType');
      commit('loadConfig');
      await dispatch('setMountPoints');
      commit('afterInit');
      commit('applyConfig');
      commit('saveConfig');
    },
    setMountPoints: async({ state, getters }) => {
      const mpt = state.mainPageType;
      if (mpt !== MAIN_PAGE_TYPE.NO_SUPPORT) {
        $$('#wrapper').forEach(el => el.classList.add('ω'));
        state.mountPointCoverLayer = $el('div', null, (el) => {
          document.body.appendChild(el);
        });
        state.mountPointCtrlPanel = $el('div', null, async(el) => {
          if (getters['pixiv/nppType'] >= 0) {
            await $ready(() => $('.sLHPYEz'));
            $after($('.sLHPYEz'), el);
          } else {
            $after($('header._global-header'), el);
          }
          state.ctrlPanelOffsetY = el.getBoundingClientRect().y;
        });
        switch (mpt) {
        case MAIN_PAGE_TYPE.SEARCH:
          state.mountPointMainView = $('#js-react-search-mid');
          break;
        case MAIN_PAGE_TYPE.FOLLOWED_NEWS:
          state.mountPointMainView = $('#js-mount-point-latest-following');
          break;
        case MAIN_PAGE_TYPE.ANCIENT_FOLLOWED_NEWS:
          state.mountPointMainView = $('ul._image-items');
          break;
        case MAIN_PAGE_TYPE.NEW_PROFILE:
        case MAIN_PAGE_TYPE.NEW_PROFILE_BOOKMARK:
        case MAIN_PAGE_TYPE.NEW_PROFILE_ILLUST:
        case MAIN_PAGE_TYPE.NEW_PROFILE_MANGA:
          await $ready(() => $('.g4R-bsH'));
          state.mountPointMainView = $('.g4R-bsH');
          break;
        case MAIN_PAGE_TYPE.SELF_BOOKMARK:
          state.mountPointMainView = $('.display_editable_works');
          break;
        default:
          break;
        }
      }
    },
  };
  var vuexStore = new Vuex.Store({
    actions: actions$1,
    getters: getters$3,
    modules,
    mutations: mutations$3,
    state: state$3,
  });
  var script = {
    props: {
      id: {
        default: '',
        type: String,
      },
    },
    data() {
      return {
        debounceId4sortInput: null,
        debounceId4tagsFilter: null,
        sortingOrderSwitchOn: false,
        usualList: [100, 500, 1000, 3000, 5000, 10000],
        usualSwitchOn: false,
      };
    },
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
        case SORT_TYPE.BOOKMARK_COUNT:
          return this.$t('ctrlPanel.sortByPopularity');
        case SORT_TYPE.ILLUST_ID:
          return this.$t('ctrlPanel.sortByDate');
        default:
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
          this.$store.commit('pixiv/pause');
        }
      },
      clickSortingOrder(event) {
        const ct = event.currentTarget;
        switch (ct.id) {
        case 'koakuma-sorting-order-by-popularity':
          this.$store.commit('setConfig', { sort: SORT_TYPE.BOOKMARK_COUNT });
          break;
        case 'koakuma-sorting-order-by-bookmark-id':
          this.$store.commit('setConfig', { sort: SORT_TYPE.BOOKMARK_ID });
          break;
        default:
          this.$store.commit('setConfig', { sort: SORT_TYPE.ILLUST_ID });
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
              const __vue_script__ = script;
  var __vue_render__ = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c("div", { ref: _vm.id, attrs: { id: _vm.id } }, [
      _c("div", { staticClass: "processed" }, [
        _vm._v(
          _vm._s(_vm.$t("ctrlPanel.processed", { count: _vm.processedCount }))
        )
      ]),
      _vm._v(" "),
      _c("div", { attrs: { id: "koakuma-bookmark-sort-block" } }, [
        _c(
          "label",
          {
            attrs: {
              id: "koakuma-bookmark-sort-label",
              for: "koakuma-bookmark-sort-input"
            }
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
              _c("span", { staticClass: "sort-order-apply-indicator" }, [
                _vm._v("⮬")
              ]),
              _vm._v(" "),
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
                      return _vm.clickUsual($event)
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
            placeholder: _vm.$t("ctrlPanel.tagsPlaceholder"),
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
            on: {
              mouseup: function($event) {
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
                return _vm.clickMainButton($event)
              }
            }
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
              _c("span", { staticClass: "sort-order-apply-indicator" }, [
                _vm._v("⮬")
              ]),
              _vm._v(" "),
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
                [_vm._v(_vm._s(_vm.$t("ctrlPanel.sortByPopularity")))]
              )
            ]),
            _vm._v(" "),
            _c("li", [
              _c("span", { staticClass: "sort-order-apply-indicator" }, [
                _vm._v("⮬")
              ]),
              _vm._v(" "),
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
                [_vm._v(_vm._s(_vm.$t("ctrlPanel.sortByDate")))]
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
                    value: _vm.isSelfBookmarkPage,
                    expression: "isSelfBookmarkPage"
                  }
                ]
              },
              [
                _c("span", { staticClass: "sort-order-apply-indicator" }, [
                  _vm._v("⮬")
                ]),
                _vm._v(" "),
                _c(
                  "a",
                  {
                    staticClass: "sorting-order-link",
                    attrs: {
                      id: "koakuma-sorting-order-by-bookmark-id",
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
                  [_vm._v(_vm._s(_vm.$t("ctrlPanel.sortByBookmarkId")))]
                )
              ]
            )
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
                value: _vm.xc.fitwidth,
                expression: "xc.fitwidth"
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
                value: !_vm.xc.fitwidth,
                expression: "!xc.fitwidth"
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
                return _vm.openCoverLayerInConfigMode($event)
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
      inject("data-v-33dda245_0", { source: "\n@keyframes slidedown-data-v-33dda245 {\nfrom {\n    transform: translateY(-100%);\n}\nto {\n    transform: translateY(0);\n}\n}\na[role=\"button\"][data-v-33dda245] {\n  text-decoration: none;\n}\na[role=\"button\"] > .fa-angle-down[data-v-33dda245] {\n  padding: 2px;\n}\na[data-v-33dda245] {\n  color: #258fb8;\n}\n#Koakuma[data-v-33dda245] {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  position: sticky;\n  top: 0;\n  z-index: 3;\n  background-color: #eef;\n  box-shadow: 0 1px 1px #777;\n  padding: 4px;\n  color: #00186c;\n  font-size: 16px;\n  width: 100%;\n}\n#Koakuma > div[data-v-33dda245] {\n  margin: 0 10px;\n  display: inline-flex;\n}\n#koakuma-bookmark-sort-label[data-v-33dda245] {\n  display: inline-flex !important;\n  align-items: center;\n  margin-right: 0;\n  border-radius: 3px 0 0 3px;\n  background-color: #cef;\n  color: rgb(0, 105, 177);\n  margin: 0 1px;\n  padding: 0 6px;\n}\n#koakuma-bookmark-sort-block[data-v-33dda245],\n#koakuma-sorting-order-block[data-v-33dda245] {\n  position: relative;\n  box-shadow: 0 0 1px #069;\n  border-radius: 4px;\n}\n#koakuma-sorting-order-block[data-v-33dda245] {\n  background-color: #cef;\n}\n#koakuma-bookmark-sort-input[data-v-33dda245] {\n  -moz-appearance: textfield;\n  border: none;\n  background-color: transparent;\n  padding: 0;\n  color: inherit;\n  font-size: 16px;\n  display: inline-block;\n  cursor: ns-resize;\n  text-align: center;\n  max-width: 50px;\n}\n#koakuma-bookmark-sort-input[data-v-33dda245]::-webkit-inner-spin-button,\n#koakuma-bookmark-sort-input[data-v-33dda245]::-webkit-outer-spin-button {\n  /* https://css-tricks.com/numeric-inputs-a-comparison-of-browser-defaults/ */\n  -webkit-appearance: none;\n  margin: 0;\n}\n#koakuma-bookmark-tags-filter-input[data-v-33dda245] {\n  margin: 0;\n  padding: 0 4px;\n  color: #333;\n  font-size: 12px;\n  border: 1px solid #becad7;\n  height: 20px;\n  min-width: 300px;\n}\n#koakuma-bookmark-tags-filter-input[data-v-33dda245]:focus {\n  background: #ffffcc;\n  outline: none;\n}\n#koakuma-bookmark-input-usual-switch[data-v-33dda245],\n#koakuma-sorting-order-select-switch[data-v-33dda245] {\n  background-color: #cef;\n  padding: 1px;\n  border-left: 1px solid #888;\n  border-radius: 0 3px 3px 0;\n  cursor: pointer;\n  display: inline-flex;\n  align-items: center;\n}\n#koakuma-sorting-order-select-switch[data-v-33dda245] {\n  border: none;\n  border-radius: 3px;\n}\n#koakuma-bookmark-input-usual-list[data-v-33dda245],\n#koakuma-sorting-order-select-list[data-v-33dda245] {\n  border-radius: 3px;\n  background-color: #cef;\n  box-shadow: 0 0 2px #069;\n  position: absolute;\n  top: 100%;\n  width: 100%;\n  margin-top: 1px;\n  list-style: none;\n  padding: 0;\n}\n#koakuma-sorting-order-select-list[data-v-33dda245] {\n  display: grid;\n  grid-auto-columns: max-content;\n  width: initial;\n}\n#koakuma-bookmark-input-usual-list > li[data-v-33dda245],\n#koakuma-sorting-order-select-list > li[data-v-33dda245] {\n  display: flex;\n  position: relative;\n  line-height: 24px;\n}\n#koakuma-bookmark-input-usual-list > li[data-v-33dda245]::after,\n#koakuma-sorting-order-select-list > li[data-v-33dda245]::after {\n  content: \"\";\n  box-shadow: 0 0 0 1px #89d8ff;\n  display: inline-block;\n  margin: 0;\n  height: 0;\n  line-height: 0;\n  font-size: 0;\n  position: absolute;\n  left: 0;\n  right: 0;\n  width: 100%;\n  transform: scaleX(0.8);\n}\n#koakuma-bookmark-input-usual-list > li[data-v-33dda245]:first-child::after,\n#koakuma-sorting-order-select-list > li[data-v-33dda245]:first-child::after {\n  box-shadow: none;\n}\n#koakuma-bookmark-input-usual-list .sort-order-apply-indicator[data-v-33dda245],\n#koakuma-sorting-order-select-list .sort-order-apply-indicator[data-v-33dda245] {\n  visibility: hidden;\n}\n#koakuma-bookmark-input-usual-list .sort-order-apply-indicator[data-v-33dda245] {\n  position: absolute;\n}\n#koakuma-bookmark-input-usual-list > li:hover .sort-order-apply-indicator[data-v-33dda245],\n#koakuma-sorting-order-select-list > li:hover .sort-order-apply-indicator[data-v-33dda245] {\n  visibility: visible;\n}\n.sort-order-apply-indicator[data-v-33dda245] {\n  display: block;\n  justify-content: center;\n  align-items: center;\n  font-weight: bolder;\n  padding: 0 4px;\n}\n.usual-list-link[data-v-33dda245],\n.sorting-order-link[data-v-33dda245] {\n  display: block;\n  cursor: pointer;\n  text-align: center;\n  flex: 1;\n}\n.sorting-order-link[data-v-33dda245] {\n  padding-right: 18px;\n}\n#koakuma-sorting-order-select-output[data-v-33dda245] {\n  padding: 0 16px;\n  display: flex;\n  align-items: center;\n}\n#koakuma-sorting-order-select[data-v-33dda245] {\n  font-size: 14px;\n}\n#koakuma-options-block > *[data-v-33dda245] {\n  margin: 0 5px;\n}\n#koakuma-main-button[data-v-33dda245] {\n  border: none;\n  padding: 2px 14px;\n  border-radius: 3px;\n  font-size: 16px;\n}\n#koakuma-main-button[data-v-33dda245]:enabled {\n  transform: translate(-1px, -1px);\n  box-shadow: 1px 1px 1px hsl(60, 0%, 30%);\n  cursor: pointer;\n}\n#koakuma-main-button[data-v-33dda245]:enabled:hover {\n  transform: translate(0);\n  box-shadow: none;\n}\n#koakuma-main-button[data-v-33dda245]:enabled:active {\n  transform: translate(1px, 1px);\n  box-shadow: -1px -1px 1px hsl(60, 0%, 30%);\n}\n#koakuma-main-button.go[data-v-33dda245] {\n  background-color: hsl(141, 100%, 50%);\n}\n#koakuma-main-button.paused[data-v-33dda245] {\n  background-color: hsl(60, 100%, 50%);\n}\n#koakuma-main-button.end[data-v-33dda245] {\n  background-color: #878787;\n  color: #fff;\n  opacity: 0.87;\n}\n#koakuma-options-width-compress[data-v-33dda245],\n#koakuma-options-width-expand[data-v-33dda245],\n#koakuma-options-config[data-v-33dda245] {\n  cursor: pointer;\n}\n._bookmark-icon-inline[data-v-33dda245] {\n  display: inline-block;\n  overflow: hidden;\n  text-indent: -999px;\n  white-space: nowrap;\n  height: 10px;\n  width: 10px;\n  background-size: cover;\n  background-image: url(\"https://s.pximg.net/www/images/bookmark-heart-inline.svg?1\");\n  background-position: center;\n  background-repeat: no-repeat;\n}\n", map: {"version":3,"sources":["/home/flandre/dev/Patchouli/src/components/CtrlPanel.vue"],"names":[],"mappings":";AAmQA;AACA;IACA,6BAAA;CACA;AACA;IACA,yBAAA;CACA;CACA;AACA;EACA,sBAAA;CACA;AACA;EACA,aAAA;CACA;AACA;EACA,eAAA;CACA;AACA;EACA,cAAA;EACA,wBAAA;EACA,oBAAA;EACA,iBAAA;EACA,OAAA;EACA,WAAA;EACA,uBAAA;EACA,2BAAA;EACA,aAAA;EACA,eAAA;EACA,gBAAA;EACA,YAAA;CACA;AACA;EACA,eAAA;EACA,qBAAA;CACA;AACA;EACA,gCAAA;EACA,oBAAA;EACA,gBAAA;EACA,2BAAA;EACA,uBAAA;EACA,wBAAA;EACA,cAAA;EACA,eAAA;CACA;AACA;;EAEA,mBAAA;EACA,yBAAA;EACA,mBAAA;CACA;AACA;EACA,uBAAA;CACA;AACA;EACA,2BAAA;EACA,aAAA;EACA,8BAAA;EACA,WAAA;EACA,eAAA;EACA,gBAAA;EACA,sBAAA;EACA,kBAAA;EACA,mBAAA;EACA,gBAAA;CACA;AACA;;EAEA,6EAAA;EACA,yBAAA;EACA,UAAA;CACA;AACA;EACA,UAAA;EACA,eAAA;EACA,YAAA;EACA,gBAAA;EACA,0BAAA;EACA,aAAA;EACA,iBAAA;CACA;AACA;EACA,oBAAA;EACA,cAAA;CACA;AACA;;EAEA,uBAAA;EACA,aAAA;EACA,4BAAA;EACA,2BAAA;EACA,gBAAA;EACA,qBAAA;EACA,oBAAA;CACA;AACA;EACA,aAAA;EACA,mBAAA;CACA;AACA;;EAEA,mBAAA;EACA,uBAAA;EACA,yBAAA;EACA,mBAAA;EACA,UAAA;EACA,YAAA;EACA,gBAAA;EACA,iBAAA;EACA,WAAA;CACA;AACA;EACA,cAAA;EACA,+BAAA;EACA,eAAA;CACA;AACA;;EAEA,cAAA;EACA,mBAAA;EACA,kBAAA;CACA;AACA;;EAEA,YAAA;EACA,8BAAA;EACA,sBAAA;EACA,UAAA;EACA,UAAA;EACA,eAAA;EACA,aAAA;EACA,mBAAA;EACA,QAAA;EACA,SAAA;EACA,YAAA;EACA,uBAAA;CACA;AACA;;EAEA,iBAAA;CACA;AACA;;EAEA,mBAAA;CACA;AACA;EACA,mBAAA;CACA;AACA;;EAEA,oBAAA;CACA;AACA;EACA,eAAA;EACA,wBAAA;EACA,oBAAA;EACA,oBAAA;EACA,eAAA;CACA;AACA;;EAEA,eAAA;EACA,gBAAA;EACA,mBAAA;EACA,QAAA;CACA;AACA;EACA,oBAAA;CACA;AACA;EACA,gBAAA;EACA,cAAA;EACA,oBAAA;CACA;AACA;EACA,gBAAA;CACA;AACA;EACA,cAAA;CACA;AACA;EACA,aAAA;EACA,kBAAA;EACA,mBAAA;EACA,gBAAA;CACA;AACA;EACA,iCAAA;EACA,yCAAA;EACA,gBAAA;CACA;AACA;EACA,wBAAA;EACA,iBAAA;CACA;AACA;EACA,+BAAA;EACA,2CAAA;CACA;AACA;EACA,sCAAA;CACA;AACA;EACA,qCAAA;CACA;AACA;EACA,0BAAA;EACA,YAAA;EACA,cAAA;CACA;AACA;;;EAGA,gBAAA;CACA;AACA;EACA,sBAAA;EACA,iBAAA;EACA,oBAAA;EACA,oBAAA;EACA,aAAA;EACA,YAAA;EACA,uBAAA;EACA,oFAAA;EACA,4BAAA;EACA,6BAAA;CACA","file":"CtrlPanel.vue","sourcesContent":["<template>\n  <div\n    :id=\"id\"\n    :ref=\"id\">\n    <div class=\"processed\">{{ $t('ctrlPanel.processed', { count: processedCount }) }}</div>\n    <div id=\"koakuma-bookmark-sort-block\">\n      <label id=\"koakuma-bookmark-sort-label\" for=\"koakuma-bookmark-sort-input\">\n        <i class=\"_icon _bookmark-icon-inline\"/>\n        <input\n          id=\"koakuma-bookmark-sort-input\"\n          :value=\"filters.limit\"\n          type=\"number\"\n          min=\"0\"\n          step=\"1\"\n          @wheel.stop.prevent=\"sortInputWheel\"\n          @input=\"sortInputInput\">\n      </label>\n      <a\n        id=\"koakuma-bookmark-input-usual-switch\"\n        role=\"button\"\n        @click.left=\"usualSwitchOn = !usualSwitchOn\">\n        <i class=\"fas fa-angle-down\"/>\n      </a>\n      <ul v-show=\"usualSwitchOn\" id=\"koakuma-bookmark-input-usual-list\">\n        <li v-for=\"usual in usualList\" :key=\"usual\">\n          <span class=\"sort-order-apply-indicator\">⮬</span>\n          <a\n            role=\"button\"\n            class=\"usual-list-link\"\n            @click.left=\"clickUsual\">{{ usual }}</a>\n        </li>\n      </ul>\n    </div>\n    <div>\n      <input\n        id=\"koakuma-bookmark-tags-filter-input\"\n        :placeholder=\"$t('ctrlPanel.tagsPlaceholder')\"\n        type=\"text\"\n        @input=\"tagsFilterInput\">\n    </div>\n    <div>\n      <button\n        id=\"koakuma-main-button\"\n        :disabled=\"status.isEnded\"\n        :class=\"statusClass\"\n        @mouseup.left=\"clickMainButton\">\n        {{ buttonMsg }}\n      </button>\n    </div>\n    <div id=\"koakuma-sorting-order-block\">\n      <a\n        id=\"koakuma-sorting-order-select-switch\"\n        role=\"button\"\n        @click.left=\"sortingOrderSwitchOn = !sortingOrderSwitchOn\">\n        <output id=\"koakuma-sorting-order-select-output\" v-html=\"sortingOrderMsg\"/>\n        <i class=\"fas fa-angle-down\"/>\n      </a>\n      <ul v-show=\"sortingOrderSwitchOn\" id=\"koakuma-sorting-order-select-list\">\n        <li>\n          <span class=\"sort-order-apply-indicator\">⮬</span>\n          <a\n            id=\"koakuma-sorting-order-by-popularity\"\n            class=\"sorting-order-link\"\n            role=\"button\"\n            @click.left=\"clickSortingOrder\">{{ $t('ctrlPanel.sortByPopularity') }}</a>\n        </li>\n        <li>\n          <span class=\"sort-order-apply-indicator\">⮬</span>\n          <a\n            id=\"koakuma-sorting-order-by-date\"\n            class=\"sorting-order-link\"\n            role=\"button\"\n            @click.left=\"clickSortingOrder\">{{ $t('ctrlPanel.sortByDate') }}</a>\n        </li>\n        <li v-show=\"isSelfBookmarkPage\">\n          <span class=\"sort-order-apply-indicator\">⮬</span>\n          <a\n            id=\"koakuma-sorting-order-by-bookmark-id\"\n            class=\"sorting-order-link\"\n            role=\"button\"\n            @click.left=\"clickSortingOrder\">{{ $t('ctrlPanel.sortByBookmarkId') }}</a>\n        </li>\n      </ul>\n    </div>\n    <div id=\"koakuma-options-block\">\n      <div>\n        <i\n          v-show=\"xc.fitwidth\"\n          id=\"koakuma-options-width-compress\"\n          class=\"fas fa-compress\"\n          @click.left=\"optionsChange\"/>\n        <i\n          v-show=\"!xc.fitwidth\"\n          id=\"koakuma-options-width-expand\"\n          class=\"fas fa-expand\"\n          @click.left=\"optionsChange\"/>\n      </div>\n      <div>\n        <i\n          id=\"koakuma-options-config\"\n          class=\"fas fa-cog\"\n          @click.left=\"openCoverLayerInConfigMode\"/>\n      </div>\n    </div>\n  </div>\n</template>\n\n<script>\nimport { $print, toInt } from '../lib/utils';\nimport { SORT_TYPE as ST } from '../lib/enums';\nexport default {\n  props: {\n    id: {\n      default: '',\n      type: String,\n    },\n  },\n  // eslint-disable-next-line sort-keys\n  data() {\n    return {\n      debounceId4sortInput: null,\n      debounceId4tagsFilter: null,\n      sortingOrderSwitchOn: false,\n      usualList: [100, 500, 1000, 3000, 5000, 10000],\n      usualSwitchOn: false,\n    };\n  },\n  // eslint-disable-next-line sort-keys\n  computed: {\n    buttonMsg() {\n      if (this.status.isEnded) {\n        return this.$t('ctrlPanel.buttonEnd');\n      } else if (this.status.isPaused) {\n        return this.$t('ctrlPanel.buttonGo');\n      } else {\n        return this.$t('ctrlPanel.buttonPause');\n      }\n    },\n    filters() {\n      return this.$store.getters.filters;\n    },\n    isSelfBookmarkPage() {\n      return this.$store.getters.isSelfBookmarkPage;\n    },\n    processedCount() {\n      return this.$store.getters['pixiv/imageItemLibrary'].length;\n    },\n    sortingOrderMsg() {\n      switch (this.xc.sort) {\n      case ST.BOOKMARK_COUNT:\n        return this.$t('ctrlPanel.sortByPopularity');\n      case ST.ILLUST_ID:\n        return this.$t('ctrlPanel.sortByDate');\n      default:\n        //ST.BOOKMARK_ID\n        return this.$t('ctrlPanel.sortByBookmarkId');\n      }\n    },\n    status() {\n      return this.$store.getters['pixiv/status'];\n    },\n    statusClass() {\n      const _s = this.status;\n      return {\n        end: _s.isEnded,\n        go: _s.isPaused && !_s.isEnded,\n        paused: !_s.isPaused && !_s.isEnded,\n      };\n    },\n    xc() {\n      return this.$store.getters.config;\n    },\n  },\n  methods: {\n    clickMainButton() {\n      if (this.status.isPaused) {\n        this.$store.dispatch('pixiv/start');\n      } else {\n        this.$store.commit('pixiv/pause');\n      }\n    },\n    clickSortingOrder(event) {\n      $print.debug('Koakuma#clickSortingOrder: event', event);\n\n      const ct = event.currentTarget;\n      switch (ct.id) {\n      case 'koakuma-sorting-order-by-popularity':\n        this.$store.commit('setConfig', { sort: ST.BOOKMARK_COUNT });\n        break;\n      case 'koakuma-sorting-order-by-bookmark-id':\n        this.$store.commit('setConfig', { sort: ST.BOOKMARK_ID });\n        break;\n      default:\n        this.$store.commit('setConfig', { sort: ST.ILLUST_ID });\n        break;\n      }\n\n      this.$store.commit('saveConfig');\n      this.$store.commit('applyConfig');\n\n      this.sortingOrderSwitchOn = false;\n    },\n    clickUsual(event) {\n      this.$store.commit('setFilters', {\n        limit: toInt(event.currentTarget.textContent),\n      });\n      this.usualSwitchOn = false;\n    },\n    openCoverLayerInConfigMode() {\n      this.$store.commit('coverLayer/open', { data: null, mode: 'config' });\n    },\n    optionsChange(event) {\n      $print.debug('Koakuma#optionsChange: event', event);\n      if (event.target.id === 'koakuma-options-width-compress') {\n        this.$store.commit('setConfig', { fitwidth: false });\n      } else if (event.target.id === 'koakuma-options-width-expand') {\n        this.$store.commit('setConfig', { fitwidth: true });\n      }\n      this.$store.commit('saveConfig');\n      this.$store.commit('applyConfig');\n    },\n    sortInputInput(event) {\n      if (this.debounceId4sortInput) {\n        clearTimeout(this.debounceId4sortInput);\n      }\n      this.debounceId4sortInput = setTimeout(() => {\n        this.debounceId4sortInput = null;\n        this.$store.commit('setFilters', {\n          limit: Math.max(0, toInt(event.target.value)),\n        });\n      }, 500);\n    },\n    sortInputWheel(event) {\n      if (event.deltaY < 0) {\n        this.$store.commit('setFilters', {\n          limit: toInt(event.target.value) + 20,\n        });\n      } else {\n        this.$store.commit('setFilters', {\n          limit: Math.max(0, toInt(event.target.value) - 20),\n        });\n      }\n    },\n    tagsFilterInput(event) {\n      if (this.debounceId4tagsFilter) {\n        clearTimeout(this.debounceId4tagsFilter);\n      }\n      this.debounceId4tagsFilter = setTimeout(() => {\n        this.debounceId4tagsFilter = null;\n        this.$store.commit('setFilters', {\n          tag: new RegExp(event.target.value, 'ig'),\n        });\n      }, 1500);\n    },\n  },\n};\n</script>\n\n<style scoped>\n@keyframes slidedown {\n  from {\n    transform: translateY(-100%);\n  }\n  to {\n    transform: translateY(0);\n  }\n}\na[role=\"button\"] {\n  text-decoration: none;\n}\na[role=\"button\"] > .fa-angle-down {\n  padding: 2px;\n}\na {\n  color: #258fb8;\n}\n#Koakuma {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  position: sticky;\n  top: 0;\n  z-index: 3;\n  background-color: #eef;\n  box-shadow: 0 1px 1px #777;\n  padding: 4px;\n  color: #00186c;\n  font-size: 16px;\n  width: 100%;\n}\n#Koakuma > div {\n  margin: 0 10px;\n  display: inline-flex;\n}\n#koakuma-bookmark-sort-label {\n  display: inline-flex !important;\n  align-items: center;\n  margin-right: 0;\n  border-radius: 3px 0 0 3px;\n  background-color: #cef;\n  color: rgb(0, 105, 177);\n  margin: 0 1px;\n  padding: 0 6px;\n}\n#koakuma-bookmark-sort-block,\n#koakuma-sorting-order-block {\n  position: relative;\n  box-shadow: 0 0 1px #069;\n  border-radius: 4px;\n}\n#koakuma-sorting-order-block {\n  background-color: #cef;\n}\n#koakuma-bookmark-sort-input {\n  -moz-appearance: textfield;\n  border: none;\n  background-color: transparent;\n  padding: 0;\n  color: inherit;\n  font-size: 16px;\n  display: inline-block;\n  cursor: ns-resize;\n  text-align: center;\n  max-width: 50px;\n}\n#koakuma-bookmark-sort-input::-webkit-inner-spin-button,\n#koakuma-bookmark-sort-input::-webkit-outer-spin-button {\n  /* https://css-tricks.com/numeric-inputs-a-comparison-of-browser-defaults/ */\n  -webkit-appearance: none;\n  margin: 0;\n}\n#koakuma-bookmark-tags-filter-input {\n  margin: 0;\n  padding: 0 4px;\n  color: #333;\n  font-size: 12px;\n  border: 1px solid #becad7;\n  height: 20px;\n  min-width: 300px;\n}\n#koakuma-bookmark-tags-filter-input:focus {\n  background: #ffffcc;\n  outline: none;\n}\n#koakuma-bookmark-input-usual-switch,\n#koakuma-sorting-order-select-switch {\n  background-color: #cef;\n  padding: 1px;\n  border-left: 1px solid #888;\n  border-radius: 0 3px 3px 0;\n  cursor: pointer;\n  display: inline-flex;\n  align-items: center;\n}\n#koakuma-sorting-order-select-switch {\n  border: none;\n  border-radius: 3px;\n}\n#koakuma-bookmark-input-usual-list,\n#koakuma-sorting-order-select-list {\n  border-radius: 3px;\n  background-color: #cef;\n  box-shadow: 0 0 2px #069;\n  position: absolute;\n  top: 100%;\n  width: 100%;\n  margin-top: 1px;\n  list-style: none;\n  padding: 0;\n}\n#koakuma-sorting-order-select-list {\n  display: grid;\n  grid-auto-columns: max-content;\n  width: initial;\n}\n#koakuma-bookmark-input-usual-list > li,\n#koakuma-sorting-order-select-list > li {\n  display: flex;\n  position: relative;\n  line-height: 24px;\n}\n#koakuma-bookmark-input-usual-list > li::after,\n#koakuma-sorting-order-select-list > li::after {\n  content: \"\";\n  box-shadow: 0 0 0 1px #89d8ff;\n  display: inline-block;\n  margin: 0;\n  height: 0;\n  line-height: 0;\n  font-size: 0;\n  position: absolute;\n  left: 0;\n  right: 0;\n  width: 100%;\n  transform: scaleX(0.8);\n}\n#koakuma-bookmark-input-usual-list > li:first-child::after,\n#koakuma-sorting-order-select-list > li:first-child::after {\n  box-shadow: none;\n}\n#koakuma-bookmark-input-usual-list .sort-order-apply-indicator,\n#koakuma-sorting-order-select-list .sort-order-apply-indicator {\n  visibility: hidden;\n}\n#koakuma-bookmark-input-usual-list .sort-order-apply-indicator {\n  position: absolute;\n}\n#koakuma-bookmark-input-usual-list > li:hover .sort-order-apply-indicator,\n#koakuma-sorting-order-select-list > li:hover .sort-order-apply-indicator {\n  visibility: visible;\n}\n.sort-order-apply-indicator {\n  display: block;\n  justify-content: center;\n  align-items: center;\n  font-weight: bolder;\n  padding: 0 4px;\n}\n.usual-list-link,\n.sorting-order-link {\n  display: block;\n  cursor: pointer;\n  text-align: center;\n  flex: 1;\n}\n.sorting-order-link {\n  padding-right: 18px;\n}\n#koakuma-sorting-order-select-output {\n  padding: 0 16px;\n  display: flex;\n  align-items: center;\n}\n#koakuma-sorting-order-select {\n  font-size: 14px;\n}\n#koakuma-options-block > * {\n  margin: 0 5px;\n}\n#koakuma-main-button {\n  border: none;\n  padding: 2px 14px;\n  border-radius: 3px;\n  font-size: 16px;\n}\n#koakuma-main-button:enabled {\n  transform: translate(-1px, -1px);\n  box-shadow: 1px 1px 1px hsl(60, 0%, 30%);\n  cursor: pointer;\n}\n#koakuma-main-button:enabled:hover {\n  transform: translate(0);\n  box-shadow: none;\n}\n#koakuma-main-button:enabled:active {\n  transform: translate(1px, 1px);\n  box-shadow: -1px -1px 1px hsl(60, 0%, 30%);\n}\n#koakuma-main-button.go {\n  background-color: hsl(141, 100%, 50%);\n}\n#koakuma-main-button.paused {\n  background-color: hsl(60, 100%, 50%);\n}\n#koakuma-main-button.end {\n  background-color: #878787;\n  color: #fff;\n  opacity: 0.87;\n}\n#koakuma-options-width-compress,\n#koakuma-options-width-expand,\n#koakuma-options-config {\n  cursor: pointer;\n}\n._bookmark-icon-inline {\n  display: inline-block;\n  overflow: hidden;\n  text-indent: -999px;\n  white-space: nowrap;\n  height: 10px;\n  width: 10px;\n  background-size: cover;\n  background-image: url(\"https://s.pximg.net/www/images/bookmark-heart-inline.svg?1\");\n  background-position: center;\n  background-repeat: no-repeat;\n}\n</style>\n"]}, media: undefined });
    };
    const __vue_scope_id__ = "data-v-33dda245";
    const __vue_module_identifier__ = undefined;
    const __vue_is_functional_template__ = false;
    function __vue_normalize__(
      template, style, script$$1,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script$$1 === 'function' ? script$$1.options : script$$1) || {};
      component.__file = "/home/flandre/dev/Patchouli/src/components/CtrlPanel.vue";
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
    var ctrlPanel = __vue_normalize__(
      { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
      __vue_inject_styles__,
      __vue_script__,
      __vue_scope_id__,
      __vue_is_functional_template__,
      __vue_module_identifier__,
      __vue_create_injector__,
      undefined
    );
  const GMC = {
    async XHR(details) {
      const xhr = window.GM_xmlhttpRequest || (GM ? GM.xmlHttpRequest : null);
      if (!xhr) {
        return Promise.reject();
      }
      return new Promise((resolve, reject) => {
        Object.assign(details, {
          onabort: reject,
          onerror: reject,
          onload: resolve,
          ontimeout: reject,
        });
        xhr(details);
      });
    },
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
  };
  var script$1 = {
    computed: {
      bookmarkPageLink() {
        if (!this.xdata) {
          return "#";
        }
        return `bookmark_add.php?type=illust&illust_id=${this.xdata.illustId}`;
      },
      currentImageItem() {
        if (!this.xdata) {
          return null;
        }
        const lib = this.$store.getters["pixiv/defaultProcessedLibrary"];
        const found = lib.find(i => i.illustId === this.xdata.illustId);
        return found ? found : null;
      },
      currentType() {
        if (!this.xdata) {
          return "";
        }
        return this.xdata.type;
      },
      inlineStyle() {
        const RIGHT_BOUND = 200;
        const position = this.xpos;
        const ow = document.body.offsetWidth;
        let style = `top: ${position.y}px;`;
        if (ow - position.x < RIGHT_BOUND) {
          style += `right: ${ow - position.x}px;`;
        } else {
          style += `left: ${position.x}px;`;
        }
        return style;
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
      xdata() {
        return this.$store.getters["contextMenu/data"];
      },
      xpos() {
        return this.$store.getters["contextMenu/pos"];
      }
    },
    methods: {
      addToBlacklist() {
        if (this.currentImageItem) {
          const userId = this.currentImageItem.userId;
          const blacklist = this.$store.getters.config.blacklist;
          blacklist.push(userId);
          blacklist.sort((a, b) => a - b);
          this.$store.commit("setConfig", { blacklist });
          this.$store.commit("saveConfig");
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
            Referer: `https://www.pixiv.net/member_illust.php?mode=medium&illust_id=${illustId}`
          }
        });
        if (ext === "jpg" || ext === "jpeg") {
          saveAs(new File([response.response], filename, { type: "image/jpeg" }));
        } else if (ext === "png") {
          saveAs(new File([response.response], filename, { type: "image/png" }));
        }
      },
      async followUser() {
        if (this.currentImageItem) {
          const userId = this.currentImageItem.userId;
          if (await PixivAPI.postFollowUser(userId)) {
            this.$store.commit("editImgItem", {
              type: "follow-user",
              userId: this.currentImageItem.userId
            });
          }
        }
      },
      openPreview() {
        this.$store.commit("coverLayer/open", {
          data: this.currentImageItem,
          mode: "preview"
        });
      },
      thumbUp() {
        if (this.currentImageItem) {
          PixivAPI.postIllustLike(this.currentImageItem.illustId);
        }
      }
    }
  };
              const __vue_script__$1 = script$1;
  var __vue_render__$1 = function() {
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
            ]
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
            ]
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
  var __vue_staticRenderFns__$1 = [];
  __vue_render__$1._withStripped = true;
    const __vue_inject_styles__$1 = function (inject) {
      if (!inject) return
      inject("data-v-3cdb3ecd_0", { source: "\n#patchouli-context-menu[data-v-3cdb3ecd] {\n  box-sizing: border-box;\n  border: 1px solid #b28fce;\n  position: fixed;\n  z-index: 10;\n  background-color: #fff;\n  font-size: 16px;\n  overflow: hidden;\n  border-radius: 5px;\n}\n#patchouli-context-menu > ul[data-v-3cdb3ecd] {\n  margin: 0;\n  padding: 0;\n  line-height: 20px;\n}\n#patchouli-context-menu > ul > li[data-v-3cdb3ecd] {\n  display: flex;\n  align-items: center;\n}\n#patchouli-context-menu > ul a[data-v-3cdb3ecd] {\n  color: #85a;\n  padding: 3px;\n  flex: 1;\n  text-decoration: none;\n  white-space: nowrap;\n  display: inline-flex;\n  align-items: center;\n  text-align: center;\n}\n#patchouli-context-menu > ul a[data-v-3cdb3ecd]:hover {\n  background-color: #b28fce;\n  color: #fff;\n  cursor: pointer;\n}\n#patchouli-context-menu > ul i.far[data-v-3cdb3ecd],\n#patchouli-context-menu > ul i.fas[data-v-3cdb3ecd] {\n  height: 18px;\n  width: 18px;\n  margin: 0 4px;\n}\n", map: {"version":3,"sources":["/home/flandre/dev/Patchouli/src/components/ContextMenu.vue"],"names":[],"mappings":";AA+KA;EACA,uBAAA;EACA,0BAAA;EACA,gBAAA;EACA,YAAA;EACA,uBAAA;EACA,gBAAA;EACA,iBAAA;EACA,mBAAA;CACA;AACA;EACA,UAAA;EACA,WAAA;EACA,kBAAA;CACA;AACA;EACA,cAAA;EACA,oBAAA;CACA;AACA;EACA,YAAA;EACA,aAAA;EACA,QAAA;EACA,sBAAA;EACA,oBAAA;EACA,qBAAA;EACA,oBAAA;EACA,mBAAA;CACA;AACA;EACA,0BAAA;EACA,YAAA;EACA,gBAAA;CACA;AACA;;EAEA,aAAA;EACA,YAAA;EACA,cAAA;CACA","file":"ContextMenu.vue","sourcesContent":["<template>\n  <div id=\"patchouli-context-menu\" :style=\"inlineStyle\">\n    <ul v-show=\"currentType === 'image-item-image'\">\n      <li>\n        <a role=\"button\" @click.left=\"thumbUp\">\n          <i class=\"far fa-thumbs-up\"/>\n          {{ $t('contextMenu.thumbUp') }}\n        </a>\n      </li>\n      <li v-show=\"isDownloadable\">\n        <a role=\"button\" @click.left=\"downloadOne\">\n          <i class=\"fas fa-download\"/>\n          {{ $t('contextMenu.download') }}\n        </a>\n      </li>\n      <li>\n        <a role=\"button\" @click.left=\"openPreview\">\n          <i class=\"fas fa-search-plus\"/>\n          {{ $t('contextMenu.preview') }}\n        </a>\n      </li>\n      <li>\n        <a\n          :href=\"bookmarkPageLink\"\n          role=\"button\"\n          target=\"_blank\">\n          <i class=\"far fa-bookmark\"/>\n          {{ $t('contextMenu.openBookmarkPage') }}\n        </a>\n      </li>\n    </ul>\n    <ul v-show=\"currentType === 'image-item-title-user'\">\n      <li>\n        <a role=\"button\" @click.left=\"addToBlacklist\">\n          <i class=\"far fa-eye-slash\"/>\n          {{ $t('contextMenu.addToBlacklist') }}\n        </a>\n      </li>\n      <li v-show=\"currentImageItem && !currentImageItem.isFollowed\">\n        <a role=\"button\" @click.left=\"followUser\">\n          <i class=\"fas fa-rss\"/>\n          {{ $t('contextMenu.followUser') }}\n        </a>\n      </li>\n    </ul>\n  </div>\n</template>\n\n\n<script>\nimport { PixivAPI } from \"../lib/pixiv\";\nimport { $el } from \"../lib/utils\";\nimport GMC from \"../lib/gmc\";\n\nexport default {\n  computed: {\n    bookmarkPageLink() {\n      if (!this.xdata) {\n        return \"#\";\n      }\n      return `bookmark_add.php?type=illust&illust_id=${this.xdata.illustId}`;\n    },\n    currentImageItem() {\n      if (!this.xdata) {\n        return null;\n      }\n      const lib = this.$store.getters[\"pixiv/defaultProcessedLibrary\"];\n      const found = lib.find(i => i.illustId === this.xdata.illustId);\n      return found ? found : null;\n    },\n    currentType() {\n      if (!this.xdata) {\n        return \"\";\n      }\n      return this.xdata.type;\n    },\n    inlineStyle() {\n      const RIGHT_BOUND = 200; // magic number\n      const position = this.xpos;\n      const ow = document.body.offsetWidth;\n\n      let style = `top: ${position.y}px;`;\n      if (ow - position.x < RIGHT_BOUND) {\n        style += `right: ${ow - position.x}px;`;\n      } else {\n        style += `left: ${position.x}px;`;\n      }\n      return style;\n    },\n    isDownloadable() {\n      return (\n        this.currentImageItem &&\n        this.currentImageItem.illustPageCount === 1 &&\n        !this.currentImageItem.isUgoira // unsupport ugoira currently\n      );\n    },\n    isUgoira() {\n      return this.currentImageItem && this.currentImageItem.isUgoira;\n    },\n    xdata() {\n      return this.$store.getters[\"contextMenu/data\"];\n    },\n    xpos() {\n      return this.$store.getters[\"contextMenu/pos\"];\n    }\n  },\n  methods: {\n    addToBlacklist() {\n      if (this.currentImageItem) {\n        const userId = this.currentImageItem.userId;\n        const blacklist = this.$store.getters.config.blacklist;\n        blacklist.push(userId);\n        blacklist.sort((a, b) => a - b);\n        this.$store.commit(\"setConfig\", { blacklist });\n        this.$store.commit(\"saveConfig\");\n      }\n    },\n    async downloadOne() {\n      const imgUrl = this.currentImageItem.urls.original;\n      const illustId = this.currentImageItem.illustId;\n      const a = $el(\"a\", { href: imgUrl });\n\n      const filename = a.pathname.split(\"/\").pop();\n      const ext = filename\n        .split(\".\")\n        .pop()\n        .toLowerCase();\n      /* eslint-disable sort-keys */\n      const response = await GMC.XHR({\n        method: \"GET\",\n        url: imgUrl,\n        // greasemonkey has no this API\n        responseType: \"arraybuffer\",\n        // for greasemonkey\n        binary: true,\n        headers: {\n          Referer: `https://www.pixiv.net/member_illust.php?mode=medium&illust_id=${illustId}`\n        }\n      });\n      /* eslint-enable sort-keys */\n\n      if (ext === \"jpg\" || ext === \"jpeg\") {\n        saveAs(new File([response.response], filename, { type: \"image/jpeg\" }));\n      } else if (ext === \"png\") {\n        saveAs(new File([response.response], filename, { type: \"image/png\" }));\n      }\n    },\n    async followUser() {\n      if (this.currentImageItem) {\n        const userId = this.currentImageItem.userId;\n\n        if (await PixivAPI.postFollowUser(userId)) {\n          this.$store.commit(\"editImgItem\", {\n            type: \"follow-user\",\n            userId: this.currentImageItem.userId\n          });\n        }\n      }\n    },\n    openPreview() {\n      this.$store.commit(\"coverLayer/open\", {\n        data: this.currentImageItem,\n        mode: \"preview\"\n      });\n    },\n    thumbUp() {\n      if (this.currentImageItem) {\n        PixivAPI.postIllustLike(this.currentImageItem.illustId);\n      }\n    }\n  }\n};\n</script>\n\n<style scoped>\n#patchouli-context-menu {\n  box-sizing: border-box;\n  border: 1px solid #b28fce;\n  position: fixed;\n  z-index: 10;\n  background-color: #fff;\n  font-size: 16px;\n  overflow: hidden;\n  border-radius: 5px;\n}\n#patchouli-context-menu > ul {\n  margin: 0;\n  padding: 0;\n  line-height: 20px;\n}\n#patchouli-context-menu > ul > li {\n  display: flex;\n  align-items: center;\n}\n#patchouli-context-menu > ul a {\n  color: #85a;\n  padding: 3px;\n  flex: 1;\n  text-decoration: none;\n  white-space: nowrap;\n  display: inline-flex;\n  align-items: center;\n  text-align: center;\n}\n#patchouli-context-menu > ul a:hover {\n  background-color: #b28fce;\n  color: #fff;\n  cursor: pointer;\n}\n#patchouli-context-menu > ul i.far,\n#patchouli-context-menu > ul i.fas {\n  height: 18px;\n  width: 18px;\n  margin: 0 4px;\n}\n</style>\n"]}, media: undefined });
    };
    const __vue_scope_id__$1 = "data-v-3cdb3ecd";
    const __vue_module_identifier__$1 = undefined;
    const __vue_is_functional_template__$1 = false;
    function __vue_normalize__$1(
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
    var ContextMenu = __vue_normalize__$1(
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
      size: {
        default: 48,
        type: Number,
      },
    },
    computed: {
      inlineStyle() {
        return `height: ${this.size}px; width: ${this.size}px;`;
      },
    },
  };
              const __vue_script__$2 = script$2;
  var __vue_render__$2 = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c(
      "svg",
      {
        staticClass: "ugoira-icon",
        style: _vm.inlineStyle,
        attrs: { viewBox: "0 0 24 24" }
      },
      [
        _c("circle", {
          staticClass: "ugoira-icon-circle",
          attrs: { cx: "12", cy: "12", r: "10" }
        }),
        _vm._v(" "),
        _c("path", {
          attrs: {
            d:
              "M9,8.74841664 L9,15.2515834 C9,15.8038681 9.44771525,16.2515834 10,16.2515834 C10.1782928,16.2515834 10.3533435,16.2039156 10.5070201,16.1135176 L16.0347118,12.8619342 C16.510745,12.5819147 16.6696454,11.969013 16.3896259,11.4929799 C16.3034179,11.3464262 16.1812655,11.2242738 16.0347118,11.1380658 L10.5070201,7.88648243 C10.030987,7.60646294 9.41808527,7.76536339 9.13806578,8.24139652 C9.04766776,8.39507316 9,8.57012386 9,8.74841664 Z"
          }
        })
      ]
    )
  };
  var __vue_staticRenderFns__$2 = [];
  __vue_render__$2._withStripped = true;
    const __vue_inject_styles__$2 = function (inject) {
      if (!inject) return
      inject("data-v-f6964bfe_0", { source: "\n.ugoira-icon-circle[data-v-f6964bfe] {\n  fill: #000;\n  fill-opacity: 0.4;\n}\n.ugoira-icon[data-v-f6964bfe] {\n  fill: #fff;\n  font-size: 0;\n  line-height: 0;\n  stroke: none;\n  vertical-align: middle;\n}\n", map: {"version":3,"sources":["/home/flandre/dev/Patchouli/src/components/IconUgoiraPlay.vue"],"names":[],"mappings":";AAgCA;EACA,WAAA;EACA,kBAAA;CACA;AACA;EACA,WAAA;EACA,aAAA;EACA,eAAA;EACA,aAAA;EACA,uBAAA;CACA","file":"IconUgoiraPlay.vue","sourcesContent":["<template>\n  <svg\n    :style=\"inlineStyle\"\n    viewBox=\"0 0 24 24\"\n    class=\"ugoira-icon\">\n    <circle\n      class=\"ugoira-icon-circle\"\n      cx=\"12\"\n      cy=\"12\"\n      r=\"10\"/>\n    <path d=\"M9,8.74841664 L9,15.2515834 C9,15.8038681 9.44771525,16.2515834 10,16.2515834 C10.1782928,16.2515834 10.3533435,16.2039156 10.5070201,16.1135176 L16.0347118,12.8619342 C16.510745,12.5819147 16.6696454,11.969013 16.3896259,11.4929799 C16.3034179,11.3464262 16.1812655,11.2242738 16.0347118,11.1380658 L10.5070201,7.88648243 C10.030987,7.60646294 9.41808527,7.76536339 9.13806578,8.24139652 C9.04766776,8.39507316 9,8.57012386 9,8.74841664 Z\"/>\n  </svg>\n</template>\n\n<script>\nexport default {\n  props: {\n    size: {\n      default: 48,\n      type: Number,\n    },\n  },\n  // eslint-disable-next-line sort-keys\n  computed: {\n    inlineStyle() {\n      return `height: ${this.size}px; width: ${this.size}px;`;\n    },\n  },\n};\n</script>\n\n<style scoped>\n.ugoira-icon-circle {\n  fill: #000;\n  fill-opacity: 0.4;\n}\n.ugoira-icon {\n  fill: #fff;\n  font-size: 0;\n  line-height: 0;\n  stroke: none;\n  vertical-align: middle;\n}\n</style>\n\n\n\n"]}, media: undefined });
    };
    const __vue_scope_id__$2 = "data-v-f6964bfe";
    const __vue_module_identifier__$2 = undefined;
    const __vue_is_functional_template__$2 = false;
    function __vue_normalize__$2(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "/home/flandre/dev/Patchouli/src/components/IconUgoiraPlay.vue";
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
    var IconUgoiraPlay = __vue_normalize__$2(
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
    components: { IconUgoiraPlay },
    props: {
      bookmarkId: {
        default: '',
        type: String,
      },
      illustId: {
        default: '',
        type: String,
      },
      illustPageCount: {
        default: 1,
        type: Number,
      },
      imgUrl: {
        default: '',
        type: String,
      },
      isBookmarked: {
        default: false,
        type: Boolean,
      },
      isUgoira: {
        default: false,
        type: Boolean,
      },
    },
    data() {
      return {
        selfIsBookmarked: this.isBookmarked,
        ugoiraMeta: null,
        ugoiraPlayed: false,
        ugoiraPlayer: null,
      };
    },
    computed: {
      canHoverPlay() {
        return this.$store.getters.config.hoverPlay;
      },
      illustPageUrl() {
        return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;
      },
      isSelfBookmarkPage() {
        return this.$store.getters.isSelfBookmarkPage;
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
      activateContextMenu(event) {
        if (this.$store.state.config.contextMenu) {
          event.preventDefault();
          const payload = {
            data: {
              illustId: this.illustId,
              type: 'image-item-image',
            },
            position: {
              x: event.clientX,
              y: event.clientY,
            },
          };
          this.$store.commit('contextMenu/activate', payload);
        }
      },
      controlUgoira(event) {
        if (!this.ugoiraMeta) {
          return;
        }
        if (!this.ugoiraPlayer) {
          try {
            this.ugoiraPlayer = new ZipImagePlayer({
              autosize: true,
              canvas: this.$refs.smallUgoiraPreview,
              chunkSize: 300000,
              loop: true,
              metadata: this.ugoiraMeta,
              source: this.ugoiraMeta.src,
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
    },
  };
              const __vue_script__$3 = script$3;
  var __vue_render__$3 = function() {
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
            ? _c("IconUgoiraPlay", {
                directives: [
                  {
                    name: "show",
                    rawName: "v-show",
                    value: !_vm.ugoiraPlayed,
                    expression: "!ugoiraPlayed"
                  }
                ],
                attrs: { size: 60 }
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
        ],
        1
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
      _vm.isSelfBookmarkPage
        ? _c("div", { staticClass: "bookmark-input-container" }, [
            _c("input", {
              attrs: { type: "checkbox", name: "book_id[]" },
              domProps: { value: _vm.bookmarkId }
            })
          ])
        : _vm._e()
    ])
  };
  var __vue_staticRenderFns__$3 = [];
  __vue_render__$3._withStripped = true;
    const __vue_inject_styles__$3 = function (inject) {
      if (!inject) return
      inject("data-v-192566ae_0", { source: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n/*\n@pixiv.override.css\n:root {\n  --default-image-item-image-square-size: 184px;\n}\n*/\n.image-item-image[data-v-192566ae] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  position: relative;\n}\n.image-flexbox[data-v-192566ae] {\n  display: flex;\n  flex-flow: column;\n  justify-content: center;\n  align-items: center;\n  z-index: 0;\n  border: 1px solid rgba(0, 0, 0, 0.04);\n  position: relative;\n  height: var(--default-image-item-image-square-size);\n  width: var(--default-image-item-image-square-size);\n}\n.image-flexbox[data-v-192566ae]:hover {\n  text-decoration: none;\n}\n.top-right-slot[data-v-192566ae] {\n  flex: none;\n  display: flex;\n  align-items: center;\n  z-index: 1;\n  box-sizing: border-box;\n  margin: 0 0 -24px auto;\n  padding: 6px;\n  height: 24px;\n  background: #000;\n  background: rgba(0, 0, 0, 0.4);\n  border-radius: 0 0 0 4px;\n  color: #fff;\n  font-size: 12px;\n  line-height: 1;\n  font-weight: 700;\n}\n.ugoira-icon[data-v-192566ae] {\n  position: absolute;\n}\nimg[data-v-192566ae],\ncanvas[data-v-192566ae] {\n  max-height: 100%;\n  max-width: 100%;\n}\n._one-click-bookmark[data-v-192566ae] {\n  right: 0;\n  width: 24px;\n  height: 24px;\n  line-height: 24px;\n  z-index: 2;\n  text-align: center;\n  cursor: pointer;\n  background: url(https://s.pximg.net/www/images/bookmark-heart-off.svg) center\n    transparent;\n  background-repeat: no-repeat;\n  background-size: cover;\n  opacity: 0.8;\n  filter: alpha(opacity=80);\n  transition: opacity 0.2s ease-in-out;\n}\n._one-click-bookmark.on[data-v-192566ae] {\n  background-image: url(https://s.pximg.net/www/images/bookmark-heart-on.svg);\n}\n.bookmark-input-container[data-v-192566ae] {\n  position: absolute;\n  left: 0;\n  top: 0;\n  background: rgba(0, 0, 0, 0.4);\n  padding: 6px;\n  border-radius: 0 0 4px 0;\n}\n", map: {"version":3,"sources":["/home/flandre/dev/Patchouli/src/components/DefaultImageItemImage.vue"],"names":[],"mappings":";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;AAgLA;;;;;EAKA;AACA;EACA,cAAA;EACA,oBAAA;EACA,wBAAA;EACA,mBAAA;CACA;AACA;EACA,cAAA;EACA,kBAAA;EACA,wBAAA;EACA,oBAAA;EACA,WAAA;EACA,sCAAA;EACA,mBAAA;EACA,oDAAA;EACA,mDAAA;CACA;AACA;EACA,sBAAA;CACA;AACA;EACA,WAAA;EACA,cAAA;EACA,oBAAA;EACA,WAAA;EACA,uBAAA;EACA,uBAAA;EACA,aAAA;EACA,aAAA;EACA,iBAAA;EACA,+BAAA;EACA,yBAAA;EACA,YAAA;EACA,gBAAA;EACA,eAAA;EACA,iBAAA;CACA;AACA;EACA,mBAAA;CACA;AACA;;EAEA,iBAAA;EACA,gBAAA;CACA;AACA;EACA,SAAA;EACA,YAAA;EACA,aAAA;EACA,kBAAA;EACA,WAAA;EACA,mBAAA;EACA,gBAAA;EACA;gBACA;EACA,6BAAA;EACA,uBAAA;EACA,aAAA;EACA,0BAAA;EACA,qCAAA;CACA;AACA;EACA,4EAAA;CACA;AACA;EACA,mBAAA;EACA,QAAA;EACA,OAAA;EACA,+BAAA;EACA,aAAA;EACA,yBAAA;CACA","file":"DefaultImageItemImage.vue","sourcesContent":["<template>\n  <div class=\"image-item-image\">\n    <a\n      :href=\"illustPageUrl\"\n      class=\"image-flexbox\"\n      rel=\"noopener\"\n      @click.right=\"activateContextMenu\"\n      @mouseenter=\"controlUgoira\"\n      @mouseleave=\"controlUgoira\">\n\n      <div v-if=\"illustPageCount > 1\" class=\"top-right-slot\">\n        <span><i class=\"far fa-images\"/>\n          {{ illustPageCount }}</span>\n      </div>\n\n      <img\n        v-show=\"!ugoiraPlayed\"\n        :data-src=\"imgUrl\"\n        :src=\"imgUrl\">\n      <IconUgoiraPlay\n        v-if=\"isUgoira\"\n        v-show=\"!ugoiraPlayed\"\n        :size=\"60\"/>\n      <canvas\n        v-if=\"isUgoira\"\n        v-show=\"ugoiraPlayed\"\n        ref=\"smallUgoiraPreview\"/>\n    </a>\n    <div\n      :class=\"{on:selfIsBookmarked}\"\n      :title=\"selfIsBookmarked\"\n      class=\"_one-click-bookmark\"\n      @click.left.prevent.stop=\"oneClickBookmarkAdd\"/>\n    <div v-if=\"isSelfBookmarkPage\" class=\"bookmark-input-container\">\n      <input\n        :value=\"bookmarkId\"\n        type=\"checkbox\"\n        name=\"book_id[]\">\n    </div>\n  </div>\n</template>\n\n<script>\nimport { $print } from '../lib/utils';\nimport { PixivAPI } from '../lib/pixiv';\nimport IconUgoiraPlay from './IconUgoiraPlay.vue';\n\nexport default {\n  components: { IconUgoiraPlay },\n  props: {\n    bookmarkId: {\n      default: '',\n      type: String,\n    },\n    illustId: {\n      default: '',\n      type: String,\n    },\n    illustPageCount: {\n      default: 1,\n      type: Number,\n    },\n    imgUrl: {\n      default: '',\n      type: String,\n    },\n    isBookmarked: {\n      default: false,\n      type: Boolean,\n    },\n    isUgoira: {\n      default: false,\n      type: Boolean,\n    },\n  },\n  // eslint-disable-next-line sort-keys\n  data() {\n    return {\n      selfIsBookmarked: this.isBookmarked,\n      ugoiraMeta: null,\n      ugoiraPlayed: false,\n      ugoiraPlayer: null,\n    };\n  },\n  // eslint-disable-next-line sort-keys\n  computed: {\n    canHoverPlay() {\n      return this.$store.getters.config.hoverPlay;\n    },\n    illustPageUrl() {\n      return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;\n    },\n    isSelfBookmarkPage() {\n      return this.$store.getters.isSelfBookmarkPage;\n    },\n  },\n  mounted() {\n    this.$nextTick(async() => {\n      if (this.isUgoira && this.canHoverPlay) {\n        this.ugoiraMeta = await PixivAPI.getIllustUgoiraMetaData(this.illustId);\n      }\n    });\n  },\n  // eslint-disable-next-line sort-keys\n  methods: {\n    activateContextMenu(event) {\n      $print.debug('DefaultImageItemImage#activateContextMenu', event);\n      if (this.$store.state.config.contextMenu) {\n        event.preventDefault();\n\n        const payload = {\n          data: {\n            illustId: this.illustId,\n            type: 'image-item-image',\n          },\n          position: {\n            x: event.clientX,\n            y: event.clientY,\n          },\n        };\n\n        this.$store.commit('contextMenu/activate', payload);\n      }\n    },\n    controlUgoira(event) {\n      if (!this.ugoiraMeta) {\n        return;\n      }\n      if (!this.ugoiraPlayer) {\n        try {\n          this.ugoiraPlayer = new ZipImagePlayer({\n            autosize: true,\n            canvas: this.$refs.smallUgoiraPreview,\n            chunkSize: 300000,\n            loop: true,\n            metadata: this.ugoiraMeta,\n            source: this.ugoiraMeta.src,\n          });\n        } catch (error) {\n          $print.error(error);\n        }\n      }\n      if (this.canHoverPlay) {\n        if (event.type === 'mouseenter') {\n          this.ugoiraPlayed = true;\n          this.ugoiraPlayer.play();\n        } else {\n          this.ugoiraPlayed = false;\n          this.ugoiraPlayer.pause();\n          this.ugoiraPlayer.rewind();\n        }\n      }\n    },\n    async oneClickBookmarkAdd() {\n      if (!this.selfIsBookmarked) {\n        if (await PixivAPI.postRPCAddBookmark(this.illustId)) {\n          this.selfIsBookmarked = true;\n        }\n      } else {\n        // this.bookmarkId might be empty...\n        // Because RPC API has no bookmarkId returned...\n        let bookmarkId = this.bookmarkId;\n        if (!bookmarkId) {\n          const data = await PixivAPI.getIllustBookmarkData(this.illustId);\n          bookmarkId = data.bookmarkData.id;\n        }\n        if (await PixivAPI.postRPCDeleteBookmark(bookmarkId)) {\n          this.selfIsBookmarked = false;\n        }\n      }\n    },\n  },\n};\n</script>\n\n<style scoped>\n/*\n@pixiv.override.css\n:root {\n  --default-image-item-image-square-size: 184px;\n}\n*/\n.image-item-image {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  position: relative;\n}\n.image-flexbox {\n  display: flex;\n  flex-flow: column;\n  justify-content: center;\n  align-items: center;\n  z-index: 0;\n  border: 1px solid rgba(0, 0, 0, 0.04);\n  position: relative;\n  height: var(--default-image-item-image-square-size);\n  width: var(--default-image-item-image-square-size);\n}\n.image-flexbox:hover {\n  text-decoration: none;\n}\n.top-right-slot {\n  flex: none;\n  display: flex;\n  align-items: center;\n  z-index: 1;\n  box-sizing: border-box;\n  margin: 0 0 -24px auto;\n  padding: 6px;\n  height: 24px;\n  background: #000;\n  background: rgba(0, 0, 0, 0.4);\n  border-radius: 0 0 0 4px;\n  color: #fff;\n  font-size: 12px;\n  line-height: 1;\n  font-weight: 700;\n}\n.ugoira-icon {\n  position: absolute;\n}\nimg,\ncanvas {\n  max-height: 100%;\n  max-width: 100%;\n}\n._one-click-bookmark {\n  right: 0;\n  width: 24px;\n  height: 24px;\n  line-height: 24px;\n  z-index: 2;\n  text-align: center;\n  cursor: pointer;\n  background: url(https://s.pximg.net/www/images/bookmark-heart-off.svg) center\n    transparent;\n  background-repeat: no-repeat;\n  background-size: cover;\n  opacity: 0.8;\n  filter: alpha(opacity=80);\n  transition: opacity 0.2s ease-in-out;\n}\n._one-click-bookmark.on {\n  background-image: url(https://s.pximg.net/www/images/bookmark-heart-on.svg);\n}\n.bookmark-input-container {\n  position: absolute;\n  left: 0;\n  top: 0;\n  background: rgba(0, 0, 0, 0.4);\n  padding: 6px;\n  border-radius: 0 0 4px 0;\n}\n</style>\n"]}, media: undefined });
    };
    const __vue_scope_id__$3 = "data-v-192566ae";
    const __vue_module_identifier__$3 = undefined;
    const __vue_is_functional_template__$3 = false;
    function __vue_normalize__$3(
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
    var DefaultImageItemImage = __vue_normalize__$3(
      { render: __vue_render__$3, staticRenderFns: __vue_staticRenderFns__$3 },
      __vue_inject_styles__$3,
      __vue_script__$3,
      __vue_scope_id__$3,
      __vue_is_functional_template__$3,
      __vue_module_identifier__$3,
      __vue_create_injector__$3,
      undefined
    );
  var script$4 = {
    props: {
      bookmarkCount: {
        default: 0,
        type: Number,
      },
      illustId: {
        default: '',
        type: String,
      },
      illustTitle: {
        default: '',
        type: String,
      },
      isFollowed: {
        default: false,
        type: Boolean,
      },
      profileImgUrl: {
        default: '',
        type: String,
      },
      userId: {
        default: '',
        type: String,
      },
      userName: {
        default: '',
        type: String,
      },
    },
    computed: {
      bookmarkDetailUrl() {
        return `/bookmark_detail.php?illust_id=${this.illustId}`;
      },
      bookmarkTooltipMsg() {
        return this.$t('mainView.bookmarkTooltip', {
          count: this.bookmarkCount,
        });
      },
      illustPageUrl() {
        return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;
      },
      isEnableUserTooltip() {
        return this.$store.state.config.userTooltip;
      },
      profileImgStyle() {
        return {
          backgroundImage: `url(${this.profileImgUrl})`,
        };
      },
      userPageUrl() {
        return `/member_illust.php?id=${this.userId}`;
      },
    },
    methods: {
      activateContextMenu(event) {
        if (this.$store.state.config.contextMenu) {
          event.preventDefault();
          const payload = {
            position: {
              x: event.clientX,
              y: event.clientY,
            },
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
          this.$store.commit('contextMenu/activate', payload);
        }
      },
    },
  };
              const __vue_script__$4 = script$4;
  var __vue_render__$4 = function() {
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
        _c(
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
        ),
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
                        "data-tooltip": _vm.$t("mainView.bookmarkTooltip", {
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
  var __vue_staticRenderFns__$4 = [];
  __vue_render__$4._withStripped = true;
    const __vue_inject_styles__$4 = function (inject) {
      if (!inject) return
      inject("data-v-6cfe9952_0", { source: "\n.image-item-title-user[data-v-6cfe9952] {\n  max-width: 100%;\n  margin: 8px auto;\n  text-align: center;\n  color: #333;\n  font-size: 12px;\n  line-height: 1;\n}\n.title-text[data-v-6cfe9952] {\n  margin: 4px 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-weight: 700;\n}\n.user-info[data-v-6cfe9952] {\n  display: inline-flex;\n  align-items: center;\n}\n.user-link[data-v-6cfe9952] {\n  font-size: 12px;\n  display: inline-flex;\n  align-items: center;\n}\n.user-img[data-v-6cfe9952] {\n  width: 20px;\n  height: 20px;\n  display: inline-block;\n  background-size: cover;\n  border-radius: 50%;\n  margin-right: 4px;\n}\ni.fa-rss[data-v-6cfe9952] {\n  display: inline-block;\n  margin-left: 4px;\n  width: 16px;\n  height: 16px;\n  color: dodgerblue;\n}\n", map: {"version":3,"sources":["/home/flandre/dev/Patchouli/src/components/DefaultImageItemTitle.vue"],"names":[],"mappings":";AAoIA;EACA,gBAAA;EACA,iBAAA;EACA,mBAAA;EACA,YAAA;EACA,gBAAA;EACA,eAAA;CACA;AACA;EACA,cAAA;EACA,iBAAA;EACA,wBAAA;EACA,oBAAA;EACA,iBAAA;CACA;AACA;EACA,qBAAA;EACA,oBAAA;CACA;AACA;EACA,gBAAA;EACA,qBAAA;EACA,oBAAA;CACA;AACA;EACA,YAAA;EACA,aAAA;EACA,sBAAA;EACA,uBAAA;EACA,mBAAA;EACA,kBAAA;CACA;AACA;EACA,sBAAA;EACA,iBAAA;EACA,YAAA;EACA,aAAA;EACA,kBAAA;CACA","file":"DefaultImageItemTitle.vue","sourcesContent":["<template>\n  <figcaption class=\"image-item-title-user\">\n    <ul>\n      <li class=\"title-text\" @click.right=\"activateContextMenu\">\n        <a :href=\"illustPageUrl\" :title=\"illustTitle\">{{ illustTitle }}</a>\n      </li>\n      <li\n        class=\"user-info\"\n        @click.right=\"activateContextMenu\">\n        <a\n          :href=\"userPageUrl\"\n          :title=\"userName\"\n          :data-user_id=\"userId\"\n          :data-user_name=\"userName\"\n          :class=\"isEnableUserTooltip ? 'ui-profile-popup' : ''\"\n          class=\"user-link\"\n          target=\"_blank\">\n          <span :style=\"profileImgStyle\" class=\"user-img\"/>\n          <span>{{ userName }}</span>\n        </a>\n        <i v-if=\"isFollowed\" class=\"fas fa-rss\"/>\n      </li>\n      <li v-if=\"bookmarkCount > 0\">\n        <ul class=\"count-list\">\n          <li>\n            <a\n              :href=\"bookmarkDetailUrl\"\n              :data-tooltip=\"$t('mainView.bookmarkTooltip', { count: bookmarkCount })\"\n              class=\"_ui-tooltip bookmark-count\">\n              <i class=\"_icon _bookmark-icon-inline\"/>\n              {{ bookmarkCount }}\n            </a>\n          </li>\n        </ul>\n      </li>\n    </ul>\n  </figcaption>\n</template>\n\n<script>\nimport { $print } from '../lib/utils';\n\nexport default {\n  props: {\n    bookmarkCount: {\n      default: 0,\n      type: Number,\n    },\n    illustId: {\n      default: '',\n      type: String,\n    },\n    illustTitle: {\n      default: '',\n      type: String,\n    },\n    isFollowed: {\n      default: false,\n      type: Boolean,\n    },\n    profileImgUrl: {\n      default: '',\n      type: String,\n    },\n    userId: {\n      default: '',\n      type: String,\n    },\n    userName: {\n      default: '',\n      type: String,\n    },\n  },\n  // eslint-disable-next-line sort-keys\n  computed: {\n    bookmarkDetailUrl() {\n      return `/bookmark_detail.php?illust_id=${this.illustId}`;\n    },\n    bookmarkTooltipMsg() {\n      return this.$t('mainView.bookmarkTooltip', {\n        count: this.bookmarkCount,\n      });\n    },\n    illustPageUrl() {\n      return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;\n    },\n    isEnableUserTooltip() {\n      return this.$store.state.config.userTooltip;\n    },\n    profileImgStyle() {\n      return {\n        backgroundImage: `url(${this.profileImgUrl})`,\n      };\n    },\n    userPageUrl() {\n      return `/member_illust.php?id=${this.userId}`;\n    },\n  },\n  methods: {\n    activateContextMenu(event) {\n      $print.debug('DefaultImageItemTitle#activateContextMenu', event);\n      if (this.$store.state.config.contextMenu) {\n        event.preventDefault();\n\n        const payload = {\n          position: {\n            x: event.clientX,\n            y: event.clientY,\n          },\n        };\n\n        const ct = event.currentTarget;\n        if (ct.classList.contains('user-info')) {\n          payload.data = {\n            illustId: this.illustId,\n            type: 'image-item-title-user',\n          };\n        } else {\n          payload.data = {\n            illustId: this.illustId,\n            type: 'image-item-image',\n          };\n        }\n\n        this.$store.commit('contextMenu/activate', payload);\n      }\n    },\n  },\n};\n</script>\n\n<style scoped>\n.image-item-title-user {\n  max-width: 100%;\n  margin: 8px auto;\n  text-align: center;\n  color: #333;\n  font-size: 12px;\n  line-height: 1;\n}\n.title-text {\n  margin: 4px 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-weight: 700;\n}\n.user-info {\n  display: inline-flex;\n  align-items: center;\n}\n.user-link {\n  font-size: 12px;\n  display: inline-flex;\n  align-items: center;\n}\n.user-img {\n  width: 20px;\n  height: 20px;\n  display: inline-block;\n  background-size: cover;\n  border-radius: 50%;\n  margin-right: 4px;\n}\ni.fa-rss {\n  display: inline-block;\n  margin-left: 4px;\n  width: 16px;\n  height: 16px;\n  color: dodgerblue;\n}\n</style>\n"]}, media: undefined });
    };
    const __vue_scope_id__$4 = "data-v-6cfe9952";
    const __vue_module_identifier__$4 = undefined;
    const __vue_is_functional_template__$4 = false;
    function __vue_normalize__$4(
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
    var DefaultImageItemTitle = __vue_normalize__$4(
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
    components: { DefaultImageItemImage, DefaultImageItemTitle },
    props: {
      bookmarkCount: {
        default: 0,
        type: Number,
      },
      bookmarkId: {
        default: '',
        type: String,
      },
      illustId: {
        default: '',
        type: String,
      },
      illustPageCount: {
        default: 1,
        type: Number,
      },
      illustTitle: {
        default: '',
        type: String,
      },
      imgUrl: {
        default: '',
        type: String,
      },
      isBookmarked: {
        default: false,
        type: Boolean,
      },
      isFollowed: {
        default: false,
        type: Boolean,
      },
      isUgoira: {
        default: false,
        type: Boolean,
      },
      profileImgUrl: {
        default: '',
        type: String,
      },
      userId: {
        default: '',
        type: String,
      },
      userName: {
        default: '',
        type: String,
      },
    },
  };
              const __vue_script__$5 = script$5;
  var __vue_render__$5 = function() {
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
  var __vue_staticRenderFns__$5 = [];
  __vue_render__$5._withStripped = true;
    const __vue_inject_styles__$5 = function (inject) {
      if (!inject) return
      inject("data-v-2ff3eadc_0", { source: "\n.image-item[data-v-2ff3eadc] {\n  display: flex;\n  justify-content: center;\n  margin: 0 0 30px 0;\n  padding: 10px;\n  height: auto;\n  width: 200px;\n}\n.image-item-inner[data-v-2ff3eadc] {\n  display: flex;\n  flex-flow: column;\n  max-width: 100%;\n  max-height: 300px;\n}\n", map: {"version":3,"sources":["/home/flandre/dev/Patchouli/src/components/DefaultImageItem.vue"],"names":[],"mappings":";AAkFA;EACA,cAAA;EACA,wBAAA;EACA,mBAAA;EACA,cAAA;EACA,aAAA;EACA,aAAA;CACA;AACA;EACA,cAAA;EACA,kBAAA;EACA,gBAAA;EACA,kBAAA;CACA","file":"DefaultImageItem.vue","sourcesContent":["<template>\n  <div class=\"image-item\">\n    <figure class=\"image-item-inner\">\n      <DefaultImageItemImage\n        :img-url=\"imgUrl\"\n        :illust-id=\"illustId\"\n        :illust-page-count=\"illustPageCount\"\n        :is-ugoira=\"isUgoira\"\n        :is-bookmarked=\"isBookmarked\"\n        :bookmark-id=\"bookmarkId\"/>\n      <DefaultImageItemTitle\n        :illust-id=\"illustId\"\n        :illust-title=\"illustTitle\"\n        :user-name=\"userName\"\n        :user-id=\"userId\"\n        :is-followed=\"isFollowed\"\n        :profile-img-url=\"profileImgUrl\"\n        :bookmark-count=\"bookmarkCount\"/>\n    </figure>\n  </div>\n</template>\n\n<script>\nimport DefaultImageItemImage from './DefaultImageItemImage.vue';\nimport DefaultImageItemTitle from './DefaultImageItemTitle.vue';\n\nexport default {\n  components: { DefaultImageItemImage, DefaultImageItemTitle },\n  props: {\n    bookmarkCount: {\n      default: 0,\n      type: Number,\n    },\n    bookmarkId: {\n      default: '',\n      type: String,\n    },\n    illustId: {\n      default: '',\n      type: String,\n    },\n    illustPageCount: {\n      default: 1,\n      type: Number,\n    },\n    illustTitle: {\n      default: '',\n      type: String,\n    },\n    imgUrl: {\n      default: '',\n      type: String,\n    },\n    isBookmarked: {\n      default: false,\n      type: Boolean,\n    },\n    isFollowed: {\n      default: false,\n      type: Boolean,\n    },\n    isUgoira: {\n      default: false,\n      type: Boolean,\n    },\n    profileImgUrl: {\n      default: '',\n      type: String,\n    },\n    userId: {\n      default: '',\n      type: String,\n    },\n    userName: {\n      default: '',\n      type: String,\n    },\n  },\n};\n</script>\n\n<style scoped>\n.image-item {\n  display: flex;\n  justify-content: center;\n  margin: 0 0 30px 0;\n  padding: 10px;\n  height: auto;\n  width: 200px;\n}\n.image-item-inner {\n  display: flex;\n  flex-flow: column;\n  max-width: 100%;\n  max-height: 300px;\n}\n</style>\n"]}, media: undefined });
    };
    const __vue_scope_id__$5 = "data-v-2ff3eadc";
    const __vue_module_identifier__$5 = undefined;
    const __vue_is_functional_template__$5 = false;
    function __vue_normalize__$5(
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
    var DefaultImageItem = __vue_normalize__$5(
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
    components: { DefaultImageItem },
    computed: {
      defaultProcessedLibrary() {
        return this.$store.getters['pixiv/defaultProcessedLibrary'];
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
      { attrs: { id: "patchouli-default-image-item-page" } },
      _vm._l(_vm.defaultProcessedLibrary, function(d) {
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
      })
    )
  };
  var __vue_staticRenderFns__$6 = [];
  __vue_render__$6._withStripped = true;
    const __vue_inject_styles__$6 = function (inject) {
      if (!inject) return
      inject("data-v-547fce94_0", { source: "\n#patchouli-default-image-item-page[data-v-547fce94] {\n  display: flex;\n  flex-flow: wrap;\n  justify-content: space-around;\n}\n", map: {"version":3,"sources":["/home/flandre/dev/Patchouli/src/components/DefaultImageItemPage.vue"],"names":[],"mappings":";AAmCA;EACA,cAAA;EACA,gBAAA;EACA,8BAAA;CACA","file":"DefaultImageItemPage.vue","sourcesContent":["<template>\n  <div id=\"patchouli-default-image-item-page\">\n    <DefaultImageItem\n      v-for=\"d in defaultProcessedLibrary\"\n      v-show=\"d._show\"\n      :key=\"d.illustId\"\n      :img-url=\"d.urls.thumb\"\n      :illust-id=\"d.illustId\"\n      :illust-title=\"d.illustTitle\"\n      :illust-page-count=\"d.illustPageCount\"\n      :is-ugoira=\"d.isUgoira\"\n      :user-name=\"d.userName\"\n      :user-id=\"d.userId\"\n      :profile-img-url=\"d.profileImg\"\n      :bookmark-count=\"d.bookmarkCount\"\n      :is-bookmarked=\"d.isBookmarked\"\n      :is-followed=\"d.isFollowed\"\n      :bookmark-id=\"d.bookmarkId\" />\n  </div>\n</template>\n\n<script>\nimport DefaultImageItem from './DefaultImageItem.vue';\n\nexport default {\n  components: { DefaultImageItem },\n  computed: {\n    defaultProcessedLibrary() {\n      return this.$store.getters['pixiv/defaultProcessedLibrary'];\n    },\n  },\n};\n</script>\n\n<style scoped>\n#patchouli-default-image-item-page {\n  display: flex;\n  flex-flow: wrap;\n  justify-content: space-around;\n}\n</style>\n\n\n"]}, media: undefined });
    };
    const __vue_scope_id__$6 = "data-v-547fce94";
    const __vue_module_identifier__$6 = undefined;
    const __vue_is_functional_template__$6 = false;
    function __vue_normalize__$6(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "/home/flandre/dev/Patchouli/src/components/DefaultImageItemPage.vue";
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
    var DefaultImageItemPage = __vue_normalize__$6(
      { render: __vue_render__$6, staticRenderFns: __vue_staticRenderFns__$6 },
      __vue_inject_styles__$6,
      __vue_script__$6,
      __vue_scope_id__$6,
      __vue_is_functional_template__$6,
      __vue_module_identifier__$6,
      __vue_create_injector__$6,
      undefined
    );
  var script$7 = {
    props: {
      actived: {
        default: false,
        type: Boolean,
      },
    },
  };
              const __vue_script__$7 = script$7;
  var __vue_render__$7 = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c(
      "svg",
      {
        staticClass: "i-effect",
        class: _vm.actived ? "f-active" : "f-inactive",
        attrs: { viewBox: "0 0 32 32", width: "32", height: "32" }
      },
      [
        _c("path", {
          attrs: {
            d:
              "M21,5.5 C24.8659932,5.5 28,8.63400675 28,12.5 C28,18.2694439 24.2975093,23.1517313 17.2206059,27.1100183 C16.4622493,27.5342993 15.5379984,27.5343235 14.779626,27.110148 C7.70250208,23.1517462 4,18.2694529 4,12.5 C4,8.63400691 7.13400681,5.5 11,5.5 C12.829814,5.5 14.6210123,6.4144028 16,7.8282366 C17.3789877,6.4144028 19.170186,5.5 21,5.5 Z"
          }
        }),
        _vm._v(" "),
        _c("path", {
          attrs: {
            d:
              "M16,11.3317089 C15.0857201,9.28334665 13.0491506,7.5 11,7.5 C8.23857625,7.5 6,9.73857647 6,12.5 C6,17.4386065 9.2519779,21.7268174 15.7559337,25.3646328 C15.9076021,25.4494645 16.092439,25.4494644 16.2441073,25.3646326 C22.7480325,21.7268037 26,17.4385986 26,12.5 C26,9.73857625 23.7614237,7.5 21,7.5 C18.9508494,7.5 16.9142799,9.28334665 16,11.3317089 Z"
          }
        })
      ]
    )
  };
  var __vue_staticRenderFns__$7 = [];
  __vue_render__$7._withStripped = true;
    const __vue_inject_styles__$7 = function (inject) {
      if (!inject) return
      inject("data-v-2a37bd30_0", { source: "\n.f-active[data-v-2a37bd30] {\n  fill: #ff4060;\n}\n.f-inactive[data-v-2a37bd30] {\n  fill: #fff;\n}\n.f-inactive > path[data-v-2a37bd30]:first-child {\n  fill: #333;\n}\n.i-effect[data-v-2a37bd30] {\n  box-sizing: border-box;\n  font-size: 0;\n  line-height: 0;\n  -webkit-transition: fill 0.2s, stroke 0.2s;\n  transition: fill 0.2s, stroke 0.2s;\n  vertical-align: top;\n}\n", map: {"version":3,"sources":["/home/flandre/dev/Patchouli/src/components/IconBookmarkHeart.vue"],"names":[],"mappings":";AAwBA;EACA,cAAA;CACA;AACA;EACA,WAAA;CACA;AACA;EACA,WAAA;CACA;AACA;EACA,uBAAA;EACA,aAAA;EACA,eAAA;EACA,2CAAA;EACA,mCAAA;EACA,oBAAA;CACA","file":"IconBookmarkHeart.vue","sourcesContent":["<template>\n  <svg\n    :class=\"actived?'f-active':'f-inactive'\"\n    class=\"i-effect\"\n    viewBox=\"0 0 32 32\"\n    width=\"32\"\n    height=\"32\">\n    <path d=\"M21,5.5 C24.8659932,5.5 28,8.63400675 28,12.5 C28,18.2694439 24.2975093,23.1517313 17.2206059,27.1100183 C16.4622493,27.5342993 15.5379984,27.5343235 14.779626,27.110148 C7.70250208,23.1517462 4,18.2694529 4,12.5 C4,8.63400691 7.13400681,5.5 11,5.5 C12.829814,5.5 14.6210123,6.4144028 16,7.8282366 C17.3789877,6.4144028 19.170186,5.5 21,5.5 Z\"/>\n    <path d=\"M16,11.3317089 C15.0857201,9.28334665 13.0491506,7.5 11,7.5 C8.23857625,7.5 6,9.73857647 6,12.5 C6,17.4386065 9.2519779,21.7268174 15.7559337,25.3646328 C15.9076021,25.4494645 16.092439,25.4494644 16.2441073,25.3646326 C22.7480325,21.7268037 26,17.4385986 26,12.5 C26,9.73857625 23.7614237,7.5 21,7.5 C18.9508494,7.5 16.9142799,9.28334665 16,11.3317089 Z\"/>\n  </svg>\n</template>\n\n<script>\nexport default {\n  props: {\n    actived: {\n      default: false,\n      type: Boolean,\n    },\n  },\n};\n</script>\n\n<style scoped>\n.f-active {\n  fill: #ff4060;\n}\n.f-inactive {\n  fill: #fff;\n}\n.f-inactive > path:first-child {\n  fill: #333;\n}\n.i-effect {\n  box-sizing: border-box;\n  font-size: 0;\n  line-height: 0;\n  -webkit-transition: fill 0.2s, stroke 0.2s;\n  transition: fill 0.2s, stroke 0.2s;\n  vertical-align: top;\n}\n</style>\n\n\n\n"]}, media: undefined });
    };
    const __vue_scope_id__$7 = "data-v-2a37bd30";
    const __vue_module_identifier__$7 = undefined;
    const __vue_is_functional_template__$7 = false;
    function __vue_normalize__$7(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "/home/flandre/dev/Patchouli/src/components/IconBookmarkHeart.vue";
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
    function __vue_create_injector__$7() {
      const head = document.head || document.getElementsByTagName('head')[0];
      const styles = __vue_create_injector__$7.styles || (__vue_create_injector__$7.styles = {});
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
    var IconBookmarkHeart = __vue_normalize__$7(
      { render: __vue_render__$7, staticRenderFns: __vue_staticRenderFns__$7 },
      __vue_inject_styles__$7,
      __vue_script__$7,
      __vue_scope_id__$7,
      __vue_is_functional_template__$7,
      __vue_module_identifier__$7,
      __vue_create_injector__$7,
      undefined
    );
  var script$8 = {
    props: {
      illustPageCount: {
        default: 1,
        type: Number,
      },
    },
  };
              const __vue_script__$8 = script$8;
  var __vue_render__$8 = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c("div", { staticClass: "icon-multiple-indicator" }, [
      _c(
        "svg",
        { staticClass: "icon-multiple-svg", attrs: { viewBox: "0 0 9 10" } },
        [
          _c("path", {
            attrs: {
              d:
                "M8,3 C8.55228475,3 9,3.44771525 9,4 L9,9 C9,9.55228475 8.55228475,10 8,10 L3,10 C2.44771525,10 2,9.55228475 2,9 L6,9 C7.1045695,9 8,8.1045695 8,7 L8,3 Z M1,1 L6,1 C6.55228475,1 7,1.44771525 7,2 L7,7 C7,7.55228475 6.55228475,8 6,8 L1,8 C0.44771525,8 0,7.55228475 0,7 L0,2 C0,1.44771525 0.44771525,1 1,1 Z"
            }
          })
        ]
      ),
      _vm._v(" "),
      _c("span", { staticClass: "illust-page-count" }, [
        _vm._v(_vm._s(_vm.illustPageCount))
      ])
    ])
  };
  var __vue_staticRenderFns__$8 = [];
  __vue_render__$8._withStripped = true;
    const __vue_inject_styles__$8 = function (inject) {
      if (!inject) return
      inject("data-v-7c086544_0", { source: "\n.icon-multiple-indicator[data-v-7c086544] {\n  align-items: center;\n  background: rgba(0, 0, 0, 0.4);\n  border-radius: 10px;\n  box-sizing: border-box;\n  display: flex;\n  flex: none;\n  height: 20px;\n  margin: 2px 2px -20px auto;\n  padding: 5px 6px;\n  z-index: 1;\n  color: #fff;\n  font-size: 10px;\n  font-weight: 700;\n  line-height: 1;\n}\n.icon-multiple-svg[data-v-7c086544] {\n  fill: #fff;\n  font-size: 0;\n  height: 10px;\n  line-height: 0;\n  stroke: none;\n  width: 9px;\n}\n.illust-page-count[data-v-7c086544] {\n  margin-left: 2px;\n}\n", map: {"version":3,"sources":["/home/flandre/dev/Patchouli/src/components/IndicatorMultiple.vue"],"names":[],"mappings":";AAqBA;EACA,oBAAA;EACA,+BAAA;EACA,oBAAA;EACA,uBAAA;EACA,cAAA;EACA,WAAA;EACA,aAAA;EACA,2BAAA;EACA,iBAAA;EACA,WAAA;EACA,YAAA;EACA,gBAAA;EACA,iBAAA;EACA,eAAA;CACA;AACA;EACA,WAAA;EACA,aAAA;EACA,aAAA;EACA,eAAA;EACA,aAAA;EACA,WAAA;CACA;AACA;EACA,iBAAA;CACA","file":"IndicatorMultiple.vue","sourcesContent":["<template>\n  <div class=\"icon-multiple-indicator\">\n    <svg viewBox=\"0 0 9 10\" class=\"icon-multiple-svg\">\n      <path d=\"M8,3 C8.55228475,3 9,3.44771525 9,4 L9,9 C9,9.55228475 8.55228475,10 8,10 L3,10 C2.44771525,10 2,9.55228475 2,9 L6,9 C7.1045695,9 8,8.1045695 8,7 L8,3 Z M1,1 L6,1 C6.55228475,1 7,1.44771525 7,2 L7,7 C7,7.55228475 6.55228475,8 6,8 L1,8 C0.44771525,8 0,7.55228475 0,7 L0,2 C0,1.44771525 0.44771525,1 1,1 Z\"/>\n    </svg>\n    <span class=\"illust-page-count\">{{ illustPageCount }}</span>\n  </div>\n</template>\n\n<script>\nexport default {\n  props: {\n    illustPageCount: {\n      default: 1,\n      type: Number,\n    },\n  },\n};\n</script>\n\n<style scoped>\n.icon-multiple-indicator {\n  align-items: center;\n  background: rgba(0, 0, 0, 0.4);\n  border-radius: 10px;\n  box-sizing: border-box;\n  display: flex;\n  flex: none;\n  height: 20px;\n  margin: 2px 2px -20px auto;\n  padding: 5px 6px;\n  z-index: 1;\n  color: #fff;\n  font-size: 10px;\n  font-weight: 700;\n  line-height: 1;\n}\n.icon-multiple-svg {\n  fill: #fff;\n  font-size: 0;\n  height: 10px;\n  line-height: 0;\n  stroke: none;\n  width: 9px;\n}\n.illust-page-count {\n  margin-left: 2px;\n}\n</style>\n\n"]}, media: undefined });
    };
    const __vue_scope_id__$8 = "data-v-7c086544";
    const __vue_module_identifier__$8 = undefined;
    const __vue_is_functional_template__$8 = false;
    function __vue_normalize__$8(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "/home/flandre/dev/Patchouli/src/components/IndicatorMultiple.vue";
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
    function __vue_create_injector__$8() {
      const head = document.head || document.getElementsByTagName('head')[0];
      const styles = __vue_create_injector__$8.styles || (__vue_create_injector__$8.styles = {});
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
    var IndicatorMultiple = __vue_normalize__$8(
      { render: __vue_render__$8, staticRenderFns: __vue_staticRenderFns__$8 },
      __vue_inject_styles__$8,
      __vue_script__$8,
      __vue_scope_id__$8,
      __vue_is_functional_template__$8,
      __vue_module_identifier__$8,
      __vue_create_injector__$8,
      undefined
    );
  var script$9 = {
    components: { IconBookmarkHeart, IconUgoiraPlay, IndicatorMultiple },
    props: {
      bookmarkCount: {
        default: 0,
        type: Number,
      },
      bookmarkId: {
        default: '',
        type: String,
      },
      illustId: {
        default: '',
        type: String,
      },
      illustPageCount: {
        default: 1,
        type: Number,
      },
      illustTitle: {
        default: '',
        type: String,
      },
      isBookmarked: {
        default: false,
        type: Boolean,
      },
      isFollowed: {
        default: false,
        type: Boolean,
      },
      isUgoira: {
        default: false,
        type: Boolean,
      },
      profileImgUrl: {
        default: '',
        type: String,
      },
      showUserProfile: {
        default: true,
        type: Boolean,
      },
      thumbImgUrl: {
        default: '',
        type: String,
      },
      userId: {
        default: '',
        type: String,
      },
      userName: {
        default: '',
        type: String,
      },
    },
    data() {
      return {
        selfBookmarkId: this.bookmarkId,
        selfIsBookmarked: this.isBookmarked,
        ugoiraMeta: null,
        ugoiraPlayed: false,
        ugoiraPlayer: null,
      };
    },
    computed: {
      canHoverPlay() {
        return this.$store.getters.config.hoverPlay;
      },
      illustMainImgStyle() {
        return {
          backgroundImage: this.ugoiraPlayed ? 'none' : `url(${this.thumbImgUrl})`,
        };
      },
      illustPageUrl() {
        return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;
      },
      profileImgStyle() {
        return {
          backgroundImage: `url(${this.profileImgUrl})`,
        };
      },
      userPageUrl() {
        return `/member_illust.php?id=${this.userId}`;
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
      activateContextMenu(event) {
        if (this.$store.getters.config.contextMenu) {
          event.preventDefault();
          const payload = {
            position: {
              x: event.clientX,
              y: event.clientY,
            },
          };
          const ct = event.currentTarget;
          if (ct.classList.contains('user-profile-name')) {
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
          this.$store.commit('contextMenu/activate', payload);
        }
      },
      controlUgoira(event) {
        if (!this.ugoiraMeta) {
          return;
        }
        if (!this.ugoiraPlayer) {
          try {
            this.ugoiraPlayer = new ZipImagePlayer({
              autosize: true,
              canvas: this.$refs.smallUgoiraPreview,
              chunkSize: 300000,
              loop: true,
              metadata: this.ugoiraMeta,
              source: this.ugoiraMeta.src,
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
      async oneClickBookmarkAdd() {
        if (!this.selfIsBookmarked) {
          if (await PixivAPI.postRPCAddBookmark(this.illustId)) {
            this.selfIsBookmarked = true;
          }
        } else {
          if (!this.selfBookmarkId) {
            const data = await PixivAPI.getIllustBookmarkData(this.illustId);
            this.selfBookmarkId = data.bookmarkData.id;
          }
          if (await PixivAPI.postRPCDeleteBookmark(this.selfBookmarkId)) {
            this.selfIsBookmarked = false;
          }
        }
      },
    },
  };
              const __vue_script__$9 = script$9;
  var __vue_render__$9 = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c("li", { staticClass: "illust-item-root" }, [
      _c(
        "a",
        {
          staticClass: "illust-main",
          attrs: { href: _vm.illustPageUrl },
          on: {
            contextmenu: function($event) {
              return _vm.activateContextMenu($event)
            },
            mouseenter: _vm.controlUgoira,
            mouseleave: _vm.controlUgoira
          }
        },
        [
          _c(
            "div",
            { staticClass: "illust-main-indicators" },
            [
              _vm.illustPageCount > 1
                ? _c("IndicatorMultiple", {
                    attrs: { "illust-page-count": _vm.illustPageCount }
                  })
                : _vm._e()
            ],
            1
          ),
          _vm._v(" "),
          _c(
            "div",
            { staticClass: "illust-main-img", style: _vm.illustMainImgStyle },
            [
              _vm.isUgoira
                ? _c("IconUgoiraPlay", {
                    directives: [
                      {
                        name: "show",
                        rawName: "v-show",
                        value: !_vm.ugoiraPlayed,
                        expression: "!ugoiraPlayed"
                      }
                    ]
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
                    ref: "smallUgoiraPreview",
                    staticClass: "illust-main-ugoira"
                  })
                : _vm._e()
            ],
            1
          )
        ]
      ),
      _vm._v(" "),
      _c("div", { staticClass: "illust-buttons" }, [
        _c("div", [
          _c(
            "button",
            {
              attrs: { type: "button" },
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
            },
            [
              _c("IconBookmarkHeart", {
                attrs: { actived: _vm.selfIsBookmarked }
              })
            ],
            1
          )
        ])
      ]),
      _vm._v(" "),
      _c(
        "a",
        {
          staticClass: "illust-title",
          attrs: { href: _vm.illustPageUrl },
          on: {
            contextmenu: function($event) {
              return _vm.activateContextMenu($event)
            }
          }
        },
        [_vm._v(_vm._s(_vm.illustTitle))]
      ),
      _vm._v(" "),
      _c(
        "div",
        {
          directives: [
            {
              name: "show",
              rawName: "v-show",
              value: _vm.showUserProfile,
              expression: "showUserProfile"
            }
          ],
          staticClass: "user-profile"
        },
        [
          _c("div", [
            _c("a", {
              staticClass: "user-profile-img",
              style: _vm.profileImgStyle,
              attrs: { href: _vm.illustPageUrl }
            })
          ]),
          _vm._v(" "),
          _c(
            "a",
            {
              staticClass: "user-profile-name",
              attrs: { href: _vm.userPageUrl },
              on: {
                contextmenu: function($event) {
                  return _vm.activateContextMenu($event)
                }
              }
            },
            [_vm._v(_vm._s(_vm.userName))]
          ),
          _vm._v(" "),
          _vm.isFollowed
            ? _c("i", { staticClass: "fas fa-rss user-followed-indicator" })
            : _vm._e()
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
              value: _vm.bookmarkCount > 0,
              expression: "bookmarkCount > 0"
            }
          ],
          staticClass: "illust-popularity"
        },
        [_c("span", [_vm._v(_vm._s(_vm.bookmarkCount))])]
      )
    ])
  };
  var __vue_staticRenderFns__$9 = [];
  __vue_render__$9._withStripped = true;
    const __vue_inject_styles__$9 = function (inject) {
      if (!inject) return
      inject("data-v-0ca010a8_0", { source: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n/*\n@pixiv.override.css\n:root {\n  --new-default-image-item-square-size: 184px;\n}\n*/\n.illust-item-root[data-v-0ca010a8] {\n  margin: 0 12px 24px;\n}\n.illust-main[data-v-0ca010a8] {\n  text-decoration: none;\n}\n.illust-main-indicators[data-v-0ca010a8] {\n  display: flex;\n  position: absolute;\n  width: var(--new-default-image-item-square-size);\n  justify-content: end;\n}\n.illust-main-img[data-v-0ca010a8] {\n  align-items: center;\n  background-color: #fff;\n  background-position: 50%;\n  background-repeat: no-repeat;\n  background-size: cover;\n  border-radius: 4px;\n  display: flex;\n  height: var(--new-default-image-item-square-size);\n  justify-content: center;\n  margin-bottom: 8px;\n  position: relative;\n  width: var(--new-default-image-item-square-size);\n}\n.illust-main-img[data-v-0ca010a8]::before {\n  background-color: rgba(0, 0, 0, 0.02);\n  content: \"\";\n  display: block;\n  height: 100%;\n  left: 0;\n  position: absolute;\n  top: 0;\n  width: 100%;\n}\n.illust-main-ugoira[data-v-0ca010a8] {\n  object-fit: contain;\n  height: var(--new-default-image-item-square-size);\n  width: var(--new-default-image-item-square-size);\n}\n.illust-buttons[data-v-0ca010a8] {\n  display: flex;\n  height: 32px;\n  justify-content: flex-end;\n  margin-bottom: 8px;\n  margin-top: -40px;\n}\n.illust-buttons > div[data-v-0ca010a8] {\n  z-index: 1;\n}\n.illust-buttons > div > button[data-v-0ca010a8] {\n  background: none;\n  border: none;\n  box-sizing: content-box;\n  cursor: pointer;\n  display: inline-block;\n  height: 32px;\n  line-height: 1;\n  padding: 0;\n}\n.illust-title[data-v-0ca010a8] {\n  color: #177082;\n  display: block;\n  font-size: 14px;\n  font-weight: 700;\n  line-height: 1;\n  margin: 0 0 4px;\n  overflow: hidden;\n  text-decoration: none;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  width: var(--new-default-image-item-square-size);\n}\n.user-profile[data-v-0ca010a8] {\n  align-items: center;\n  display: flex;\n  width: var(--new-default-image-item-square-size);\n  margin-bottom: 4px;\n}\n.user-profile > div[data-v-0ca010a8] {\n  display: inline-block;\n  margin-right: 4px;\n}\n.user-profile-img[data-v-0ca010a8] {\n  background-size: cover;\n  border-radius: 50%;\n  display: block;\n  flex: none;\n  position: relative;\n  overflow: hidden;\n  width: 16px;\n  height: 16px;\n}\n.user-profile-name[data-v-0ca010a8] {\n  color: #999;\n  font-size: 12px;\n  line-height: 1;\n  overflow: hidden;\n  text-decoration: none;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  flex: 1;\n}\n.user-followed-indicator[data-v-0ca010a8] {\n  display: inline-block;\n  margin-left: 4px;\n  width: 16px;\n  height: 16px;\n  color: dodgerblue;\n}\n.illust-popularity[data-v-0ca010a8] {\n  display: flex;\n  width: 100%;\n  justify-content: center;\n}\n.illust-popularity > span[data-v-0ca010a8] {\n  background-color: #cef;\n  color: rgb(0, 105, 177);\n  padding: 2px 8px;\n  border-radius: 8px;\n  font-weight: bold;\n}\n.illust-popularity > span[data-v-0ca010a8]::before {\n  content: \"❤️\";\n  margin-right: 4px;\n}\n", map: {"version":3,"sources":["/home/flandre/dev/Patchouli/src/components/NewDefaultImageItem.vue"],"names":[],"mappings":";;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;AA2OA;;;;;EAKA;AACA;EACA,oBAAA;CACA;AACA;EACA,sBAAA;CACA;AACA;EACA,cAAA;EACA,mBAAA;EACA,iDAAA;EACA,qBAAA;CACA;AACA;EACA,oBAAA;EACA,uBAAA;EACA,yBAAA;EACA,6BAAA;EACA,uBAAA;EACA,mBAAA;EACA,cAAA;EACA,kDAAA;EACA,wBAAA;EACA,mBAAA;EACA,mBAAA;EACA,iDAAA;CACA;AACA;EACA,sCAAA;EACA,YAAA;EACA,eAAA;EACA,aAAA;EACA,QAAA;EACA,mBAAA;EACA,OAAA;EACA,YAAA;CACA;AACA;EACA,oBAAA;EACA,kDAAA;EACA,iDAAA;CACA;AACA;EACA,cAAA;EACA,aAAA;EACA,0BAAA;EACA,mBAAA;EACA,kBAAA;CACA;AACA;EACA,WAAA;CACA;AACA;EACA,iBAAA;EACA,aAAA;EACA,wBAAA;EACA,gBAAA;EACA,sBAAA;EACA,aAAA;EACA,eAAA;EACA,WAAA;CACA;AACA;EACA,eAAA;EACA,eAAA;EACA,gBAAA;EACA,iBAAA;EACA,eAAA;EACA,gBAAA;EACA,iBAAA;EACA,sBAAA;EACA,wBAAA;EACA,oBAAA;EACA,iDAAA;CACA;AACA;EACA,oBAAA;EACA,cAAA;EACA,iDAAA;EACA,mBAAA;CACA;AACA;EACA,sBAAA;EACA,kBAAA;CACA;AACA;EACA,uBAAA;EACA,mBAAA;EACA,eAAA;EACA,WAAA;EACA,mBAAA;EACA,iBAAA;EACA,YAAA;EACA,aAAA;CACA;AACA;EACA,YAAA;EACA,gBAAA;EACA,eAAA;EACA,iBAAA;EACA,sBAAA;EACA,wBAAA;EACA,oBAAA;EACA,QAAA;CACA;AACA;EACA,sBAAA;EACA,iBAAA;EACA,YAAA;EACA,aAAA;EACA,kBAAA;CACA;AACA;EACA,cAAA;EACA,YAAA;EACA,wBAAA;CACA;AACA;EACA,uBAAA;EACA,wBAAA;EACA,iBAAA;EACA,mBAAA;EACA,kBAAA;CACA;AACA;EACA,cAAA;EACA,kBAAA;CACA","file":"NewDefaultImageItem.vue","sourcesContent":["<template>\n  <li class=\"illust-item-root\">\n    <a\n      :href=\"illustPageUrl\"\n      class=\"illust-main\"\n      @click.right=\"activateContextMenu\"\n      @mouseenter=\"controlUgoira\"\n      @mouseleave=\"controlUgoira\">\n      <div class=\"illust-main-indicators\">\n        <IndicatorMultiple v-if=\"illustPageCount > 1\" :illust-page-count=\"illustPageCount\"/>\n      </div>\n      <div\n        :style=\"illustMainImgStyle\"\n        class=\"illust-main-img\">\n        <IconUgoiraPlay v-if=\"isUgoira\" v-show=\"!ugoiraPlayed\"/>\n        <canvas\n          v-if=\"isUgoira\"\n          v-show=\"ugoiraPlayed\"\n          ref=\"smallUgoiraPreview\"\n          class=\"illust-main-ugoira\"/>\n      </div>\n    </a>\n    <div class=\"illust-buttons\">\n      <div>\n        <button type=\"button\" @click.left.prevent.stop=\"oneClickBookmarkAdd\">\n          <IconBookmarkHeart :actived=\"selfIsBookmarked\"/>\n        </button>\n      </div>\n    </div>\n    <a\n      :href=\"illustPageUrl\"\n      class=\"illust-title\"\n      @click.right=\"activateContextMenu\">{{ illustTitle }}</a>\n    <div v-show=\"showUserProfile\" class=\"user-profile\">\n      <div>\n        <a\n          :href=\"illustPageUrl\"\n          :style=\"profileImgStyle\"\n          class=\"user-profile-img\"/>\n      </div>\n      <a\n        :href=\"userPageUrl\"\n        class=\"user-profile-name\"\n        @click.right=\"activateContextMenu\">{{ userName }}</a>\n      <i v-if=\"isFollowed\" class=\"fas fa-rss user-followed-indicator\"/>\n    </div>\n    <div v-show=\"bookmarkCount > 0\" class=\"illust-popularity\">\n      <span>{{ bookmarkCount }}</span>\n    </div>\n  </li>\n</template>\n\n<script>\nimport IconBookmarkHeart from './IconBookmarkHeart.vue';\nimport IconUgoiraPlay from './IconUgoiraPlay.vue';\nimport IndicatorMultiple from './IndicatorMultiple.vue';\nimport { $print } from '../lib/utils';\nimport { PixivAPI } from '../lib/pixiv';\n\nexport default {\n  components: { IconBookmarkHeart, IconUgoiraPlay, IndicatorMultiple },\n  props: {\n    bookmarkCount: {\n      default: 0,\n      type: Number,\n    },\n    bookmarkId: {\n      default: '',\n      type: String,\n    },\n    illustId: {\n      default: '',\n      type: String,\n    },\n    illustPageCount: {\n      default: 1,\n      type: Number,\n    },\n    illustTitle: {\n      default: '',\n      type: String,\n    },\n    isBookmarked: {\n      default: false,\n      type: Boolean,\n    },\n    isFollowed: {\n      default: false,\n      type: Boolean,\n    },\n    isUgoira: {\n      default: false,\n      type: Boolean,\n    },\n    profileImgUrl: {\n      default: '',\n      type: String,\n    },\n    showUserProfile: {\n      default: true,\n      type: Boolean,\n    },\n    thumbImgUrl: {\n      default: '',\n      type: String,\n    },\n    userId: {\n      default: '',\n      type: String,\n    },\n    userName: {\n      default: '',\n      type: String,\n    },\n  },\n  // eslint-disable-next-line sort-keys\n  data() {\n    return {\n      selfBookmarkId: this.bookmarkId,\n      selfIsBookmarked: this.isBookmarked,\n      ugoiraMeta: null,\n      ugoiraPlayed: false,\n      ugoiraPlayer: null,\n    };\n  },\n  // eslint-disable-next-line sort-keys\n  computed: {\n    canHoverPlay() {\n      return this.$store.getters.config.hoverPlay;\n    },\n    illustMainImgStyle() {\n      return {\n        backgroundImage: this.ugoiraPlayed ? 'none' : `url(${this.thumbImgUrl})`,\n      };\n    },\n    illustPageUrl() {\n      return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;\n    },\n    profileImgStyle() {\n      return {\n        backgroundImage: `url(${this.profileImgUrl})`,\n      };\n    },\n    userPageUrl() {\n      return `/member_illust.php?id=${this.userId}`;\n    },\n  },\n  mounted() {\n    this.$nextTick(async() => {\n      if (this.isUgoira && this.canHoverPlay) {\n        this.ugoiraMeta = await PixivAPI.getIllustUgoiraMetaData(this.illustId);\n      }\n    });\n  },\n  // eslint-disable-next-line sort-keys\n  methods: {\n    activateContextMenu(event) {\n      $print.debug('NewDefaultImageItem#activateContextMenu', event);\n      if (this.$store.getters.config.contextMenu) {\n        event.preventDefault();\n\n        const payload = {\n          position: {\n            x: event.clientX,\n            y: event.clientY,\n          },\n        };\n\n        const ct = event.currentTarget;\n        if (ct.classList.contains('user-profile-name')) {\n          payload.data = {\n            illustId: this.illustId,\n            type: 'image-item-title-user',\n          };\n        } else {\n          payload.data = {\n            illustId: this.illustId,\n            type: 'image-item-image',\n          };\n        }\n\n        this.$store.commit('contextMenu/activate', payload);\n      }\n    },\n    controlUgoira(event) {\n      if (!this.ugoiraMeta) {\n        return;\n      }\n      if (!this.ugoiraPlayer) {\n        try {\n          this.ugoiraPlayer = new ZipImagePlayer({\n            autosize: true,\n            canvas: this.$refs.smallUgoiraPreview,\n            chunkSize: 300000,\n            loop: true,\n            metadata: this.ugoiraMeta,\n            source: this.ugoiraMeta.src,\n          });\n        } catch (error) {\n          $print.error(error);\n        }\n      }\n      if (this.canHoverPlay) {\n        if (event.type === 'mouseenter') {\n          this.ugoiraPlayed = true;\n          this.ugoiraPlayer.play();\n        } else {\n          this.ugoiraPlayed = false;\n          this.ugoiraPlayer.pause();\n          this.ugoiraPlayer.rewind();\n        }\n      }\n    },\n    async oneClickBookmarkAdd() {\n      if (!this.selfIsBookmarked) {\n        if (await PixivAPI.postRPCAddBookmark(this.illustId)) {\n          this.selfIsBookmarked = true;\n        }\n      } else {\n        // this.selfBookmarkId might be empty...\n        // Because RPC API has no bookmarkId returned...\n        if (!this.selfBookmarkId) {\n          const data = await PixivAPI.getIllustBookmarkData(this.illustId);\n          this.selfBookmarkId = data.bookmarkData.id;\n        }\n        if (await PixivAPI.postRPCDeleteBookmark(this.selfBookmarkId)) {\n          this.selfIsBookmarked = false;\n        }\n      }\n    },\n  },\n};\n</script>\n\n<style scoped>\n/*\n@pixiv.override.css\n:root {\n  --new-default-image-item-square-size: 184px;\n}\n*/\n.illust-item-root {\n  margin: 0 12px 24px;\n}\n.illust-main {\n  text-decoration: none;\n}\n.illust-main-indicators {\n  display: flex;\n  position: absolute;\n  width: var(--new-default-image-item-square-size);\n  justify-content: end;\n}\n.illust-main-img {\n  align-items: center;\n  background-color: #fff;\n  background-position: 50%;\n  background-repeat: no-repeat;\n  background-size: cover;\n  border-radius: 4px;\n  display: flex;\n  height: var(--new-default-image-item-square-size);\n  justify-content: center;\n  margin-bottom: 8px;\n  position: relative;\n  width: var(--new-default-image-item-square-size);\n}\n.illust-main-img::before {\n  background-color: rgba(0, 0, 0, 0.02);\n  content: \"\";\n  display: block;\n  height: 100%;\n  left: 0;\n  position: absolute;\n  top: 0;\n  width: 100%;\n}\n.illust-main-ugoira {\n  object-fit: contain;\n  height: var(--new-default-image-item-square-size);\n  width: var(--new-default-image-item-square-size);\n}\n.illust-buttons {\n  display: flex;\n  height: 32px;\n  justify-content: flex-end;\n  margin-bottom: 8px;\n  margin-top: -40px;\n}\n.illust-buttons > div {\n  z-index: 1;\n}\n.illust-buttons > div > button {\n  background: none;\n  border: none;\n  box-sizing: content-box;\n  cursor: pointer;\n  display: inline-block;\n  height: 32px;\n  line-height: 1;\n  padding: 0;\n}\n.illust-title {\n  color: #177082;\n  display: block;\n  font-size: 14px;\n  font-weight: 700;\n  line-height: 1;\n  margin: 0 0 4px;\n  overflow: hidden;\n  text-decoration: none;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  width: var(--new-default-image-item-square-size);\n}\n.user-profile {\n  align-items: center;\n  display: flex;\n  width: var(--new-default-image-item-square-size);\n  margin-bottom: 4px;\n}\n.user-profile > div {\n  display: inline-block;\n  margin-right: 4px;\n}\n.user-profile-img {\n  background-size: cover;\n  border-radius: 50%;\n  display: block;\n  flex: none;\n  position: relative;\n  overflow: hidden;\n  width: 16px;\n  height: 16px;\n}\n.user-profile-name {\n  color: #999;\n  font-size: 12px;\n  line-height: 1;\n  overflow: hidden;\n  text-decoration: none;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  flex: 1;\n}\n.user-followed-indicator {\n  display: inline-block;\n  margin-left: 4px;\n  width: 16px;\n  height: 16px;\n  color: dodgerblue;\n}\n.illust-popularity {\n  display: flex;\n  width: 100%;\n  justify-content: center;\n}\n.illust-popularity > span {\n  background-color: #cef;\n  color: rgb(0, 105, 177);\n  padding: 2px 8px;\n  border-radius: 8px;\n  font-weight: bold;\n}\n.illust-popularity > span::before {\n  content: \"❤️\";\n  margin-right: 4px;\n}\n</style>\n\n\n"]}, media: undefined });
    };
    const __vue_scope_id__$9 = "data-v-0ca010a8";
    const __vue_module_identifier__$9 = undefined;
    const __vue_is_functional_template__$9 = false;
    function __vue_normalize__$9(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "/home/flandre/dev/Patchouli/src/components/NewDefaultImageItem.vue";
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
    function __vue_create_injector__$9() {
      const head = document.head || document.getElementsByTagName('head')[0];
      const styles = __vue_create_injector__$9.styles || (__vue_create_injector__$9.styles = {});
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
    var NewDefaultImageItem = __vue_normalize__$9(
      { render: __vue_render__$9, staticRenderFns: __vue_staticRenderFns__$9 },
      __vue_inject_styles__$9,
      __vue_script__$9,
      __vue_scope_id__$9,
      __vue_is_functional_template__$9,
      __vue_module_identifier__$9,
      __vue_create_injector__$9,
      undefined
    );
  var script$a = {
    components: { NewDefaultImageItem },
    computed: {
      hasNoResult() {
        return !this.nppProcessedLibrary.filter(d => d._show).length;
      },
      isSelfBookmarkPage() {
        return this.$store.getters.isSelfBookmarkPage;
      },
      isSelfPrivateBookmarkPage() {
        return this.isSelfBookmarkPage && this.rest === 'hide';
      },
      nppProcessedLibrary() {
        return this.$store.getters['pixiv/nppProcessedLibrary'];
      },
      nppType() {
        return this.$store.getters['pixiv/nppType'];
      },
      rest() {
        return this.$store.getters.sp.rest;
      },
      uid() {
        return this.$store.getters.sp.id;
      },
    },
    methods: {
      clickRoute(event) {
        this.$store.commit('pixiv/pause');
        const tid = event.currentTarget.id;
        const thref = event.currentTarget.href;
        if (this.isSamePath(location.href, thref)) {
          return;
        }
        history.pushState(null, '', thref);
        switch (tid) {
        case 'patchouli-npp-all':
          this.$store.commit('setMainPageType', {
            forceSet: MAIN_PAGE_TYPE.NEW_PROFILE,
          });
          break;
        case 'patchouli-npp-illust':
          this.$store.commit('setMainPageType', {
            forceSet: MAIN_PAGE_TYPE.NEW_PROFILE_ILLUST,
          });
          break;
        case 'patchouli-npp-manga':
          this.$store.commit('setMainPageType', {
            forceSet: MAIN_PAGE_TYPE.NEW_PROFILE_MANGA,
          });
          break;
        case 'patchouli-npp-bookmark':
        case 'patchouli-npp-view-bookmark-switch-public':
        case 'patchouli-npp-view-bookmark-switch-private':
          this.$store.commit('updateSearchParam');
          this.$store.commit('setMainPageType', {
            forceSet: MAIN_PAGE_TYPE.NEW_PROFILE_BOOKMARK,
          });
          break;
        default:
          break;
        }
        this.$store.dispatch('pixiv/start', { force: true, times: 1 });
      },
      isSamePath(href0, href1) {
        const a0 = $el('a', { href: href0 });
        const a1 = $el('a', { href: href1 });
        if (a0.pathname !== a1.pathname) {
          return false;
        }
        const sp0 = new URLSearchParams(a0.search);
        const sp1 = new URLSearchParams(a1.search);
        const keysSet = new Set([...sp0.keys(), ...sp1.keys()]);
        for (const k of keysSet) {
          if (sp0.get(k) !== sp1.get(k)) {
            return false;
          }
        }
        return true;
      },
    },
  };
              const __vue_script__$a = script$a;
  var __vue_render__$a = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c("div", { attrs: { id: "patchouli-new-profile-page" } }, [
      _c("nav", { attrs: { id: "patchouli-npp-nav" } }, [
        _c(
          "a",
          {
            class: { current: _vm.nppType === 0 },
            attrs: { id: "patchouli-npp-all", href: "/member.php?id=" + _vm.uid },
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
                return _vm.clickRoute($event)
              }
            }
          },
          [_vm._v(_vm._s(_vm.$t("mainView.newProfilePage.contents")))]
        ),
        _vm._v(" "),
        _c(
          "a",
          {
            class: { current: _vm.nppType === 1 },
            attrs: {
              id: "patchouli-npp-illust",
              href: "/member_illust.php?id=" + _vm.uid + "&type=illust"
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
                $event.preventDefault();
                return _vm.clickRoute($event)
              }
            }
          },
          [_vm._v(_vm._s(_vm.$t("mainView.newProfilePage.illustrations")))]
        ),
        _vm._v(" "),
        _c(
          "a",
          {
            class: { current: _vm.nppType === 2 },
            attrs: {
              id: "patchouli-npp-manga",
              href: "/member_illust.php?id=" + _vm.uid + "&type=manga"
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
                $event.preventDefault();
                return _vm.clickRoute($event)
              }
            }
          },
          [_vm._v(_vm._s(_vm.$t("mainView.newProfilePage.manga")))]
        ),
        _vm._v(" "),
        _c(
          "a",
          {
            class: { current: _vm.nppType === 3 },
            attrs: {
              id: "patchouli-npp-bookmark",
              href: "/bookmark.php?id=" + _vm.uid + "&rest=show"
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
                $event.preventDefault();
                return _vm.clickRoute($event)
              }
            }
          },
          [_vm._v(_vm._s(_vm.$t("mainView.newProfilePage.bookmarks")))]
        )
      ]),
      _vm._v(" "),
      _c("div", { attrs: { id: "patchouli-npp-view" } }, [
        _c(
          "div",
          {
            directives: [
              {
                name: "show",
                rawName: "v-show",
                value: _vm.isSelfBookmarkPage,
                expression: "isSelfBookmarkPage"
              }
            ],
            staticClass: "ω",
            attrs: { id: "patchouli-npp-view-bookmark-switch" }
          },
          [
            _c("nav", [
              _c(
                "a",
                {
                  class: { current: !_vm.isSelfPrivateBookmarkPage },
                  attrs: {
                    id: "patchouli-npp-view-bookmark-switch-public",
                    href: "/bookmark.php?id=" + _vm.uid + "&rest=show"
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
                      $event.preventDefault();
                      return _vm.clickRoute($event)
                    }
                  }
                },
                [_vm._v(_vm._s(_vm.$t("mainView.newProfilePage.publicBookmark")))]
              ),
              _vm._v(" "),
              _c(
                "a",
                {
                  class: { current: _vm.isSelfPrivateBookmarkPage },
                  attrs: {
                    id: "patchouli-npp-view-bookmark-switch-private",
                    href: "/bookmark.php?id=" + _vm.uid + "&rest=hide"
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
                      $event.preventDefault();
                      return _vm.clickRoute($event)
                    }
                  }
                },
                [
                  _vm._v(
                    _vm._s(_vm.$t("mainView.newProfilePage.privateBookmark"))
                  )
                ]
              )
            ])
          ]
        ),
        _vm._v(" "),
        _c("div", { attrs: { id: "patchouli-npp-view-header" } }),
        _vm._v(" "),
        _c(
          "ul",
          {
            staticClass: "ω",
            attrs: { id: "patchouli-npp-view-image-item-list" }
          },
          [
            _vm._l(_vm.nppProcessedLibrary, function(d) {
              return _c("NewDefaultImageItem", {
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
                  "illust-id": d.illustId,
                  "bookmark-count": d.bookmarkCount,
                  "bookmark-id": d.bookmarkId,
                  "is-bookmarked": d.isBookmarked,
                  "is-followed": d.isFollowed,
                  "is-ugoira": d.isUgoira,
                  "illust-page-count": d.illustPageCount,
                  "illust-title": d.illustTitle,
                  "thumb-img-url": d.urls.thumb,
                  "profile-img-url": d.profileImg,
                  "user-id": d.userId,
                  "user-name": d.userName,
                  "show-user-profile": _vm.uid !== d.userId
                }
              })
            }),
            _vm._v(" "),
            _c(
              "span",
              {
                directives: [
                  {
                    name: "show",
                    rawName: "v-show",
                    value: _vm.hasNoResult,
                    expression: "hasNoResult"
                  }
                ],
                attrs: { id: "patchouli-npp-view-no-result" }
              },
              [
                _vm._v(
                  "\n        " +
                    _vm._s(_vm.$t("mainView.newProfilePage.noResult")) +
                    "\n      "
                )
              ]
            )
          ],
          2
        )
      ])
    ])
  };
  var __vue_staticRenderFns__$a = [];
  __vue_render__$a._withStripped = true;
    const __vue_inject_styles__$a = function (inject) {
      if (!inject) return
      inject("data-v-67302fee_0", { source: "\n#patchouli-npp-nav[data-v-67302fee] {\n  display: flex;\n  justify-content: center;\n  background-color: #f9f8ff;\n  width: 100%;\n}\n#patchouli-npp-nav > a[data-v-67302fee] {\n  border-top: 4px solid transparent;\n  color: #999;\n  font-size: 16px;\n  font-weight: 700;\n  margin: 0 10px;\n  padding: 10px 20px;\n  text-decoration: none;\n  transition: color 0.2s;\n}\n#patchouli-npp-nav > a[data-v-67302fee]:hover {\n  color: #333;\n  cursor: pointer;\n}\n#patchouli-npp-nav > a.current[data-v-67302fee] {\n  color: #333;\n  border-bottom: 4px solid #0096fa;\n}\n#patchouli-npp-view-bookmark-switch[data-v-67302fee] {\n  display: flex;\n  justify-content: flex-end;\n  margin: 24px auto 48px;\n  width: 1300px;\n}\n#patchouli-npp-view-bookmark-switch a.current[data-v-67302fee] {\n  background-color: #f5f5f5;\n  color: #5c5c5c;\n}\n#patchouli-npp-view-bookmark-switch a[data-v-67302fee] {\n  border-radius: 24px;\n  color: #8f8f8f;\n  font-size: 16px;\n  font-weight: 700;\n  padding: 16px 24px;\n  text-decoration: none;\n}\n#patchouli-npp-view-image-item-list[data-v-67302fee] {\n  list-style: none;\n  display: flex;\n  align-content: flex-start;\n  justify-content: center;\n  flex-wrap: wrap;\n  padding: 14px 0;\n  margin: 0 auto;\n  width: 1300px;\n}\n#patchouli-npp-view-no-result[data-v-67302fee] {\n  color: #b8b8b8;\n  font-size: 20px;\n  font-weight: 700;\n  line-height: 1;\n  padding: 30px 0;\n}\n", map: {"version":3,"sources":["/home/flandre/dev/Patchouli/src/components/NewProfilePage.vue"],"names":[],"mappings":";AAkKA;EACA,cAAA;EACA,wBAAA;EACA,0BAAA;EACA,YAAA;CACA;AACA;EACA,kCAAA;EACA,YAAA;EACA,gBAAA;EACA,iBAAA;EACA,eAAA;EACA,mBAAA;EACA,sBAAA;EACA,uBAAA;CACA;AACA;EACA,YAAA;EACA,gBAAA;CACA;AACA;EACA,YAAA;EACA,iCAAA;CACA;AACA;EACA,cAAA;EACA,0BAAA;EACA,uBAAA;EACA,cAAA;CACA;AACA;EACA,0BAAA;EACA,eAAA;CACA;AACA;EACA,oBAAA;EACA,eAAA;EACA,gBAAA;EACA,iBAAA;EACA,mBAAA;EACA,sBAAA;CACA;AACA;EACA,iBAAA;EACA,cAAA;EACA,0BAAA;EACA,wBAAA;EACA,gBAAA;EACA,gBAAA;EACA,eAAA;EACA,cAAA;CACA;AACA;EACA,eAAA;EACA,gBAAA;EACA,iBAAA;EACA,eAAA;EACA,gBAAA;CACA","file":"NewProfilePage.vue","sourcesContent":["<template>\n  <div id=\"patchouli-new-profile-page\">\n    <nav id=\"patchouli-npp-nav\">\n      <a\n        id=\"patchouli-npp-all\"\n        :class=\"{'current': nppType === 0}\"\n        :href=\"`/member.php?id=${uid}`\"\n        @click.left.prevent=\"clickRoute\">{{ $t('mainView.newProfilePage.contents') }}</a>\n      <a\n        id=\"patchouli-npp-illust\"\n        :class=\"{'current': nppType === 1}\"\n        :href=\"`/member_illust.php?id=${uid}&type=illust`\"\n        @click.left.prevent=\"clickRoute\">{{ $t('mainView.newProfilePage.illustrations') }}</a>\n      <a\n        id=\"patchouli-npp-manga\"\n        :class=\"{'current': nppType === 2}\"\n        :href=\"`/member_illust.php?id=${uid}&type=manga`\"\n        @click.left.prevent=\"clickRoute\">{{ $t('mainView.newProfilePage.manga') }}</a>\n      <a\n        id=\"patchouli-npp-bookmark\"\n        :class=\"{'current': nppType === 3}\"\n        :href=\"`/bookmark.php?id=${uid}&rest=show`\"\n        @click.left.prevent=\"clickRoute\">{{ $t('mainView.newProfilePage.bookmarks') }}</a>\n    </nav>\n    <div id=\"patchouli-npp-view\">\n      <div\n        v-show=\"isSelfBookmarkPage\"\n        id=\"patchouli-npp-view-bookmark-switch\"\n        class=\"ω\">\n        <nav>\n          <a\n            id=\"patchouli-npp-view-bookmark-switch-public\"\n            :class=\"{'current': !isSelfPrivateBookmarkPage}\"\n            :href=\"`/bookmark.php?id=${uid}&rest=show`\"\n            @click.left.prevent=\"clickRoute\">{{ $t('mainView.newProfilePage.publicBookmark') }}</a>\n          <a\n            id=\"patchouli-npp-view-bookmark-switch-private\"\n            :class=\"{'current': isSelfPrivateBookmarkPage}\"\n            :href=\"`/bookmark.php?id=${uid}&rest=hide`\"\n            @click.left.prevent=\"clickRoute\">{{ $t('mainView.newProfilePage.privateBookmark') }}</a>\n        </nav>\n      </div>\n      <div id=\"patchouli-npp-view-header\"/>\n      <ul id=\"patchouli-npp-view-image-item-list\" class=\"ω\">\n        <NewDefaultImageItem\n          v-for=\"d in nppProcessedLibrary\"\n          v-show=\"d._show\"\n          :key=\"d.illustId\"\n          :illust-id=\"d.illustId\"\n          :bookmark-count=\"d.bookmarkCount\"\n          :bookmark-id=\"d.bookmarkId\"\n          :is-bookmarked=\"d.isBookmarked\"\n          :is-followed=\"d.isFollowed\"\n          :is-ugoira=\"d.isUgoira\"\n          :illust-page-count=\"d.illustPageCount\"\n          :illust-title=\"d.illustTitle\"\n          :thumb-img-url=\"d.urls.thumb\"\n          :profile-img-url=\"d.profileImg\"\n          :user-id=\"d.userId\"\n          :user-name=\"d.userName\"\n          :show-user-profile=\"uid !== d.userId\"/>\n        <span v-show=\"hasNoResult\" id=\"patchouli-npp-view-no-result\">\n          {{ $t('mainView.newProfilePage.noResult') }}\n        </span>\n      </ul>\n    </div>\n  </div>\n</template>\n\n<script>\nimport { MAIN_PAGE_TYPE as MPT } from '../lib/enums';\nimport { $el } from '../lib/utils';\nimport NewDefaultImageItem from './NewDefaultImageItem.vue';\n\nexport default {\n  components: { NewDefaultImageItem },\n  computed: {\n    hasNoResult() {\n      return !this.nppProcessedLibrary.filter(d => d._show).length;\n    },\n    isSelfBookmarkPage() {\n      return this.$store.getters.isSelfBookmarkPage;\n    },\n    isSelfPrivateBookmarkPage() {\n      return this.isSelfBookmarkPage && this.rest === 'hide';\n    },\n    nppProcessedLibrary() {\n      return this.$store.getters['pixiv/nppProcessedLibrary'];\n    },\n    nppType() {\n      return this.$store.getters['pixiv/nppType'];\n    },\n    rest() {\n      return this.$store.getters.sp.rest;\n    },\n    uid() {\n      return this.$store.getters.sp.id;\n    },\n  },\n  methods: {\n    clickRoute(event) {\n      this.$store.commit('pixiv/pause');\n      const tid = event.currentTarget.id;\n      const thref = event.currentTarget.href;\n\n      if (this.isSamePath(location.href, thref)) {\n        return;\n      }\n\n      history.pushState(null, '', thref);\n\n      switch (tid) {\n      case 'patchouli-npp-all':\n        this.$store.commit('setMainPageType', {\n          forceSet: MPT.NEW_PROFILE,\n        });\n        break;\n      case 'patchouli-npp-illust':\n        this.$store.commit('setMainPageType', {\n          forceSet: MPT.NEW_PROFILE_ILLUST,\n        });\n        break;\n      case 'patchouli-npp-manga':\n        this.$store.commit('setMainPageType', {\n          forceSet: MPT.NEW_PROFILE_MANGA,\n        });\n        break;\n      case 'patchouli-npp-bookmark':\n      case 'patchouli-npp-view-bookmark-switch-public':\n      case 'patchouli-npp-view-bookmark-switch-private':\n        this.$store.commit('updateSearchParam');\n        this.$store.commit('setMainPageType', {\n          forceSet: MPT.NEW_PROFILE_BOOKMARK,\n        });\n        break;\n      default:\n        break;\n      }\n\n      this.$store.dispatch('pixiv/start', { force: true, times: 1 });\n    },\n    isSamePath(href0, href1) {\n      const a0 = $el('a', { href: href0 });\n      const a1 = $el('a', { href: href1 });\n      if (a0.pathname !== a1.pathname) {\n        return false;\n      }\n      const sp0 = new URLSearchParams(a0.search);\n      const sp1 = new URLSearchParams(a1.search);\n      const keysSet = new Set([...sp0.keys(), ...sp1.keys()]);\n      for (const k of keysSet) {\n        if (sp0.get(k) !== sp1.get(k)) {\n          return false;\n        }\n      }\n      return true;\n    },\n  },\n};\n</script>\n\n<style scoped>\n#patchouli-npp-nav {\n  display: flex;\n  justify-content: center;\n  background-color: #f9f8ff;\n  width: 100%;\n}\n#patchouli-npp-nav > a {\n  border-top: 4px solid transparent;\n  color: #999;\n  font-size: 16px;\n  font-weight: 700;\n  margin: 0 10px;\n  padding: 10px 20px;\n  text-decoration: none;\n  transition: color 0.2s;\n}\n#patchouli-npp-nav > a:hover {\n  color: #333;\n  cursor: pointer;\n}\n#patchouli-npp-nav > a.current {\n  color: #333;\n  border-bottom: 4px solid #0096fa;\n}\n#patchouli-npp-view-bookmark-switch {\n  display: flex;\n  justify-content: flex-end;\n  margin: 24px auto 48px;\n  width: 1300px;\n}\n#patchouli-npp-view-bookmark-switch a.current {\n  background-color: #f5f5f5;\n  color: #5c5c5c;\n}\n#patchouli-npp-view-bookmark-switch a {\n  border-radius: 24px;\n  color: #8f8f8f;\n  font-size: 16px;\n  font-weight: 700;\n  padding: 16px 24px;\n  text-decoration: none;\n}\n#patchouli-npp-view-image-item-list {\n  list-style: none;\n  display: flex;\n  align-content: flex-start;\n  justify-content: center;\n  flex-wrap: wrap;\n  padding: 14px 0;\n  margin: 0 auto;\n  width: 1300px;\n}\n#patchouli-npp-view-no-result {\n  color: #b8b8b8;\n  font-size: 20px;\n  font-weight: 700;\n  line-height: 1;\n  padding: 30px 0;\n}\n</style>\n\n\n"]}, media: undefined });
    };
    const __vue_scope_id__$a = "data-v-67302fee";
    const __vue_module_identifier__$a = undefined;
    const __vue_is_functional_template__$a = false;
    function __vue_normalize__$a(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "/home/flandre/dev/Patchouli/src/components/NewProfilePage.vue";
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
    function __vue_create_injector__$a() {
      const head = document.head || document.getElementsByTagName('head')[0];
      const styles = __vue_create_injector__$a.styles || (__vue_create_injector__$a.styles = {});
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
    var NewProfilePage = __vue_normalize__$a(
      { render: __vue_render__$a, staticRenderFns: __vue_staticRenderFns__$a },
      __vue_inject_styles__$a,
      __vue_script__$a,
      __vue_scope_id__$a,
      __vue_is_functional_template__$a,
      __vue_module_identifier__$a,
      __vue_create_injector__$a,
      undefined
    );
  var script$b = {
    components: { ContextMenu, DefaultImageItemPage, NewProfilePage },
    props: {
      id: {
        default: '',
        type: String,
      },
    },
    computed: {
      isNewProfilePage() {
        return this.$store.getters['pixiv/nppType'] >= 0;
      },
    },
  };
              const __vue_script__$b = script$b;
  var __vue_render__$b = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c(
      "div",
      { attrs: { id: _vm.id } },
      [
        _vm.isNewProfilePage ? _c("NewProfilePage") : _c("DefaultImageItemPage"),
        _vm._v(" "),
        _c("ContextMenu")
      ],
      1
    )
  };
  var __vue_staticRenderFns__$b = [];
  __vue_render__$b._withStripped = true;
    const __vue_inject_styles__$b = function (inject) {
      if (!inject) return
      inject("data-v-4ab1002e_0", { source: "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n", map: {"version":3,"sources":[],"names":[],"mappings":"","file":"MainView.vue"}, media: undefined });
    };
    const __vue_scope_id__$b = "data-v-4ab1002e";
    const __vue_module_identifier__$b = undefined;
    const __vue_is_functional_template__$b = false;
    function __vue_normalize__$b(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "/home/flandre/dev/Patchouli/src/components/MainView.vue";
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
    function __vue_create_injector__$b() {
      const head = document.head || document.getElementsByTagName('head')[0];
      const styles = __vue_create_injector__$b.styles || (__vue_create_injector__$b.styles = {});
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
    var mainView = __vue_normalize__$b(
      { render: __vue_render__$b, staticRenderFns: __vue_staticRenderFns__$b },
      __vue_inject_styles__$b,
      __vue_script__$b,
      __vue_scope_id__$b,
      __vue_is_functional_template__$b,
      __vue_module_identifier__$b,
      __vue_create_injector__$b,
      undefined
    );
  var script$c = {
    props: {
      id: {
        default: '',
        type: String,
      },
    },
    data() {
      return {
        previewCurrentIndex: 0,
        previewSrcList: [],
        previewUgoiraMetaData: null,
        ugoiraPlayers: [],
      };
    },
    computed: {
      xc() {
        return this.$store.getters.config;
      },
      xdata() {
        return this.$store.getters['coverLayer/data'];
      },
      xmode() {
        return this.$store.getters['coverLayer/mode'];
      },
    },
    watch: {
      async xmode(value) {
        if (value === 'preview') {
          const imageItem = this.xdata;
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
      if (this.xmode === 'preview') {
        this.$refs.coverLayerRoot.focus();
      }
    },
    methods: {
      clickBase(event) {
        this.$store.commit('coverLayer/close');
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
      initZipImagePlayer() {
        const meta = this.previewUgoiraMetaData;
        this.$refs.previewOriginalUgoiraCanvas.width = 0;
        this.$refs.previewUgoiraCanvas.width = 0;
        const opt = {
          autoStart: true,
          autosize: true,
          canvas: this.$refs.previewUgoiraCanvas,
          chunkSize: 300000,
          loop: true,
          metadata: meta,
          source: meta.src,
        };
        this.ugoiraPlayers.push(new ZipImagePlayer(opt));
        this.ugoiraPlayers.push(
          new ZipImagePlayer(
            Object.assign({}, opt, {
              canvas: this.$refs.previewOriginalUgoiraCanvas,
              source: meta.originalSrc,
            })
          )
        );
      },
      jumpByKeyup(event) {
        if (this.xmode === 'preview') {
          if (event.key === 'ArrowLeft') {
            this.jumpPrev();
          } else if (event.key === 'ArrowRight') {
            this.jumpNext();
          }
        }
      },
      jumpByWheel(event) {
        if (this.xmode === 'preview') {
          if (event.deltaY < 0) {
            this.jumpPrev();
          } else if (event.deltaY > 0) {
            this.jumpNext();
          }
        }
      },
      jumpNext() {
        const t = this.previewSrcList.length;
        const c = this.previewCurrentIndex;
        this.jumpTo((c + 1) % t);
      },
      jumpPrev() {
        const t = this.previewSrcList.length;
        const c = this.previewCurrentIndex;
        this.jumpTo((c + t - 1) % t);
      },
      jumpTo(index) {
        this.previewCurrentIndex = index;
      },
    },
  };
              const __vue_script__$c = script$c;
  var __vue_render__$c = function() {
    var _vm = this;
    var _h = _vm.$createElement;
    var _c = _vm._self._c || _h;
    return _c(
      "div",
      {
        directives: [
          {
            name: "show",
            rawName: "v-show",
            value: _vm.xmode,
            expression: "xmode"
          }
        ],
        ref: "coverLayerRoot",
        attrs: { id: _vm.id, tabindex: "0" },
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
          scroll: function($event) {
            $event.stopPropagation();
            $event.preventDefault();
          },
          wheel: function($event) {
            $event.stopPropagation();
            $event.preventDefault();
            return _vm.jumpByWheel($event)
          }
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
                value: _vm.xmode === "config",
                expression: "xmode === 'config'"
              }
            ],
            attrs: { id: "marisa-config-mode" },
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
            _c("a", { attrs: { id: "marisa-config-blacklist-label" } }, [
              _c("i", { staticClass: "far fa-eye-slash" }),
              _vm._v(_vm._s(_vm.$t("config.blacklist")) + "\n    ")
            ]),
            _vm._v(" "),
            _c("textarea", {
              ref: "blacklistTextarea",
              attrs: {
                id: "marisa-config-blacklist-textarea",
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
                value: _vm.xmode === "preview",
                expression: "xmode === 'preview'"
              }
            ],
            attrs: { id: "marisa-preview-mode" },
            on: {
              click: function($event) {
                $event.stopPropagation();
              }
            }
          },
          [
            _c("div", { attrs: { id: "marisa-preview-display-area" } }, [
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
                attrs: { id: "marisa-preview-thumbnails-area" }
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
                          _vm.jumpTo(index);
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
  var __vue_staticRenderFns__$c = [];
  __vue_render__$c._withStripped = true;
    const __vue_inject_styles__$c = function (inject) {
      if (!inject) return
      inject("data-v-6e5f249a_0", { source: "\n#Marisa[data-v-6e5f249a] {\n  background-color: #000a;\n  position: fixed;\n  height: 100%;\n  width: 100%;\n  z-index: 5;\n  top: 0;\n  left: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n#marisa-config-mode[data-v-6e5f249a],\n#marisa-preview-mode[data-v-6e5f249a] {\n  min-width: 100px;\n  min-height: 100px;\n  background-color: #eef;\n}\n#marisa-config-mode[data-v-6e5f249a] {\n  display: flex;\n  flex-flow: column;\n  padding: 10px;\n  border-radius: 10px;\n  font-size: 18px;\n  white-space: nowrap;\n}\n#marisa-config-mode a[data-v-6e5f249a] {\n  color: #00186c;\n  text-decoration: none;\n}\n#marisa-config-mode [id$=\"switch\"][data-v-6e5f249a] {\n  text-align: center;\n}\n#marisa-config-mode [id$=\"switch\"][data-v-6e5f249a]:hover {\n  cursor: pointer;\n}\n#marisa-config-mode [id$=\"label\"][data-v-6e5f249a] {\n  text-align: center;\n  margin: 0 5px;\n}\n#marisa-config-blacklist-label > .fa-eye-slash[data-v-6e5f249a] {\n  margin: 0 4px;\n}\n#marisa-config-blacklist-textarea[data-v-6e5f249a] {\n  box-sizing: border-box;\n  flex: 1;\n  resize: none;\n  font-size: 11pt;\n  height: 90px;\n}\n#marisa-preview-mode[data-v-6e5f249a] {\n  width: 70%;\n  height: 100%;\n  box-sizing: border-box;\n  display: grid;\n  grid-template-rows: minmax(0, auto) max-content;\n}\n#marisa-preview-display-area[data-v-6e5f249a] {\n  border: 2px #00186c solid;\n  box-sizing: border-box;\n  text-align: center;\n}\n#marisa-preview-display-area > a[data-v-6e5f249a],\n#marisa-preview-display-area > div[data-v-6e5f249a] {\n  display: inline-flex;\n  height: 100%;\n  justify-content: center;\n  align-items: center;\n}\n#marisa-preview-display-area > a > img[data-v-6e5f249a],\n#marisa-preview-display-area > div > canvas[data-v-6e5f249a] {\n  object-fit: contain;\n  max-width: 100%;\n  max-height: 100%;\n}\n#marisa-preview-thumbnails-area[data-v-6e5f249a] {\n  background-color: ghostwhite;\n  display: flex;\n  align-items: center;\n  overflow-x: auto;\n  overflow-y: hidden;\n  height: 100%;\n  border: 2px solid #014;\n  box-sizing: border-box;\n  border-top: 0;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n#marisa-preview-thumbnails-area > li[data-v-6e5f249a] {\n  margin: 0 10px;\n  display: inline-flex;\n}\n#marisa-preview-thumbnails-area > li > a[data-v-6e5f249a] {\n  cursor: pointer;\n  display: inline-flex;\n  border: 3px solid transparent;\n}\n#marisa-preview-thumbnails-area > li > a.current-preview[data-v-6e5f249a] {\n  border: 3px solid palevioletred;\n}\n#marisa-preview-thumbnails-area > li > a > img[data-v-6e5f249a] {\n  max-height: 100px;\n  box-sizing: border-box;\n  display: inline-block;\n}\n", map: {"version":3,"sources":["/home/flandre/dev/Patchouli/src/components/CoverLayer.vue"],"names":[],"mappings":";AAgRA;EACA,wBAAA;EACA,gBAAA;EACA,aAAA;EACA,YAAA;EACA,WAAA;EACA,OAAA;EACA,QAAA;EACA,cAAA;EACA,oBAAA;EACA,wBAAA;CACA;AACA;;EAEA,iBAAA;EACA,kBAAA;EACA,uBAAA;CACA;AACA;EACA,cAAA;EACA,kBAAA;EACA,cAAA;EACA,oBAAA;EACA,gBAAA;EACA,oBAAA;CACA;AACA;EACA,eAAA;EACA,sBAAA;CACA;AACA;EACA,mBAAA;CACA;AACA;EACA,gBAAA;CACA;AACA;EACA,mBAAA;EACA,cAAA;CACA;AACA;EACA,cAAA;CACA;AACA;EACA,uBAAA;EACA,QAAA;EACA,aAAA;EACA,gBAAA;EACA,aAAA;CACA;AACA;EACA,WAAA;EACA,aAAA;EACA,uBAAA;EACA,cAAA;EACA,gDAAA;CACA;AACA;EACA,0BAAA;EACA,uBAAA;EACA,mBAAA;CACA;AACA;;EAEA,qBAAA;EACA,aAAA;EACA,wBAAA;EACA,oBAAA;CACA;AACA;;EAEA,oBAAA;EACA,gBAAA;EACA,iBAAA;CACA;AACA;EACA,6BAAA;EACA,cAAA;EACA,oBAAA;EACA,iBAAA;EACA,mBAAA;EACA,aAAA;EACA,uBAAA;EACA,uBAAA;EACA,cAAA;EACA,UAAA;EACA,WAAA;EACA,iBAAA;CACA;AACA;EACA,eAAA;EACA,qBAAA;CACA;AACA;EACA,gBAAA;EACA,qBAAA;EACA,8BAAA;CACA;AACA;EACA,gCAAA;CACA;AACA;EACA,kBAAA;EACA,uBAAA;EACA,sBAAA;CACA","file":"CoverLayer.vue","sourcesContent":["<template>\n  <div\n    v-show=\"xmode\"\n    ref=\"coverLayerRoot\"\n    :id=\"id\"\n    tabindex=\"0\"\n    @keyup=\"jumpByKeyup\"\n    @click.left=\"clickBase\"\n    @scroll.stop.prevent=\"0\"\n    @wheel.stop.prevent=\"jumpByWheel\">\n    <div\n      v-show=\"xmode === 'config'\"\n      id=\"marisa-config-mode\"\n      @click.stop=\"0\">\n      <a id=\"config-context-menu-switch\" @click.left=\"clickSwitch\">\n        <a\n          v-show=\"xc.contextMenu\"\n          id=\"config-context-menu-switch-on\"\n          role=\"button\">\n          <i class=\"fas fa-toggle-on\"/>\n        </a>\n        <a\n          v-show=\"!xc.contextMenu\"\n          id=\"config-context-menu-switch-off\"\n          role=\"button\">\n          <i class=\"fas fa-toggle-off\"/>\n        </a>\n        <span id=\"config-context-menu-label\">{{ $t('config.contextMenuExtension') }}</span>\n      </a>\n      <a id=\"config-user-tooltip-switch\" @click.left=\"clickSwitch\">\n        <a\n          v-show=\"xc.userTooltip\"\n          id=\"config-user-tooltip-switch-on\"\n          role=\"button\">\n          <i class=\"fas fa-toggle-on\"/>\n        </a>\n        <a\n          v-show=\"!xc.userTooltip\"\n          id=\"config-user-tooltip-switch-off\"\n          role=\"button\">\n          <i class=\"fas fa-toggle-off\"/>\n        </a>\n        <span id=\"config-user-tooltip-label\">{{ $t('config.userTooltip') }}</span>\n      </a>\n      <a id=\"config-hover-play-switch\" @click.left=\"clickSwitch\">\n        <a\n          v-show=\"xc.hoverPlay\"\n          id=\"config-hover-play-switch-on\"\n          role=\"button\">\n          <i class=\"fas fa-toggle-on\"/>\n        </a>\n        <a\n          v-show=\"!xc.hoverPlay\"\n          id=\"config-hover-play-switch-off\"\n          role=\"button\">\n          <i class=\"fas fa-toggle-off\"/>\n        </a>\n        <span id=\"config-hover-play-label\">{{ $t('config.hoverPlay') }}</span>\n      </a>\n      <a id=\"marisa-config-blacklist-label\">\n        <i class=\"far fa-eye-slash\"/>{{ $t('config.blacklist') }}\n      </a>\n      <textarea\n        id=\"marisa-config-blacklist-textarea\"\n        ref=\"blacklistTextarea\"\n        :value=\"xc.blacklist.join('\\n')\"\n        spellcheck=\"false\"\n        rows=\"5\"/>\n    </div>\n    <div\n      v-show=\"xmode === 'preview'\"\n      id=\"marisa-preview-mode\"\n      @click.stop=\"0\">\n      <div id=\"marisa-preview-display-area\">\n        <a\n          v-show=\"!previewUgoiraMetaData\"\n          :href=\"previewSrcList[previewCurrentIndex]\"\n          target=\"_blank\">\n          <img :src=\"previewSrcList[previewCurrentIndex]\">\n        </a>\n        <div v-show=\"!!previewUgoiraMetaData\">\n          <canvas v-show=\"previewCurrentIndex === 0\" ref=\"previewUgoiraCanvas\"/>\n          <canvas v-show=\"previewCurrentIndex === 1\" ref=\"previewOriginalUgoiraCanvas\"/>\n        </div>\n      </div>\n      <ul v-show=\"previewSrcList.length > 1\" id=\"marisa-preview-thumbnails-area\">\n        <li v-for=\"(pSrc, index) in previewSrcList\" :key=\"pSrc\">\n          <a\n            :class=\"(index === previewCurrentIndex) ? 'current-preview' : ''\"\n            @click.left=\"jumpTo(index)\" >\n            <img :src=\"pSrc\">\n          </a>\n        </li>\n      </ul>\n    </div>\n  </div>\n</template>\n\n<script>\nimport { PixivAPI } from '../lib/pixiv';\nimport { $print, toInt } from '../lib/utils';\n\nexport default {\n  props: {\n    id: {\n      default: '',\n      type: String,\n    },\n  },\n  // eslint-disable-next-line sort-keys\n  data() {\n    return {\n      previewCurrentIndex: 0,\n      previewSrcList: [],\n      previewUgoiraMetaData: null,\n      ugoiraPlayers: [],\n    };\n  },\n  // eslint-disable-next-line sort-keys\n  computed: {\n    // vue'x' 'c'onfig\n    xc() {\n      return this.$store.getters.config;\n    },\n    xdata() {\n      return this.$store.getters['coverLayer/data'];\n    },\n    xmode() {\n      return this.$store.getters['coverLayer/mode'];\n    },\n  },\n  watch: {\n    async xmode(value) {\n      $print.debug('watch xmode change:', value);\n\n      if (value === 'preview') {\n        const imageItem = this.xdata;\n        if (imageItem.isUgoira) {\n          this.previewUgoiraMetaData = await PixivAPI.getIllustUgoiraMetaData(\n            imageItem.illustId\n          );\n          this.initZipImagePlayer();\n          this.previewSrcList.push(imageItem.urls.thumb);\n          this.previewSrcList.push(imageItem.urls.original);\n        } else if (imageItem.illustPageCount > 1) {\n          const indexArray = Array.from(\n            Array(imageItem.illustPageCount).keys()\n          );\n          const srcs = indexArray.map(idx =>\n            imageItem.urls.original.replace('p0', `p${idx}`)\n          );\n          this.previewSrcList.push(...srcs);\n        } else {\n          this.previewSrcList.push(imageItem.urls.original);\n        }\n      } else if (!value) {\n        this.previewSrcList.length = 0;\n        this.previewCurrentIndex = 0;\n        this.previewUgoiraMetaData = null;\n        this.ugoiraPlayers.forEach(player => player.stop());\n        this.ugoiraPlayers.length = 0;\n      }\n    },\n  },\n  // eslint-disable-next-line sort-keys\n  updated() {\n    if (this.xmode === 'preview') {\n      this.$refs.coverLayerRoot.focus();\n    }\n  },\n  // eslint-disable-next-line sort-keys\n  methods: {\n    clickBase(event) {\n      $print.debug('CoverLayer#clickBase: event', event);\n      this.$store.commit('coverLayer/close');\n\n      const blacklist = [\n        ...new Set(\n          this.$refs.blacklistTextarea.value\n            .split('\\n')\n            .map(s => s.trim())\n            .filter(Boolean)\n        ),\n      ];\n\n      blacklist.sort((a, b) => a - b);\n\n      this.$store.commit('setConfig', { blacklist });\n      this.$store.commit('saveConfig');\n    },\n    clickSwitch(event) {\n      $print.debug('CoverLayer#clickSwitch: event', event);\n\n      if (event.currentTarget.id === 'config-context-menu-switch') {\n        this.xc.contextMenu = toInt(!this.xc.contextMenu);\n      }\n\n      if (event.currentTarget.id === 'config-user-tooltip-switch') {\n        this.xc.userTooltip = toInt(!this.xc.userTooltip);\n      }\n\n      if (event.currentTarget.id === 'config-hover-play-switch') {\n        this.xc.hoverPlay = toInt(!this.xc.hoverPlay);\n      }\n    },\n    initZipImagePlayer() {\n      const meta = this.previewUgoiraMetaData;\n      // resize as clear\n      this.$refs.previewOriginalUgoiraCanvas.width = 0;\n      this.$refs.previewUgoiraCanvas.width = 0;\n\n      const opt = {\n        autoStart: true,\n        autosize: true,\n        canvas: this.$refs.previewUgoiraCanvas,\n        chunkSize: 300000,\n        loop: true,\n        metadata: meta,\n        source: meta.src,\n      };\n\n      this.ugoiraPlayers.push(new ZipImagePlayer(opt));\n\n      this.ugoiraPlayers.push(\n        new ZipImagePlayer(\n          Object.assign({}, opt, {\n            canvas: this.$refs.previewOriginalUgoiraCanvas,\n            source: meta.originalSrc,\n          })\n        )\n      );\n    },\n    jumpByKeyup(event) {\n      $print.debug('CoverLayer#jumpByKeyup: event', event);\n\n      if (this.xmode === 'preview') {\n        if (event.key === 'ArrowLeft') {\n          this.jumpPrev();\n        } else if (event.key === 'ArrowRight') {\n          this.jumpNext();\n        }\n      }\n    },\n    jumpByWheel(event) {\n      $print.debug('CoverLayer#jumpByWheel: event', event);\n\n      if (this.xmode === 'preview') {\n        if (event.deltaY < 0) {\n          this.jumpPrev();\n        } else if (event.deltaY > 0) {\n          this.jumpNext();\n        }\n      }\n    },\n    jumpNext() {\n      const t = this.previewSrcList.length;\n      const c = this.previewCurrentIndex;\n      this.jumpTo((c + 1) % t);\n    },\n    jumpPrev() {\n      const t = this.previewSrcList.length;\n      const c = this.previewCurrentIndex;\n      this.jumpTo((c + t - 1) % t);\n    },\n    jumpTo(index) {\n      this.previewCurrentIndex = index;\n    },\n  },\n};\n</script>\n\n<style scoped>\n#Marisa {\n  background-color: #000a;\n  position: fixed;\n  height: 100%;\n  width: 100%;\n  z-index: 5;\n  top: 0;\n  left: 0;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n#marisa-config-mode,\n#marisa-preview-mode {\n  min-width: 100px;\n  min-height: 100px;\n  background-color: #eef;\n}\n#marisa-config-mode {\n  display: flex;\n  flex-flow: column;\n  padding: 10px;\n  border-radius: 10px;\n  font-size: 18px;\n  white-space: nowrap;\n}\n#marisa-config-mode a {\n  color: #00186c;\n  text-decoration: none;\n}\n#marisa-config-mode [id$=\"switch\"] {\n  text-align: center;\n}\n#marisa-config-mode [id$=\"switch\"]:hover {\n  cursor: pointer;\n}\n#marisa-config-mode [id$=\"label\"] {\n  text-align: center;\n  margin: 0 5px;\n}\n#marisa-config-blacklist-label > .fa-eye-slash {\n  margin: 0 4px;\n}\n#marisa-config-blacklist-textarea {\n  box-sizing: border-box;\n  flex: 1;\n  resize: none;\n  font-size: 11pt;\n  height: 90px;\n}\n#marisa-preview-mode {\n  width: 70%;\n  height: 100%;\n  box-sizing: border-box;\n  display: grid;\n  grid-template-rows: minmax(0, auto) max-content;\n}\n#marisa-preview-display-area {\n  border: 2px #00186c solid;\n  box-sizing: border-box;\n  text-align: center;\n}\n#marisa-preview-display-area > a,\n#marisa-preview-display-area > div {\n  display: inline-flex;\n  height: 100%;\n  justify-content: center;\n  align-items: center;\n}\n#marisa-preview-display-area > a > img,\n#marisa-preview-display-area > div > canvas {\n  object-fit: contain;\n  max-width: 100%;\n  max-height: 100%;\n}\n#marisa-preview-thumbnails-area {\n  background-color: ghostwhite;\n  display: flex;\n  align-items: center;\n  overflow-x: auto;\n  overflow-y: hidden;\n  height: 100%;\n  border: 2px solid #014;\n  box-sizing: border-box;\n  border-top: 0;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n#marisa-preview-thumbnails-area > li {\n  margin: 0 10px;\n  display: inline-flex;\n}\n#marisa-preview-thumbnails-area > li > a {\n  cursor: pointer;\n  display: inline-flex;\n  border: 3px solid transparent;\n}\n#marisa-preview-thumbnails-area > li > a.current-preview {\n  border: 3px solid palevioletred;\n}\n#marisa-preview-thumbnails-area > li > a > img {\n  max-height: 100px;\n  box-sizing: border-box;\n  display: inline-block;\n}\n</style>\n"]}, media: undefined });
    };
    const __vue_scope_id__$c = "data-v-6e5f249a";
    const __vue_module_identifier__$c = undefined;
    const __vue_is_functional_template__$c = false;
    function __vue_normalize__$c(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "/home/flandre/dev/Patchouli/src/components/CoverLayer.vue";
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
    function __vue_create_injector__$c() {
      const head = document.head || document.getElementsByTagName('head')[0];
      const styles = __vue_create_injector__$c.styles || (__vue_create_injector__$c.styles = {});
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
    var coverLayer$1 = __vue_normalize__$c(
      { render: __vue_render__$c, staticRenderFns: __vue_staticRenderFns__$c },
      __vue_inject_styles__$c,
      __vue_script__$c,
      __vue_scope_id__$c,
      __vue_is_functional_template__$c,
      __vue_module_identifier__$c,
      __vue_create_injector__$c,
      undefined
    );
  if (unsafeWindow) {
    const { globalInitData, pixiv } = unsafeWindow;
    const { DataView, ArrayBuffer } = unsafeWindow;
    Object.assign(window, {
      ArrayBuffer,
      DataView,
      globalInitData,
      pixiv,
    });
  }
  vuexStore.dispatch('init')
    .then(() => {
      if (vuexStore.getters.MPT === MAIN_PAGE_TYPE.NO_SUPPORT) {
        return;
      }
      removeAnnoyings();
      const fontawesome = $el('link', {
        crossOrigin: 'anonymous',
        href: 'https://use.fontawesome.com/releases/v5.2.0/css/all.css',
        integrity: 'sha384-hWVjflwFxL6sNzntih27bfxkr27PmbbK/iSvJ+a4+0owXq79v+lsFkW54bOGbiDQ',
        rel: 'stylesheet',
      });
      document.head.appendChild(fontawesome);
      if (vuexStore.getters['pixiv/nppType'] < 0) {
        $('._global-header').classList.add('koakuma-placeholder');
      }
      const Koakuma = new Vue({
        i18n,
        store: vuexStore,
        data: {
          name: 'Koakuma',
        },
        computed: {
          currentLocale() {
            return this.$store.getters.locale;
          },
        },
        watch: {
          currentLocale(newValue) {
            this.$i18n.locale = newValue;
          },
        },
        render(h) {
          return h(ctrlPanel, { props: { id: this.name } });
        },
      });
      const Patchouli = new Vue({
        i18n,
        store: vuexStore,
        data: {
          name: 'Patchouli',
        },
        computed: {
          currentLocale() {
            return this.$store.getters.locale;
          },
        },
        watch: {
          currentLocale(newValue) {
            this.$i18n.locale = newValue;
          },
        },
        render(h) {
          return h(mainView, { props: { id: this.name } });
        },
      });
      const Marisa = new Vue({
        i18n,
        store: vuexStore,
        data: {
          name: 'Marisa',
        },
        computed: {
          currentLocale() {
            return this.$store.getters.locale;
          },
        },
        watch: {
          currentLocale(newValue) {
            this.$i18n.locale = newValue;
          },
        },
        render(h) {
          return h(coverLayer$1, { props: { id: this.name } });
        },
      });
      vuexStore.dispatch('pixiv/start', { isFirst: true, times: 1 })
        .then(() => {
          Patchouli.$mount(vuexStore.getters.mountPointMainView);
          Koakuma.$mount(vuexStore.getters.mountPointCtrlPanel);
          Marisa.$mount(vuexStore.getters.mountPointCoverLayer);
          vuexStore.commit('applyConfig');
          if (vuexStore.getters['pixiv/nppType'] < 0) {
            $('._global-header').classList.remove('koakuma-placeholder');
          }
          return vuexStore.getters['pixiv/status'];
        })
        .catch(error => {
          $print.error('main#init: Fail to first mount', error);
        })
        .then(async(status) => {
          const nppType = vuexStore.getters['pixiv/nppType'];
          if (nppType >= 0) {
            await vuexStore.dispatch('pixiv/delayFirstStart', { actionName: 'startMovingWindowBased', options: { rest: 'hide', times: 1 } });
            if (nppType === 2) {
              await vuexStore.dispatch('pixiv/delayFirstStart', { actionName: 'startPrefetchBased', options: { pool: 'illusts', times: 1 } });
              await vuexStore.dispatch('pixiv/delayFirstStart', { actionName: 'startMovingWindowBased', options: { rest: 'show', times: 1 } });
            } else if (nppType === 3) {
              await vuexStore.dispatch('pixiv/delayFirstStart', { actionName: 'startPrefetchBased', options: { pool: 'illusts', times: 1 } });
              await vuexStore.dispatch('pixiv/delayFirstStart', { actionName: 'startPrefetchBased', options: { pool: 'manga', times: 1 } });
            } else {
              await vuexStore.dispatch('pixiv/delayFirstStart', { actionName: 'startPrefetchBased', options: { pool: 'manga', times: 1 } });
              await vuexStore.dispatch('pixiv/delayFirstStart', { actionName: 'startMovingWindowBased', options: { rest: 'show', times: 1 } });
            }
          }
          if (status.isEnded) {
            vuexStore.commit('pixiv/stop');
          } else {
            vuexStore.commit('pixiv/relive');
          }
        });
      document.body.addEventListener('click', (event) => {
        const koakuma = Koakuma.$children[0];
        if (!$parents(event.target).find((el) => el.id === 'koakuma-bookmark-input-usual-switch')) {
          koakuma.usualSwitchOn = false;
        }
        if (!$parents(event.target).find((el) => el.id === 'koakuma-sorting-order-select-switch')) {
          koakuma.sortingOrderSwitchOn = false;
        }
        if (vuexStore.getters['contextMenu/active']) {
          vuexStore.commit('contextMenu/deactivate');
        }
      });
      Object.assign(unsafeWindow, {
        Koakuma,
        Marisa,
        Patchouli,
        vuexStore,
      });
    })
    .catch($print.error);

}(Vue,VueI18n,Vuex));
