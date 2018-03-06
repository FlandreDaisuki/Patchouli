// ==UserScript==
// @name              Patchouli.dev
// @name:ja           パチュリー.dev
// @name:zh-CN        帕秋莉.dev
// @name:zh-TW        帕秋莉.dev
// @namespace         https://github.com/FlandreDaisuki
// @description       An image searching/browsing tool on Pixiv
// @description:ja    Pixiv 検索機能強化
// @description:zh-CN Pixiv 搜寻/浏览 工具
// @description:zh-TW Pixiv 搜尋/瀏覽 工具
// @include           *://www.pixiv.net/*
// @require           https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.13/vue.js
// @require           https://cdnjs.cloudflare.com/ajax/libs/vuex/3.0.1/vuex.js
// @require           https://cdnjs.cloudflare.com/ajax/libs/axios/0.17.1/axios.js
// @icon              http://i.imgur.com/VwoYc5w.png
// @noframes
// @author            FlandreDaisuki
// @license           The MIT License (MIT) Copyright (c) 2016-2018 FlandreDaisuki
// @compatible        firefox >=52
// @compatible        chrome >=55
// @version           4.0.0
// @grant             none
// ==/UserScript==

(function (Vue,Vuex) {
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

__$styleInject("/*# sourceMappingURL=Koakuma.vue.map */\n/*# sourceMappingURL=Patchouli.vue.map */\n/*# sourceMappingURL=DefaultImageItem.vue.map */\n.image-flexbox[data-v-3c187ee4] {\n  display: -webkit-box;\n  display: -webkit-flex;\n  display: flex;\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n  -webkit-flex-flow: column;\n  flex-flow: column;\n  -webkit-box-pack: center;\n  -webkit-justify-content: center;\n  justify-content: center;\n  -webkit-box-align: center;\n  -webkit-align-items: center;\n  align-items: center;\n  z-index: 0;\n  border: 1px solid #000;\n  border: 1px solid rgba(0, 0, 0, 0.04);\n  min-width: 88px;\n  min-height: 88px;\n  position: relative;\n}\n.top-right-slot[data-v-3c187ee4] {\n  -webkit-box-flex: 0;\n  -webkit-flex: none;\n  flex: none;\n  display: -webkit-box;\n  display: -webkit-flex;\n  display: flex;\n  -webkit-box-align: center;\n  -webkit-align-items: center;\n  align-items: center;\n  z-index: 1;\n  box-sizing: border-box;\n  margin: 0 0 -24px auto;\n  padding: 6px;\n  height: 24px;\n  background: #000;\n  background: rgba(0, 0, 0, 0.4);\n  border-radius: 0 0 0 4px;\n  color: #fff;\n  font-size: 12px;\n  line-height: 1;\n  font-weight: 700;\n}\n.multiple-icon[data-v-3c187ee4] {\n  display: inline-block;\n  margin-right: 4px;\n  width: 10px;\n  height: 10px;\n  background: url(https://source.pixiv.net/www/js/bundle/3b9b0b9e331e13c46aeadaea83132203.svg);\n}\n.ugoira-icon[data-v-3c187ee4] {\n  position: absolute;\n  -webkit-box-flex: 0;\n  -webkit-flex: none;\n  flex: none;\n  width: 40px;\n  height: 40px;\n  background: url(https://source.pixiv.net/www/js/bundle/f608d897f389e8161e230b817068526d.svg)\n    50% no-repeat;\n  top: 50%;\n  left: 50%;\n  margin: -20px 0 0 -20px;\n}\n/*# sourceMappingURL=DefaultImageItemTitle.vue.map */");

function $(selector) {
  return document.querySelector(selector);
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

function $error(...args) {
  console.error.apply(console, args);
}

function $debug(...args) {
  console.debug.apply(console, args);
}

(() => {
  Math.clamp = (val, min, max) => Math.min(Math.max(min, val), max);
  Number.toInt = (s) => (isNaN(~~s) ? 0 : ~~s);

  // from: https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/after()/after().md
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

// (get|post)Name(HTMLDetail|APIDetail)s?

class Pixiv {
  constructor() {
    this.tt = $('input[name="tt"]').value;
  }

  async fetch(url) {
    try {
      $debug('Pixiv#fetch: url:', url);
      if (url) {
        const res = await axios.get(url);
        if (res.statusText !== 'OK') {
          throw new Error(res.statusText);
        } else {
          return res.data;
        }
      } else {
        $error('Pixiv#fetch has no url');
      }
    } catch (error) {
      $error('Pixiv#fetch: error:', error);
    }
  }

  async getLegacyPageHTMLIllustIds(url, { needBookmarkId } = { needBookmarkId: false }) {
    try {
      const html = await this.fetch(url);
      const nextTag = html.match(/class="next"[^/]*/);

      let nextURL = '';
      if (nextTag) {
        const nextHref = nextTag[0].match(/href="([^"]+)"/);
        if (nextHref) {
          const query = nextHref[1].replace(/&amp;/g, '&');
          if (query) {
            nextURL = `${location.pathname}${query}`;
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
        nextURL,
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
      $error('Pixiv#getLegacyPageHTMLIllustIds: error:', error);
    }
  }

  async getPageHTMLIllustIds(url) {
    try {
      const html = await this.fetch(url);
      const nextTag = html.match(/class="next"[^/]*/);

      let nextURL = '';
      if (nextTag) {
        const nextHref = nextTag[0].match(/href="([^"]+)"/);
        if (nextHref) {
          const query = nextHref[1].replace(/&amp;/g, '&');
          if (query) {
            nextURL = `${location.pathname}${query}`;
          }
        }
      }

      const iidHTMLs = html.match(/illustId&quot;:&quot;(\d+)&quot;/g) || [];
      $debug('Pixiv#getPageHTMLIllustIds: iidHTMLs:', iidHTMLs);

      const illustIds = [];
      for (const dataid of iidHTMLs) {
        const iid = dataid.replace(/\D+(\d+).*/, '$1');
        if (!illustIds.includes(iid) && iid !== '0') {
          illustIds.push(iid);
        }
      }

      const ret = {
        nextURL,
        illustIds
      };
      return ret;
    } catch (error) {
      $error('Pixiv#getPageHTMLIllustIds: error:', error);
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
      $error('Pixiv#getBookmarkHTMLDetail: error:', error);
    }
  }

  async getIllustsAPIDetail(illustIds) {
    const iids = illustIds.join(',');
    const url = `/rpc/index.php?mode=get_illust_detail_by_ids&illust_ids=${iids}&tt=${this.tt}`;

    try {
      const json = await this.fetch(url);
      $debug('Pixiv#getIllustsAPIDetail: json:', json);
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
      $error('Pixiv#getIllustsAPIDetail: error:', error);
    }
  }

  async getUsersAPIDetail(userIds) {
    const uids = [...new Set(userIds)].join(',');
    const url = `/rpc/get_profile.php?user_ids=${uids}&tt=${this.tt}`;

    try {
      const json = await this.fetch(url);
      $debug('Pixiv#getUsersAPIDetail: json:', json);
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
      $error('Pixiv#getUsersAPIDetail: error:', error);
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
      $error('Pixiv#getRecommendationsAPIDetails: error:', error);
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
    const data = searchParams.entries.map(p => p.join('=')).join('&');
    const config = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    };

    try {
      const res = await axios.post('/rpc/index.php', data, config);
      if (res.statusText === 'OK') {
        $debug('Pixiv#postBookmarkAdd: res.data:', res.data);
        return !res.data.error;
      } else {
        throw new Error(res.statusText);
      }
    } catch (error) {
      $error('Pixiv#postBookmarkAdd: error:', error);
    }
  }

  static removeAnnoyings(doc = document) {
    const annoyings = [
      'iframe',
      // Ad
      '.ad',
      '.ads_area',
      '.ad-footer',
      '.ads_anchor',
      '.ads-top-info',
      '.comic-hot-works',
      '.user-ad-container',
      '.ads_area_no_margin',
      // Premium
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
}

var PixivAPI = new Pixiv;

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

var pixiv = {
  state: {
    imgLibrary: [],
    isPaused: true,
    isEnded: false,
    nextURL: location.href
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
    async start({ state, dispatch, rootState }, { times }) {
      times = times || Infinity;

      if (state.isEnded || times <= 0) {
        return;
      }

      switch (rootState.pageType) {
      case 'SEARCH':
      case 'NEW_ILLUST':
      case 'MY_BOOKMARK':
      case 'MEMBER_ILLIST':
        await dispatch('startNextUrlBased', { times });
        break;
      default:
        break;
      }
    },
    async startNextUrlBased({ state, commit, rootState }, { times }) {
      state.isPaused = false;

      while (!state.isPaused && !state.isEnded && times) {
        let page = null;
        if (rootState.pageType === 'SEARCH') {
          page = await PixivAPI.getPageHTMLIllustIds(state.nextURL);
        } else {
          page = await PixivAPI.getLegacyPageHTMLIllustIds(state.nextURL, {
            needBookmarkId: rootState.pageType === 'MY_BOOKMARK'
          });
        }
        $debug('PixivModule#startNextUrlBased: page:', page);

        state.nextURL = page.next_url;

        // {[illustId : IDString]: illust_detail}
        const illustAPIDetails = await PixivAPI.getIllustsAPIDetail(page.illustIds);
        $debug('PixivModule#startNextUrlBased: illustAPIDetails:', illustAPIDetails);

        if (rootState.pageType === 'MY_BOOKMARK') {
          // {[illustId : IDString]: {
          //   illustId,
          //   bookmarkId
          // }}
          const myBookmarkAPIDetails = page.bookmarkIds;
          for (const [illustId, illustDetail] of Object.entries(illustAPIDetails)) {
            const bookmarkId = myBookmarkAPIDetails[illustId].bookmarkId;
            if (bookmarkId) {
              illustDetail.bookmarkId = bookmarkId;
            }
          }
          $debug('PixivModule#startNextUrlBased: myBookmarkAPIDetails:', myBookmarkAPIDetails);
        }

        // {[illustId : IDString]: {
        //   illustId,
        //   bookmarkCount,
        //   tags: string[]
        // }}
        const bookmarkHTMLDetails = await PixivAPI.getBookmarkHTMLDetails(Object.keys(illustAPIDetails));
        $debug('PixivModule#startNextUrlBased: bookmarkHTMLDetails:', bookmarkHTMLDetails);

        const userIds = Object.values(illustAPIDetails).map(d => d.user_id);
        // {[user_id : IDString]: {
        // userId,
        // isFollow
        // }}
        const userAPIDetails = await PixivAPI.getUsersAPIDetail(userIds);
        $debug('PixivModule#startNextUrlBased: userAPIDetails:', userAPIDetails);

        const libraryData = makeLibraryData({ pageType: rootState.pageType, illustAPIDetails, bookmarkHTMLDetails, userAPIDetails });
        state.imgLibrary.push(...libraryData);

        times -= 1;
        if (!times) {
          commit('pause');
        }

        if (!state.nextURL) {
          commit('stop');
        }
      }
    }
  },
  getters: {
    filteredLibrary(state, getters, rootState) {
      const cloneLibrary = state.imgLibrary.slice();
      return cloneLibrary
        .filter(el => el.bookmarkCount >= rootState.filters.limit)
        .filter(el => el.tags.match(rootState.filters.tag))
        .sort(
          (a, b) =>
            Number.toInt(b[rootState.filters.orderBy]) -
            Number.toInt(a[rootState.filters.orderBy])
        );
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
  case '/bookmark_new_illust.php':
  case '/new_illust.php':
  case '/mypixiv_new_illust.php':
  case '/new_illust_r18.php':
  case '/bookmark_new_illust_r18.php':
    return 'NEW_ILLUST';
  case '/member_illust.php':
    return spId ? 'MEMBER_ILLIST' : 'NO_SUPPORT';
  case '/bookmark.php': {
    if (spId) {
      return 'NEW_ILLUST';
    } else if (!spType || spType === 'illust_all') {
      return 'MY_BOOKMARK';
    } else {
      // e.g. http://www.pixiv.net/bookmark.php?type=reg_user
      return 'NO_SUPPORT';
    }
  }
  default:
    return 'NO_SUPPORT';
  }
})();

var store = new Vuex.Store({
  modules: { pixiv },
  state: {
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
        } else {
          const li = $('li.image-item');
          const ul = $('ul._image-items');
          state.patchouliMountPoint = li ? li.parentElement : ul;
        }
      }
    }
  }
});

var koakuma = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_vm._v(" Hello, world ")])},staticRenderFns: [],_scopeId: 'data-v-430ffdfb',

};

var DefaultImageItemImage = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"image-item-image"},[_c('a',{staticClass:"image-flexbox",attrs:{"rel":"noopener","href":_vm.illustPageURL}},[(_vm.illustPageCount > 1)?_c('div',{staticClass:"top-right-slot"},[_c('span',[_c('span',{staticClass:"multiple-icon"}),_vm._v(" "+_vm._s(_vm.illustPageCount))])]):_vm._e(),_vm._v(" "),_c('img',{attrs:{"data-src":_vm.imgUrl,"src":_vm.imgUrl}}),_vm._v(" "),(_vm.isUgoira)?_c('div',{staticClass:"ugoira-icon"}):_vm._e()])])},staticRenderFns: [],_scopeId: 'data-v-3c187ee4',
  props: {
    imgUrl: {
      type: String,
      default: ''
    },
    illustId: {
      type: String,
      default: ''
    },
    illustPageCount: {
      type: Number,
      default: 1
    },
    isUgoira: {
      type: Boolean,
      default: false
    },
  },
  computed: {
    illustPageUrl() {
      return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;
    }
  }
};

var DefaultImageItemTitle = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('figcaption',{staticClass:"image-item-title"},[_c('ul',[_c('li',{staticClass:"title-text"},[_c('a',{attrs:{"href":_vm.illustPageUrl,"title":_vm.illustTitle}},[_vm._v(_vm._s(_vm.illustTitle))])]),_vm._v(" "),(!_vm.isMemberIllistPage)?_c('li',[_c('a',{staticClass:"user-link ui-profile-popup",attrs:{"target":"_blank","href":_vm.userPageUrl,"title":_vm.userName,"data-user_id":_vm.userId,"data-user_name":_vm.userName}},[_c('span',{staticClass:"user-img",style:(_vm.profileImgStyle)}),_vm._v(" "),_c('span',[_vm._v(_vm._s(_vm.userName))])])]):_vm._e(),_vm._v(" "),(_vm.bookmarkCount > 0)?_c('li',[_c('ul',{staticClass:"count-list"},[_c('li',[_c('a',{staticClass:"_ui-tooltip bookmark-count",attrs:{"href":_vm.bookmarkDetailUrl}},[_c('i',{staticClass:"_icon _bookmark-icon-inline"}),_vm._v(" "+_vm._s(_vm.bookmarkCount)+" ")])])])]):_vm._e()])])},staticRenderFns: [],_scopeId: 'data-v-d20319ea',
  props: {
    illustId: {
      type: String,
      default: ''
    },
    illustTitle: {
      type: String,
      default: ''
    },
    userName: {
      type: String,
      default: ''
    },
    userId: {
      type: String,
      default: ''
    },
    profileImgUrl: {
      type: String,
      default: ''
    },
    bookmarkCount: {
      type: Number,
      default: 0
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
    // bookmarkTooltipMsg() {
    //   return this.bookmarkTooltipMsgFunc(this.bookmarkCount);
    // },
    profileImgStyle() {
      return {
        backgroundImage: `url(${this.profileImgUrl})`
      };
    },
    isMemberIllistPage() {
      return this.$store.state.pageType === 'MEMBER_ILLIST';
    }
  }
};

// const baseStringPropType = {
//   type: String,
//   default: ''
// };
// x = {
//   type: Number,
//   default: 1
// };

var DefaultImageItem = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"image-item"},[_c('figure',{staticClass:"image-item-inner"},[_c('DefaultImageItemImage',{attrs:{"img-url":_vm.imgUrl,"illust-id":_vm.illustId,"illust-page-count":_vm.illustPageCount,"is-ugoira":_vm.isUgoira,"is-bookmarked":_vm.isBookmarked,"bookmark-id":_vm.bookmarkId}}),_vm._v(" "),_c('DefaultImageItemTitle',{attrs:{"illust-id":_vm.illustId,"illust-title":_vm.illustTitle,"user-name":_vm.userName,"user-id":_vm.userId,"profile-img-url":_vm.profileImgUrl,"bookmark-count":_vm.bookmarkCount,"page-type":_vm.pageType}})],1)])},staticRenderFns: [],_scopeId: 'data-v-f6c8e106',
  components: { DefaultImageItemImage, DefaultImageItemTitle },
  props: {
    imgUrl: {
      type: String,
      default: ''
    },
    illustId: {
      type: String,
      default: ''
    },
    illustTitle: {
      type: String,
      default: ''
    },
    illustPageCount: {
      type: Number,
      default: 1
    },
    userName: {
      type: String,
      default: ''
    },
    userId: {
      type: String,
      default: ''
    },
    profileImgUrl: {
      type: String,
      default: ''
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
      default: ''
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

var patchouli = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{attrs:{"id":"patchouli"}},_vm._l((_vm.filteredLibrary),function(d){return _c('DefaultImageItem',{key:d.illustId,attrs:{"img-url":d.url.sq240,"illust-id":d.illustId,"illust-title":d.illustTitle,"illust-page-count":d.illustPageCount,"is-ugoira":d.isUgoira,"user-name":d.userName,"user-id":d.userId,"profile-img-url":d.profileImg,"bookmark-count":d.bookmarkCount,"is-bookmarked":d.isBookmarked,"bookmark-id":d.bookmarkId}})}))},staticRenderFns: [],_scopeId: 'data-v-39c8e0ab',
  components: { DefaultImageItem },
  computed: {
    filteredLibrary() {
      return this.$store.getters.filteredLibrary;
    },
    // ...mapGetters(['filteredLibrary']),
    // ...mapState(['pageType'])
  }
};

store.commit('prepareMountPoint');

const Patchouli = new Vue({
  store,
  render: h => h(patchouli)
});

const Koakuma = new Vue({
  store,
  render: h => h(koakuma)
});

store.dispatch('start', { times: 1 }).then(() => {
  Patchouli.$mount(store.state.patchouliMountPoint);
  Koakuma.$mount(store.state.koakumaMountPoint);
}).catch(error => {
  $error('Fail to first mount', error);
});

window.store = store;
window.Patchouli = Patchouli;
window.Koakuma = Koakuma;

}(Vue,Vuex));
