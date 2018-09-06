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
// @version           4.2.0-alpha.19
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

  __$styleInject("._global-header {\n  z-index: 4;\n  position: relative;\n}\n._global-header .ui-search {\n  z-index: auto;\n}\n._global-header.koakuma-placeholder {\n  /* I don't know why #koakuma just 32px\n     but it should preserve 42px to keep all spacing correct */\n  margin-bottom: 42px;\n}\nul.menu-items > li.current > a {\n  color: black;\n  font-weight: bold;\n  text-decoration: none;\n}\n#toolbar-items {\n  z-index: 5;\n}\n.ω {\n  display: flex;\n  flex-flow: row wrap;\n  justify-content: center;\n  position: relative;\n}\n.ω,\n.ω .layout-a,\n.ω .layout-body {\n  transition: width 0.2s;\n}\n.ω.↔,\n.ω.↔ .layout-a,\n.ω.↔ .layout-body {\n  width: 100% !important;\n}\n.ω.↔ .layout-a {\n  display: flex;\n  flex-direction: row-reverse;\n}\n.ω.↔ .layout-column-2 {\n  flex: 1;\n  margin-left: 20px;\n}\n.ω.↔ .layout-body,\n.ω.↔ .layout-a {\n  margin: 10px 20px;\n}\n\n/* annoyings, ref: lib/pixiv.js */\n\niframe,\n/* Ad */\n.ad,\n.ads_area,\n.ad-footer,\n.ads_anchor,\n.ads-top-info,\n.comic-hot-works,\n.user-ad-container,\n.ads_area_no_margin,\n/* Premium */\n.hover-item,\n.ad-printservice,\n.bookmark-ranges,\n.require-premium,\n.showcase-reminder,\n.sample-user-search,\n.popular-introduction,\n._premium-lead-tag-search-bar,\n._premium-lead-popular-d-body,\n._premium-lead-promotion-banner {\n  display: none !important;\n}\n\n:root {\n  --new-default-image-item-square-size: 184px;\n  --default-image-item-image-square-size: 200px;\n  --loading-icon-size: 72px;\n  --loading-icon-color: #0096fa;\n}\n\n/* dotted focus */\na::-moz-focus-inner,\nbutton::-moz-focus-inner {\n  border: 0 !important;\n  outline: 0 !important;\n}\na:focus,\nbutton:focus {\n  outline: 0 !important;\n}\n");

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
  const NPP_TYPE_COUNT = 5;
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
  const toFormUrlencoded = (o) => {
    return new URLSearchParams(o).toString();
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
      sortByBookmarkId: 'sort by bookmark id',
      sortByDate: 'sort by date',
      sortByPopularity: 'sort by popularity',
      tagFilterQueryPlaceholder: 'tags filter example: flandre || sister',
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
      sortByBookmarkId: 'ブックマーク順',
      sortByDate: '投稿順',
      sortByPopularity: '人気順',
      tagFilterQueryPlaceholder: 'タグフィルター 例: フランドール || 妹様',
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
      sortByBookmarkId: '以加入顺序排序',
      sortByDate: '以日期排序',
      sortByPopularity: '以人气排序',
      tagFilterQueryPlaceholder: '标签过滤 例: 芙兰朵露 || 二小姐',
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
      sortByBookmarkId: '以加入順序排序',
      sortByDate: '以日期排序',
      sortByPopularity: '以人氣排序',
      tagFilterQueryPlaceholder: '標籤過濾 例: 芙蘭朵露 || 二小姐',
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
  const DEFAULT_MATCH = true;
  const isString = (s) => typeof(s) === 'string';
  const isFunction = (s) => typeof(s) === 'function';
  const isOrOp = (s) => s === ' || ';
  const isAndOp = (s) => s === ' && ';
  const isCondOp = (s) => isOrOp(s) || isAndOp(s);
  const isGroupExpr = (s) => isString(s) && (/^{.*}$/).test(s);
  const isPartialExclusionExpr = (s) => isString(s) && (/^-[^-].*$/).test(s);
  const isPartialInclusionExpr = (s) => isString(s) && (/^[+]?.*$/).test(s);
  const defaultFunc = () => DEFAULT_MATCH;
  const isMatched = (ruleStr, targetStr) => {
    const rule = ruleStr.toLowerCase();
    const target = targetStr.toLowerCase();
    return makeRuleFunc(rule, target)();
  };
  const makeRuleFunc = (rule, target) => {
    if (isString(rule)) {
      const rtoks = rule.trim().match(/(\{.*?\}| ([|]{2}|[&]{2}) |\S+)/g);
      if (!rtoks) {
        return defaultFunc;
      }
      const tokList = rtoks.map((rtok) => {
        if (isCondOp(rtok)) {
          return rtok;
        } else if (isGroupExpr(rtok)) {
          return makeRuleFunc(rtok.slice(1, -1), target);
        } else if (isPartialExclusionExpr(rtok)) {
          return () => !target.includes(rtok.slice(1));
        } else if (isPartialInclusionExpr(rtok)) {
          return () => target.includes(rtok.replace(/^[+]?(.*)$/, '$1'));
        } else {
          $print.log('tagMatcher#makeRuleFunc: Unknown rtok', rtok);
          return defaultFunc;
        }
      });
      return makeRuleFunc(tokList, target);
    } else {
      const ruleList = rule.map(r => (isString(r) && !isCondOp(r)) ? makeRuleFunc(r, target) : r);
      const funcList = ruleList.filter(isFunction);
      const opList = ruleList.filter(isCondOp);
      if (funcList.length + opList.length !== ruleList.length) {
        $print.log('tagMatcher#makeRuleFunc: Unknown ruleList', ruleList);
        return defaultFunc;
      }
      if (opList.every(isAndOp)) {
        return () => funcList.every(fn => fn());
      } else if (opList.every(isOrOp)) {
        return () => funcList.some(fn => fn());
      } else {
        $print.log('tagMatcher#makeRuleFunc: Mixed condition operators without grouping', ruleList);
        return defaultFunc;
      }
    }
  };
  var tagFilterQuerier = {
    isMatched,
    makeRuleFunc,
  };
  const makeNewTag = (tag) => {
    if (tag.translation) {
      const trs = Object.values(tag.translation);
      return [tag.tag, ...trs].filter(Boolean).join('\x00');
    }
    return [tag.tag, tag.romaji].filter(Boolean).join('\x00');
  };
  const makeLibraryData = ({ illustDataGroup, userDataGroup }) => {
    if (!illustDataGroup || !Object.keys(illustDataGroup).length) {
      return [];
    }
    const library = [];
    for (const [illustId, illustData] of Object.entries(illustDataGroup)) {
      const allTags = illustData.tags.tags.map(makeNewTag).join('\x00');
      const d = {
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
  };
  const state = {
    batchSize: 40,
    defaultStatus: {
      isEnded: false,
      isPaused: true,
    },
    imageItemLibrary: [],
    moveWindowIndex: 0,
    moveWindowPrivateBookmarkIndex: 0,
    nextUrl: location.href,
    nppStatus: {
      isEnded: Array(NPP_TYPE_COUNT).fill(false),
      isPaused: true,
    },
    prefetchPool: {
      illusts: [],
      manga: [],
    },
  };
  const getters = {
    batchSize: (state) => state.batchSize,
    defaultDisplayIndices: (state, getters, rootState, rootGetters) => {
      const clonedLib = state.imageItemLibrary.slice();
      const { sp, filters, config, orderBy } = rootGetters;
      const dateOldFirst = sp.order === 'date';
      const bookmarkEarlyFirst = sp.order === 'asc';
      const isToShow = (d) => {
        return d.bookmarkCount >= filters.limit &&
          tagFilterQuerier.isMatched(filters.query, d.tags) &&
          !config.blacklist.includes(d.userId);
      };
      const shows = [], hides = [];
      for (const [i, d] of clonedLib.entries()) {
        const s = isToShow(d);
        const o = {
          index: i,
          [orderBy]: d[orderBy],
        };
        if (s) {
          shows.push(o);
        } else {
          hides.push(o);
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
      return {
        hides: hides.map(item => item.index),
        shows: shows.map(item => item.index),
      };
    },
    imageItemLibrary: (state) => state.imageItemLibrary,
    nppDisplayIndices: (state, getters, rootState, rootGetters) => {
      const clonedLib = state.imageItemLibrary.slice();
      const { filters, config, orderBy, sp } = rootGetters;
      const { nppType } = getters;
      const isToShow = (d) => {
        const conds = [
          d.bookmarkCount >= filters.limit,
          tagFilterQuerier.isMatched(filters.query, d.tags),
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
          conds.push(d.userId !== sp.id && !d.isPrivateBookmark);
          break;
        case 4:
          conds.push(d.userId !== sp.id && d.isPrivateBookmark);
          break;
        default:
          break;
        }
        return conds.every(Boolean);
      };
      const shows = [], hides = [];
      for (const [i, d] of clonedLib.entries()) {
        const s = isToShow(d);
        const o = {
          index: i,
          [orderBy]: d[orderBy],
        };
        if (s) {
          shows.push(o);
        } else {
          hides.push(o);
        }
      }
      shows.sort((a, b) => {
        const av = toInt(a[orderBy]);
        const bv = toInt(b[orderBy]);
        return bv - av;
      });
      return {
        hides: hides.map(item => item.index),
        shows: shows.map(item => item.index),
      };
    },
    nppType: (state, getters, rootState, rootGetters) => {
      const types = [
        MAIN_PAGE_TYPE.NEW_PROFILE,
        MAIN_PAGE_TYPE.NEW_PROFILE_ILLUST,
        MAIN_PAGE_TYPE.NEW_PROFILE_MANGA,
        MAIN_PAGE_TYPE.NEW_PROFILE_BOOKMARK,
      ];
      const loginId = rootGetters.loginData.id;
      const uid = rootGetters.sp.id;
      const rest = rootGetters.sp.rest;
      const mpt = rootGetters.MPT;
      const isSelfPrivateBookmarkPage = mpt === MAIN_PAGE_TYPE.NEW_PROFILE_BOOKMARK && loginId === uid && rest === 'hide';
      if (isSelfPrivateBookmarkPage) {
        return types.length;
      }
      return types.indexOf(mpt);
    },
    status: (state, getters) => {
      if (getters.nppType >= 0) {
        return {
          isEnded: state.nppStatus.isEnded[getters.nppType],
          isPaused: state.nppStatus.isPaused,
        };
      } else {
        return state.defaultStatus;
      }
    },
  };
  const mutations = {
    editImgItem: (state, payload = {}) => {
      const DEFAULT_OPT = {
        illustId: '',
        type: null,
        userId: '',
      };
      const opt = Object.assign({}, DEFAULT_OPT, payload);
      if (opt.type === 'follow-user' && opt.userId) {
        state.imageItemLibrary
          .filter(i => i.userId === opt.userId)
          .forEach(i => {
            i.isFollowed = true;
          });
      }
    },
    setStatus: (state, { nppType = -1, isPaused, isEnded }) => {
      if (nppType >= 0) {
        if (isPaused !== undefined) {
          state.nppStatus.isPaused = isPaused;
        }
        if (isEnded !== undefined) {
          state.nppStatus.isEnded[nppType] = isEnded;
        }
      } else {
        if (isPaused !== undefined) {
          state.defaultStatus.isPaused = isPaused;
        }
        if (isEnded !== undefined) {
          state.defaultStatus.isEnded = isEnded;
        }
      }
    },
  };
  const actions = {
    pause: ({ commit, getters }) => {
      commit('setStatus', { isPaused: true,  nppType: getters.nppType });
    },
    relive: ({ commit, getters }) => {
      commit('setStatus', { isEnded: false,  nppType: getters.nppType });
    },
    resume: ({ commit, getters }) => {
      commit('setStatus', { isPaused: false,  nppType: getters.nppType });
    },
    start: async({ state, dispatch, getters, rootGetters }, { times = Infinity, force = false, isFirst = false } = {}) => {
      await dispatch('resume');
      if (force) {
        await dispatch('relive');
      }
      if (getters.status.isEnded || times <= 0) {
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
    startMovingWindowBased: async({ state, dispatch, getters, rootGetters }, { times = Infinity, rest = null } = {}) => {
      while (!getters.status.isPaused && !getters.status.isEnded && times) {
        let illustIds = [], maxTotal = Infinity;
        const _rest = rest || rootGetters.sp.rest;
        const _uid = rootGetters.sp.id;
        let cIndex = (_rest === 'show') ? state.moveWindowIndex : state.moveWindowPrivateBookmarkIndex;
        if (getters.nppType >= 0) {
          const opt = { limit: getters.batchSize, offset: cIndex, rest: _rest };
          const { works, total } = await PixivAPI.getUserBookmarkData(_uid, opt);
          if (!works) {
            await dispatch('stop');
            break;
          }
          maxTotal = total;
          illustIds.push(...works.map((d) => d.id));
        }
        cIndex += getters.batchSize;
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
          await dispatch('pause');
        }
        if (cIndex > maxTotal) {
          await dispatch('stop');
        }
      }
    },
    startNextUrlBased: async({ state, dispatch, getters, rootGetters }, { times = Infinity } = {}) => {
      while (!getters.status.isPaused && !getters.status.isEnded && times) {
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
          await dispatch('pause');
        }
        if (!state.nextUrl) {
          await dispatch('stop');
        }
      }
    },
    startPrefetchBased: async({ state, dispatch, getters }, { times = Infinity, pool = 'all' } = {}) => {
      const pPool = state.prefetchPool;
      let todoPool = [];
      if (pool === 'all') {
        todoPool.push(...pPool.illusts);
        todoPool.push(...pPool.manga);
      } else {
        todoPool.push(...pPool[pool]);
      }
      while (!getters.status.isPaused && !getters.status.isEnded && times) {
        if (!todoPool.length) {
          await dispatch('stop');
        }
        const illustIds = todoPool.splice(0, getters.batchSize);
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
          await dispatch('pause');
        }
        if (!todoPool.length) {
          await dispatch('stop');
        }
      }
    },
    stop: ({ commit, getters }) => {
      commit('setStatus', { isEnded: true, isPaused: true,  nppType: getters.nppType });
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
    activate: (state, payload) => {
      state.active = true;
      state.position = payload.position;
      state.data = payload.data;
    },
    deactivate: (state) => {
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
      query: '',
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
      const _sbp = _isSelfBookmarkPage(state.mainPageType, state.loginData.id, state.searchParam.id);
      if (_sbp) {
        state.config.sort = SORT_TYPE.BOOKMARK_ID;
      } else if (state.config.sort === SORT_TYPE.BOOKMARK_ID) {
        state.config.sort = SORT_TYPE.ILLUST_ID;
      }
      if (state.mainPageType === MAIN_PAGE_TYPE.SELF_BOOKMARK) {
        for (const marker of $$('.js-legacy-mark-all, .js-legacy-unmark-all')) {
          marker.addEventListener('click', () => {
            $$('input[name="book_id[]"]').forEach(el => {
              el.checked = marker.classList.contains('js-legacy-mark-all');
            });
          });
        }
        const sp = state.searchParam;
        if (sp.order && sp.order.includes('date')) {
          state.config.sort = SORT_TYPE.ILLUST_ID;
        } else {
          state.config.sort = SORT_TYPE.BOOKMARK_ID;
        }
      }
      removeAnnoyings();
      const fontawesome = $el('link', {
        crossOrigin: 'anonymous',
        href: 'https://use.fontawesome.com/releases/v5.2.0/css/all.css',
        integrity: 'sha384-hWVjflwFxL6sNzntih27bfxkr27PmbbK/iSvJ+a4+0owXq79v+lsFkW54bOGbiDQ',
        rel: 'stylesheet',
      });
      document.head.appendChild(fontawesome);
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
      } else {
        const path = location.pathname;
        const sp = state.searchParam;
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
          if (sp.mode) {
            state.mainPageType = MAIN_PAGE_TYPE.NO_SUPPORT;
            break;
          }
          if (sp.type === 'manga') {
            state.mainPageType = MAIN_PAGE_TYPE.NEW_PROFILE_MANGA;
          } else if (sp.type === 'illust') {
            state.mainPageType = MAIN_PAGE_TYPE.NEW_PROFILE_ILLUST;
          } else {
            state.mainPageType = MAIN_PAGE_TYPE.NEW_PROFILE;
          }
          break;
        case '/bookmark.php': {
          if (sp.rest && sp.id) {
            state.mainPageType =  MAIN_PAGE_TYPE.NEW_PROFILE_BOOKMARK;
          } else if (sp.type === 'user' || sp.type === 'reg_user') {
            state.mainPageType = MAIN_PAGE_TYPE.NO_SUPPORT;
          } else {
            state.mainPageType = MAIN_PAGE_TYPE.SELF_BOOKMARK;
          }
          break;
        }
        default:
          state.mainPageType = MAIN_PAGE_TYPE.NO_SUPPORT;
          break;
        }
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
      if (state.mainPageType !== MAIN_PAGE_TYPE.NO_SUPPORT) {
        commit('loadConfig');
        await dispatch('setMountPoints');
        commit('afterInit');
        commit('applyConfig');
        commit('saveConfig');
      }
    },
    setMountPoints: async({ state, getters }) => {
      $$('#wrapper').forEach(el => el.classList.add('ω'));
      state.mountPointCoverLayer = $el('div', null, (el) => {
        document.body.appendChild(el);
      });
      state.mountPointCtrlPanel = $el('div', null, async(el) => {
        if (getters['pixiv/nppType'] >= 0) {
          await $ready(() => $('.sLHPYEz'));
          $('.sLHPYEz').parentNode.insertAdjacentElement('afterend', el);
        } else {
          $('header._global-header').insertAdjacentElement('afterend', el);
        }
        state.ctrlPanelOffsetY = el.getBoundingClientRect().y;
      });
      switch (state.mainPageType) {
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
      processedCountMsg() {
        const rootGetters = this.$store.getters;
        const isNewProfilePage = rootGetters['pixiv/nppType'] >= 0;
        let indices = null;
        if (isNewProfilePage) {
          indices = rootGetters['pixiv/nppDisplayIndices'];
        } else {
          indices = rootGetters['pixiv/defaultDisplayIndices'];
        }
        const { shows, hides } = indices;
        return `${shows.length} / ${shows.length + hides.length}`;
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
          this.$store.dispatch('pixiv/pause');
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
            query: event.target.value,
          });
        }, 1500);
      },
    },
  };
              const __vue_script__ = script;
  var __vue_render__ = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{ref:_vm.id,attrs:{"id":_vm.id}},[_c('div',{staticClass:"koakuma-block",attrs:{"id":"koakuma-processed-block"}},[_vm._v(_vm._s(_vm.processedCountMsg))]),_vm._v(" "),_c('div',{staticClass:"koakuma-block",attrs:{"id":"koakuma-bookmark-sort-block"}},[_c('label',{attrs:{"id":"koakuma-bookmark-sort-label","for":"koakuma-bookmark-sort-input"}},[_c('span',[_vm._v("❤️")]),_vm._v(" "),_c('input',{attrs:{"id":"koakuma-bookmark-sort-input","type":"number","min":"0","step":"1"},domProps:{"value":_vm.filters.limit},on:{"wheel":function($event){$event.stopPropagation();$event.preventDefault();return _vm.sortInputWheel($event)},"input":_vm.sortInputInput}})]),_vm._v(" "),_c('a',{attrs:{"id":"koakuma-bookmark-input-usual-switch","role":"button"},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }_vm.usualSwitchOn = !_vm.usualSwitchOn;}}},[_c('i',{staticClass:"fas fa-angle-down"})]),_vm._v(" "),_c('ul',{directives:[{name:"show",rawName:"v-show",value:(_vm.usualSwitchOn),expression:"usualSwitchOn"}],attrs:{"id":"koakuma-bookmark-input-usual-list"}},_vm._l((_vm.usualList),function(usual){return _c('li',{key:usual},[_c('span',{staticClass:"sort-order-apply-indicator"},[_vm._v("⮬")]),_vm._v(" "),_c('a',{staticClass:"usual-list-link",attrs:{"role":"button"},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }return _vm.clickUsual($event)}}},[_vm._v(_vm._s(usual))])])}))]),_vm._v(" "),_c('div',{staticClass:"koakuma-block"},[_c('input',{attrs:{"id":"koakuma-bookmark-tags-filter-input","placeholder":_vm.$t('ctrlPanel.tagFilterQueryPlaceholder'),"type":"text"},on:{"input":_vm.tagsFilterInput}})]),_vm._v(" "),_c('div',{staticClass:"koakuma-block"},[_c('button',{class:_vm.statusClass,attrs:{"id":"koakuma-main-button","disabled":_vm.status.isEnded},on:{"mouseup":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }return _vm.clickMainButton($event)}}},[_vm._v("\n      "+_vm._s(_vm.buttonMsg)+"\n    ")])]),_vm._v(" "),_c('div',{staticClass:"koakuma-block",attrs:{"id":"koakuma-sorting-order-block"}},[_c('a',{attrs:{"id":"koakuma-sorting-order-select-switch","role":"button"},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }_vm.sortingOrderSwitchOn = !_vm.sortingOrderSwitchOn;}}},[_c('output',{attrs:{"id":"koakuma-sorting-order-select-output"},domProps:{"innerHTML":_vm._s(_vm.sortingOrderMsg)}}),_vm._v(" "),_c('i',{staticClass:"fas fa-angle-down"})]),_vm._v(" "),_c('ul',{directives:[{name:"show",rawName:"v-show",value:(_vm.sortingOrderSwitchOn),expression:"sortingOrderSwitchOn"}],attrs:{"id":"koakuma-sorting-order-select-list"}},[_c('li',[_c('span',{staticClass:"sort-order-apply-indicator"},[_vm._v("⮬")]),_vm._v(" "),_c('a',{staticClass:"sorting-order-link",attrs:{"id":"koakuma-sorting-order-by-popularity","role":"button"},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }return _vm.clickSortingOrder($event)}}},[_vm._v(_vm._s(_vm.$t('ctrlPanel.sortByPopularity')))])]),_vm._v(" "),_c('li',[_c('span',{staticClass:"sort-order-apply-indicator"},[_vm._v("⮬")]),_vm._v(" "),_c('a',{staticClass:"sorting-order-link",attrs:{"id":"koakuma-sorting-order-by-date","role":"button"},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }return _vm.clickSortingOrder($event)}}},[_vm._v(_vm._s(_vm.$t('ctrlPanel.sortByDate')))])]),_vm._v(" "),_c('li',{directives:[{name:"show",rawName:"v-show",value:(_vm.isSelfBookmarkPage),expression:"isSelfBookmarkPage"}]},[_c('span',{staticClass:"sort-order-apply-indicator"},[_vm._v("⮬")]),_vm._v(" "),_c('a',{staticClass:"sorting-order-link",attrs:{"id":"koakuma-sorting-order-by-bookmark-id","role":"button"},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }return _vm.clickSortingOrder($event)}}},[_vm._v(_vm._s(_vm.$t('ctrlPanel.sortByBookmarkId')))])])])]),_vm._v(" "),_c('div',{staticClass:"koakuma-block",attrs:{"id":"koakuma-options-block"}},[_c('div',[_c('i',{directives:[{name:"show",rawName:"v-show",value:(_vm.xc.fitwidth),expression:"xc.fitwidth"}],staticClass:"fas fa-compress",attrs:{"id":"koakuma-options-width-compress"},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }return _vm.optionsChange($event)}}}),_vm._v(" "),_c('i',{directives:[{name:"show",rawName:"v-show",value:(!_vm.xc.fitwidth),expression:"!xc.fitwidth"}],staticClass:"fas fa-expand",attrs:{"id":"koakuma-options-width-expand"},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }return _vm.optionsChange($event)}}})]),_vm._v(" "),_c('div',[_c('i',{staticClass:"fas fa-cog",attrs:{"id":"koakuma-options-config"},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }return _vm.openCoverLayerInConfigMode($event)}}})])])])};
  var __vue_staticRenderFns__ = [];
    const __vue_inject_styles__ = function (inject) {
      if (!inject) return
      inject("data-v-0ade4ee9_0", { source: "\na[data-v-0ade4ee9]{color:#258fb8;text-decoration:none\n}\na[role=button]>.fa-angle-down[data-v-0ade4ee9]{padding:2px\n}\n#Koakuma[data-v-0ade4ee9]{display:flex;justify-content:center;align-items:center;position:sticky;top:0;z-index:3;background-color:#eef;box-shadow:0 1px 1px #777;padding:4px;color:#00186c;font-size:16px\n}\n.koakuma-block[data-v-0ade4ee9]{margin:0 10px;display:inline-flex\n}\n#koakuma-processed-block[data-v-0ade4ee9]{font-size:18px\n}\n#koakuma-bookmark-sort-label[data-v-0ade4ee9]{display:inline-flex!important;align-items:center;margin-right:0;border-radius:3px 0 0 3px;background-color:#cef;color:#0069b1;margin:0 1px;padding:0 6px\n}\n#koakuma-bookmark-sort-block[data-v-0ade4ee9],#koakuma-sorting-order-block[data-v-0ade4ee9]{position:relative;box-shadow:0 0 1px #069;border-radius:4px\n}\n#koakuma-sorting-order-block[data-v-0ade4ee9]{background-color:#cef\n}\n#koakuma-bookmark-sort-input[data-v-0ade4ee9]{-moz-appearance:textfield;border:none;background-color:transparent;padding:0;color:inherit;font-size:16px;display:inline-block;cursor:ns-resize;text-align:center;max-width:50px\n}\n#koakuma-bookmark-sort-input[data-v-0ade4ee9]::-webkit-inner-spin-button,#koakuma-bookmark-sort-input[data-v-0ade4ee9]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0\n}\n#koakuma-bookmark-tags-filter-input[data-v-0ade4ee9]{margin:0;padding:0 4px;color:#333;font-size:12px;border:1px solid #becad7;height:20px;min-width:300px\n}\n#koakuma-bookmark-tags-filter-input[data-v-0ade4ee9]:focus{background:#ffc;outline:0\n}\n#koakuma-bookmark-input-usual-switch[data-v-0ade4ee9],#koakuma-sorting-order-select-switch[data-v-0ade4ee9]{background-color:#cef;padding:1px;border-left:1px solid #888;border-radius:0 3px 3px 0;cursor:pointer;display:inline-flex;align-items:center\n}\n#koakuma-sorting-order-select-switch[data-v-0ade4ee9]{border:none;border-radius:3px\n}\n#koakuma-bookmark-input-usual-list[data-v-0ade4ee9],#koakuma-sorting-order-select-list[data-v-0ade4ee9]{border-radius:3px;background-color:#cef;box-shadow:0 0 2px #069;position:absolute;top:100%;width:100%;margin-top:1px;list-style:none;padding:0\n}\n#koakuma-sorting-order-select-list[data-v-0ade4ee9]{display:grid;grid-auto-columns:max-content;width:initial\n}\n#koakuma-bookmark-input-usual-list>li[data-v-0ade4ee9],#koakuma-sorting-order-select-list>li[data-v-0ade4ee9]{display:flex;position:relative;line-height:24px\n}\n#koakuma-bookmark-input-usual-list>li[data-v-0ade4ee9]::after,#koakuma-sorting-order-select-list>li[data-v-0ade4ee9]::after{content:\"\";box-shadow:0 0 0 1px #89d8ff;display:inline-block;margin:0;height:0;line-height:0;font-size:0;position:absolute;left:0;right:0;width:100%;transform:scaleX(.8)\n}\n#koakuma-bookmark-input-usual-list>li[data-v-0ade4ee9]:first-child::after,#koakuma-sorting-order-select-list>li[data-v-0ade4ee9]:first-child::after{box-shadow:none\n}\n#koakuma-bookmark-input-usual-list .sort-order-apply-indicator[data-v-0ade4ee9],#koakuma-sorting-order-select-list .sort-order-apply-indicator[data-v-0ade4ee9]{visibility:hidden\n}\n#koakuma-bookmark-input-usual-list .sort-order-apply-indicator[data-v-0ade4ee9]{position:absolute\n}\n#koakuma-bookmark-input-usual-list>li:hover .sort-order-apply-indicator[data-v-0ade4ee9],#koakuma-sorting-order-select-list>li:hover .sort-order-apply-indicator[data-v-0ade4ee9]{visibility:visible\n}\n.sort-order-apply-indicator[data-v-0ade4ee9]{display:block;justify-content:center;align-items:center;font-weight:bolder;padding:0 4px\n}\n.sorting-order-link[data-v-0ade4ee9],.usual-list-link[data-v-0ade4ee9]{display:block;cursor:pointer;text-align:center;flex:1\n}\n.sorting-order-link[data-v-0ade4ee9]{padding-right:18px\n}\n#koakuma-sorting-order-select-output[data-v-0ade4ee9]{padding:0 16px;display:flex;align-items:center\n}\n#koakuma-sorting-order-select[data-v-0ade4ee9]{font-size:14px\n}\n#koakuma-options-block>*[data-v-0ade4ee9]{margin:0 5px\n}\n#koakuma-main-button[data-v-0ade4ee9]{border:none;padding:2px 14px;border-radius:3px;font-size:16px\n}\n#koakuma-main-button[data-v-0ade4ee9]:enabled{transform:translate(-1px,-1px);box-shadow:1px 1px 1px #4c4c4c;cursor:pointer\n}\n#koakuma-main-button[data-v-0ade4ee9]:enabled:hover{transform:translate(0);box-shadow:none\n}\n#koakuma-main-button[data-v-0ade4ee9]:enabled:active{transform:translate(1px,1px);box-shadow:-1px -1px 1px #4c4c4c\n}\n#koakuma-main-button.go[data-v-0ade4ee9]{background-color:#00ff59\n}\n#koakuma-main-button.paused[data-v-0ade4ee9]{background-color:#feff00\n}\n#koakuma-main-button.end[data-v-0ade4ee9]{background-color:#878787;color:#fff;opacity:.87\n}\n#koakuma-options-config[data-v-0ade4ee9],#koakuma-options-width-compress[data-v-0ade4ee9],#koakuma-options-width-expand[data-v-0ade4ee9]{cursor:pointer\n}", map: undefined, media: undefined });
    };
    const __vue_scope_id__ = "data-v-0ade4ee9";
    const __vue_module_identifier__ = undefined;
    const __vue_is_functional_template__ = false;
    function __vue_normalize__(
      template, style, script$$1,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script$$1 === 'function' ? script$$1.options : script$$1) || {};
      component.__file = "CtrlPanel.vue";
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
          if (css.map) {
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            code +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
              ' */';
          }
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
          return '#';
        }
        return `bookmark_add.php?type=illust&illust_id=${this.xdata.illustId}`;
      },
      currentImageItem() {
        if (!this.xdata) {
          return null;
        }
        const lib = this.$store.getters['pixiv/imageItemLibrary'];
        const found = lib.find(i => i.illustId === this.xdata.illustId);
        return found ? found : null;
      },
      currentType() {
        if (!this.xdata) {
          return '';
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
        return this.$store.getters['contextMenu/data'];
      },
      xpos() {
        return this.$store.getters['contextMenu/pos'];
      },
    },
    methods: {
      addToBlacklist() {
        if (this.currentImageItem) {
          const userId = this.currentImageItem.userId;
          const blacklist = this.$store.getters.config.blacklist;
          blacklist.push(userId);
          blacklist.sort((a, b) => a - b);
          this.$store.commit('setConfig', { blacklist });
          this.$store.commit('saveConfig');
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
      async followUser() {
        if (this.currentImageItem) {
          const userId = this.currentImageItem.userId;
          if (await PixivAPI.postFollowUser(userId)) {
            this.$store.commit('pixiv/editImgItem', {
              type: 'follow-user',
              userId: this.currentImageItem.userId,
            });
          }
        }
      },
      openPreview() {
        this.$store.commit('coverLayer/open', {
          data: this.currentImageItem,
          mode: 'preview',
        });
      },
      thumbUp() {
        if (this.currentImageItem) {
          PixivAPI.postIllustLike(this.currentImageItem.illustId);
        }
      },
    },
  };
              const __vue_script__$1 = script$1;
  var __vue_render__$1 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{style:(_vm.inlineStyle),attrs:{"id":"patchouli-context-menu"}},[_c('ul',{directives:[{name:"show",rawName:"v-show",value:(_vm.currentType === 'image-item-image'),expression:"currentType === 'image-item-image'"}]},[_c('li',[_c('a',{attrs:{"role":"button"},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }return _vm.thumbUp($event)}}},[_c('i',{staticClass:"far fa-thumbs-up"}),_vm._v("\n        "+_vm._s(_vm.$t('contextMenu.thumbUp'))+"\n      ")])]),_vm._v(" "),_c('li',{directives:[{name:"show",rawName:"v-show",value:(_vm.isDownloadable),expression:"isDownloadable"}]},[_c('a',{attrs:{"role":"button"},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }return _vm.downloadOne($event)}}},[_c('i',{staticClass:"fas fa-download"}),_vm._v("\n        "+_vm._s(_vm.$t('contextMenu.download'))+"\n      ")])]),_vm._v(" "),_c('li',[_c('a',{attrs:{"role":"button"},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }return _vm.openPreview($event)}}},[_c('i',{staticClass:"fas fa-search-plus"}),_vm._v("\n        "+_vm._s(_vm.$t('contextMenu.preview'))+"\n      ")])]),_vm._v(" "),_c('li',[_c('a',{attrs:{"href":_vm.bookmarkPageLink,"role":"button","target":"_blank"}},[_c('i',{staticClass:"far fa-bookmark"}),_vm._v("\n        "+_vm._s(_vm.$t('contextMenu.openBookmarkPage'))+"\n      ")])])]),_vm._v(" "),_c('ul',{directives:[{name:"show",rawName:"v-show",value:(_vm.currentType === 'image-item-title-user'),expression:"currentType === 'image-item-title-user'"}]},[_c('li',[_c('a',{attrs:{"role":"button"},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }return _vm.addToBlacklist($event)}}},[_c('i',{staticClass:"far fa-eye-slash"}),_vm._v("\n        "+_vm._s(_vm.$t('contextMenu.addToBlacklist'))+"\n      ")])]),_vm._v(" "),_c('li',{directives:[{name:"show",rawName:"v-show",value:(_vm.currentImageItem && !_vm.currentImageItem.isFollowed),expression:"currentImageItem && !currentImageItem.isFollowed"}]},[_c('a',{attrs:{"role":"button"},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }return _vm.followUser($event)}}},[_c('i',{staticClass:"fas fa-rss"}),_vm._v("\n        "+_vm._s(_vm.$t('contextMenu.followUser'))+"\n      ")])])])])};
  var __vue_staticRenderFns__$1 = [];
    const __vue_inject_styles__$1 = function (inject) {
      if (!inject) return
      inject("data-v-0d957a5e_0", { source: "\n#patchouli-context-menu[data-v-0d957a5e]{box-sizing:border-box;border:1px solid #b28fce;position:fixed;z-index:10;background-color:#fff;font-size:16px;overflow:hidden;border-radius:5px\n}\n#patchouli-context-menu>ul[data-v-0d957a5e]{margin:0;padding:0;line-height:20px\n}\n#patchouli-context-menu>ul>li[data-v-0d957a5e]{display:flex;align-items:center\n}\n#patchouli-context-menu>ul a[data-v-0d957a5e]{color:#85a;padding:3px;flex:1;text-decoration:none;white-space:nowrap;display:inline-flex;align-items:center;text-align:center\n}\n#patchouli-context-menu>ul a[data-v-0d957a5e]:hover{background-color:#b28fce;color:#fff;cursor:pointer\n}\n#patchouli-context-menu>ul i.far[data-v-0d957a5e],#patchouli-context-menu>ul i.fas[data-v-0d957a5e]{height:18px;width:18px;margin:0 4px\n}", map: undefined, media: undefined });
    };
    const __vue_scope_id__$1 = "data-v-0d957a5e";
    const __vue_module_identifier__$1 = undefined;
    const __vue_is_functional_template__$1 = false;
    function __vue_normalize__$1(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "ContextMenu.vue";
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
          if (css.map) {
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            code +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
              ' */';
          }
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
  var __vue_render__$2 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('svg',{staticClass:"iup",style:(_vm.inlineStyle),attrs:{"viewBox":"0 0 24 24"}},[_c('circle',{staticClass:"iup-circle",attrs:{"cx":"12","cy":"12","r":"10"}}),_vm._v(" "),_c('path',{attrs:{"d":"M9,8.74841664 L9,15.2515834 C9,15.8038681 9.44771525,16.2515834 10,16.2515834 C10.1782928,16.2515834 10.3533435,16.2039156 10.5070201,16.1135176 L16.0347118,12.8619342 C16.510745,12.5819147 16.6696454,11.969013 16.3896259,11.4929799 C16.3034179,11.3464262 16.1812655,11.2242738 16.0347118,11.1380658 L10.5070201,7.88648243 C10.030987,7.60646294 9.41808527,7.76536339 9.13806578,8.24139652 C9.04766776,8.39507316 9,8.57012386 9,8.74841664 Z"}})])};
  var __vue_staticRenderFns__$2 = [];
    const __vue_inject_styles__$2 = function (inject) {
      if (!inject) return
      inject("data-v-7fe09a6e_0", { source: "\n.iup-circle[data-v-7fe09a6e]{fill:#000;fill-opacity:.4\n}\n.iup[data-v-7fe09a6e]{fill:#fff;font-size:0;line-height:0;stroke:none;vertical-align:middle\n}", map: undefined, media: undefined });
    };
    const __vue_scope_id__$2 = "data-v-7fe09a6e";
    const __vue_module_identifier__$2 = undefined;
    const __vue_is_functional_template__$2 = false;
    function __vue_normalize__$2(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "IconUgoiraPlay.vue";
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
          if (css.map) {
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            code +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
              ' */';
          }
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
    props: {
      actived: {
        default: false,
        type: Boolean,
      },
      isPrivate: {
        default: false,
        type: Boolean,
      },
    },
    computed: {
      classes() {
        return {
          ['ibh-active']: this.actived,
          ['ibh-inactive']: !this.actived,
          ['ibh-private']: this.isPrivate,
        };
      },
    },
  };
              const __vue_script__$3 = script$3;
  var __vue_render__$3 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('svg',{staticClass:"ibh-effect",class:_vm.classes,attrs:{"viewBox":"0 0 32 32","width":"32","height":"32"}},[_c('path',{staticClass:"ibh-filled-heart",attrs:{"fill-rule":"evenodd","clip-rule":"evenodd","d":"M21,5.5 C24.8659932,5.5 28,8.63400675 28,12.5 C28,18.2694439 24.2975093,23.1517313 17.2206059,27.1100183 C16.4622493,27.5342993 15.5379984,27.5343235 14.779626,27.110148 C7.70250208,23.1517462 4,18.2694529 4,12.5 C4,8.63400691 7.13400681,5.5 11,5.5 C12.829814,5.5 14.6210123,6.4144028 16,7.8282366 C17.3789877,6.4144028 19.170186,5.5 21,5.5 Z"}}),_vm._v(" "),_c('path',{staticClass:"ibh-hollow-heart",attrs:{"d":"M16,11.3317089 C15.0857201,9.28334665 13.0491506,7.5 11,7.5 C8.23857625,7.5 6,9.73857647 6,12.5 C6,17.4386065 9.2519779,21.7268174 15.7559337,25.3646328 C15.9076021,25.4494645 16.092439,25.4494644 16.2441073,25.3646326 C22.7480325,21.7268037 26,17.4385986 26,12.5 C26,9.73857625 23.7614237,7.5 21,7.5 C18.9508494,7.5 16.9142799,9.28334665 16,11.3317089 Z"}}),_vm._v(" "),_c('path',{staticClass:"ibh-heart-lock-bg",attrs:{"fill-rule":"evenodd","clip-rule":"evenodd","d":"M29.98 20.523A3.998 3.998 0 0 1 32 24v4a4 4 0 0 1-4 4h-7a4 4 0 0 1-4-4v-4c0-1.489.814-2.788 2.02-3.477a5.5 5.5 0 0 1 10.96 0z","fill":"#fff"}}),_vm._v(" "),_c('path',{staticClass:"ibh-heart-lock-fg",attrs:{"fill-rule":"evenodd","clip-rule":"evenodd","d":"M28 22a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2v-1a3.5 3.5 0 1 1 7 0v1zm-5-1a1.5 1.5 0 0 1 3 0v1h-3v-1z","fill":"#1F1F1F"}})])};
  var __vue_staticRenderFns__$3 = [];
    const __vue_inject_styles__$3 = function (inject) {
      if (!inject) return
      inject("data-v-5b017ece_0", { source: "\n.ibh-active[data-v-5b017ece]{fill:#ff4060\n}\n.ibh-heart-lock-bg[data-v-5b017ece],.ibh-heart-lock-fg[data-v-5b017ece]{display:none\n}\n.ibh-active.ibh-private>.ibh-heart-lock-bg[data-v-5b017ece],.ibh-active.ibh-private>.ibh-heart-lock-fg[data-v-5b017ece]{display:inline\n}\n.ibh-inactive[data-v-5b017ece]{fill:#fff\n}\n.ibh-inactive>.ibh-filled-heart[data-v-5b017ece]{fill:#333\n}\n.ibh-effect[data-v-5b017ece]{box-sizing:border-box;font-size:0;line-height:0;-webkit-transition:fill .2s,stroke .2s;transition:fill .2s,stroke .2s;vertical-align:top;opacity:.85\n}\n.ibh-effect[data-v-5b017ece]:hover{opacity:1\n}", map: undefined, media: undefined });
    };
    const __vue_scope_id__$3 = "data-v-5b017ece";
    const __vue_module_identifier__$3 = undefined;
    const __vue_is_functional_template__$3 = false;
    function __vue_normalize__$3(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "IconBookmarkHeart.vue";
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
          if (css.map) {
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            code +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
              ' */';
          }
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
    var IconBookmarkHeart = __vue_normalize__$3(
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
    components: { IconBookmarkHeart, IconUgoiraPlay },
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
      isPrivateBookmark: {
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
        selfIsPrivateBookmark: this.isPrivateBookmark,
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
            this.selfIsPrivateBookmark = false;
          }
        }
      },
    },
  };
              const __vue_script__$4 = script$4;
  var __vue_render__$4 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"image-item-image"},[_c('a',{staticClass:"image-flexbox",attrs:{"href":_vm.illustPageUrl,"rel":"noopener"},on:{"contextmenu":function($event){return _vm.activateContextMenu($event)},"mouseenter":_vm.controlUgoira,"mouseleave":_vm.controlUgoira}},[(_vm.illustPageCount > 1)?_c('div',{staticClass:"top-right-slot"},[_c('span',[_c('i',{staticClass:"far fa-images"}),_vm._v("\n        "+_vm._s(_vm.illustPageCount))])]):_vm._e(),_vm._v(" "),_c('img',{directives:[{name:"show",rawName:"v-show",value:(!_vm.ugoiraPlayed),expression:"!ugoiraPlayed"}],attrs:{"data-src":_vm.imgUrl,"src":_vm.imgUrl}}),_vm._v(" "),(_vm.isUgoira)?_c('IconUgoiraPlay',{directives:[{name:"show",rawName:"v-show",value:(!_vm.ugoiraPlayed),expression:"!ugoiraPlayed"}],staticClass:"ugoira-icon",attrs:{"size":60}}):_vm._e(),_vm._v(" "),(_vm.isUgoira)?_c('canvas',{directives:[{name:"show",rawName:"v-show",value:(_vm.ugoiraPlayed),expression:"ugoiraPlayed"}],ref:"smallUgoiraPreview"}):_vm._e()],1),_vm._v(" "),_c('div',{staticClass:"bookmark-heart-block",on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }$event.stopPropagation();return _vm.oneClickBookmarkAdd($event)}}},[_c('IconBookmarkHeart',{attrs:{"actived":_vm.selfIsBookmarked,"is-private":_vm.selfIsPrivateBookmark}})],1),_vm._v(" "),(_vm.isSelfBookmarkPage)?_c('div',{staticClass:"bookmark-input-container"},[_c('input',{attrs:{"type":"checkbox","name":"book_id[]"},domProps:{"value":_vm.bookmarkId}})]):_vm._e()])};
  var __vue_staticRenderFns__$4 = [];
    const __vue_inject_styles__$4 = function (inject) {
      if (!inject) return
      inject("data-v-1f88fc0b_0", { source: "\n.image-item-image[data-v-1f88fc0b]{display:flex;align-items:center;justify-content:center;position:relative\n}\n.image-flexbox[data-v-1f88fc0b]{display:flex;flex-flow:column;justify-content:center;align-items:center;z-index:0;border:1px solid rgba(0,0,0,.04);position:relative;height:var(--default-image-item-image-square-size);width:var(--default-image-item-image-square-size)\n}\n.image-flexbox[data-v-1f88fc0b]:hover{text-decoration:none\n}\n.top-right-slot[data-v-1f88fc0b]{flex:none;display:flex;align-items:center;z-index:1;box-sizing:border-box;margin:0 0 -24px auto;padding:6px;height:24px;background:#000;background:rgba(0,0,0,.4);border-radius:0 0 0 4px;color:#fff;font-size:12px;line-height:1;font-weight:700\n}\n.ugoira-icon[data-v-1f88fc0b]{position:absolute\n}\ncanvas[data-v-1f88fc0b],img[data-v-1f88fc0b]{max-height:100%;max-width:100%\n}\n.bookmark-input-container[data-v-1f88fc0b]{position:absolute;left:0;top:0;background:rgba(0,0,0,.4);padding:6px;border-radius:0 0 4px 0\n}\n.bookmark-heart-block[data-v-1f88fc0b]{position:absolute;bottom:0;right:0\n}", map: undefined, media: undefined });
    };
    const __vue_scope_id__$4 = "data-v-1f88fc0b";
    const __vue_module_identifier__$4 = undefined;
    const __vue_is_functional_template__$4 = false;
    function __vue_normalize__$4(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "DefaultImageItemImage.vue";
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
          if (css.map) {
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            code +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
              ' */';
          }
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
    var DefaultImageItemImage = __vue_normalize__$4(
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
              const __vue_script__$5 = script$5;
  var __vue_render__$5 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('figcaption',{staticClass:"image-item-title-user"},[_c('ul',[_c('li',{staticClass:"title-text",on:{"contextmenu":function($event){return _vm.activateContextMenu($event)}}},[_c('a',{attrs:{"href":_vm.illustPageUrl,"title":_vm.illustTitle}},[_vm._v(_vm._s(_vm.illustTitle))])]),_vm._v(" "),_c('li',{staticClass:"user-info",on:{"contextmenu":function($event){return _vm.activateContextMenu($event)}}},[_c('a',{staticClass:"user-link",class:_vm.isEnableUserTooltip ? 'ui-profile-popup' : '',attrs:{"href":_vm.userPageUrl,"title":_vm.userName,"data-user_id":_vm.userId,"data-user_name":_vm.userName,"target":"_blank"}},[_c('span',{staticClass:"user-img",style:(_vm.profileImgStyle)}),_vm._v(" "),_c('span',[_vm._v(_vm._s(_vm.userName))])]),_vm._v(" "),(_vm.isFollowed)?_c('i',{staticClass:"fas fa-rss"}):_vm._e()]),_vm._v(" "),(_vm.bookmarkCount > 0)?_c('li',[_c('ul',{staticClass:"count-list"},[_c('li',[_c('a',{staticClass:"_ui-tooltip bookmark-count",attrs:{"href":_vm.bookmarkDetailUrl,"data-tooltip":_vm.$t('mainView.bookmarkTooltip', { count: _vm.bookmarkCount })}},[_c('i',{staticClass:"_icon _bookmark-icon-inline"}),_vm._v("\n            "+_vm._s(_vm.bookmarkCount)+"\n          ")])])])]):_vm._e()])])};
  var __vue_staticRenderFns__$5 = [];
    const __vue_inject_styles__$5 = function (inject) {
      if (!inject) return
      inject("data-v-dbefa7e2_0", { source: "\n.image-item-title-user[data-v-dbefa7e2]{max-width:100%;margin:8px auto;text-align:center;color:#333;font-size:12px;line-height:1\n}\n.title-text[data-v-dbefa7e2]{margin:4px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700\n}\n.user-info[data-v-dbefa7e2]{display:inline-flex;align-items:center\n}\n.user-link[data-v-dbefa7e2]{font-size:12px;display:inline-flex;align-items:center\n}\n.user-img[data-v-dbefa7e2]{width:20px;height:20px;display:inline-block;background-size:cover;border-radius:50%;margin-right:4px\n}\ni.fa-rss[data-v-dbefa7e2]{display:inline-block;margin-left:4px;width:16px;height:16px;color:#1e90ff\n}", map: undefined, media: undefined });
    };
    const __vue_scope_id__$5 = "data-v-dbefa7e2";
    const __vue_module_identifier__$5 = undefined;
    const __vue_is_functional_template__$5 = false;
    function __vue_normalize__$5(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "DefaultImageItemTitle.vue";
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
          if (css.map) {
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            code +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
              ' */';
          }
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
    var DefaultImageItemTitle = __vue_normalize__$5(
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
      isPrivateBookmark: {
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
              const __vue_script__$6 = script$6;
  var __vue_render__$6 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"image-item"},[_c('figure',{staticClass:"image-item-inner"},[_c('DefaultImageItemImage',{attrs:{"img-url":_vm.imgUrl,"illust-id":_vm.illustId,"illust-page-count":_vm.illustPageCount,"is-ugoira":_vm.isUgoira,"is-bookmarked":_vm.isBookmarked,"is-private-bookmark":_vm.isPrivateBookmark,"bookmark-id":_vm.bookmarkId}}),_vm._v(" "),_c('DefaultImageItemTitle',{attrs:{"illust-id":_vm.illustId,"illust-title":_vm.illustTitle,"user-name":_vm.userName,"user-id":_vm.userId,"is-followed":_vm.isFollowed,"profile-img-url":_vm.profileImgUrl,"bookmark-count":_vm.bookmarkCount}})],1)])};
  var __vue_staticRenderFns__$6 = [];
    const __vue_inject_styles__$6 = function (inject) {
      if (!inject) return
      inject("data-v-04041dc0_0", { source: "\n.image-item[data-v-04041dc0]{display:flex;justify-content:center;margin:0 0 30px 0;padding:10px;height:auto;width:200px\n}\n.image-item-inner[data-v-04041dc0]{display:flex;flex-flow:column;max-width:100%;max-height:300px\n}", map: undefined, media: undefined });
    };
    const __vue_scope_id__$6 = "data-v-04041dc0";
    const __vue_module_identifier__$6 = undefined;
    const __vue_is_functional_template__$6 = false;
    function __vue_normalize__$6(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "DefaultImageItem.vue";
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
          if (css.map) {
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            code +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
              ' */';
          }
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
    var DefaultImageItem = __vue_normalize__$6(
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
    components: { DefaultImageItem },
    computed: {
      defaultProcessedLibrary() {
        const { shows, hides } = this.displayIndices;
        const iiLib = this.$store.getters['pixiv/imageItemLibrary'];
        return shows.concat(hides).map(idx => iiLib[idx]);
      },
      displayIndices() {
        return this.$store.getters['pixiv/defaultDisplayIndices'];
      },
      imageToShowCount() {
        const { shows } = this.displayIndices;
        return shows.length;
      },
    },
  };
              const __vue_script__$7 = script$7;
  var __vue_render__$7 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{attrs:{"id":"patchouli-default-image-item-page"}},_vm._l((_vm.defaultProcessedLibrary),function(d,index){return _c('DefaultImageItem',{directives:[{name:"show",rawName:"v-show",value:(index < _vm.imageToShowCount),expression:"index < imageToShowCount"}],key:d.illustId,attrs:{"img-url":d.urls.thumb,"illust-id":d.illustId,"illust-title":d.illustTitle,"illust-page-count":d.illustPageCount,"is-ugoira":d.isUgoira,"user-name":d.userName,"user-id":d.userId,"profile-img-url":d.profileImg,"bookmark-count":d.bookmarkCount,"is-private-bookmark":d.isPrivateBookmark,"is-bookmarked":d.isBookmarked,"is-followed":d.isFollowed,"bookmark-id":d.bookmarkId}})}))};
  var __vue_staticRenderFns__$7 = [];
    const __vue_inject_styles__$7 = function (inject) {
      if (!inject) return
      inject("data-v-14d2afc2_0", { source: "\n#patchouli-default-image-item-page[data-v-14d2afc2]{display:flex;flex-flow:wrap;justify-content:space-around\n}", map: undefined, media: undefined });
    };
    const __vue_scope_id__$7 = "data-v-14d2afc2";
    const __vue_module_identifier__$7 = undefined;
    const __vue_is_functional_template__$7 = false;
    function __vue_normalize__$7(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "DefaultImageItemPage.vue";
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
          if (css.map) {
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            code +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
              ' */';
          }
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
    var DefaultImageItemPage = __vue_normalize__$7(
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
  var __vue_render__$8 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"icon-multiple-indicator"},[_c('svg',{staticClass:"icon-multiple-svg",attrs:{"viewBox":"0 0 9 10"}},[_c('path',{attrs:{"d":"M8,3 C8.55228475,3 9,3.44771525 9,4 L9,9 C9,9.55228475 8.55228475,10 8,10 L3,10 C2.44771525,10 2,9.55228475 2,9 L6,9 C7.1045695,9 8,8.1045695 8,7 L8,3 Z M1,1 L6,1 C6.55228475,1 7,1.44771525 7,2 L7,7 C7,7.55228475 6.55228475,8 6,8 L1,8 C0.44771525,8 0,7.55228475 0,7 L0,2 C0,1.44771525 0.44771525,1 1,1 Z"}})]),_vm._v(" "),_c('span',{staticClass:"illust-page-count"},[_vm._v(_vm._s(_vm.illustPageCount))])])};
  var __vue_staticRenderFns__$8 = [];
    const __vue_inject_styles__$8 = function (inject) {
      if (!inject) return
      inject("data-v-6d8cbce8_0", { source: "\n.icon-multiple-indicator[data-v-6d8cbce8]{align-items:center;background:rgba(0,0,0,.4);border-radius:10px;box-sizing:border-box;display:flex;flex:none;height:20px;margin:2px 2px -20px auto;padding:5px 6px;z-index:1;color:#fff;font-size:10px;font-weight:700;line-height:1\n}\n.icon-multiple-svg[data-v-6d8cbce8]{fill:#fff;font-size:0;height:10px;line-height:0;stroke:none;width:9px\n}\n.illust-page-count[data-v-6d8cbce8]{margin-left:2px\n}", map: undefined, media: undefined });
    };
    const __vue_scope_id__$8 = "data-v-6d8cbce8";
    const __vue_module_identifier__$8 = undefined;
    const __vue_is_functional_template__$8 = false;
    function __vue_normalize__$8(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "IndicatorMultiple.vue";
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
          if (css.map) {
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            code +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
              ' */';
          }
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
  var __vue_render__$9 = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('li',{staticClass:"illust-item-root"},[_c('a',{staticClass:"illust-main",attrs:{"href":_vm.illustPageUrl},on:{"contextmenu":function($event){return _vm.activateContextMenu($event)},"mouseenter":_vm.controlUgoira,"mouseleave":_vm.controlUgoira}},[_c('div',{staticClass:"illust-main-indicators"},[(_vm.illustPageCount > 1)?_c('IndicatorMultiple',{attrs:{"illust-page-count":_vm.illustPageCount}}):_vm._e()],1),_vm._v(" "),_c('div',{staticClass:"illust-main-img",style:(_vm.illustMainImgStyle)},[(_vm.isUgoira)?_c('IconUgoiraPlay',{directives:[{name:"show",rawName:"v-show",value:(!_vm.ugoiraPlayed),expression:"!ugoiraPlayed"}]}):_vm._e(),_vm._v(" "),(_vm.isUgoira)?_c('canvas',{directives:[{name:"show",rawName:"v-show",value:(_vm.ugoiraPlayed),expression:"ugoiraPlayed"}],ref:"smallUgoiraPreview",staticClass:"illust-main-ugoira"}):_vm._e()],1)]),_vm._v(" "),_c('div',{staticClass:"illust-buttons"},[_c('div',[_c('button',{attrs:{"type":"button"},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }$event.preventDefault();$event.stopPropagation();return _vm.oneClickBookmarkAdd($event)}}},[_c('IconBookmarkHeart',{attrs:{"actived":_vm.selfIsBookmarked}})],1)])]),_vm._v(" "),_c('a',{staticClass:"illust-title",attrs:{"href":_vm.illustPageUrl},on:{"contextmenu":function($event){return _vm.activateContextMenu($event)}}},[_vm._v(_vm._s(_vm.illustTitle))]),_vm._v(" "),_c('div',{directives:[{name:"show",rawName:"v-show",value:(_vm.showUserProfile),expression:"showUserProfile"}],staticClass:"user-profile"},[_c('div',[_c('a',{staticClass:"user-profile-img",style:(_vm.profileImgStyle),attrs:{"href":_vm.illustPageUrl}})]),_vm._v(" "),_c('a',{staticClass:"user-profile-name",attrs:{"href":_vm.userPageUrl},on:{"contextmenu":function($event){return _vm.activateContextMenu($event)}}},[_vm._v(_vm._s(_vm.userName))]),_vm._v(" "),(_vm.isFollowed)?_c('i',{staticClass:"fas fa-rss user-followed-indicator"}):_vm._e()]),_vm._v(" "),_c('div',{directives:[{name:"show",rawName:"v-show",value:(_vm.bookmarkCount > 0),expression:"bookmarkCount > 0"}],staticClass:"illust-popularity"},[_c('span',[_vm._v(_vm._s(_vm.bookmarkCount))])])])};
  var __vue_staticRenderFns__$9 = [];
    const __vue_inject_styles__$9 = function (inject) {
      if (!inject) return
      inject("data-v-6ea6f540_0", { source: "\n.illust-item-root[data-v-6ea6f540]{margin:0 12px 24px\n}\n.illust-main[data-v-6ea6f540]{text-decoration:none\n}\n.illust-main-indicators[data-v-6ea6f540]{display:flex;position:absolute;width:var(--new-default-image-item-square-size);justify-content:end\n}\n.illust-main-img[data-v-6ea6f540]{align-items:center;background-color:#fff;background-position:50%;background-repeat:no-repeat;background-size:cover;border-radius:4px;display:flex;height:var(--new-default-image-item-square-size);justify-content:center;margin-bottom:8px;position:relative;width:var(--new-default-image-item-square-size)\n}\n.illust-main-img[data-v-6ea6f540]::before{background-color:rgba(0,0,0,.02);content:\"\";display:block;height:100%;left:0;position:absolute;top:0;width:100%\n}\n.illust-main-ugoira[data-v-6ea6f540]{object-fit:contain;height:var(--new-default-image-item-square-size);width:var(--new-default-image-item-square-size)\n}\n.illust-buttons[data-v-6ea6f540]{display:flex;height:32px;justify-content:flex-end;margin-bottom:8px;margin-top:-40px\n}\n.illust-buttons>div[data-v-6ea6f540]{z-index:1\n}\n.illust-buttons>div>button[data-v-6ea6f540]{background:0 0;border:none;box-sizing:content-box;cursor:pointer;display:inline-block;height:32px;line-height:1;padding:0\n}\n.illust-title[data-v-6ea6f540]{color:#177082;display:block;font-size:14px;font-weight:700;line-height:1;margin:0 0 4px;overflow:hidden;text-decoration:none;text-overflow:ellipsis;white-space:nowrap;width:var(--new-default-image-item-square-size)\n}\n.user-profile[data-v-6ea6f540]{align-items:center;display:flex;width:var(--new-default-image-item-square-size);margin-bottom:4px\n}\n.user-profile>div[data-v-6ea6f540]{display:inline-block;margin-right:4px\n}\n.user-profile-img[data-v-6ea6f540]{background-size:cover;border-radius:50%;display:block;flex:none;position:relative;overflow:hidden;width:16px;height:16px\n}\n.user-profile-name[data-v-6ea6f540]{color:#999;font-size:12px;line-height:1;overflow:hidden;text-decoration:none;text-overflow:ellipsis;white-space:nowrap;flex:1\n}\n.user-followed-indicator[data-v-6ea6f540]{display:inline-block;margin-left:4px;width:16px;height:16px;color:#1e90ff\n}\n.illust-popularity[data-v-6ea6f540]{display:flex;width:100%;justify-content:center\n}\n.illust-popularity>span[data-v-6ea6f540]{background-color:#cef;color:#0069b1;padding:2px 8px;border-radius:8px;font-weight:700\n}\n.illust-popularity>span[data-v-6ea6f540]::before{content:\"❤️\";margin-right:4px\n}", map: undefined, media: undefined });
    };
    const __vue_scope_id__$9 = "data-v-6ea6f540";
    const __vue_module_identifier__$9 = undefined;
    const __vue_is_functional_template__$9 = false;
    function __vue_normalize__$9(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "NewDefaultImageItem.vue";
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
          if (css.map) {
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            code +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
              ' */';
          }
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
  var script$a = {};
              const __vue_script__$a = script$a;
  var __vue_render__$a = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _vm._m(0)};
  var __vue_staticRenderFns__$a = [function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"ils-grid"},[_c('div',{staticClass:"ils-cell ils-1"}),_vm._v(" "),_c('div',{staticClass:"ils-cell ils-2"}),_vm._v(" "),_c('div',{staticClass:"ils-cell ils-3"}),_vm._v(" "),_c('div',{staticClass:"ils-cell ils-4"}),_vm._v(" "),_c('div',{staticClass:"ils-cell ils-5"}),_vm._v(" "),_c('div',{staticClass:"ils-cell ils-6"}),_vm._v(" "),_c('div',{staticClass:"ils-cell ils-7"}),_vm._v(" "),_c('div',{staticClass:"ils-cell ils-8"}),_vm._v(" "),_c('div',{staticClass:"ils-cell ils-9"})])}];
    const __vue_inject_styles__$a = function (inject) {
      if (!inject) return
      inject("data-v-1f3e96a6_0", { source: "\n.ils-grid[data-v-1f3e96a6]{width:var(--loading-icon-size);height:var(--loading-icon-size);margin:100px auto\n}\n.ils-grid .ils-cell[data-v-1f3e96a6]{width:33%;height:33%;background-color:var(--loading-icon-color);float:left;-webkit-animation:ilsGridScaleDelay-data-v-1f3e96a6 1.3s infinite ease-in-out;animation:ilsGridScaleDelay-data-v-1f3e96a6 1.3s infinite ease-in-out\n}\n.ils-grid .ils-1[data-v-1f3e96a6]{-webkit-animation-delay:.2s;animation-delay:.2s\n}\n.ils-grid .ils-2[data-v-1f3e96a6]{-webkit-animation-delay:.3s;animation-delay:.3s\n}\n.ils-grid .ils-3[data-v-1f3e96a6]{-webkit-animation-delay:.4s;animation-delay:.4s\n}\n.ils-grid .ils-4[data-v-1f3e96a6]{-webkit-animation-delay:.1s;animation-delay:.1s\n}\n.ils-grid .ils-5[data-v-1f3e96a6]{-webkit-animation-delay:.2s;animation-delay:.2s\n}\n.ils-grid .ils-6[data-v-1f3e96a6]{-webkit-animation-delay:.3s;animation-delay:.3s\n}\n.ils-grid .ils-7[data-v-1f3e96a6]{-webkit-animation-delay:0s;animation-delay:0s\n}\n.ils-grid .ils-8[data-v-1f3e96a6]{-webkit-animation-delay:.1s;animation-delay:.1s\n}\n.ils-grid .ils-9[data-v-1f3e96a6]{-webkit-animation-delay:.2s;animation-delay:.2s\n}\n@-webkit-keyframes ilsGridScaleDelay-data-v-1f3e96a6{\n0%,100%,70%{-webkit-transform:scale3D(1,1,1);transform:scale3D(1,1,1)\n}\n35%{-webkit-transform:scale3D(0,0,1);transform:scale3D(0,0,1)\n}\n}\n@keyframes ilsGridScaleDelay-data-v-1f3e96a6{\n0%,100%,70%{-webkit-transform:scale3D(1,1,1);transform:scale3D(1,1,1)\n}\n35%{-webkit-transform:scale3D(0,0,1);transform:scale3D(0,0,1)\n}\n}", map: undefined, media: undefined });
    };
    const __vue_scope_id__$a = "data-v-1f3e96a6";
    const __vue_module_identifier__$a = undefined;
    const __vue_is_functional_template__$a = false;
    function __vue_normalize__$a(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "IconLoadingSpin.vue";
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
          if (css.map) {
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            code +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
              ' */';
          }
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
    var IconLoadingSpin = __vue_normalize__$a(
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
    components: { IconLoadingSpin, NewDefaultImageItem },
    data() {
      return {
        routeIsInited: Array(NPP_TYPE_COUNT).fill(false),
      };
    },
    computed: {
      displayIndices() {
        return this.$store.getters['pixiv/nppDisplayIndices'];
      },
      hasNoResult() {
        return !this.imageToShowCount;
      },
      imageToShowCount() {
        const { shows } = this.displayIndices;
        return shows.length;
      },
      isSelfBookmarkPage() {
        return this.$store.getters.isSelfBookmarkPage;
      },
      nppProcessedLibrary() {
        const { shows, hides } = this.displayIndices;
        const iiLib = this.$store.getters['pixiv/imageItemLibrary'];
        return shows.concat(hides).map(idx => iiLib[idx]);
      },
      nppType() {
        return this.$store.getters['pixiv/nppType'];
      },
      rest() {
        return this.$store.getters.sp.rest;
      },
      status() {
        return this.$store.getters['pixiv/status'];
      },
      uid() {
        return this.$store.getters.sp.id;
      },
    },
    mounted() {
      this.$nextTick(() => {
        this.routeIsInited[this.nppType] = true;
      });
    },
    methods: {
      async clickRoute(event) {
        await this.$store.dispatch('pixiv/pause');
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
        if (!this.routeIsInited[this.nppType]) {
          this.$store.dispatch('pixiv/start', { force: true, times: 1 });
          this.routeIsInited[this.nppType] = true;
        }
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
              const __vue_script__$b = script$b;
  var __vue_render__$b = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{attrs:{"id":"patchouli-new-profile-page"}},[_c('nav',{attrs:{"id":"patchouli-npp-nav"}},[_c('a',{class:{'current': _vm.nppType === 0},attrs:{"id":"patchouli-npp-all","href":("/member.php?id=" + _vm.uid)},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }$event.preventDefault();return _vm.clickRoute($event)}}},[_vm._v(_vm._s(_vm.$t('mainView.newProfilePage.contents')))]),_vm._v(" "),_c('a',{class:{'current': _vm.nppType === 1},attrs:{"id":"patchouli-npp-illust","href":("/member_illust.php?id=" + _vm.uid + "&type=illust")},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }$event.preventDefault();return _vm.clickRoute($event)}}},[_vm._v(_vm._s(_vm.$t('mainView.newProfilePage.illustrations')))]),_vm._v(" "),_c('a',{class:{'current': _vm.nppType === 2},attrs:{"id":"patchouli-npp-manga","href":("/member_illust.php?id=" + _vm.uid + "&type=manga")},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }$event.preventDefault();return _vm.clickRoute($event)}}},[_vm._v(_vm._s(_vm.$t('mainView.newProfilePage.manga')))]),_vm._v(" "),_c('a',{class:{'current': _vm.nppType === 3},attrs:{"id":"patchouli-npp-bookmark","href":("/bookmark.php?id=" + _vm.uid + "&rest=show")},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }$event.preventDefault();return _vm.clickRoute($event)}}},[_vm._v(_vm._s(_vm.$t('mainView.newProfilePage.bookmarks')))])]),_vm._v(" "),_c('div',{attrs:{"id":"patchouli-npp-view"}},[_c('div',{directives:[{name:"show",rawName:"v-show",value:(_vm.isSelfBookmarkPage),expression:"isSelfBookmarkPage"}],staticClass:"ω",attrs:{"id":"patchouli-npp-view-bookmark-switch"}},[_c('nav',[_c('a',{class:{'current': _vm.nppType === 3},attrs:{"id":"patchouli-npp-view-bookmark-switch-public","href":("/bookmark.php?id=" + _vm.uid + "&rest=show")},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }$event.preventDefault();return _vm.clickRoute($event)}}},[_vm._v(_vm._s(_vm.$t('mainView.newProfilePage.publicBookmark')))]),_vm._v(" "),_c('a',{class:{'current': _vm.nppType === 4},attrs:{"id":"patchouli-npp-view-bookmark-switch-private","href":("/bookmark.php?id=" + _vm.uid + "&rest=hide")},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }$event.preventDefault();return _vm.clickRoute($event)}}},[_vm._v(_vm._s(_vm.$t('mainView.newProfilePage.privateBookmark')))])])]),_vm._v(" "),_c('div',{attrs:{"id":"patchouli-npp-view-header"}}),_vm._v(" "),_c('ul',{directives:[{name:"show",rawName:"v-show",value:(!_vm.hasNoResult),expression:"!hasNoResult"}],staticClass:"ω",attrs:{"id":"patchouli-npp-view-image-item-list"}},_vm._l((_vm.nppProcessedLibrary),function(d,index){return _c('NewDefaultImageItem',{directives:[{name:"show",rawName:"v-show",value:(index < _vm.imageToShowCount),expression:"index < imageToShowCount"}],key:d.illustId,attrs:{"illust-id":d.illustId,"bookmark-count":d.bookmarkCount,"bookmark-id":d.bookmarkId,"is-bookmarked":d.isBookmarked,"is-followed":d.isFollowed,"is-ugoira":d.isUgoira,"illust-page-count":d.illustPageCount,"illust-title":d.illustTitle,"thumb-img-url":d.urls.thumb,"profile-img-url":d.profileImg,"user-id":d.userId,"user-name":d.userName,"show-user-profile":_vm.uid !== d.userId}})})),_vm._v(" "),_c('span',{directives:[{name:"show",rawName:"v-show",value:(_vm.hasNoResult),expression:"hasNoResult"}],attrs:{"id":"patchouli-npp-view-no-result"}},[_vm._v("\n      "+_vm._s(_vm.$t('mainView.newProfilePage.noResult'))+"\n    ")]),_vm._v(" "),_c('span',{directives:[{name:"show",rawName:"v-show",value:(!_vm.status.isPaused && !_vm.status.isEnded),expression:"!status.isPaused && !status.isEnded"}],attrs:{"id":"patchouli-npp-view-loading"}},[_c('IconLoadingSpin')],1)])])};
  var __vue_staticRenderFns__$b = [];
    const __vue_inject_styles__$b = function (inject) {
      if (!inject) return
      inject("data-v-501dcecc_0", { source: "\n#patchouli-npp-nav[data-v-501dcecc]{display:flex;justify-content:center;background-color:#f9f8ff;width:100%\n}\n#patchouli-npp-nav>a[data-v-501dcecc]{border-top:4px solid transparent;color:#999;font-size:16px;font-weight:700;margin:0 10px;padding:10px 20px;text-decoration:none;transition:color .2s\n}\n#patchouli-npp-nav>a[data-v-501dcecc]:hover{color:#333;cursor:pointer\n}\n#patchouli-npp-nav>a.current[data-v-501dcecc]{color:#333;border-bottom:4px solid #0096fa\n}\n#patchouli-npp-view[data-v-501dcecc]{display:flex;flex-flow:column;min-height:340px;align-items:center\n}\n#patchouli-npp-view-bookmark-switch[data-v-501dcecc]{display:flex;justify-content:flex-end;margin:24px auto 48px;width:1300px\n}\n#patchouli-npp-view-bookmark-switch a.current[data-v-501dcecc]{background-color:#f5f5f5;color:#5c5c5c\n}\n#patchouli-npp-view-bookmark-switch a[data-v-501dcecc]{border-radius:24px;color:#8f8f8f;font-size:16px;font-weight:700;padding:16px 24px;text-decoration:none\n}\n#patchouli-npp-view-image-item-list[data-v-501dcecc]{list-style:none;display:flex;align-content:flex-start;justify-content:center;flex-wrap:wrap;padding:14px 0;margin:0 auto;width:1300px\n}\n#patchouli-npp-view-no-result[data-v-501dcecc]{flex:1;display:inline-flex;align-items:center;color:#b8b8b8;font-size:20px;font-weight:700;line-height:1\n}\n#patchouli-npp-view-loading[data-v-501dcecc]{flex:1;display:inline-flex;align-items:center\n}", map: undefined, media: undefined });
    };
    const __vue_scope_id__$b = "data-v-501dcecc";
    const __vue_module_identifier__$b = undefined;
    const __vue_is_functional_template__$b = false;
    function __vue_normalize__$b(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "NewProfilePage.vue";
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
          if (css.map) {
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            code +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
              ' */';
          }
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
    var NewProfilePage = __vue_normalize__$b(
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
              const __vue_script__$c = script$c;
  var __vue_render__$c = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{attrs:{"id":_vm.id}},[(_vm.isNewProfilePage)?_c('NewProfilePage'):_c('DefaultImageItemPage'),_vm._v(" "),_c('ContextMenu')],1)};
  var __vue_staticRenderFns__$c = [];
    const __vue_inject_styles__$c = undefined;
    const __vue_scope_id__$c = "data-v-642adf9e";
    const __vue_module_identifier__$c = undefined;
    const __vue_is_functional_template__$c = false;
    function __vue_normalize__$c(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "MainView.vue";
      if (!component.render) {
        component.render = template.render;
        component.staticRenderFns = template.staticRenderFns;
        component._compiled = true;
        if (functional) component.functional = true;
      }
      component._scopeId = scope;
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
          if (css.map) {
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            code +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
              ' */';
          }
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
    var mainView = __vue_normalize__$c(
      { render: __vue_render__$c, staticRenderFns: __vue_staticRenderFns__$c },
      __vue_inject_styles__$c,
      __vue_script__$c,
      __vue_scope_id__$c,
      __vue_is_functional_template__$c,
      __vue_module_identifier__$c,
      __vue_create_injector__$c,
      undefined
    );
  var script$d = {
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
              const __vue_script__$d = script$d;
  var __vue_render__$d = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{directives:[{name:"show",rawName:"v-show",value:(_vm.xmode),expression:"xmode"}],ref:"coverLayerRoot",attrs:{"id":_vm.id,"tabindex":"0"},on:{"keyup":_vm.jumpByKeyup,"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }return _vm.clickBase($event)},"scroll":function($event){$event.stopPropagation();$event.preventDefault();},"wheel":function($event){$event.stopPropagation();$event.preventDefault();return _vm.jumpByWheel($event)}}},[_c('div',{directives:[{name:"show",rawName:"v-show",value:(_vm.xmode === 'config'),expression:"xmode === 'config'"}],attrs:{"id":"marisa-config-mode"},on:{"click":function($event){$event.stopPropagation();}}},[_c('a',{attrs:{"id":"config-context-menu-switch"},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }return _vm.clickSwitch($event)}}},[_c('a',{directives:[{name:"show",rawName:"v-show",value:(_vm.xc.contextMenu),expression:"xc.contextMenu"}],attrs:{"id":"config-context-menu-switch-on","role":"button"}},[_c('i',{staticClass:"fas fa-toggle-on"})]),_vm._v(" "),_c('a',{directives:[{name:"show",rawName:"v-show",value:(!_vm.xc.contextMenu),expression:"!xc.contextMenu"}],attrs:{"id":"config-context-menu-switch-off","role":"button"}},[_c('i',{staticClass:"fas fa-toggle-off"})]),_vm._v(" "),_c('span',{attrs:{"id":"config-context-menu-label"}},[_vm._v(_vm._s(_vm.$t('config.contextMenuExtension')))])]),_vm._v(" "),_c('a',{attrs:{"id":"config-user-tooltip-switch"},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }return _vm.clickSwitch($event)}}},[_c('a',{directives:[{name:"show",rawName:"v-show",value:(_vm.xc.userTooltip),expression:"xc.userTooltip"}],attrs:{"id":"config-user-tooltip-switch-on","role":"button"}},[_c('i',{staticClass:"fas fa-toggle-on"})]),_vm._v(" "),_c('a',{directives:[{name:"show",rawName:"v-show",value:(!_vm.xc.userTooltip),expression:"!xc.userTooltip"}],attrs:{"id":"config-user-tooltip-switch-off","role":"button"}},[_c('i',{staticClass:"fas fa-toggle-off"})]),_vm._v(" "),_c('span',{attrs:{"id":"config-user-tooltip-label"}},[_vm._v(_vm._s(_vm.$t('config.userTooltip')))])]),_vm._v(" "),_c('a',{attrs:{"id":"config-hover-play-switch"},on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }return _vm.clickSwitch($event)}}},[_c('a',{directives:[{name:"show",rawName:"v-show",value:(_vm.xc.hoverPlay),expression:"xc.hoverPlay"}],attrs:{"id":"config-hover-play-switch-on","role":"button"}},[_c('i',{staticClass:"fas fa-toggle-on"})]),_vm._v(" "),_c('a',{directives:[{name:"show",rawName:"v-show",value:(!_vm.xc.hoverPlay),expression:"!xc.hoverPlay"}],attrs:{"id":"config-hover-play-switch-off","role":"button"}},[_c('i',{staticClass:"fas fa-toggle-off"})]),_vm._v(" "),_c('span',{attrs:{"id":"config-hover-play-label"}},[_vm._v(_vm._s(_vm.$t('config.hoverPlay')))])]),_vm._v(" "),_c('a',{attrs:{"id":"marisa-config-blacklist-label"}},[_c('i',{staticClass:"far fa-eye-slash"}),_vm._v(_vm._s(_vm.$t('config.blacklist'))+"\n    ")]),_vm._v(" "),_c('textarea',{ref:"blacklistTextarea",attrs:{"id":"marisa-config-blacklist-textarea","spellcheck":"false","rows":"5"},domProps:{"value":_vm.xc.blacklist.join('\n')}})]),_vm._v(" "),_c('div',{directives:[{name:"show",rawName:"v-show",value:(_vm.xmode === 'preview'),expression:"xmode === 'preview'"}],attrs:{"id":"marisa-preview-mode"},on:{"click":function($event){$event.stopPropagation();}}},[_c('div',{attrs:{"id":"marisa-preview-display-area"}},[_c('a',{directives:[{name:"show",rawName:"v-show",value:(!_vm.previewUgoiraMetaData),expression:"!previewUgoiraMetaData"}],attrs:{"href":_vm.previewSrcList[_vm.previewCurrentIndex],"target":"_blank"}},[_c('img',{attrs:{"src":_vm.previewSrcList[_vm.previewCurrentIndex]}})]),_vm._v(" "),_c('div',{directives:[{name:"show",rawName:"v-show",value:(!!_vm.previewUgoiraMetaData),expression:"!!previewUgoiraMetaData"}]},[_c('canvas',{directives:[{name:"show",rawName:"v-show",value:(_vm.previewCurrentIndex === 0),expression:"previewCurrentIndex === 0"}],ref:"previewUgoiraCanvas"}),_vm._v(" "),_c('canvas',{directives:[{name:"show",rawName:"v-show",value:(_vm.previewCurrentIndex === 1),expression:"previewCurrentIndex === 1"}],ref:"previewOriginalUgoiraCanvas"})])]),_vm._v(" "),_c('ul',{directives:[{name:"show",rawName:"v-show",value:(_vm.previewSrcList.length > 1),expression:"previewSrcList.length > 1"}],attrs:{"id":"marisa-preview-thumbnails-area"}},_vm._l((_vm.previewSrcList),function(pSrc,index){return _c('li',{key:pSrc},[_c('a',{class:(index === _vm.previewCurrentIndex) ? 'current-preview' : '',on:{"click":function($event){if(!('button' in $event)&&_vm._k($event.keyCode,"left",37,$event.key,["Left","ArrowLeft"])){ return null; }if('button' in $event && $event.button !== 0){ return null; }_vm.jumpTo(index);}}},[_c('img',{attrs:{"src":pSrc}})])])}))])])};
  var __vue_staticRenderFns__$d = [];
    const __vue_inject_styles__$d = function (inject) {
      if (!inject) return
      inject("data-v-45254152_0", { source: "\n#Marisa[data-v-45254152]{background-color:#000a;position:fixed;height:100%;width:100%;z-index:5;top:0;left:0;display:flex;align-items:center;justify-content:center\n}\n#marisa-config-mode[data-v-45254152],#marisa-preview-mode[data-v-45254152]{min-width:100px;min-height:100px;background-color:#eef\n}\n#marisa-config-mode[data-v-45254152]{display:flex;flex-flow:column;padding:10px;border-radius:10px;font-size:18px;white-space:nowrap\n}\n#marisa-config-mode a[data-v-45254152]{color:#00186c;text-decoration:none\n}\n#marisa-config-mode [id$=switch][data-v-45254152]{text-align:center\n}\n#marisa-config-mode [id$=switch][data-v-45254152]:hover{cursor:pointer\n}\n#marisa-config-mode [id$=label][data-v-45254152]{text-align:center;margin:0 5px\n}\n#marisa-config-blacklist-label>.fa-eye-slash[data-v-45254152]{margin:0 4px\n}\n#marisa-config-blacklist-textarea[data-v-45254152]{box-sizing:border-box;flex:1;resize:none;font-size:11pt;height:90px\n}\n#marisa-preview-mode[data-v-45254152]{width:70%;height:100%;box-sizing:border-box;display:grid;grid-template-rows:minmax(0,auto) max-content\n}\n#marisa-preview-display-area[data-v-45254152]{border:2px #00186c solid;box-sizing:border-box;text-align:center\n}\n#marisa-preview-display-area>a[data-v-45254152],#marisa-preview-display-area>div[data-v-45254152]{display:inline-flex;height:100%;justify-content:center;align-items:center\n}\n#marisa-preview-display-area>a>img[data-v-45254152],#marisa-preview-display-area>div>canvas[data-v-45254152]{object-fit:contain;max-width:100%;max-height:100%\n}\n#marisa-preview-thumbnails-area[data-v-45254152]{background-color:#f8f8ff;display:flex;align-items:center;overflow-x:auto;overflow-y:hidden;height:100%;border:2px solid #014;box-sizing:border-box;border-top:0;margin:0;padding:0;list-style:none\n}\n#marisa-preview-thumbnails-area>li[data-v-45254152]{margin:0 10px;display:inline-flex\n}\n#marisa-preview-thumbnails-area>li>a[data-v-45254152]{cursor:pointer;display:inline-flex;border:3px solid transparent\n}\n#marisa-preview-thumbnails-area>li>a.current-preview[data-v-45254152]{border:3px solid #db7093\n}\n#marisa-preview-thumbnails-area>li>a>img[data-v-45254152]{max-height:100px;box-sizing:border-box;display:inline-block\n}", map: undefined, media: undefined });
    };
    const __vue_scope_id__$d = "data-v-45254152";
    const __vue_module_identifier__$d = undefined;
    const __vue_is_functional_template__$d = false;
    function __vue_normalize__$d(
      template, style, script,
      scope, functional, moduleIdentifier,
      createInjector, createInjectorSSR
    ) {
      const component = (typeof script === 'function' ? script.options : script) || {};
      component.__file = "CoverLayer.vue";
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
    function __vue_create_injector__$d() {
      const head = document.head || document.getElementsByTagName('head')[0];
      const styles = __vue_create_injector__$d.styles || (__vue_create_injector__$d.styles = {});
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
          if (css.map) {
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            code +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
              ' */';
          }
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
    var coverLayer$1 = __vue_normalize__$d(
      { render: __vue_render__$d, staticRenderFns: __vue_staticRenderFns__$d },
      __vue_inject_styles__$d,
      __vue_script__$d,
      __vue_scope_id__$d,
      __vue_is_functional_template__$d,
      __vue_module_identifier__$d,
      __vue_create_injector__$d,
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
      if (vuexStore.getters['pixiv/nppType'] < 0) {
        $('._global-header').classList.add('koakuma-placeholder');
      }
      vuexStore.dispatch('pixiv/start', { isFirst: true, times: 1 })
        .then(() => {
          Patchouli.$mount(vuexStore.getters.mountPointMainView);
          Koakuma.$mount(vuexStore.getters.mountPointCtrlPanel);
          Marisa.$mount(vuexStore.getters.mountPointCoverLayer);
          vuexStore.commit('applyConfig');
          if (vuexStore.getters['pixiv/nppType'] < 0) {
            $('._global-header').classList.remove('koakuma-placeholder');
          }
        })
        .catch(error => {
          $print.error('main#init: Fail to first mount', error);
        });
      document.body.addEventListener('click', (event) => {
        const koakuma = Koakuma.$children[0];
        if (!event.target.closest('#koakuma-bookmark-input-usual-switch')) {
          koakuma.usualSwitchOn = false;
        }
        if (!event.target.closest('#koakuma-sorting-order-select-switch')) {
          koakuma.sortingOrderSwitchOn = false;
        }
        if (vuexStore.getters['contextMenu/active']) {
          vuexStore.commit('contextMenu/deactivate');
        }
      });
      if (vuexStore.getters.MPT === MAIN_PAGE_TYPE.SEARCH) {
        const menuItems = $('ul.menu-items');
        [...menuItems.children].forEach((item, index) => {
          const textContent = item.textContent;
          const a = $el('a', { href: 'javascript:;', textContent });
          item.removeChild(item.firstChild);
          item.appendChild(a);
          item.addEventListener('click', () => {
            [...menuItems.children].forEach(_item => _item.classList.remove('current'));
            item.classList.add('current');
            const target = $('#koakuma-bookmark-tags-filter-input');
            if (index === 1) {
              target.value = '-R-18';
            } else if (index === 2) {
              target.value = 'R-18';
            } else {
              target.value = '';
            }
            Koakuma.$children[0].tagsFilterInput({ target });
          });
        });
      }
      Object.assign(unsafeWindow, {
        Koakuma,
        Marisa,
        Patchouli,
        vuexStore,
      });
    })
    .catch($print.error);

}(Vue,VueI18n,Vuex));
