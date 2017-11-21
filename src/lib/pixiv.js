import {$, $$find, $error} from './utils'
import {$debug} from './debugger'

// (get|post) (dataname)s? (HTMLDetail|APIDetail)s?

/* global axios */
export default class Pixiv {
  constructor () {
    this.tt = $('input[name="tt"]').value
  }

  async fetch (url) {
    try {
      $debug('Pixiv#fetch: url:', url)
      if (url) {
        const res = await axios.get(url)
        // $debug('Pixiv#fetch: res:', res);
        if (res.statusText !== 'OK') {
          throw new Error(res.statusText)
        } else {
          return res.data
        }
      } else {
        $error('Pixiv#fetch has no url')
      }
    } catch (error) {
      $error(error)
    }
  }

  async getLegacyPageHTMLIllustIds (url, options = {}) {
    const opt = Object.assign({
      needBookmarkId: false
    }, options)

    try {
      const html = await this.fetch(url)
      $debug('getPageIllustids', url)
      // eslint-disable-next-line no-useless-escape
      const nextTag = html.match(/class="next"[^\/]*/)

      let nextUrl = ''
      if (nextTag) {
        const nextHref = nextTag[0].match(/href="([^"]+)"/)
        if (nextHref) {
          const query = nextHref[1].replace(/&amp;/g, '&')
          if (query) {
            nextUrl = `${location.pathname}${query}`
          }
        }
      }
      const iidHTMLs = html.match(/;illust_id=\d+"\s*class="work/g) || []
      const illustIds = []
      for (const dataid of iidHTMLs) {
        const iid = dataid.replace(/\D+(\d+).*/, '$1')
        if (!illustIds.includes(iid) && iid !== '0') {
          illustIds.push(iid)
        }
      }

      const ret = {
        next_url: nextUrl,
        illust_ids: illustIds
      }

      if (opt.needBookmarkId) {
        ret.bookmark_ids = {}

        const bimHTMLs = html.match(/name="book_id[^;]+;illust_id=\d+/g) || []
        for (const bim of bimHTMLs) {
          const [illustId, bookmarkId] = bim.replace(/\D+(\d+)\D+(\d+)/, '$2 $1').split(' ')
          if (illustIds.includes(illustId)) {
            ret.bookmark_ids[illustId] = {illust_id: illustId, bookmark_id: bookmarkId}
          }
        }
      }
      return ret
    } catch (e) {
      $error(e)
    }
  }

  async getPageHTMLIllustIds (url) {
    try {
      const html = await this.fetch(url)
      // eslint-disable-next-line no-useless-escape
      const nextTag = html.match(/class="next"[^\/]*/)

      let nextUrl = ''
      if (nextTag) {
        const nextHref = nextTag[0].match(/href="([^"]+)"/)
        if (nextHref) {
          const query = nextHref[1].replace(/&amp;/g, '&')
          if (query) {
            nextUrl = `${location.pathname}${query}`
          }
        }
      }
      const iidHTMLs = html.match(/illustId&quot;:&quot;(\d+)&quot;/g) || []
      $debug('Pixiv#getPageHTMLIllustIds: iidHTMLs:', iidHTMLs)
      const illustIds = []
      for (const dataid of iidHTMLs) {
        const iid = dataid.replace(/\D+(\d+).*/, '$1')
        if (!illustIds.includes(iid) && iid !== '0') {
          illustIds.push(iid)
        }
      }

      const ret = {
        next_url: nextUrl,
        illust_ids: illustIds
      }

      return ret
    } catch (error) {
      $error(error)
    }
  }

  async getBookmarkHTMLDetail (illustId) {
    const url = `/bookmark_detail.php?illust_id=${illustId}`

    try {
      const html = await this.fetch(url)
      const _a = html.match(/sprites-bookmark-badge[^\d]+(\d+)/)
      const bookmarkCount = _a ? parseInt(_a[1]) : 0
      const _b = html.match(/<ul class="tags[^>]+>.*?(?=<\/ul>)/)
      const _c = _b ? _b[0].match(/>[^<]+?(?=<\/a>)/g) : []
      const tags = _c ? _c.map(x => x.slice(1)) : []
      return {
        bookmark_count: bookmarkCount,
        illust_id: illustId,
        tags
      }
    } catch (error) {
      $error(error)
    }
  }

  async getBookmarkHTMLDetails (illustIds) {
    const fn = this.getBookmarkHTMLDetail.bind(this)
    const bookmarkDetails = await Promise.all(illustIds.map(fn))
    const details = {}
    for (const detail of bookmarkDetails) {
      details[detail.illust_id] = detail
    }
    return details
  }

  async getIllustsAPIDetail (illustIds) {
    const iids = illustIds.join(',')
    const url = `/rpc/index.php?mode=get_illust_detail_by_ids&illust_ids=${iids}&tt=${this.tt}`

    try {
      const json = await this.fetch(url)
      $debug('Pixiv#getIllustsAPIDetail: json:', json)

      if (json.error) {
        throw new Error(json.message)
      }

      const details = json.body

      for (const [key, detail] of Object.entries(details)) {
        if (detail.error) {
          delete details[key]
        }
      }

      return details
    } catch (error) {
      $error(error)
    }
  }

  async getUsersAPIDetail (userIds) {
    const uids = userIds.join(',')
    const url = `/rpc/get_profile.php?user_ids=${uids}&tt=${this.tt}`

    try {
      const json = await this.fetch(url)
      $debug('Pixiv#getUsersAPIDetail: json:', json)

      if (json.error) {
        throw new Error(json.message)
      }

      const details = {}
      for (const u of json.body) {
        details[u.user_id] = {
          user_id: u.user_id,
          is_follow: u.is_follow
        }
      }
      return details
    } catch (error) {
      $error(error)
    }
  }

  async getRecommendationsAPIDetails (illustIds = 'auto', numRecommendations = 500) {
    const searchParams = {
      type: 'illust',
      sample_illusts: illustIds,
      num_recommendations: numRecommendations,
      tt: this.tt
    }
    const url = `/rpc/recommender.php?${searchParams.entries.map(p => p.join('=')).join('&')}`
    try {
      const data = await this.fetch(url)
      return data.recommendations.map(x => `${x}`)
    } catch (error) {
      $error(error)
    }
  }

  async postBookmarkAdd (illustId) {
    const searchParams = {
      mode: 'save_illust_bookmark',
      illust_id: illustId,
      restrict: 0,
      comment: '',
      tags: '',
      tt: this.tt
    }
    const data = searchParams.entries.map(p => p.join('=')).join('&')
    const config = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
    try {
      const res = await axios.post('/rpc/index.php', data, config)
      if (res.statusText === 'OK') {
        $debug('Pixiv#postBookmarkAdd: res.data:', res.data)
        return !res.data.error
      } else {
        throw new Error(res.statusText)
      }
    } catch (error) {
      $error(error)
    }
  }

  static removeAnnoyings (doc = document) {
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
    ]

    for (const selector of annoyings) {
      for (const el of $$find(doc, selector)) {
        el.remove()
      }
    }
  }
}
