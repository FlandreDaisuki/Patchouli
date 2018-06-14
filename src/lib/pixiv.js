import {
  $,
  $$find,
  $print
} from './utils';

// (get|post)Name(HTMLDetail|APIDetail)s?

// new API
// (get|post) (illust|user) name? Data (Group)?
// └ method                 |              |
//                          └ special attr |
//                 group array of requests ┘

class Pixiv {
  constructor() {
    try {
      this.tt = $('input[name="tt"]').value;
    } catch (error) {
      const pixivData =
        window.pixiv ? window.pixiv.context : window.globalInitData;
      this.tt = pixivData.token;
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

  // new API to get an illust data
  async getIllustData(illustId) {
    const url = `/ajax/illust/${illustId}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`${resp.statusText}`);
    }
    const data = await resp.json();
    if (data.error) {
      $print.error('Pixiv#getIllustData', data.message);
      return null;
    }
    return data.body;
  }

  async getIllustDataGroup(illustIds) {
    const uniqIllustIds = [...new Set(illustIds)];
    const illustDataGroup = await Promise.all(uniqIllustIds.map(this.getIllustData));
    $print.debug('getIllustDataGroup: illustDataGroup:', illustDataGroup);
    return illustDataGroup
      .filter(Boolean)
      .reduce((collect, d) => {
        collect[d.illustId] = d;
        return collect;
      }, {});
  }

  // new API to get an user data
  async getUserData(userId) {
    const url = `/ajax/user/${userId}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`${resp.statusText}`);
    }
    const data = await resp.json();
    if (data.error) {
      $print.error('Pixiv#getUserData', data.message);
      return null;
    }
    return data.body;
  }

  async getUserDataGroup(userIds) {
    const uniqUserIds = [...new Set(userIds)];
    const userDataGroup = await Promise.all(uniqUserIds.map(this.getUserData));
    return userDataGroup
      .filter(Boolean)
      .reduce((collect, d) => {
        collect[d.userId] = d;
        return collect;
      }, {});
  }

  async getLegacyPageHTMLIllustIds(url) {
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

  async getMultipleIllustHTMLDetail(illustId) {
    const url = `/member_illust.php?mode=manga&illust_id=${illustId}`;

    const failResult = {
      illustId,
      imgSrcs: []
    };

    try {
      const html = await this.fetch(url);
      const srcAttrHTML = html.match(/data-src="[^"]*"/ig);
      $print.debug(
        'Pixiv#getMultipleIllustHTMLDetail: srcAttrHTML:', srcAttrHTML);
      if (!srcAttrHTML) {
        return failResult;
      }
      const imgSrcs =
        srcAttrHTML.map(attr => attr.replace(/.*"([^"]*)"/, '$1'));
      $print.debug('Pixiv#getMultipleIllustHTMLDetail: imgSrcs:', imgSrcs);
      return {
        illustId,
        imgSrcs
      };
    } catch (error) {
      $print.error('Pixiv#getMultipleIllustHTMLDetail: error:', error);
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
      if (res.status === 200) {
        $print.debug('Pixiv#postThumbUp: res.data:', res.data);
        return !!res.data.score;
      } else {
        throw new Error(res.statusText);
      }
    } catch (error) {
      $print.error('Pixiv#postThumbUp: error:', error);
    }
  }

  async postFollowUser(userId) {
    const searchParams = {
      mode: 'add',
      user_id: userId,
      format: 'json',
      type: 'user',
      restrict: 0,
      tt: this.tt
    };

    const data = Object.entries(searchParams).map(p => p.join('=')).join('&');
    const config = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    };

    try {
      const res = await axios.post('/bookmark_add.php', data, config);
      if (res.status === 200) {
        $print.debug('Pixiv#postFollowUser: res.data:', res.data);
        return !!res.data;
      } else {
        throw new Error(res.statusText);
      }
    } catch (error) {
      $print.error('Pixiv#postFollowUser: error:', error);
    }
  }
}

function removeAnnoyings(doc = document) {
  const annoyings = [
    'iframe',
    // Ad
    '.ad', '.ads_area', '.ad-footer', '.ads_anchor', '.ads-top-info',
    '.comic-hot-works', '.user-ad-container', '.ads_area_no_margin',
    // Premium
    '.hover-item', '.ad-printservice', '.bookmark-ranges', '.require-premium',
    '.showcase-reminder', '.sample-user-search', '.popular-introduction',
    '._premium-lead-tag-search-bar', '._premium-lead-popular-d-body'
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
