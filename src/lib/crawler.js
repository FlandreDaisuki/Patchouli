import {$debug} from './debugger'
import {PageType} from './pagetype'

export default class Crawler {
  constructor (global) {
    this.library = global.library
    this.api = global.api
    this.pagetype = global.pagetype
    this.next_url = location.href
    this.isPaused = true
    this.isEnded = false
  }

  async startNextUrlBased (opt) {
    // next_url based
    this.isPaused = false

    while (this.canContinue() && opt.times) {
      let page = null
      if (this.pagetype === PageType.SEARCH) {
        page = await this.api.getPageHTMLIllustIds(this.next_url)
      } else {
        page = await this.api.getLegacyPageHTMLIllustIds(this.next_url, {
          needBookmarkId: this.pagetype === PageType.MY_BOOKMARK
        })
      }
      $debug('Crawler#startNextUrlBased: page:', page)

      this.next_url = page.next_url

      // {[illust_id : IDString]: illust_detail}
      const illustAPIDetails = await this.api.getIllustsAPIDetail(page.illust_ids)
      $debug('Crawler#startNextUrlBased: illustAPIDetails:', illustAPIDetails)

      if (this.pagetype === PageType.MY_BOOKMARK) {
        // {[illust_id : IDString]: {
        //   illust_id,
        //   bookmark_id
        // }}
        const myBookmarkAPIDetails = page.bookmark_ids
        for (const [illustId, illustDetail] of Object.entries(illustAPIDetails)) {
          const bookmarkId = page.bookmark_ids[illustId].bookmark_id
          if (bookmarkId) {
            illustDetail.bookmark_id = bookmarkId
          }
        }
        $debug('Crawler#startNextUrlBased: myBookmarkAPIDetails:', myBookmarkAPIDetails)
      }

      // {[illust_id : IDString]: {
      //   illust_id,
      //   bookmark_count,
      //   tags: string[]
      // }}
      const bookmarkHTMLDetails = await this.api.getBookmarkHTMLDetails(Object.keys(illustAPIDetails))
      $debug('Crawler#startNextUrlBased: bookmarkHTMLDetails:', bookmarkHTMLDetails)

      const userIds = Object.values(illustAPIDetails).map(d => d.user_id)
      // {[user_id : IDString]: {
      // user_id,
      // is_follow
      // }}
      const userAPIDetails = await this.api.getUsersAPIDetail(userIds)
      $debug('Crawler#startNextUrlBased: userAPIDetails:', userAPIDetails)

      const libraryData = this.makeLibraryData({illustAPIDetails, bookmarkHTMLDetails, userAPIDetails})
      this.library.push(...libraryData)

      opt.times -= 1
      if (!opt.times) {
        this.pause()
      }

      if (!this.next_url) {
        this.stop()
      }
    }
  }

  async start (options) {
    const opt = Object.assign({times: Infinity}, options)
    $debug('Crawler#start: opt:', opt)

    if (this.isEnded || opt.times <= 0) {
      return
    }

    switch (this.pagetype) {
      case PageType.SEARCH:
      case PageType.NEW_ILLUST:
      case PageType.MY_BOOKMARK:
      case PageType.MEMBER_ILLIST:
        await this.startNextUrlBased(opt)
        break
      default:
        break
    }
  }

  pause () {
    this.isPaused = true
  }

  stop () {
    this.pause()
    this.isEnded = true
  }

  canContinue () {
    return !(this.isEnded || this.isPaused)
  }

  makeLibraryData ({illustAPIDetails, bookmarkHTMLDetails, userAPIDetails}) {
    if (!illustAPIDetails || !Object.keys(illustAPIDetails).length) {
      throw new Error('Crawler#makeLibraryData: illustAPIDetails is falsy.')
    }

    const vLibrary = []
    for (const [illustId, illustDetail] of Object.entries(illustAPIDetails)) {
      const d = {
        illust_id: illustId,
        bookmark_count: bookmarkHTMLDetails[illustId].bookmark_count,
        tags: bookmarkHTMLDetails[illustId].tags.join(', '),
        illust_title: illustDetail.illust_title,
        illust_page_count: Number.toInt(illustDetail.illust_page_count),
        user_id: illustDetail.user_id,
        user_name: illustDetail.user_name,
        is_follow: userAPIDetails[illustDetail.user_id].is_follow,
        is_bookmarked: illustDetail.is_bookmarked,
        is_ugoira: !!illustDetail.ugoira_meta,
        profile_img: illustDetail.profile_img,
        url: {
          big: illustDetail.url.big,
          sq240: illustDetail.url['240mw'].replace('240x480', '240x240')
        }
      }

      if (this.pagetype === PageType.MY_BOOKMARK) {
        d.bookmark_id = illustDetail.bookmark_id
      }

      vLibrary.push(d)
    }

    return vLibrary
  }
}
