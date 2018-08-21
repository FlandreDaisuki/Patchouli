import { PixivAPI } from '../../lib/pixiv';
import { $print, toInt } from '../../lib/utils';
import { MAIN_PAGE_TYPE as MPT } from '../../lib/enums';

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
      MPT.NEW_PROFILE,
      MPT.NEW_PROFILE_ILLUST,
      MPT.NEW_PROFILE_MANGA,
      MPT.NEW_PROFILE_BOOKMARK,
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
  async start({ state, commit, dispatch, rootGetters }, { times = Infinity, force = false, isFirst = false } = {}) {
    commit('resume');

    if (force) {
      commit('relive');
    }

    if (state.isEnded || times <= 0) {
      return;
    }

    if (rootGetters.isNewProfilePage && isFirst) {
      const profile = await PixivAPI.getUserProfileData(rootGetters.sp.id);
      state.prefetchPool.illusts.push(...Object.keys(profile.illusts));
      state.prefetchPool.manga.push(...Object.keys(profile.manga));

      // from new → old
      state.prefetchPool.illusts.sort((i, j) => j - i);
      state.prefetchPool.manga.sort((i, j) => j - i);

      $print.debug('vuexMudule/pixiv#start: prefetchPool.illusts:', state.prefetchPool.illusts);
      $print.debug('vuexMudule/pixiv#start: prefetchPool.manga:', state.prefetchPool.manga);
    }

    $print.debug('vuexMudule/pixiv#start: MPT:', rootGetters.MPT);

    switch (rootGetters.MPT) {
    case MPT.SEARCH:
    case MPT.FOLLOWED_NEWS:
    case MPT.ANCIENT_FOLLOWED_NEWS:
    case MPT.SELF_BOOKMARK:
      await dispatch('startNextUrlBased', { times });
      break;
    case MPT.NEW_PROFILE:
      await dispatch('startPrefetchBased', { pool: 'all', times  });
      break;
    case MPT.NEW_PROFILE_ILLUST:
      await dispatch('startPrefetchBased', { pool: 'illusts', times });
      break;
    case MPT.NEW_PROFILE_MANGA:

      await dispatch('startPrefetchBased', { pool: 'manga', times });
      break;
    case MPT.NEW_PROFILE_BOOKMARK:
      await dispatch('startMovingWindowBased', { times });
      break;
    default:
      $print.error('Unknown main page type', rootGetters.MPT);
      break;
    }
  },
  async startMovingWindowBased({ state, commit, rootGetters }, { times = Infinity, rest = null } = {}) {
    while (!state.isPaused && !state.isEnded && times) {
      let illustIds = [], maxTotal = Infinity;
      const _rest = rest || rootGetters.sp.rest;
      const _uid = rootGetters.sp.id;
      let cIndex = (_rest === 'show') ? state.moveWindowIndex : state.moveWindowPrivateBookmarkIndex;
      if (rootGetters.isNewProfilePage) {
        const opt = { limit: state.batchSize, offset: cIndex, rest: _rest };
        const { works, total } = await PixivAPI.getUserBookmarkData(_uid, opt);
        $print.debug('vuexMudule/pixiv#startMovingWindowBased: works:', works);
        if (!works) {
          commit('stop');
          break;
        }
        maxTotal = total;
        illustIds.push(...works.map((d) => d.id));
      }

      cIndex += state.batchSize;

      if (rootGetters.isNewProfilePage && _rest === 'hide') {
        state.moveWindowPrivateBookmarkIndex = cIndex;
      } else {
        state.moveWindowIndex = cIndex;
      }

      const illustDataGroup = await PixivAPI.getIllustDataGroup(illustIds);
      $print.debug('vuexMudule/pixiv#startMovingWindowBased: illustDataGroup:', illustDataGroup);

      const userIds = Object.values(illustDataGroup).map(d => d.userId);
      const userDataGroup = await PixivAPI.getUserDataGroup(userIds);
      $print.debug('vuexMudule/pixiv#startMovingWindowBased: userDataGroup:', userDataGroup);

      const libraryData = makeLibraryData({
        illustDataGroup,
        userDataGroup,
      });

      // prevent duplicate illustId
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

      if ([MPT.SEARCH, MPT.FOLLOWED_NEWS].includes(rootGetters.MPT)) {
        page = await PixivAPI.getIllustIdsInPageHTML(state.nextUrl);
      } else {
        page = await PixivAPI.getIllustIdsInLegacyPageHTML(state.nextUrl);
      }
      $print.debug('vuexMudule/pixiv#startNextUrlBased: page:', page);

      state.nextUrl = page.nextUrl;

      const illustDataGroup = await PixivAPI.getIllustDataGroup(page.illustIds);
      $print.debug('vuexMudule/pixiv#startNextUrlBased: illustDataGroup:', illustDataGroup);

      const userIds = Object.values(illustDataGroup).map(d => d.userId);
      const userDataGroup = await PixivAPI.getUserDataGroup(userIds);
      $print.debug('vuexMudule/pixiv#startNextUrlBased: userDataGroup:', userDataGroup);

      const libraryData = makeLibraryData({
        illustDataGroup,
        userDataGroup,
      });

      // prevent duplicate illustId
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
    $print.debug('vuexMudule/pixiv#startPrefetchBased: todoPool:', todoPool);

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
      $print.debug('vuexMudule/pixiv#startPrefetchBased: illustDataGroup:', illustDataGroup);

      const userIds = Object.values(illustDataGroup).map(d => d.userId);
      const userDataGroup = await PixivAPI.getUserDataGroup(userIds);
      $print.debug('vuexMudule/pixiv#startPrefetchBased: userDataGroup:', userDataGroup);

      const libraryData = makeLibraryData({
        illustDataGroup,
        userDataGroup,
      });

      // prevent duplicate illustId
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

export default {
  actions,
  getters,
  mutations,
  namespaced: true,
  state,
};
