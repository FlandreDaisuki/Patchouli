import Vue from 'vue';
import Vuex from 'vuex';
import { InitError } from '../lib/errors';
import { MAIN_PAGE_TYPE as MPT, SORT_TYPE as ST } from '../lib/enums';
import { $, $el, $$, $after, $print, $ready } from '../lib/utils';
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
    fitwidth: 1,
    hoverPlay: 1,
    sort: ST.ILLUST_ID,
    userTooltip: 1,
  },
  ctrlPanelOffsetY: 0,
  filters: {
    limit: 0,
    tag: new RegExp('', 'i'),
  },
  locale: document.documentElement.lang.toLowerCase(),
  loginData: null,
  mainPageType: MPT.NO_SUPPORT,
  mountPointCoverLayer: null,
  mountPointCtrlPanel: null,
  mountPointMainView: null,
  searchParam: {},
};

const getters = {
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
};

const mutations = {
  afterInit: (state) => {
    if (state.mainPageType === MPT.SELF_BOOKMARK) {
      for (const marker of $$('.js-legacy-mark-all, .js-legacy-unmark-all')) {
        marker.addEventListener('click', () => {
          $$('input[name="book_id[]"]').forEach(el => {
            el.checked = marker.classList.contains('js-legacy-mark-all');
          });
        });
      }
    }
    const _sbp = _isSelfBookmarkPage(state.mainPageType, state.loginData.id, state.searchParam.id);
    if (!_sbp && state.config.sort === ST.BOOKMARK_ID) {
      state.config.sort = ST.ILLUST_ID;
    }
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
    if (payload.forceSet) {
      $print.debug('vuexStore#setMainPageType: payload:', payload);
      state.mainPageType = payload.forceSet;
      return;
    }

    const path = location.pathname;
    const _id = state.searchParam.id;
    const _type = state.searchParam.type;
    const _mode = state.searchParam.mode;

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
      if (_mode) {
        state.mainPageType = MPT.NO_SUPPORT;
        break;
      }
      // MPT.NEW_PROFILE_ILLUST: (_type === 'illust') || (!_type)
      if (_type === 'manga') {
        state.mainPageType = MPT.NEW_PROFILE_MANGA; // pool = manga
      } else if (_type === 'illust') {
        state.mainPageType = MPT.NEW_PROFILE_ILLUST; // pool = illusts
      } else { // !_type
        state.mainPageType = MPT.NEW_PROFILE; // pool = all (illusts + manga)
      }
      break;
    case '/bookmark.php': {
      state.mainPageType = (!_id) ? MPT.SELF_BOOKMARK : MPT.NEW_PROFILE_BOOKMARK;
      break;
    }
    default:
      state.mainPageType = MPT.NO_SUPPORT;
      break;
    }
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

    commit('loadConfig');

    // set mount points by mainPageType
    await dispatch('setMountPoints');

    // others
    commit('afterInit');
    commit('applyConfig');
    commit('saveConfig');
  },
  setMountPoints: async({ state, getters }) => {
    const mpt = state.mainPageType;
    if (mpt !== MPT.NO_SUPPORT) {

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
        await $ready(() => $('.g4R-bsH'));
        state.mountPointMainView = $('.g4R-bsH');
        break;
      case MPT.SELF_BOOKMARK:
        state.mountPointMainView = $('.display_editable_works');
        break;
      default:
        break;
      }
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
