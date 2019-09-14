import Vue from 'vue';
import Vuex from 'vuex';
import { InitError } from '../lib/errors';
import { MAIN_PAGE_TYPE as MPT, SORT_TYPE as ST } from '../lib/enums';
import { $, $el, $$, $print, $ready } from '../lib/utils';
import { removeAnnoyings } from '../lib/pixiv';
import pixiv from './modules/pixiv';
import contextMenu from './modules/contextMenu';
import coverLayer from './modules/coverLayer';

Vue.use(Vuex);

const _isSelfBookmarkPage = (mpt, loginId, uid) => {
  return (
    mpt === MPT.SELF_BOOKMARK ||
    (mpt === MPT.NEW_PROFILE_BOOKMARK &&
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

const state = {
  NAME: GM_info.script.name,
  VERSION: GM_info.script.version,
  config: {
    blacklist: [],
    contextMenu: 1,
    croppedThumb: 1,
    fitwidth: 1,
    hoverPlay: 1,
    sort: ST.ILLUST_ID,
    userTooltip: 1,
  },
  filters: {
    limit: 0,
    query: '',
  },
  locale: document.documentElement.lang.toLowerCase(),
  loginData: null,
  mainPageType: MPT.NO_SUPPORT,
  mountPointCoverLayer: null,
  mountPointCtrlPanel: null,
  mountPointMainView: null,
  searchParam: {},
  unbookmarkedOnly: false, // need not save to config
};

const getters = {
  MPT: (state) => state.mainPageType,
  config: (state) => state.config,
  filters: (state) => state.filters,
  isSelfBookmarkPage: (state) => _isSelfBookmarkPage(state.mainPageType, state.loginData.id, state.searchParam.id),
  locale: (state) => state.locale,
  loginData: (state) => state.loginData,
  mountPointCoverLayer: (state) => state.mountPointCoverLayer,
  mountPointCtrlPanel: (state) => state.mountPointCtrlPanel,
  mountPointMainView: (state) => state.mountPointMainView,
  orderBy: (state) => {
    switch (state.config.sort) {
    case ST.ILLUST_ID:
      return 'illustId';
    case ST.BOOKMARK_ID:
      return 'bookmarkId';
    case ST.BOOKMARK_COUNT:
      return 'bookmarkCount';
    default:
      $print.error('VuexStore#getters.orderBy:', state.config.sort);
      return 'illustId';
    }
  },
  sp: (state) => state.searchParam,
  unbookmarkedOnly: (state) => state.unbookmarkedOnly,
};

const mutations = {
  afterInit: (state) => {
    const _sbp = _isSelfBookmarkPage(state.mainPageType, state.loginData.id, state.searchParam.id);
    if (_sbp) {
      state.config.sort = ST.BOOKMARK_ID;
    } else if (state.config.sort === ST.BOOKMARK_ID) {
      state.config.sort = ST.ILLUST_ID;
    }

    if (state.mainPageType === MPT.SELF_BOOKMARK) {
      for (const marker of $$('.js-legacy-mark-all, .js-legacy-unmark-all')) {
        marker.addEventListener('click', () => {
          $$('input[name="book_id[]"]').forEach(el => {
            el.checked = marker.classList.contains('js-legacy-mark-all');
          });
        });
      }

      const sp = state.searchParam;
      if (sp.order && sp.order.includes('date')) {
        state.config.sort = ST.ILLUST_ID;
      } else {
        state.config.sort = ST.BOOKMARK_ID;
      }
    }

    removeAnnoyings();
  },
  applyConfig: (state) => {
    if (state.mainPageType !== MPT.NO_SUPPORT) {
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
    $print.debug('vuexStore#setMainPageType: payload:', payload);

    if (payload.forceSet) {
      state.mainPageType = payload.forceSet;
    } else {
      const path = location.pathname;
      const sp = state.searchParam;

      switch (path) {
      case '/search.php':
        state.mainPageType = MPT.SEARCH;
        break;
      case '/bookmark_new_illust_r18.php':
      case '/bookmark_new_illust.php':
        state.mainPageType = MPT.FOLLOWED_NEWS;
        break;
      case '/new_illust.php':
      case '/mypixiv_new_illust.php':
      case '/new_illust_r18.php':
        state.mainPageType = MPT.ANCIENT_FOLLOWED_NEWS;
        break;
      case '/member.php':
        state.mainPageType = MPT.NEW_PROFILE;
        break;
      case '/member_illust.php':
        if (sp.mode) {
          state.mainPageType = MPT.NO_SUPPORT;
          break;
        }

        if (sp.type === 'manga') {
          state.mainPageType = MPT.NEW_PROFILE_MANGA; // pool = manga
        } else if (sp.type === 'illust') {
          state.mainPageType = MPT.NEW_PROFILE_ILLUST; // pool = illusts
        } else { // !sp.type
          state.mainPageType = MPT.NEW_PROFILE; // pool = all (illusts + manga)
        }
        break;
      case '/bookmark.php': {
        if (sp.type === 'user' || sp.type === 'reg_user') {
          // ?id={userId}&type=user
          // ?id={userId}&type=reg_user
          state.mainPageType = MPT.NO_SUPPORT;
        }
        else if (sp.id) {
          // ?id={userId}
          // ?id={userId}&rest=show
          // ?id={userId}&rest=hide
          state.mainPageType =  MPT.NEW_PROFILE_BOOKMARK;
        } else {
          // ?
          // ?untagged=1
          // ?type=illust_all
          state.mainPageType = MPT.SELF_BOOKMARK;
        }
        break;
      }
      default:
        state.mainPageType = MPT.NO_SUPPORT;
        break;
      }
    }

    const _sbp = _isSelfBookmarkPage(state.mainPageType, state.loginData.id, state.searchParam.id);
    if (!_sbp && state.config.sort === ST.BOOKMARK_ID) {
      state.config.sort = ST.ILLUST_ID;
    }
  },
  toggleUnbookmarkedOnly: (state) => {
    state.unbookmarkedOnly = !state.unbookmarkedOnly;
  },
  updateSearchParam: (state) => {
    state.searchParam = _getSearchParam();
  },
};

const actions = {
  init: async({ state, commit, dispatch }) => {
    // init loginData
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

    // determine mainPageType
    commit('setMainPageType');

    if (state.mainPageType !== MPT.NO_SUPPORT) {
      commit('loadConfig');

      // set mount points by mainPageType
      await dispatch('setMountPoints');

      // others
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
        await $ready(() => $('.sLHPYEz, ._3CsQgM9'));
        $('.sLHPYEz, ._3CsQgM9').parentNode.insertAdjacentElement('afterend', el);
      } else {
        $('header._global-header').insertAdjacentElement('afterend', el);
      }
    });

    switch (state.mainPageType) {
    case MPT.SEARCH:
      state.mountPointMainView = $('#js-react-search-mid');
      break;
    case MPT.FOLLOWED_NEWS:
      state.mountPointMainView = $('#js-mount-point-latest-following');
      break;
    case MPT.ANCIENT_FOLLOWED_NEWS:
      state.mountPointMainView = $('ul._image-items');
      break;
    case MPT.NEW_PROFILE:
    case MPT.NEW_PROFILE_BOOKMARK:
    case MPT.NEW_PROFILE_ILLUST:
    case MPT.NEW_PROFILE_MANGA:
      await $ready(() => $('.g4R-bsH, ._9GTeZI7'));
      // eslint-disable-next-line require-atomic-updates
      state.mountPointMainView = $('.g4R-bsH, ._9GTeZI7');
      break;
    case MPT.SELF_BOOKMARK:
      state.mountPointMainView = $('.display_editable_works');
      break;
    default:
      break;
    }

  },
};

export default new Vuex.Store({
  actions,
  getters,
  modules,
  mutations,
  state,
});
