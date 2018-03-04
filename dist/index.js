(function (Vue,Vuex) {
'use strict';

Vue = Vue && Vue.hasOwnProperty('default') ? Vue['default'] : Vue;
Vuex = Vuex && Vuex.hasOwnProperty('default') ? Vuex['default'] : Vuex;

function $(selector) {
  return document.querySelector(selector);
}

function $el(tag, attr = {}, cb = () => {}) {
  const el = document.createElement(tag);
  Object.assign(el, attr);
  cb(el);
  return el;
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
  state: {
    pageType,
    koakumaMountPoint: null,
    patchouliMountPoint: null,
    VERSION: GM_info.script.version,
    NAME: GM_info.script.name
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

var koakuma = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_vm._v(" Hello, world ")])},staticRenderFns: [],_scopeId: 'data-v-bbceb720',

}

var patchouli = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_vm._v(" Hello, world ")])},staticRenderFns: [],_scopeId: 'data-v-0d7c8440',

}

store.commit('prepareMountPoint');

const Patchouli = new Vue({
  store,
  render: h => h(patchouli)
});

const Koakuma = new Vue({
  store,
  render: h => h(koakuma)
});

}(Vue,Vuex));
