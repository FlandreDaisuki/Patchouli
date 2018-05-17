import Vue from 'vue';
import Vuex from 'vuex';
import { $, $el, $$ } from '../lib/utils';
import pixiv from './modules/pixiv';
import contextMenu from './modules/contextMenu';

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
      // e.g. http://www.pixiv.net/bookmark.php?type=reg_user
      return 'NO_SUPPORT';
    }
  }
  default:
    return 'NO_SUPPORT';
  }
})();

export default new Vuex.Store({
  modules: { pixiv, contextMenu },
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
