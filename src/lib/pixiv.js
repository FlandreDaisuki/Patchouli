import { $, $$find,  $print } from './utils';

// (get|post)Name(HTMLDetail|APIDetail)s?

// new API
// (get|post) (illust|user) name? Data (Group)?
// └ method                 |              |
//                          └ special attr |
//                 group array of requests ┘

class Pixiv {
  constructor() {
    this._tt = null;
  }

  get tt() {
    if (this._tt) {
      return this._tt;
    }

    const inputTT = $('input[name="tt"]');
    if (inputTT) {
      this._tt = inputTT.value;
    } else if (window.pixiv) {
      this._tt = window.pixiv.context.token;
    } else if (window.globalInitData) {
      this._tt = window.globalInitData.token;
    } else {
      $print.error('Pixiv#tt getter');
    }
    return this._tt;
  }

  async fetch(url, options = {}) {
    const opt = Object.assign({ credentials: 'same-origin' }, options);

    $print.debug('Pixiv#fetch: url:', url);

    try {
      if (url) {
        const resp = await fetch(url, opt);
        if (!resp.ok) {
          throw new Error(`${resp.status} ${resp.statusText}`);
        }
        return resp;
      } else {
        $print.error('Pixiv#fetch without url');
      }
    } catch (error) {
      $print.error('Pixiv#fetch: error:', error);
    }
  }

  async fetchJSON(url, options = {}) {
    try {
      const resp = await this.fetch(url, options);
      const data = await resp.json();
      const properties = Object.keys(data);
      if (properties.includes('error') && properties.includes('body')) {
        if (data.error) {
          $print.error('Pixiv#fetchJSON: JSON has error:', data.message);
          return null;
        } else {
          return data.body;
        }
      } else {
        return data;
      }
    } catch (error) {
      $print.error('Pixiv#fetchJSON: error:', error);
    }
  }

  async fetchHTML(url, options = {}) {
    try {
      const resp = await this.fetch(url, options);
      const data = await resp.text();
      return data;
    } catch (error) {
      $print.error('Pixiv#fetchHTML: error:', error);
    }
  }

  // new API to get an illust data
  async getIllustData(illustId) {
    const url = `/ajax/illust/${illustId}`;
    const data = await this.fetchJSON(url);
    $print.debug('Pixiv#getIllustData: data:', data);
    return data;
  }

  async getIllustDataGroup(illustIds) {
    const uniqIllustIds = [...new Set(illustIds)];
    const illustDataGroup = await Promise.all(uniqIllustIds.map(id => this.getIllustData(id)));
    $print.debug('Pixiv#getIllustDataGroup: illustDataGroup:', illustDataGroup);
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
    const data = await this.fetchJSON(url);
    $print.debug('Pixiv#getUserData: data:', data);
    return data;
  }

  async getUserDataGroup(userIds) {
    const uniqUserIds = [...new Set(userIds)];
    const userDataGroup = await Promise.all(uniqUserIds.map(id => this.getUserData(id)));
    return userDataGroup
      .filter(Boolean)
      .reduce((collect, d) => {
        collect[d.userId] = d;
        return collect;
      }, {});
  }

  async getIllustUgoiraMetaData(illustId) {
    const url = `/ajax/illust/${illustId}/ugoira_meta`;
    const data = await this.fetchJSON(url);
    $print.debug('Pixiv#getIllustUgoiraMetaData: data:', data);
    return data;
  }

  async getIllustIdsInLegacyPageHTML(url) {
    try {
      const html = await this.fetchHTML(url);
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
      $print.error('Pixiv#getIllustIdsInLegacyPageHTML: error:', error);
    }
  }

  async getIllustIdsInPageHTML(url) {
    try {
      const html = await this.fetchHTML(url);
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
      $print.debug('Pixiv#getIllustIdsInPageHTML: iidHTMLs:', iidHTMLs);

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
      $print.error('Pixiv#getIllustIdsInPageHTML: error:', error);
    }
  }

  async getMultipleIllustHTMLDetail(illustId) {
    const url = `/member_illust.php?mode=manga&illust_id=${illustId}`;

    const failResult = {
      illustId,
      imgSrcs: []
    };

    try {
      const html = await this.fetchHTML(url);
      const srcAttrHTML = html.match(/data-src="[^"]*"/ig);
      $print.debug('Pixiv#getMultipleIllustHTMLDetail: srcAttrHTML:', srcAttrHTML);
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

  // new API to like an illust, return true if succeeded
  async postIllustLike(illustId) {
    const url = '/ajax/illusts/like';
    const data = await this.fetchJSON(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': this.tt,
      },
      body: JSON.stringify({
        illust_id: illustId,
      }),
    });

    return Boolean(data);
  }

  async postFollowUser(userId) {
    const url = '/bookmark_add.php';

    const searchParams = {
      mode: 'add',
      user_id: userId,
      format: 'json',
      type: 'user',
      restrict: 0,
      tt: this.tt
    };

    const body = Object.entries(searchParams)
      .map(p => p.join('='))
      .join('&');


    const data = await this.fetchJSON(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body,
    });

    return Boolean(data);
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
