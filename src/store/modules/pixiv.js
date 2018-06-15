import { PixivAPI } from '../../lib/pixiv';
import { $print, toInt } from '../../lib/utils';

function makeNewTag(tag) {
  if (tag.translation) {
    const trs = Object.values(tag.translation);
    return [tag.tag, ...trs].join(', ');
  }
  return [tag.tag, tag.romaji].join(', ');
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
        thumb: illustData.urls.thumb
      },
      _show: true
    };

    if (pageType === 'MY_BOOKMARK') {
      d.bookmarkId = illustData.bookmarkData.id;
    }

    vLibrary.push(d);
  }

  return vLibrary;
}

export default {
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
    }
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
        $print.debug('PixivModule#startNextUrlBased: page:', page);

        state.nextUrl = page.nextUrl;

        const illustDataGroup = await PixivAPI.getIllustDataGroup(page.illustIds);
        $print.debug('PixivModule#startNextUrlBased: illustDataGroup:', illustDataGroup);

        const userIds = Object.values(illustDataGroup).map(d => d.userId);
        const userDataGroup = await PixivAPI.getUserDataGroup(userIds);
        $print.debug('PixivModule#startNextUrlBased: userDataGroup:', userDataGroup);

        const libraryData = makeLibraryData({
          pageType: rootState.pageType,
          illustDataGroup,
          userDataGroup,
        });

        // prevent duplicate illustId
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
    }
  }
};
