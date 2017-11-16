// ==UserScript==
// @name              Patchouli
// @name:ja           パチュリー
// @name:zh-CN        帕秋莉
// @name:zh-TW        帕秋莉
// @namespace         https://github.com/FlandreDaisuki
// @description       An image searching/browsing tool on Pixiv
// @description:ja    Pixiv 検索機能強化
// @description:zh-CN Pixiv 搜寻/浏览 工具
// @description:zh-TW Pixiv 搜尋/瀏覽 工具
// @include           *://www.pixiv.net/*
// @require           https://cdnjs.cloudflare.com/ajax/libs/vue/2.5.3/vue.min.js
// @require           https://cdnjs.cloudflare.com/ajax/libs/axios/0.17.1/axios.min.js
// @icon              http://i.imgur.com/VwoYc5w.png
// @noframes
// @author            FlandreDaisuki
// @license           The MIT License (MIT) Copyright (c) 2016-2017 FlandreDaisuki
// @compatible        firefox >=52
// @compatible        chrome >=55
// @version           3.0.1
// @grant             none
// ==/UserScript==

(function () {
'use strict';

function __$styleInject( css ) {
    if(!css) return ;

    if(typeof(window) == 'undefined') return ;
    let style = document.createElement('style');

    style.innerHTML = css;
    document.head.appendChild(style);
    return css;
}

const _msg_following = "following";
const _msg_bookmark_tooltip = "$bookmark_count$ bookmarks";
const _msg_koakuma_processed = "$processed_count$ pics processed";
const _msg_koakuma_go = "Go";
const _msg_koakuma_pause = "Pause";
const _msg_koakuma_end = "End";
const _msg_fit_browser_width = "fit browser width";
const _msg_sort_by_bookmark_count = "sort by bookmark count";
const _msg_tag_filter_placeholder = "tag filter e.g.: flandre|sister";
var en = {
	_msg_following: _msg_following,
	_msg_bookmark_tooltip: _msg_bookmark_tooltip,
	_msg_koakuma_processed: _msg_koakuma_processed,
	_msg_koakuma_go: _msg_koakuma_go,
	_msg_koakuma_pause: _msg_koakuma_pause,
	_msg_koakuma_end: _msg_koakuma_end,
	_msg_fit_browser_width: _msg_fit_browser_width,
	_msg_sort_by_bookmark_count: _msg_sort_by_bookmark_count,
	_msg_tag_filter_placeholder: _msg_tag_filter_placeholder
};

const _msg_following$1 = "フォロー中";
const _msg_bookmark_tooltip$1 = "$bookmark_count$件のブックマーク";
const _msg_koakuma_processed$1 = "$processed_count$ 件が処理された";
const _msg_koakuma_go$1 = "捜す";
const _msg_koakuma_pause$1 = "中断";
const _msg_koakuma_end$1 = "終了";
const _msg_fit_browser_width$1 = "全幅";
const _msg_sort_by_bookmark_count$1 = "ブックマーク数順";
const _msg_tag_filter_placeholder$1 = "タグフィルター 例: フランドール|妹様";
var ja = {
	_msg_following: _msg_following$1,
	_msg_bookmark_tooltip: _msg_bookmark_tooltip$1,
	_msg_koakuma_processed: _msg_koakuma_processed$1,
	_msg_koakuma_go: _msg_koakuma_go$1,
	_msg_koakuma_pause: _msg_koakuma_pause$1,
	_msg_koakuma_end: _msg_koakuma_end$1,
	_msg_fit_browser_width: _msg_fit_browser_width$1,
	_msg_sort_by_bookmark_count: _msg_sort_by_bookmark_count$1,
	_msg_tag_filter_placeholder: _msg_tag_filter_placeholder$1
};

const _msg_following$2 = "关注中";
const _msg_bookmark_tooltip$2 = "$bookmark_count$个收藏";
const _msg_koakuma_processed$2 = "已处理 $processed_count$ 张";
const _msg_koakuma_go$2 = "找";
const _msg_koakuma_pause$2 = "停";
const _msg_koakuma_end$2 = "完";
const _msg_fit_browser_width$2 = "自适应浏览器宽度";
const _msg_sort_by_bookmark_count$2 = "书签数排序";
const _msg_tag_filter_placeholder$2 = "标签过滤 例: 芙兰朵露|二小姐";
var zh = {
	_msg_following: _msg_following$2,
	_msg_bookmark_tooltip: _msg_bookmark_tooltip$2,
	_msg_koakuma_processed: _msg_koakuma_processed$2,
	_msg_koakuma_go: _msg_koakuma_go$2,
	_msg_koakuma_pause: _msg_koakuma_pause$2,
	_msg_koakuma_end: _msg_koakuma_end$2,
	_msg_fit_browser_width: _msg_fit_browser_width$2,
	_msg_sort_by_bookmark_count: _msg_sort_by_bookmark_count$2,
	_msg_tag_filter_placeholder: _msg_tag_filter_placeholder$2
};

const _msg_following$3 = "關注中";
const _msg_bookmark_tooltip$3 = "$bookmark_count$個收藏";
const _msg_koakuma_processed$3 = "已處理 $processed_count$ 張";
const _msg_koakuma_go$3 = "找";
const _msg_koakuma_pause$3 = "停";
const _msg_koakuma_end$3 = "完";
const _msg_fit_browser_width$3 = "自適應瀏覽器寬度";
const _msg_sort_by_bookmark_count$3 = "書籤數排序";
const _msg_tag_filter_placeholder$3 = "標籤過濾 例: 芙蘭朵露|二小姐";
var tw = {
	_msg_following: _msg_following$3,
	_msg_bookmark_tooltip: _msg_bookmark_tooltip$3,
	_msg_koakuma_processed: _msg_koakuma_processed$3,
	_msg_koakuma_go: _msg_koakuma_go$3,
	_msg_koakuma_pause: _msg_koakuma_pause$3,
	_msg_koakuma_end: _msg_koakuma_end$3,
	_msg_fit_browser_width: _msg_fit_browser_width$3,
	_msg_sort_by_bookmark_count: _msg_sort_by_bookmark_count$3,
	_msg_tag_filter_placeholder: _msg_tag_filter_placeholder$3
};

class L10N {
	constructor() {
		this.dict = {en, ja, zh, tw};
		this.lang = document.documentElement.lang;
		if (this.lang === 'zh-tw') {
			this.lang = 'tw';
		}
		if (!this.dict[this.lang]) {
			this.lang = 'en';
		}
	}
	get following() {
		return this.dict[this.lang]['_msg_following'];
	}
	bookmarkTooltip(n) {
		return this.dict[this.lang]['_msg_bookmark_tooltip'].replace('$bookmark_count$', n);
	}
	koakumaProcessed(n) {
		return this.dict[this.lang]['_msg_koakuma_processed'].replace('$processed_count$', n);
	}
	get koakumaGo() {
		return this.dict[this.lang]['_msg_koakuma_go'];
	}
	get koakumaPause() {
		return this.dict[this.lang]['_msg_koakuma_pause'];
	}
	get koakumaEnd() {
		return this.dict[this.lang]['_msg_koakuma_end'];
	}
	get fitBrowserWidth() {
		return this.dict[this.lang]['_msg_fit_browser_width'];
	}
	get sortByBookmarkCount() {
		return this.dict[this.lang]['_msg_sort_by_bookmark_count'];
	}
	get tagFilterPlaceholder() {
		return this.dict[this.lang]['_msg_tag_filter_placeholder'];
	}
}

function $(selector) {
	return document.querySelector(selector);
}
function $$(selector) {
	return [...document.querySelectorAll(selector)];
}
function $$find(doc, selector) {
	return [...doc.querySelectorAll(selector)];
}
function $el(tag, attr = {}, cb = () => {}) {
	const el = document.createElement(tag);
	Object.assign(el, attr);
	cb(el);
	return el;
}
function $log(...args) {
	console.log.apply(console, args);
}
function $error(...args) {
	console.error.apply(console, args);
}
(() => {
	Math.clamp = (val, min, max) => Math.min(Math.max(min, val), max);
	Number.toInt = (s) => (isNaN(~~s) ? 0 : ~~s);
	(function (arr) {
		arr.forEach(function (item) {
			if (item.hasOwnProperty('after')) {
				return;
			}
			Object.defineProperty(item, 'after', {
				configurable: true,
				enumerable: true,
				writable: true,
				value: function after() {
					var argArr = Array.prototype.slice.call(arguments),
						docFrag = document.createDocumentFragment();
					argArr.forEach(function (argItem) {
						var isNode = argItem instanceof Node;
						docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
					});
					this.parentNode.insertBefore(docFrag, this.nextSibling);
				}
			});
		});
	})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);
})();

class Pixiv {
	constructor() {
		this.tt = $('input[name="tt"]').value;
	}
	async fetch(url) {
		try {
			if (url) {
				const res = await axios.get(url);
				if (res.statusText !== 'OK') {
					throw new Error(res.statusText);
				} else {
					return res.data;
				}
			} else {
				$error('Pixiv#fetch has no url');
			}
		} catch (error) {
			$error(error);
		}
	}
	async getLegacyPageHTMLIllustIds(url, options = {}) {
		const opt = Object.assign({
			needBookmarkId: false
		}, options);
		try {
			const html = await this.fetch(url);
			const next_tag = html.match(/class="next"[^\/]*/);
			let next_url = '';
			if (next_tag) {
				const next_href = next_tag[0].match(/href="([^"]+)"/);
				if (next_href) {
					const query = next_href[1].replace(/&amp;/g, '&');
					if (query) {
						next_url = `${location.pathname}${query}`;
					}
				}
			}
			const iidHTMLs = html.match(/;illust_id=\d+"\s*class="work/g) || [];
			const illust_ids = [];
			for (const dataid of iidHTMLs) {
				const iid = dataid.replace(/\D+(\d+).*/, '$1');
				if (!illust_ids.includes(iid) && iid !== '0') {
					illust_ids.push(iid);
				}
			}
			const ret = {
				next_url,
				illust_ids
			};
			if (opt.needBookmarkId) {
				ret.bookmark_ids = {};
				const bimHTMLs = html.match(/name="book_id[^;]+;illust_id=\d+/g) || [];
				for (const bim of bimHTMLs) {
					const [illust_id, bookmark_id] = bim.replace(/\D+(\d+)\D+(\d+)/, '$2 $1').split(' ');
					if (illust_ids.includes(illust_id)) {
						ret.bookmark_ids[illust_id] = {illust_id, bookmark_id};
					}
				}
			}
			return ret;
		} catch (e) {
			$error(e);
		}
	}
	async getPageHTMLIllustIds(url) {
		try {
			const html = await this.fetch(url);
			const next_tag = html.match(/class="next"[^\/]*/);
			let next_url = '';
			if (next_tag) {
				const next_href = next_tag[0].match(/href="([^"]+)"/);
				if (next_href) {
					const query = next_href[1].replace(/&amp;/g, '&');
					if (query) {
						next_url = `${location.pathname}${query}`;
					}
				}
			}
			const iidHTMLs = html.match(/illustId&quot;:&quot;(\d+)&quot;/g) || [];
			const illust_ids = [];
			for (const dataid of iidHTMLs) {
				const iid = dataid.replace(/\D+(\d+).*/, '$1');
				if (!illust_ids.includes(iid) && iid !== '0') {
					illust_ids.push(iid);
				}
			}
			const ret = {
				next_url,
				illust_ids
			};
			return ret;
		} catch (error) {
			$error(error);
		}
	}
	async getBookmarkHTMLDetail(illust_id) {
		const url = `/bookmark_detail.php?illust_id=${illust_id}`;
		try {
			const html = await this.fetch(url);
			const _a = html.match(/sprites-bookmark-badge[^\d]+(\d+)/);
			const bookmark_count = _a ? parseInt(_a[1]) : 0;
			const _b = html.match(/<ul class="tags[^>]+>.*?(?=<\/ul>)/);
			const _c = _b ? _b[0].match(/>[^<]+?(?=<\/a>)/g) : [];
			const tags = _c ? _c.map(x => x.slice(1)) : [];
			return {
				bookmark_count,
				illust_id,
				tags
			};
		} catch (error) {
			$error(error);
		}
	}
	async getBookmarkHTMLDetails(illust_ids) {
		const fn = this.getBookmarkHTMLDetail.bind(this);
		const bookmark_details = await Promise.all(illust_ids.map(fn));
		const details = {};
		for (const detail of bookmark_details) {
			details[detail.illust_id] = detail;
		}
		return details;
	}
	async getIllustsAPIDetail(illust_ids) {
		const iids = illust_ids.join(',');
		const url = `/rpc/index.php?mode=get_illust_detail_by_ids&illust_ids=${iids}&tt=${this.tt}`;
		try {
			const json = await this.fetch(url);
			if(json.error) {
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
			$error(error);
		}
	}
	async getUsersAPIDetail(user_ids) {
		const uids = user_ids.join(',');
		const url = `/rpc/get_profile.php?user_ids=${uids}&tt=${this.tt}`;
		try {
			const json = await this.fetch(url);
			if(json.error) {
				throw new Error(json.message);
			}
			const details = {};
			for (const u of json.body) {
				details[u.user_id] = {
					user_id: u.user_id,
					is_follow: u.is_follow
				};
			}
			return details;
		} catch (error) {
			$error(error);
		}
	}
	async getRecommendationsAPIDetails(illust_ids = 'auto', num_recommendations = 500) {
		const searchParams = {
			type: 'illust',
			sample_illusts: illust_ids,
			num_recommendations,
			tt: this.tt
		};
		const url = `/rpc/recommender.php?${searchParams.entries.map(p => p.join('=')).join('&')}`;
		try {
			const data = await this.fetch(url);
			return data.recommendations.map(x => `${x}`);
		} catch (error) {
			$error(error);
		}
	}
	async postBookmarkAdd(illust_id) {
		const searchParams = {
			mode: 'save_illust_bookmark',
			illust_id,
			restrict: 0,
			comment: '',
			tags: '',
			tt: this.tt
		};
		const data = searchParams.entries.map(p => p.join('=')).join('&');
		const config = {
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
		};
		try {
			const res = await axios.post('/rpc/index.php', data, config);
			if(res.statusText === 'OK') {
				return !res.data.error;
			} else {
				throw new Error(res.statusText);
			}
		} catch (error) {
			$error(error);
		}
	}
	static removeAnnoyings(doc = document) {
		const annoyings = [
			'iframe',
			'.ad',
			'.ads_area',
			'.ad-footer',
			'.ads_anchor',
			'.ads-top-info',
			'.comic-hot-works',
			'.user-ad-container',
			'.ads_area_no_margin',
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
}

const PageType = {
	SEARCH: Symbol('SEARCH'),
	NEW_ILLUST: Symbol('NEW_ILLUST'),
	NO_SUPPORT: Symbol('NO_SUPPORT'),
	MY_BOOKMARK: Symbol('MY_BOOKMARK'),
	MEMBER_ILLIST: Symbol('MEMBER_ILLIST')
};

class Global {
	constructor() {
		this.l10n = new L10N();
		this.api = new Pixiv();
		this.library = [];
		this.filters = {
			limit: 0,
			orderBy: 'illust_id',
			tag: new RegExp('', 'i')
		};
		this.conf = {
			fitwidth: 1,
			sort: 0
		};
		const storeNamespace = this.constructor.NAME;
		this.store = {
			get: (key = null) => {
				const obj = JSON.parse(localStorage.getItem(storeNamespace) || '{}');
				if (key) {
					return obj[key];
				}
				return obj;
			},
			set: (obj) => {
				const storable = JSON.stringify(obj);
				localStorage.setItem(storeNamespace, storable);
			}
		};
		this.classifyPagetype();
	}
	applyConf() {
		if(this.pagetype !== PageType.NO_SUPPORT) {
			if (this.conf.fitwidth) {
				$('.ω').classList.add('↔');
			} else {
				$('.ω').classList.remove('↔');
			}
			if (this.conf.sort) {
				this.filters.orderBy = 'bookmark_count';
			} else {
				this.filters.orderBy = 'illust_id';
			}
			if (this.pagetype === PageType.MY_BOOKMARK) {
				for (const marker of $$('.js-legacy-mark-all, .js-legacy-unmark-all')) {
					marker.addEventListener('click', () => {
						$$('input[name="book_id[]"]').forEach(el => {
							el.checked = marker.classList.contains('js-legacy-mark-all');
						});
					});
				}
			}
		}
	}
	classifyPagetype() {
		const path = location.pathname;
		const searchParam = new URLSearchParams(location.search);
		const spId = searchParam.get('id');
		const spType = searchParam.get('type');
		switch (path) {
		case '/search.php':
			this.pagetype = PageType.SEARCH;
			break;
		case '/bookmark_new_illust.php':
		case '/new_illust.php':
		case '/mypixiv_new_illust.php':
		case '/new_illust_r18.php':
		case '/bookmark_new_illust_r18.php':
			this.pagetype = PageType.NEW_ILLUST;
			break;
		case '/discovery':
			this.pagetype = PageType.DISCOVERY;
			break;
		case '/member_illust.php':
			this.pagetype = spId ? PageType.MEMBER_ILLIST : PageType.NO_SUPPORT;
			break;
		case '/bookmark.php': {
			if (spId) {
				this.pagetype = PageType.NEW_ILLUST;
			} else if (!spType || spType === 'illust_all') {
				this.pagetype = PageType.MY_BOOKMARK;
			} else {
				this.pagetype = PageType.NO_SUPPORT;
			}
			break;
		}
		default:
			this.pagetype = PageType.NO_SUPPORT;
			break;
		}
		if(this.pagetype !== PageType.NO_SUPPORT) {
			$('#wrapper').classList.add('ω');
			this.koakumaMountPoint = $el('div', {className: 'koakumaMountPoint'}, (el) => {
				$('header._global-header').after(el);
			});
			if (this.pagetype === PageType.SEARCH) {
				this.patchouliMountPoint = $('#js-react-search-mid');
			} else {
				const _a = $('li.image-item');
				const _b = $('ul._image-items');
				this.patchouliMountPoint = _a ? _a.parentElement : _b;
			}
		}
	}
	static get VERSION() {
		return GM_info.script.version;
	}
	static get NAME() {
		return GM_info.script.name;
	}
}

class Crawler {
	constructor(global){
		this.library = global.library;
		this.api = global.api;
		this.pagetype = global.pagetype;
		this.next_url = location.href;
		this.isPaused = true;
		this.isEnded = false;
	}
	async startNextUrlBased(opt) {
		this.isPaused = false;
		while(this.canContinue() && opt.times) {
			let page = null;
			if (this.pagetype === PageType.SEARCH) {
				page = await this.api.getPageHTMLIllustIds(this.next_url);
			} else {
				page = await this.api.getLegacyPageHTMLIllustIds(this.next_url, {
					needBookmarkId: this.pagetype === PageType.MY_BOOKMARK
				});
			}
			this.next_url = page.next_url;
			const illust_api_details = await this.api.getIllustsAPIDetail(page.illust_ids);
			if (this.pagetype === PageType.MY_BOOKMARK) {
				const my_bookmark_api_details = page.bookmark_ids;
				for (const [illust_id, illust_detail] of Object.entries(illust_api_details)) {
					const bookmark_id = page.bookmark_ids[illust_id].bookmark_id;
					if (bookmark_id) {
						illust_detail.bookmark_id = bookmark_id;
					}
				}
			}
			const bookmark_html_details = await this.api.getBookmarkHTMLDetails(Object.keys(illust_api_details));
			const user_ids = Object.values(illust_api_details).map(d => d.user_id);
			const user_api_details = await this.api.getUsersAPIDetail(user_ids);
			const libraryData = this.makeLibraryData({illust_api_details, bookmark_html_details, user_api_details});
			this.library.push(...libraryData);
			opt.times -= 1;
			if (!opt.times) {
				this.pause();
			}
			if (!this.next_url) {
				this.stop();
			}
		}
	}
	async start(options){
		const opt = Object.assign({times: Infinity}, options);
		if(this.isEnded || opt.times <= 0) {
			return;
		}
		switch (this.pagetype) {
		case PageType.SEARCH:
		case PageType.NEW_ILLUST:
		case PageType.MY_BOOKMARK:
		case PageType.MEMBER_ILLIST:
			await this.startNextUrlBased(opt);
			break;
		default:
			break;
		}
	}
	pause(){
		this.isPaused = true;
	}
	stop(){
		this.pause();
		this.isEnded = true;
	}
	canContinue() {
		return !(this.isEnded || this.isPaused);
	}
	makeLibraryData({illust_api_details, bookmark_html_details, user_api_details}) {
		if(!illust_api_details || !Object.keys(illust_api_details).length) {
			throw new Error('Crawler#makeLibraryData: illust_api_details is falsy.');
		}
		const vLibrary = [];
		for (const [illust_id, illust_detail] of Object.entries(illust_api_details)) {
			const d = {
				illust_id,
				bookmark_count: bookmark_html_details[illust_id].bookmark_count,
				tags: bookmark_html_details[illust_id].tags.join(', '),
				illust_title: illust_detail.illust_title,
				illust_page_count: Number.toInt(illust_detail.illust_page_count),
				user_id: illust_detail.user_id,
				user_name: illust_detail.user_name,
				is_follow: user_api_details[illust_detail.user_id].is_follow,
				is_bookmarked: illust_detail.is_bookmarked,
				is_ugoira: !!illust_detail.ugoira_meta,
				profile_img: illust_detail.profile_img,
				url: {
					big: illust_detail.url.big,
					sq240: illust_detail.url['240mw'].replace('240x480', '240x240')
				}
			};
			if (this.pagetype === PageType.MY_BOOKMARK) {
				d.bookmark_id = illust_detail.bookmark_id;
			}
			vLibrary.push(d);
		}
		return vLibrary;
	}
}

__$styleInject(".ω.↔,\n.ω.↔ .layout-a,\n.ω.↔ .layout-body {\n    width: initial !important;\n}\n.ω.↔ .layout-a {\n    display: flex;\n    flex-direction: row-reverse;\n}\n.ω.↔ .layout-column-2{\n    flex: 1;\n    margin-left: 20px;\n}\n.ω.↔ .layout-body,\n.ω.↔ .layout-a {\n    margin: 10px 20px;\n}\n");

var DefaultImageItemImage = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"container"},[_c('a',{staticClass:"link",attrs:{"href":_vm.illustPageUrl,"rel":"noopener"}},[(_vm.illustPageCount > 1)?_c('div',{staticClass:"multiple"},[_c('span',[_c('span',{staticClass:"multiple-icon"}),_vm._v(" "+_vm._s(_vm.illustPageCount)+" ")])]):_vm._e(),_vm._v(" "),_c('img',{staticClass:"img",attrs:{"data-src":_vm.imgUrl,"src":_vm.imgUrl}}),_vm._v(" "),(_vm.isUgoira)?_c('div',{staticClass:"ugoira"}):_vm._e()]),_vm._v(" "),_c('div',{staticClass:"bookmark _one-click-bookmark",class:{on:_vm.selfIsBookmarked},attrs:{"data-click-action":"illust","data-click-label":_vm.illustId,"data-type":"illust","data-id":_vm.illustId,"title":_vm.selfIsBookmarked},on:{"click":_vm.oneClickBookmarkAdd}}),_vm._v(" "),(_vm.bookmarkId)?_c('div',{staticClass:"bookmark-input-container"},[_c('input',{attrs:{"name":"book_id[]","type":"checkbox"},domProps:{"value":_vm.bookmarkId}})]):_vm._e()])},staticRenderFns: [],_scopeId: 'data-v-23ff0f22',
  name: "DefaultImageItemImage",
  props: {
    imgUrl: String,
    illustId: String,
    illustPageCount: Number,
    isUgoira: Boolean,
    isBookmarked: Boolean,
    bookmarkId: String
  },
  data() {
    return {
      selfIsBookmarked: this.isBookmarked
    };
  },
  computed: {
    illustPageUrl() {
      return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;
    }
  },
  methods: {
    oneClickBookmarkAdd() {
      if (!selfIsBookmarked) {
        selfIsBookmarked = true;
      }
    }
  }
};
var DefaultImageItemTitle = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('figcaption',{staticClass:"container"},[_c('ul',[_c('li',{staticClass:"title"},[_c('a',{attrs:{"href":_vm.illustPageUrl,"title":_vm.illustTitle}},[_vm._v(_vm._s(_vm.illustTitle))])]),_vm._v(" "),(!_vm.isMemberIllistPage)?_c('li',[_c('a',{staticClass:"user ui-profile-popup",attrs:{"href":_vm.userPageUrl,"target":"_blank","title":_vm.userName,"data-user_id":_vm.userId,"data-user_name":_vm.userName}},[_c('span',{staticClass:"user-img",style:(_vm.profileImgStyle)}),_vm._v(" "),_c('span',[_vm._v(_vm._s(_vm.userName))])])]):_vm._e(),_vm._v(" "),(_vm.bookmarkCount > 0)?_c('li',[_c('ul',{staticClass:"count-list"},[_c('li',[_c('a',{staticClass:"_ui-tooltip bookmark-count",attrs:{"href":_vm.bookmarkDetailUrl,"data-tooltip":_vm.bookmarkTooltipMsg}},[_c('i',{staticClass:"_icon sprites-bookmark-badge"}),_vm._v(_vm._s(_vm.bookmarkCount))])])])]):_vm._e()])])},staticRenderFns: [],_scopeId: 'data-v-b9e9aa28',
  name: "DefaultImageItemTitle",
  props: {
    illustId: String,
    illustTitle: String,
    userName: String,
    userId: String,
    profileImgUrl: String,
    bookmarkCount: Number,
    bookmarkTooltipMsgFunc: Function,
    pagetype: Symbol
  },
  computed: {
    illustPageUrl() {
      return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;
    },
    userPageUrl() {
      return `/member_illust.php?id=${this.userId}`;
    },
    bookmarkDetailUrl() {
      return `/bookmark_detail.php?illust_id=${this.illustId}`;
    },
    bookmarkTooltipMsg() {
      return this.bookmarkTooltipMsgFunc(this.bookmarkCount);
    },
    profileImgStyle() {
      return {
        backgroundImage: `url(${this.profileImgUrl})`
      };
    },
    isMemberIllistPage() {
      return this.pagetype.toString() === "Symbol(MEMBER_ILLIST)";
    }
  }
};
var DefaultImageItem = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"image-item"},[_c('figure',{staticClass:"image-item-inner"},[_c('DefaultImageItemImage',{attrs:{"imgUrl":_vm.imgUrl,"illustId":_vm.illustId,"illustPageCount":_vm.illustPageCount,"isUgoira":_vm.isUgoira,"isBookmarked":_vm.isBookmarked,"bookmarkId":_vm.bookmarkId}}),_vm._v(" "),_c('DefaultImageItemTitle',{attrs:{"illustId":_vm.illustId,"illustTitle":_vm.illustTitle,"userName":_vm.userName,"userId":_vm.userId,"profileImgUrl":_vm.profileImgUrl,"bookmarkCount":_vm.bookmarkCount,"bookmarkTooltipMsgFunc":_vm.bookmarkTooltipMsgFunc,"pagetype":_vm.pagetype}})],1)])},staticRenderFns: [],_scopeId: 'data-v-7313ace1',
  name: "DefaultImageItem",
  components: {
    DefaultImageItemImage,
    DefaultImageItemTitle
  },
  props: {
    imgUrl: String,
    illustId: String,
    illustTitle: String,
    illustPageCount: Number,
    isUgoira: Boolean,
    isBookmarked: Boolean,
    userName: String,
    userId: String,
    profileImgUrl: String,
    bookmarkCount: Number,
    bookmarkTooltipMsgFunc: Function,
    bookmarkId: { type: String, default: "" },
    pagetype: Symbol
  }
};
var _default = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{attrs:{"id":"patchouli"}},_vm._l((_vm.filteredLibrary),function(d){return _c('DefaultImageItem',{key:d.illust_id,attrs:{"imgUrl":d.url.sq240,"illustId":d.illust_id,"illustTitle":d.illust_title,"illustPageCount":d.illust_page_count,"isUgoira":d.is_ugoira,"userName":d.user_name,"userId":d.user_id,"profileImgUrl":d.profile_img,"bookmarkCount":d.bookmark_count,"bookmarkTooltipMsgFunc":_vm.bookmarkTooltipMsgFunc,"isBookmarked":d.is_bookmarked,"bookmarkId":d.bookmark_id,"pagetype":_vm.pagetype}})}))},staticRenderFns: [],_scopeId: 'data-v-186857e1',
  name: "Default",
  components: {
    DefaultImageItem
  },
  props: ["library", "l10n", "pagetype", "filters"],
  computed: {
    bookmarkTooltipMsgFunc() {
      return this.l10n.bookmarkTooltip.bind(this.l10n);
    },
    filteredLibrary() {
      const cloneLibrary = this.library.slice();
      return cloneLibrary
        .filter(el => el.bookmark_count >= this.filters.limit)
        .filter(el => el.tags.match(this.filters.tag))
        .sort(
          (a, b) =>
            Number.toInt(b[this.filters.orderBy]) -
            Number.toInt(a[this.filters.orderBy])
        );
    }
  }
};
var koakuma = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{attrs:{"id":"koakuma"}},[_c('div',{staticClass:"processed"},[_vm._v(_vm._s(_vm.processedMsg))]),_vm._v(" "),_c('div',[_c('label',{staticClass:"bookmark-count",attrs:{"for":"koakuma-bookmark-sort-input"}},[_c('i',{staticClass:"_icon sprites-bookmark-badge"}),_vm._v(" "),_c('input',{attrs:{"id":"koakuma-bookmark-sort-input","type":"number","min":"0","step":"1"},domProps:{"value":_vm.filters.limit},on:{"wheel":function($event){$event.stopPropagation();$event.preventDefault();_vm.sortInputWheel($event);},"input":_vm.sortInputInput}}),_vm._v("↑ ")])]),_vm._v(" "),_c('div',[_c('input',{staticClass:"tag-filter",attrs:{"type":"text","placeholder":_vm.l10n.tagFilterPlaceholder},on:{"input":_vm.tagFilterInput}})]),_vm._v(" "),_c('div',[_c('button',{staticClass:"explosion",class:_vm.buttonClass,attrs:{"disabled":_vm.crawler.isEnded},on:{"click":_vm.clickExplosion}},[_vm._v(_vm._s(_vm.buttonMsg))])]),_vm._v(" "),_c('div',[_c('input',{attrs:{"type":"checkbox","id":"koakuma-options-fit-browser-width"},domProps:{"checked":_vm.conf.fitwidth},on:{"change":_vm.optionsChange}}),_vm._v(" "),_c('label',{attrs:{"for":"koakuma-options-fit-browser-width"}},[_vm._v(_vm._s(_vm.l10n.fitBrowserWidth))]),_vm._v(" "),_c('input',{attrs:{"type":"checkbox","id":"koakuma-options-sort-by-bookmark-count"},domProps:{"checked":_vm.conf.sort},on:{"change":_vm.optionsChange}}),_vm._v(" "),_c('label',{attrs:{"for":"koakuma-options-sort-by-bookmark-count"}},[_vm._v(_vm._s(_vm.l10n.sortByBookmarkCount))])])])},staticRenderFns: [],_scopeId: 'data-v-40b353ca',
  name: "Koakuma",
  props: ["crawler", "l10n", "filters", "store", "conf", "applyConf"],
  computed: {
    processedMsg() {
      return this.l10n.koakumaProcessed.call(
        this.l10n,
        this.crawler.library.length
      );
    },
    buttonClass() {
      return {
        end: this.crawler.isEnded,
        paused: !this.crawler.isPaused && !this.crawler.isEnded,
        go: this.crawler.isPaused && !this.crawler.isEnded
      };
    },
    buttonMsg() {
      if (this.crawler.isEnded) {
        return this.l10n.koakumaEnd;
      } else if (this.crawler.isPaused) {
        return this.l10n.koakumaGo;
      } else {
        return this.l10n.koakumaPause;
      }
    }
  },
  methods: {
    clickExplosion() {
      if (this.crawler.isPaused) {
        this.crawler.start();
      } else {
        this.crawler.pause();
      }
    },
    sortInputWheel(event) {
      if (event.deltaY < 0) {
        this.filters.limit = Number.toInt(event.target.value) + 20;
      } else {
        this.filters.limit = Math.max(0, Number.toInt(event.target.value) - 20);
      }
    },
    sortInputInput(event) {
      if (this.debounceId0) {
        clearTimeout(this.debounceId0);
      }
      this.debounceId0 = setTimeout(() => {
        this.debounceId0 = null;
        this.filters.limit = Math.max(0, Number.toInt(event.target.value));
      }, 500);
    },
    optionsChange(event) {
      if (event.target.id === "koakuma-options-fit-browser-width") {
        this.conf.fitwidth = event.target.checked;
      } else {
        this.conf.sort = Number.toInt(event.target.checked);
      }
      this.store.set(this.conf);
      this.applyConf();
    },
    tagFilterInput(event) {
      if (this.debounceId1) {
        clearTimeout(this.debounceId1);
      }
      this.debounceId1 = setTimeout(() => {
        this.debounceId1 = null;
        this.filters.tag = new RegExp(event.target.value, "ig");
      }, 1500);
    }
  },
  data() {
    return {
      debounceId0: null,
      debounceId1: null
    };
  }
};

__$styleInject("#patchouli[data-v-186857e1] {\n  display: flex;\n  flex-flow: wrap;\n  justify-content: space-around;\n}\n.image-item[data-v-7313ace1] {\n  display: flex;\n  justify-content: center;\n  margin: 0 0 30px 0;\n  padding: 10px;\n  height: auto;\n  width: 200px;\n}\n.image-item-inner[data-v-7313ace1] {\n  display: flex;\n  flex-flow: column;\n  max-width: 100%;\n}\n.container[data-v-23ff0f22] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  position: relative;\n}\n.multiple[data-v-23ff0f22] {\n  position: absolute;\n  right: 0;\n  top: 0;\n  background: rgba(0, 0, 0, 0.4);\n  padding: 6px;\n  color: #fff;\n  border-radius: 0 0 0 4px;\n  font-weight: 700;\n}\n.multiple-icon[data-v-23ff0f22] {\n  background: url(https://source.pixiv.net/www/js/bundle/0d96c2a49f75a8fa27d0424549169573.svg);\n  width: 10px;\n  height: 10px;\n  display: inline-block;\n}\n.img[data-v-23ff0f22] {\n  max-height: 200px;\n  max-width: 200px;\n  object-fit: cover;\n}\n.link[data-v-23ff0f22] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  max-width: 200px;\n  max-height: 200px;\n  border: 1px solid rgba(0, 0, 0, 0.04);\n}\n.ugoira[data-v-23ff0f22] {\n  background: url(https://source.pixiv.net/www/js/bundle/70ae15bac4e2e134bbf9d5727859f1fc.svg);\n  position: absolute;\n  width: 40px;\n  height: 40px;\n}\n.bookmark[data-v-23ff0f22] {\n  right: 0;\n}\n.bookmark-input-container[data-v-23ff0f22] {\n  position: absolute;\n  left: 0;\n  top: 0;\n  background: rgba(0, 0, 0, 0.4);\n  padding: 6px;\n  border-radius: 0 0 4px 0;\n}\n.container[data-v-b9e9aa28] {\n  max-width: 100%;\n}\n.title[data-v-b9e9aa28] {\n  font-weight: 700;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.user[data-v-b9e9aa28] {\n  font-size: 12px;\n  display: inline-flex;\n  align-items: center;\n}\n.user-img[data-v-b9e9aa28] {\n  width: 20px;\n  height: 20px;\n  display: inline-block;\n  background-size: cover;\n  border-radius: 50%;\n  margin-right: 4px;\n}\n#koakuma[data-v-40b353ca] {\n  display: flex;\n  justify-content: center;\n  position: sticky;\n  top: 0;\n  z-index: 3;\n  background-color: #e77;\n  color: #fff;\n  padding: 4px;\n  font-size: 16px;\n}\n#koakuma > div[data-v-40b353ca] {\n  margin: 0 10px;\n}\n.bookmark-count[data-v-40b353ca] {\n  display: inline-flex !important;\n  align-items: center;\n}\n#koakuma-bookmark-sort-input[data-v-40b353ca] {\n  -moz-appearance: textfield;\n  border: none;\n  background-color: transparent;\n  padding: 0px;\n  color: inherit;\n  font-size: 16px;\n  display: inline-block;\n  cursor: ns-resize;\n  text-align: center;\n  max-width: 50px;\n}\n.tag-filter[data-v-40b353ca] {\n  min-width: 300px;\n}\n.explosion[data-v-40b353ca] {\n  border: none;\n  padding: 2px 14px;\n  border-radius: 3px;\n  font-size: 16px;\n}\n.explosion[data-v-40b353ca]:enabled:hover {\n  box-shadow: 1px 1px;\n}\n.explosion[data-v-40b353ca]:enabled:active {\n  box-shadow: 1px 1px inset;\n}\n.go[data-v-40b353ca] {\n  background-color: #64ffda;\n}\n.paused[data-v-40b353ca] {\n  background-color: #ffd600;\n}\n.end[data-v-40b353ca] {\n  background-color: #455a64;\n  color: #fff;\n  opacity: 0.9;\n}");

const global = new Global();
$log(`[${Global.NAME}] version: ${Global.VERSION}`);
const storeVersion = global.store.get('version');
if(!storeVersion || Global.VERSION > storeVersion) {
	global.store.set(Object.assign({
		version: Global.VERSION
	}, global.conf));
} else {
	Object.assign(global.conf, global.store.get());
}
global.applyConf();
Pixiv.removeAnnoyings();
if(global.pagetype !== PageType.NO_SUPPORT) {
	const crawler = new Crawler(global);
	const patchouli = new Vue({
		components: {Default: _default},
		data: {
			l10n: global.l10n,
			library: global.library,
			pagetype: global.pagetype,
			filters: global.filters
		},
		template: '<Default :l10n="l10n" :library="library" :pagetype="pagetype" :filters="filters" />'
	});
	const koakuma$$1 = new Vue({
		components: {Koakuma: koakuma},
		data: {
			l10n: global.l10n,
			filters: global.filters,
			store: global.store,
			conf: global.conf,
			applyConf: global.applyConf.bind(global),
			crawler
		},
		template: '<Koakuma :l10n="l10n" :crawler="crawler" :filters="filters" :store="store" :conf="conf" :applyConf="applyConf"/>'
	});
	crawler.start({times: 1}).then(() => {
		patchouli.$mount(global.patchouliMountPoint);
		koakuma$$1.$mount(global.koakumaMountPoint);
	}).catch(error => {
		$error(error);
	});
}

}());
