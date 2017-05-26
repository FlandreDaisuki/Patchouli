// ==UserScript==
// @name	Patchouli
// @name:ja	パチュリー
// @name:zh-TW	帕秋莉
// @name:zh-CN	帕秋莉
// @description		An image searching/browsing tool on Pixiv
// @description:ja	An image searching/browsing tool on Pixiv
// @description:zh-TW	輕量版Pixiv++
// @description:zh-CN	輕量版Pixiv++
// @namespace	https://github.com/FlandreDaisuki
// @author		FlandreDaisuki
// @include		*://www.pixiv.net/*
// @require		https://cdnjs.cloudflare.com/ajax/libs/vue/2.3.3/vue.min.js
// @require		https://cdnjs.cloudflare.com/ajax/libs/axios/0.16.1/axios.min.js
// @version		2017.05.25
// @icon		http://i.imgur.com/VwoYc5w.png
// @grant		none
// @noframes
// ==/UserScript==
'use strict';
console.log(`[${GM_info.script.name}] version: ${GM_info.script.version}`);
class L10N {
	constructor() {
		this.lang = document.documentElement.lang;
		this.following = this._following();
		this.bookmark = this._bookmark();
		this.koakumaGo = this._koakumaGo();
		this.koakumaPause = this._koakumaPause();
		this.koakumaEnd = this._koakumaEnd();
		this.koakumaFullwidth = this._koakumaFullwidth();
		this.koakumaSort = this._koakumaSort();
	}

	_following() {
		switch (this.lang) {
			case 'ja':
				return 'フォロー中';
			case 'zh-tw':
				return '關注中';
			case 'zh':
				return '关注中';
			default:
				return 'following';
		}
	}

	_bookmark() {
		switch (this.lang) {
			case 'ja':
				return 'ブックマーク';
			case 'zh-tw':
			case 'zh':
				return '收藏';
			default:
				return 'Bookmark';
		}
	}

	_koakumaGo() {
		switch (this.lang) {
			case 'ja':
				return '捜す';
			case 'zh-tw':
			case 'zh':
				return '找';
			default:
				return 'Go';
		}
	}

	_koakumaPause() {
		switch (this.lang) {
			case 'ja':
				return '中断';
			case 'zh-tw':
			case 'zh':
				return '停';
			default:
				return 'Pause';
		}
	}

	_koakumaEnd() {
		switch (this.lang) {
			case 'ja':
				return '終了';
			case 'zh-tw':
			case 'zh':
				return '完';
			default:
				return 'End';
		}
	}

	koakumaProcessed(n) {
		switch (this.lang) {
			case 'ja':
				return `${n} 件が処理された`;
			case 'zh-tw':
				return `已處理 ${n} 張`
			case 'zh':
				return `已处理 ${n} 张`;
			default:
				return `${n} pics processed`;
		}
	}

	_koakumaFullwidth() {
		switch (this.lang) {
			case 'ja':
				return '全幅';
			case 'zh-tw':
				return '全寬';
			case 'zh':
				return '全宽';
			default:
				return 'fullwidth';
		}
	}

	_koakumaSort() {
		switch (this.lang) {
			case 'ja':
				return 'ソート';
			case 'zh-tw':
			case 'zh':
				return '排序';
			default:
				return 'sorted';
		}
	}

	bookmarkTooltip(n) {
		switch (this.lang) {
			case 'ja':
				return `${n}件のブックマーク`;
			case 'zh-tw':
				return `${n}個收藏`
			case 'zh':
				return `${n}个收藏`;
			default:
				return `${n} bookmarks`;
		}
	}
}
class Pixiv {
	constructor() {
		this.tt = document.querySelector('input[name="tt"]').value;
	}

	static storageGet() {
		const storage = localStorage.getItem('むきゅー');
		if (!storage || storage.version < GM_info.script.version) {
			Pixiv.storageSet({
				version: GM_info.script.version
			});
		}
		return JSON.parse(localStorage.getItem('むきゅー'));
	}

	static storageSet(obj) {
		localStorage.setItem('むきゅー', JSON.stringify(obj));
	}

	static toDOM(html) {
		return (new DOMParser()).parseFromString(html, 'text/html');
	}

	static rmAnnoyance(doc = document) {
		[
			'iframe',
			//Ad
			'.ad',
			'.ads_area',
			'.ad-footer',
			'.ads_anchor',
			'.ads-top-info',
			'.comic-hot-works',
			'.user-ad-container',
			'.ads_area_no_margin',
			//Premium
			'.hover-item',
			'.ad-printservice',
			'.bookmark-ranges',
			'.require-premium',
			'.showcase-reminder',
			'.sample-user-search',
			'.popular-introduction',
		].forEach(cl => [...doc.querySelectorAll(cl)].forEach(el => el.remove()));
	}

	static hrefAttr(elem) {
		const a = elem;
		if (!a) {
			return '';
		} else if (a.href) {
			// Firefox
			return a.href;
		} else {
			// Chrome
			const m = a.outerHTML.match(/href="([^"]+)"/);
			if (!m) {
				return '';
			}
			const query = m[1].replace(/&amp;/g, '&');
			return `${location.pathname}${query}`;
		}
	}

	async fetch(url) {
		try {
			const res = await axios.get(url);
			if (res.statusText !== 'OK') {
				throw res;
			} else {
				return res.data;
			}
		} catch (e) {
			console.error(e);
		}
	}

	async getDetail(illust_ids, f) {
		const _a = await Promise.all(illust_ids.map(f));
		return _a.reduce((acc, val) => {
			acc[val.illust_id] = val;
			return acc;
		}, {});
	}

	async getBookmarkCount(illust_id) {
		const url = `/bookmark_detail.php?illust_id=${illust_id}`;

		try {
			const doc = await this.fetch(url).then(Pixiv.toDOM);
			const _a = doc.querySelector('a.bookmark-count');
			const bookmark_count = _a ? parseInt(_a.innerText) : 0;

			return {
				bookmark_count,
				illust_id,
			};
		} catch (e) {
			console.error(e);
		}
	}

	/**
	 * Returns detail object that illust_id: detail object by DOM
	 *
	 * { '12345': {}, '12346': {}, ... }
	 * @param {String[]} illust_ids
	 * @return {{String: Object}}
	 */
	async getBookmarksDetail(illust_ids) {
		const _f = this.getBookmarkCount.bind(this);
		return await this.getDetail(illust_ids, _f);
	}

	async getIllustPageDetail(illust_id) {
		const url = `/member_illust.php?mode=medium&illust_id=${illust_id}`;

		try {
			const doc = await this.fetch(url).then(Pixiv.toDOM);
			const _a = doc.querySelector('.score-count');
			const rating_score = _a ? parseInt(_a.innerText) : 0;

			return {
				illust_id,
				rating_score,
			};
		} catch (e) {
			console.error(e);
		}
	}

	/**
	 * Returns detail object that illust_id: detail object by DOM
	 *
	 * { '12345': {}, '12346': {}, ... }
	 * @param {String[]} illust_ids
	 * @return {{String: Object}}
	 */
	async getIllustPagesDetail(illust_ids) {
		const _f = this.getIllustPageDetail.bind(this);
		return await this.getDetail(illust_ids, _f);
	}

	/**
	 * Returns detail object that illust_id: detail object by Pixiv API
	 *
	 * { '12345': {}, '12346': {}, ... }
	 * @param {String[]} illust_ids
	 * @return {{String: Object}}
	 */
	getIllustsDetail(illust_ids) {
		const iids = illust_ids.join(',');
		if(iids.indexOf(',,')>=0) {
		}
		const url = `/rpc/index.php?mode=get_illust_detail_by_ids&illust_ids=${iids}&tt=${this.tt}`;

		return this.fetch(url)
			.then(json => json.body)
			.catch(console.error);
	}

	/**
	 * Returns detail object that user_id: detail object by Pixiv API
	 *
	 * { '12345': {}, '12346': {}, ... }
	 * @param {String[]} user_ids
	 * @return {{String: Object}}
	 */
	getUsersDetail(user_ids) {
		const uids = user_ids.join(',');
		const url = `/rpc/get_profile.php?user_ids=${uids}&tt=${this.tt}`;

		return this.fetch(url)
			.then(json => json.body)
			.then(arr => arr.reduce((a, b) => {
				// make the same output of getIllustsDetail
				a[b.user_id] = b;
				return a;
			}, {}))
			.catch(console.error);
	}

	postBookmarkadd(illust_id) {
		const data = [
			'mode=save_illust_bookmark',
			`illust_id=${illust_id}`,
			'restrict=0',
			'comment=',
			'tags=',
			`tt=${this.tt}`,
		].join('&');
		const config = {
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
		};

		return axios.post('/rpc/index.php', data, config)
			.then(res => {
				return new Promise((resolve, reject) => {
					(res.statusText === 'OK' && !res.data.error) ? resolve(true): reject(res);
				});
			})
			.catch(console.error);
	}

	/**
	 * Returns array of recommend illust_id
	 * @return {String[]}
	 */
	async getRecommendIllustids(illust_id = 'auto') {
		const param = [
			'type=illust',
			`sample_illusts=${illust_id}`,
			'num_recommendations=500',
			`tt=${this.tt}`,
		].join('&');
		const url = `/rpc/recommender.php?${param}`;
		try {
			return await this.fetch(url).then(data => data.recommendations.map(x => `${x}`));
		} catch (e) {
			console.error(e);
		}
	}

	/**
	 * Returns array of recommend illust_id
	 * @param {String} url
	 * @return {{next_url: String, illust_ids: String[]}}
	 */
	async getPageIllustids(url) {
		try {
			const doc = await this.fetch(url).then(Pixiv.toDOM);
			Pixiv.rmAnnoyance(doc);
			const next_url = Pixiv.hrefAttr(doc.querySelector('.next a'));
			const imgs = [...doc.querySelectorAll('.image-item img')];
			const illust_ids = imgs.map(x => x.dataset.id).filter(x => x !== '0');

			return {
				next_url,
				illust_ids,
			};
		} catch (e) {
			console.error(e);
		}
	}
}
const utils = {
	linkStyle(url) {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = url;
		document.head.appendChild(link);
	},
	linkScript(url) {
		const script = document.createElement('script');
		script.src = url;
		document.head.appendChild(script);
	},
	createIcon(name, options = {}) {
		const el = document.createElement('i');
		el.classList.add('fa');
		el.classList.add(`fa-${name}`);
		el.setAttribute('aria-hidden', 'true');
		return el;
	},
	addStyle(text, id = '') {
		const style = document.createElement('style');
		style.innerHTML = text;
		if (id) {
			style.id = id;
		}
		document.head.appendChild(style);
	},
	asyncWhile(condition, action, options = {}) {
		options = Object.assign({
			first: undefined,
			ctx: this,
		}, options);
		const ctx = options.ctx;
		const first = options.first;
		const whilst = function(data) {
			return condition.call(ctx, data) ?
				Promise.resolve(action.call(ctx, data)).then(whilst) :
				data;
		};

		return whilst(first);
	}
};
const global = {
	api: new Pixiv(),
	l10n: new L10N(),
	books: [],
	filters: {
		limit: 0,
		orderBy: 'illust_id',
	},
	favorite: {
		fullwidth: 1,
		sort: 0,
	},
	patchouliToMount: (() => {
		const _a = document.querySelector('li.image-item');
		const _b = document.querySelector('ul._image-items');
		return _a ? _a.parentElement : _b;
	})(),
	koakumaToMount: (() => {
		return document.querySelector('#toolbar-items');
	})(),
	pageType: (() => {
		const path = location.pathname;
		const search = new URLSearchParams(location.search);

		/** type - for patchouli <image-item>, need (not) next page
		 *
		 *	default: thumb + title + user + count-list , need next page
		 *	member-illust: default w/o user, need next page
		 *	mybookmark:  default with bookmark-edit, need next page
		 *	recommend: default , need not next page
		 *	ranking: ranking , need not next page
		 */

		switch (path) {
			case '/search.php':
			case '/bookmark_new_illust.php':
			case '/new_illust.php':
			case '/mypixiv_new_illust.php':
			case '/new_illust_r18.php':
			case '/bookmark_new_illust_r18.php':
				return 'default';
			case '/recommended.php':
				return 'recommend';
			case '/member_illust.php':
				return search.has('id') ? 'member-illust' : 'not support';
			case '/bookmark.php':
				const t = search.get('type')
				if (search.has('id')) {
					return 'default';
				} else if (!t || t === 'illust_all') {
					return 'mybookmark';
				} else {
					// e.g. http://www.pixiv.net/bookmark.php?type=reg_user
					return 'not support';
				}
			default:
				return 'not support';
		}
	})(),
};
global.favorite = (() => {
	const _s = Object.assign(global.favorite, Pixiv.storageGet());
	if (_s.fullwidth) {
		document.querySelector('#wrapper').classList.add('fullwidth');
	}
	if (_s.sort) {
		global.filters.orderBy = 'bookmark_count';
	}
	Pixiv.storageSet(_s);
	return _s;
})();
Vue.directive('dataset', {
	bind: function(el, binding) {
		for (let key of Object.keys(binding.value)) {
			el.dataset[key] = binding.value[key];
		}
	}
});
Vue.component('koakuma-bookmark', {
	props: ['limit', 'l10n'],
	methods: {
		blur(event) {
			const self = event.target;
			if (!self.validity.valid) {
				console.error('koakuma-bookmark', self.validationMessage);
			}
		},
		input(event) {
			let val = parseInt(event.target.value);
			val = Math.max(0, val);
			this.$emit('limitUpdate', val);
		},
		wheel(event) {
			let val;
			if (event.deltaY < 0) {
				val = this.limit + 20;
			} else {
				val = Math.max(0, this.limit - 20);
			}
			this.$emit('limitUpdate', val);
		},
	},
	template: `
	<div id="koakuma-bookmark">
		<label for="koakuma-bookmark-input">★{{ l10n.bookmark }}</label>
		<input id="koakuma-bookmark-input"
			type="number" min="0" step="1"
			:value="limit"
			@wheel.stop.prevent="wheel"
			@blur="blur"
			@input="input"/>
	</div>`,
});
Vue.component('koakuma-settings', {
	props: ['favorite', 'l10n'],
	methods: {
		fullwidthClick(event) {
			this.$emit('fullwidthUpdate', event.target.checked);
		},
		sortClick(event) {
			this.$emit('sortUpdate', event.target.checked);
		},
	},
	template: `
	<div>
		<input id="koakuma-settings-fullwidth" type="checkbox"
			:checked="favorite.fullwidth"
			@click="fullwidthClick"> {{ l10n.koakumaFullwidth }}
		<input id="koakuma-settings-sort" type="checkbox"
			:checked="favorite.sort"
			@click="sortClick"> {{ l10n.koakumaSort }}
	</div>`,
});
const koakumaTemplate = `
<div id="こあくま">
	<div>{{ l10n.koakumaProcessed(books.length) }}</div>
	<koakuma-bookmark :l10n="l10n"
		:limit="filters.limit"
		@limitUpdate="limitUpdate"></koakuma-bookmark>
	<button id="koakuma-switch"
		@click="switchSearching"
		:disabled="isEnded"
		:class="switchStyle">{{ switchText }}</button>
	<koakuma-settings :l10n="l10n"
		:favorite="favorite"
		@fullwidthUpdate="fullwidthUpdate"
		@sortUpdate="sortUpdate"></koakuma-settings>
</div>`;
const koakuma = new Vue({
	data: {
		l10n: global.l10n,
		books: global.books,
		filters: global.filters,
		api: global.api,
		favorite: global.favorite,
		pageType: global.pageType,
		next_url: location.href,
		isStoped: true,
		isEnded: false,
		local_ids: [],
	},
	methods: {
		async start(times = Infinity) {
			this.isStoped = false;
			const toContinue = () => {
				return !this.isEnded && !this.isStoped && times > 0 &&
					(this.next_url !== '' || this.local_ids.length);
			};
			while (toContinue()) {
				// get illust_ids and next_url
				if (this.pageType === 'default' || this.pageType === 'member-illust') {
					const res = await this.api.getPageIllustids(this.next_url);
					if (res.next_url === this.next_url) {
						// debounce
						break;
					}
					this.next_url = res.next_url;
					this.local_ids.push(...res.illust_ids);
				} else if (this.pageType === 'recommend') {
					if (this.next_url !== '') {
						const res = await this.api.getRecommendIllustids();
						this.next_url = '';
						this.local_ids.push(...res);
					}
				} else if (this.pageType === 'mybookmark') {
					const res = await this.api.getPageIllustids(this.next_url);
					if (res.next_url === this.next_url) {
						// debounce
						break;
					}
					this.next_url = res.next_url;
					this.local_ids.push(...res.illust_ids);
				} else {
					console.error('Unknown pageType:', this.pageType);
				}

				//get illust_ids from local_ids
				const process_ids = this.local_ids.slice(0, 20)
					.filter(id => !this.books.includes(id));
				this.local_ids = this.local_ids.slice(20);
				const ild = await this.api.getIllustsDetail(process_ids);
				for(let k in ild) {
					if(ild[k].error) {
						delete ild[k];
					}
				}
				const iids = Object.values(ild).map(x => x.illust_id);
				const ipd = await this.api.getIllustPagesDetail(iids);
				const bd = await this.api.getBookmarksDetail(iids);
				const uids = Object.values(ild).map(x => x.user_id).filter((item, pos, self) => {
					// make user_ids unique
					return self.indexOf(item) == pos;
				});
				const ud = await this.api.getUsersDetail(uids);

				for (let i of iids) {
					const illust = ild[i];
					const book = {
						illust_id: illust.illust_id,
						thumb_src: illust.url['240mw'].replace('240x480', '150x150'),
						user_id: illust.user_id,
						user_name: illust.user_name,
						illust_title: illust.illust_title,
						is_multiple: illust.is_multiple,
						is_bookmarked: illust.is_bookmarked,
						is_manga: illust.illust_type === '1',
						is_ugoira: !!illust.ugoira_meta,
						is_follow: ud[illust.user_id].is_follow,
						bookmark_count: bd[illust.illust_id].bookmark_count,
						// tags: bd[illust.illust_id].somehow,
						rating_score: ipd[illust.illust_id].rating_score,
					}
					this.books.push(book);
				}
				times--;
			}
			// End of while
			if (this.next_url === '') {
				this.stop();
				this.isEnded = this.local_ids.length <= 0;
			}
			if (times <= 0) {
				this.stop();
			}
		},
		stop() {
			this.isStoped = true;
		},
		switchSearching() {
			if (this.isStoped) {
				this.start();
			} else {
				this.stop();
			}
		},
		limitUpdate(value) {
			global.filters.limit = isNaN(value) ? 0 : value;
		},
		fullwidthUpdate(todo) {
			if (todo) {
				document.querySelector('#wrapper').classList.add('fullwidth');
				global.favorite.fullwidth = 1;
			} else {
				document.querySelector('#wrapper').classList.remove('fullwidth');
				global.favorite.fullwidth = 0;
			}
			Pixiv.storageSet(global.favorite);
		},
		sortUpdate(todo) {
			if (todo) {
				global.filters.orderBy = 'bookmark_count';
				global.favorite.sort = 1;
			} else {
				global.filters.orderBy = 'illust_id';
				global.favorite.sort = 0;
			}
			Pixiv.storageSet(global.favorite);
		},
	},
	computed: {
		switchText() {
			return this.isEnded ? this.l10n.koakumaEnd :
				(this.isStoped ? this.l10n.koakumaGo : this.l10n.koakumaPause);
		},
		switchStyle() {
			return {
				ended: this.isEnded,
				toSearch: !this.isEnded && this.isStoped,
				toStop: !this.isEnded && !this.isStoped,
			};
		},
	},
	template: koakumaTemplate,
});
if (global.pageType !== 'not support') {
	utils.addStyle(`
	#wrapper.fullwidth,
	#wrapper.fullwidth .layout-a,
	#wrapper.fullwidth .layout-body {
		width: initial;
	}
	#wrapper.fullwidth .layout-a {
		display: flex;
		flex-direction: row-reverse;
	}
	#wrapper.fullwidth .layout-column-2{
		flex: 1;
		margin-left: 20px;
	}
	#wrapper.fullwidth .layout-body,
	#wrapper.fullwidth .layout-a {
		margin: 10px 20px;
	}

	#koakuma-bookmark {
		display: flex;
	}
	#koakuma-bookmark label{
		white-space: nowrap;
		color: #0069b1 !important;
		background-color: #cceeff;
		border-radius: 3px;
		padding: 0 6px;
	}
	#koakuma-bookmark-input::-webkit-inner-spin-button,
	#koakuma-bookmark-input::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	#koakuma-bookmark-input {
		-moz-appearance: textfield;
		border: none;
		background-color: transparent;
		padding: 0px;
		color: blue;
		font-size: 16px;
		display: inline-block;
		cursor: ns-resize;
		text-align: center;
		min-width: 0;
	}
	#koakuma-bookmark-input:focus {
		cursor: initial;
	}
	#koakuma-switch {
		border: 0;
		padding: 3px 20px;
		border-radius: 3px;
		font-size: 16px;
	}
	#koakuma-switch:hover {
		box-shadow: 1px 1px gray;
	}
	#koakuma-switch:active {
		box-shadow: 1px 1px gray inset;
	}
	#koakuma-switch:focus {
		outline: 0;
	}
	#koakuma-switch.toSearch {
		background-color: lightgreen;
	}
	#koakuma-switch.toStop {
		background-color: lightpink;
	}
	#koakuma-switch.ended {
		background-color: lightgrey;
	}
	#koakuma-switch.ended:hover,
	#koakuma-switch.ended:hover {
		box-shadow: unset;
	}
	#こあくま {
		position: fixed;
		left: 22px;
		bottom: 10px;
		z-index: 1;
		background-color: aliceblue;
		border-radius: 10px;
		padding: 5px;
		font-size: 16px;
		text-align: center;
		width: 162px;
	}
	#こあくま > * {
		margin: 2px 0;
	}`);
}
Vue.component('image-item-thumb', {
	props: ['detail'],
	computed: {
		thumbStyle() {
			return {
				multiple: this.detail.multiple,
				manga: this.detail.manga,
				'ugoku-illust': this.detail.ugoira,
			};
		},
	},
	template: `
		<a class="work _work" :href="detail.href" :class="thumbStyle">
			<div><img :src="detail.src"></div>
		</a>`,
});

Vue.component('image-item-title', {
	props: ['detail'],
	template: `
		<a :href="detail.href">
			<h1 class="title" :title="detail.title">{{ detail.title }}</h1>
		</a>`,
});

Vue.component('image-item-user', {
	props: ['user'],
	computed: {
		href() {
			return `/member_illust.php?id=${this.user.id}`;
		},
		userStyle() {
			return {
				following: this.user.is_follow,
			};
		},
	},
	template: `
		<span>
			<a class="user ui-profile-popup"
				:href="href"
				:title="user.name"
				:data-user_id="user.id">{{ user.name }}</a>
			<i class="fa fa-feed" aria-hidden="true" v-show="user.is_follow"></i>
		</span>`,
});

Vue.component('image-item-count-list', {
	props: ['api', 'detail', 'l10n'],
	data() {
		return {
			bookmarked: this.detail.bookmarked,
		};
	},
	computed: {
		tooltip() {
			return this.l10n.bookmarkTooltip(this.detail.bmkcount);
		},
		shortRating() {
			return (this.detail.rating > 10000) ? `${(this.detail.rating / 1e3).toFixed(1)}K` : this.detail.rating;
		},
		bookmarkStyle() {
			return this.bookmarked ? 'fa-bookmark' : 'fa-bookmark-o';
		},
	},
	methods: {
		click(event) {
			if (!this.bookmarked) {
				this.api.postBookmarkadd(this.detail.illust_id);
				this.$emit('bookmarkUpdate', this.detail.illust_id);
				this.bookmarked = true;
			}
		},
	},
	template: `
		<ul class="count-list">
			<li v-if="detail.bmkcount > 0">
				<a class="bookmark-count _ui-tooltip"
					:href="detail.bmkhref"
					:data-tooltip="tooltip">
					<i class="_icon sprites-bookmark-badge"></i>{{ detail.bmkcount }}</a>
			</li>
			<li v-if="detail.rating > 0">
				<span class="rating-score">
					<i class="fa fa-star" aria-hidden="true"></i>{{ shortRating }}
				</span>
			</li>
			<li>
				<a class="is-bookmarked" @click.prevent="click">
					<i class="fa" :class="bookmarkStyle" aria-hidden="true"></i>
				</a>
			</li>
		</ul>`,
});

Vue.component('image-item', {
	props: ['api', 'l10n', 'detail', 'pagetype'],
	computed: {
		illust_page_href() {
			return `/member_illust.php?mode=medium&illust_id=${this.detail.illust_id}`;
		},
		bookmark_detail_href() {
			return `/bookmark_detail.php?illust_id=${this.detail.illust_id}`;
		},
		thumb_detail() {
			return {
				href: this.illust_page_href,
				src: this.detail.thumb_src,
				multiple: this.detail.is_multiple,
				manga: this.detail.is_manga,
				ugoira: this.detail.is_ugoira,
			};
		},
		user_detail() {
			return {
				id: this.detail.user_id,
				name: this.detail.user_name,
				is_follow: this.detail.is_follow,
			};
		},
		title_detail() {
			return {
				href: this.illust_page_href,
				title: this.detail.illust_title,
			};
		},
		count_detail() {
			return {
				bmkhref: this.bookmark_detail_href,
				bmkcount: this.detail.bookmark_count,
				rating: this.detail.rating_score,
				bookmarked: this.detail.is_bookmarked,
				illust_id: this.detail.illust_id,
			};
		},
	},
	template: `
		<li class="image-item">
			<image-item-thumb :detail="thumb_detail"></image-item-thumb>
			<image-item-title :detail="title_detail"></image-item-title>
			<image-item-user :user="user_detail" v-if="pagetype !== 'member-illust'"></image-item-user>
			<image-item-count-list :detail="count_detail" :api="api" :l10n="l10n"></image-item-count-list>
		</li>`,
});
const patchouli = new Vue({
	data: {
		api: global.api,
		l10n: global.l10n,
		books: global.books,
		filters: global.filters,
		pagetype: global.pageType,
	},
	computed: {
		sortedBooks() {
			const _limit = this.filters.limit;
			const _order = this.filters.orderBy;
			const _books = this.books.filter(b => b.bookmark_count >= _limit);
			return _books.sort((a, b) => b[_order] - a[_order]);
		},
	},
	methods: {
		bookmarkUpdate(illust_id) {
			const _a = this.books.filter(b => b.illust_id === illust_id);
			if (_a.length) {
				_a[0].is_bookmarked = true;
			}
		},
	},
	template: `
	<ul id="パチュリー">
		<image-item v-for="book in sortedBooks"
			:key="book.illust_id"
			:api="api"
			:l10n="l10n"
			:detail="book"
			:pagetype="pagetype"></image-item>
	</ul>`,
});
if (global.pageType !== 'not support') {
	utils.addStyle(`
	.fa-feed {
		color: dodgerblue;
		cursor: default;
	}
	.fa-feed:hover::after {
		content:'${global.l10n.following}';
		position: absolute;
		color: white;
		white-space: nowrap;
		background-color: dodgerblue;
		padding: 2px;
		border-radius: 3px;
		margin-top: -2px;
		margin-left: 8px;
		font-family: "Helvetica Neue","arial","Hiragino Kaku Gothic ProN", Meiryo, sans-serif;
	}
	.rating-score {
		background-color: #FFEE88;
		color: #FF7700;
		border-radius: 3px;
		display: inline-block !important;
		margin: 0 1px;
		padding: 0 6px !important;
		font: bold 10px/18px "lucida grande", sans-serif !important;
		text-decoration: none;
		cursor: default;
	}
	.is-bookmarked {
		cursor: pointer;
	}
	#パチュリー {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-around;
	}`);
}
if (global.pageType !== 'not support') {
	utils.linkStyle('https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css');
	koakuma.$mount(global.koakumaToMount);
	koakuma.start(1).then(() => {
		patchouli.$mount(global.patchouliToMount);
	});
}
Pixiv.rmAnnoyance();
