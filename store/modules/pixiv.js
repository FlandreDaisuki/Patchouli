import PixivAPI from '../../pixiv';
import { $debug } from '../../utils';

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
      d.bookmarkId = illustDetail.bookmark_id;
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

        // {[illust_id : IDString]: illust_detail}
        const illustAPIDetails = await PixivAPI.getIllustsAPIDetail(page.illustIds);
        $debug('PixivModule#startNextUrlBased: illustAPIDetails:', illustAPIDetails);

        if (rootState.pageType === 'MY_BOOKMARK') {
          // {[illust_id : IDString]: {
          //   illust_id,
          //   bookmark_id
          // }}
          const myBookmarkAPIDetails = page.bookmarkIds;
          for (const [illustId, illustDetail] of Object.entries(illustAPIDetails)) {
            const bookmarkId = myBookmarkAPIDetails[illustId].bookmarkId;
            if (bookmarkId) {
              illustDetail.bookmark_id = bookmarkId;
            }
          }
          $debug('PixivModule#startNextUrlBased: myBookmarkAPIDetails:', myBookmarkAPIDetails);
        }

        // {[illust_id : IDString]: {
        //   illust_id,
        //   bookmarkCount,
        //   tags: string[]
        // }}
        const bookmarkHTMLDetails = await PixivAPI.getBookmarkHTMLDetails(Object.keys(illustAPIDetails));
        $debug('PixivModule#startNextUrlBased: bookmarkHTMLDetails:', bookmarkHTMLDetails);

        const userIds = Object.values(illustAPIDetails).map(d => d.user_id);
        // {[user_id : IDString]: {
        // user_id,
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
  getters: {}
};
