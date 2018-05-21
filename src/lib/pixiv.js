import { $, $$find, $print } from './utils';

// (get|post)Name(HTMLDetail|APIDetail)s?

class Pixiv {
  constructor() {
    try {
      this.tt = $('input[name="tt"]').value;
    } catch (error) {
      /* global pixiv */
      this.tt = pixiv.context.token;
    }
  }

  async fetch(url) {
    try {
      $print.debug('Pixiv#fetch: url:', url);
      if (url) {
        const res = await axios.get(url);
        if (res.status !== 200) {
          throw new Error(`${res.status} ${res.statusText}`);
        } else {
          return res.data;
        }
      } else {
        $print.error('Pixiv#fetch has no url');
      }
    } catch (error) {
      $print.error('Pixiv#fetch: error:', error);
    }
  }

  async getLegacyPageHTMLIllustIds(url, { needBookmarkId } = { needBookmarkId: false }) {
    try {
      const html = await this.fetch(url);
      const nextTag = html.match(/class="next"[^/]*/);

      let nextUrl = '';
      if (nextTag) {
        const nextHref = nextTag[0].match(/href="([^"]+)"/);
        if (nextHref) {
          const query = nextHref[1].replace(/&amp;/g, '&');
          if (query) {
            nextUrl = `${location.pathname}${query}`;
          }
        }
      }

      const iidHTMLs = html.match(/;illust_id=\d+"\s*class="work/g) || [];
      const illustIds = [];
      for (const dataid of iidHTMLs) {
        const iid = dataid.replace(/\D+(\d+).*/, '$1');
        if (!illustIds.includes(iid) && iid !== '0') {
          illustIds.push(iid);
        }
      }

      const ret = {
        nextUrl,
        illustIds
      };
      if (needBookmarkId) {
        ret.bookmarkIds = {};

        const bimHTMLs = html.match(/name="book_id[^;]+;illust_id=\d+/g) || [];
        for (const bim of bimHTMLs) {
          const [illustId, bookmarkId] = bim.replace(/\D+(\d+)\D+(\d+)/, '$2 $1').split(' ');
          if (illustIds.includes(illustId)) {
            ret.bookmarkIds[illustId] = { illustId, bookmarkId };
          }
        }
      }
      return ret;
    } catch (error) {
      $print.error('Pixiv#getLegacyPageHTMLIllustIds: error:', error);
    }
  }

  async getPageHTMLIllustIds(url) {
    try {
      const html = await this.fetch(url);
      const nextTag = html.match(/class="next"[^/]*/);

      let nextUrl = '';
      if (nextTag) {
        const nextHref = nextTag[0].match(/href="([^"]+)"/);
        if (nextHref) {
          const query = nextHref[1].replace(/&amp;/g, '&');
          if (query) {
            nextUrl = `${location.pathname}${query}`;
          }
        }
      }

      const iidHTMLs = html.match(/illustId&quot;:&quot;(\d+)&quot;/g) || [];
      $print.debug('Pixiv#getPageHTMLIllustIds: iidHTMLs:', iidHTMLs);

      const illustIds = [];
      for (const dataid of iidHTMLs) {
        const iid = dataid.replace(/\D+(\d+).*/, '$1');
        if (!illustIds.includes(iid) && iid !== '0') {
          illustIds.push(iid);
        }
      }

      const ret = {
        nextUrl,
        illustIds
      };
      return ret;
    } catch (error) {
      $print.error('Pixiv#getPageHTMLIllustIds: error:', error);
    }
  }

  async getBookmarkHTMLDetails(illustIds) {
    const bookmarkHTMLDetails = illustIds.map(id => this.getBookmarkHTMLDetail(id));
    const bookmarkDetails = await Promise.all(bookmarkHTMLDetails);
    const detail = {};
    for (const d of bookmarkDetails) {
      detail[d.illustId] = d;
    }
    return detail;
  }

  async getBookmarkHTMLDetail(illustId) {
    const url = `/bookmark_detail.php?illust_id=${illustId}`;

    try {
      const html = await this.fetch(url);
      const bkMatches = html.match(/<i class="_icon _bookmark-icon-inline"><\/i>(\d+)/);
      const bookmarkCount = bkMatches ? parseInt(bkMatches[1]) : 0;
      const tagsListHTML = html.match(/<ul class="tags[^>]+>.*?(?=<\/ul>)/);
      const tagHTMLs = tagsListHTML ? tagsListHTML[0].match(/>[^<]+?(?=<\/a>)/g) : [];
      const tags = tagHTMLs ? tagHTMLs.map(x => x.slice(1)) : [];
      return {
        bookmarkCount,
        illustId,
        tags
      };
    } catch (error) {
      $print.error('Pixiv#getBookmarkHTMLDetail: error:', error);
    }
  }

  async getIllustsAPIDetail(illustIds) {
    const iids = illustIds.join(',');
    const url = `/rpc/index.php?mode=get_illust_detail_by_ids&illust_ids=${iids}&tt=${this.tt}`;

    try {
      const json = await this.fetch(url);
      $print.debug('Pixiv#getIllustsAPIDetail: json:', json);
      if (json.error) {
        throw new Error(json.message);
      }

      const details = json.body;
      for (const [key, detail] of Object.entries(details)) {
        if (detail.error) {
          delete details[key];
        }
      }
      return details;
    } catch (error) {
      $print.error('Pixiv#getIllustsAPIDetail: error:', error);
    }
  }

  async getUsersAPIDetail(userIds) {
    const uids = [...new Set(userIds)].join(',');
    const url = `/rpc/get_profile.php?user_ids=${uids}&tt=${this.tt}`;

    try {
      const json = await this.fetch(url);
      $print.debug('Pixiv#getUsersAPIDetail: json:', json);
      if (json.error) {
        throw new Error(json.message);
      }

      const details = {};
      for (const u of json.body) {
        details[u.user_id] = {
          userId: u.user_id,
          isFollow: u.is_follow
        };
      }
      return details;
    } catch (error) {
      $print.error('Pixiv#getUsersAPIDetail: error:', error);
    }
  }

  async getIllustHTMLDetail(illustId) {
    const url = `/member_illust.php?mode=medium&illust_id=${illustId}`;
    const failResult = {
      illustId,
      tags: []
    };
    try {
      const html = await this.fetch(url);
      const tagHTMLPart = html.match(/class="work-tags"[.\s\S]*template-work-tag/ig);
      if (!tagHTMLPart) {
        return failResult;
      }
      const tagHTMLs = tagHTMLPart[0].replace('\n', '').match(/((translation|original|romaji)-tag">|tag-translation( romaji)?">)[^<]+/ig);
      if (!tagHTMLs) {
        return failResult;
      }
      const tags = tagHTMLs.map(tagHTML => tagHTML.replace(/.*>(.*)$/, '$1'));
      return {
        illustId,
        tags
      };
    } catch (error) {
      $print.error('Pixiv#getIllustHTMLDetail: error:', error);
    }
  }

  async getIllustHTMLDetails(illustIds) {
    const IllustHTMLDetails = illustIds.map(id => this.getIllustHTMLDetail(id));
    const IllustDetails = await Promise.all(IllustHTMLDetails);
    const detail = {};
    for (const d of IllustDetails) {
      detail[d.illustId] = d;
    }
    return detail;
  }

  async getRecommendationsAPIDetails(illustIds = 'auto', numRecommendations = 500) {
    const searchParams = {
      type: 'illust',
      sample_illusts: illustIds,
      num_recommendations: numRecommendations,
      tt: this.tt
    };
    const url = `/rpc/recommender.php?${searchParams.entries.map(p => p.join('=')).join('&')}`;
    try {
      const data = await this.fetch(url);
      return data.recommendations.map(x => `${x}`);
    } catch (error) {
      $print.error('Pixiv#getRecommendationsAPIDetails: error:', error);
    }
  }

  async postBookmarkAdd(illustId) {
    const searchParams = {
      mode: 'save_illust_bookmark',
      illust_id: illustId,
      restrict: 0,
      comment: '',
      tags: '',
      tt: this.tt
    };
    const data = Object.entries(searchParams).map(p => p.join('=')).join('&');
    const config = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    };

    try {
      const res = await axios.post('/rpc/index.php', data, config);
      if (res.statusText === 'OK') {
        $print.debug('Pixiv#postBookmarkAdd: res.data:', res.data);
        return !res.data.error;
      } else {
        throw new Error(res.statusText);
      }
    } catch (error) {
      $print.error('Pixiv#postBookmarkAdd: error:', error);
    }
  }

  async postThumbUp(illustId, userId) {
    const searchParams = {
      mode: 'save',
      i_id: illustId,
      u_id: userId,
      qr: 0,
      score: 10,
      tt: this.tt
    };

    const data = Object.entries(searchParams).map(p => p.join('=')).join('&');
    const config = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    };

    try {
      const res = await axios.post('/rpc_rating.php', data, config);
      if (res.statusText === 'OK') {
        $print.debug('Pixiv#postThumbUp: res.data:', res.data);
        return !!res.data.score;
      } else {
        throw new Error(res.statusText);
      }
    } catch (error) {
      $print.error('Pixiv#postThumbUp: error:', error);
    }
  }
}

function removeAnnoyings(doc = document) {
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
  ];

  for (const selector of annoyings) {
    for (const el of $$find(doc, selector)) {
      el.remove();
    }
  }
}

const PixivAPI = new Pixiv();

export {
  PixivAPI,
  removeAnnoyings
};
