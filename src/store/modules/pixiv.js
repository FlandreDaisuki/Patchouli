import { PixivAPI } from '../../lib/pixiv';
import { $print, toInt } from '../../lib/utils';

function makeLibraryData({ pageType, illustAPIDetails, bookmarkHTMLDetails, userAPIDetails, illustHTMLDetails }) {
  if (!illustAPIDetails || !Object.keys(illustAPIDetails).length) {
    throw new Error('makeLibraryData: illustAPIDetails is falsy.');
  }

  const vLibrary = [];

  for (const [illustId, illustDetail] of Object.entries(illustAPIDetails)) {
    const atags = illustHTMLDetails[illustId].tags;
    const btags = bookmarkHTMLDetails[illustId].tags;

    const allTags = [...new Set([...atags, ...btags])].join(', ');
    const d = {
      illustId,
      bookmarkCount: bookmarkHTMLDetails[illustId].bookmarkCount,
      tags: allTags,
      illustTitle: illustDetail.illust_title,
      illustPageCount: toInt(illustDetail.illust_page_count),
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
          .filter(i => i.userId ===  opt.userId)
          .forEach(i => {
            i.isFollow = true;
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
          page = await PixivAPI.getPageHTMLIllustIds(state.nextUrl);
        } else {
          page = await PixivAPI.getLegacyPageHTMLIllustIds(state.nextUrl, {
            needBookmarkId: rootState.pageType === 'MY_BOOKMARK'
          });
        }
        $print.debug('PixivModule#startNextUrlBased: page:', page);

        state.nextUrl = page.nextUrl;

        // {[illustId : IDString]: illust_detail}
        const illustAPIDetails = await PixivAPI.getIllustsAPIDetail(page.illustIds);
        $print.debug('PixivModule#startNextUrlBased: illustAPIDetails:', illustAPIDetails);

        // {[illustId : IDString]: illust_detail}
        const illustHTMLDetails = await PixivAPI.getIllustHTMLDetails(page.illustIds);
        $print.debug('PixivModule#startNextUrlBased: illustHTMLDetails:', illustHTMLDetails);

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
          $print.debug('PixivModule#startNextUrlBased: myBookmarkAPIDetails:', myBookmarkAPIDetails);
        }

        // {[illustId : IDString]: {
        //   illustId,
        //   bookmarkCount,
        //   tags: string[]
        // }}
        const bookmarkHTMLDetails = await PixivAPI.getBookmarkHTMLDetails(Object.keys(illustAPIDetails));
        $print.debug('PixivModule#startNextUrlBased: bookmarkHTMLDetails:', bookmarkHTMLDetails);

        const userIds = Object.values(illustAPIDetails).map(d => d.user_id);
        // {[user_id : IDString]: {
        // userId,
        // isFollow
        // }}
        const userAPIDetails = await PixivAPI.getUsersAPIDetail(userIds);
        $print.debug('PixivModule#startNextUrlBased: userAPIDetails:', userAPIDetails);

        const libraryData = makeLibraryData({ pageType: rootState.pageType,
          illustAPIDetails,
          bookmarkHTMLDetails,
          userAPIDetails,
          illustHTMLDetails });

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
      return cloneLibrary
        .filter(el => el.bookmarkCount >= rootState.filters.limit)
        .filter(el => el.tags.match(rootState.filters.tag))
        .filter(el => !rootState.config.blacklist.includes(el.userId))
        .sort(
          (a, b) => {
            const av = toInt(a[getters.orderBy]);
            const bv = toInt(b[getters.orderBy]);
            const c = bv - av;
            return dateOrder && getters.orderBy === 'illustId' ? -c : c;
          }
        );
    }
  }
};
