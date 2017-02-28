// ==UserScript==
// @name		Patchouli
// @description	An image searching/browsing tool on Pixiv
// @namespace	https://github.com/FlandreDaisuki
// @author		FlandreDaisuki
// @include		http://www.pixiv.net/*
// @require		https://cdnjs.cloudflare.com/ajax/libs/vue/2.2.1/vue.min.js
// @require		https://cdnjs.cloudflare.com/ajax/libs/axios/0.15.3/axios.min.js
// @updateURL	https://github.com/FlandreDaisuki/Patchouli/raw/master/Patchouli.user.js
// @version		2017.03.01
// @icon		http://i.imgur.com/VwoYc5w.png
// @grant		none
// @noframes
// ==/UserScript==
class Pixiv {
	constructor() {
		this.tt = document.querySelector('input[name="tt"]').value;
	}

	fetch(url) {
		return axios.get(url)
			.then(res => {
				return new Promise((resolve, reject) => {
					(res.statusText !== 'OK') ?
						reject(res) : resolve(res.data);
				});
			})
			.catch(console.error);
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
		].forEach(cl => {
			Array.from(doc.querySelectorAll(cl)).forEach(el => {
				el.remove();
			});
		});
	}

	static storageGet() {
		if(!localStorage.getItem('むきゅー')) {
			Pixiv.storageSet({});
		}
		return JSON.parse(localStorage.getItem('むきゅー'));
	}

	static storageSet(obj) {
		localStorage.setItem('むきゅー', JSON.stringify(obj));
	}

	static hrefAttr(elem) {
		const a = elem;
		if (!a) {
			return '';
		} else if(a.href) {
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

	getBookmarkCount(illust_id) {
		const url = `/bookmark_detail.php?illust_id=${illust_id}`;

		return this.fetch(url)
			.then(Pixiv.toDOM)
			.then(doc => {
				const _a = doc.querySelector('a.bookmark-count');
				const bookmark_count = _a ? parseInt(_a.innerText) : 0;

				return {
					bookmark_count,
					illust_id,
				};
			})
			.catch(console.error);
	}

	getBookmarksDetail(illust_ids) {
		const _f = this.getBookmarkCount.bind(this);
		const bookmarks = illust_ids.map(_f);

		return Promise.all(bookmarks)
			.then(arr => arr.reduce((a, b) => {
				a[b.illust_id] = b;
				return a;
			}, {}))
			.catch(console.error);
	}

	getIllustPageDetail(illust_id) {
		const url = `/member_illust.php?mode=medium&illust_id=${illust_id}`;

		return this.fetch(url)
			.then(Pixiv.toDOM)
			.then(doc => {
				const _a = doc.querySelector('.score-count');
				const rating_score = _a ? parseInt(_a.innerText) : 0;
				return {
					illust_id,
					rating_score,
				};
			})
			.catch(console.error);
	}

	getIllustPagesDetail(illust_ids) {
		const _f = this.getIllustPageDetail.bind(this);
		const pages = illust_ids.map(_f);

		return Promise.all(pages)
			.then(arr => arr.reduce((a, b) => {
				a[b.illust_id] = b;
				return a;
			}, {}))
			.catch(console.error);
	}

	getIllustsDetail(illust_ids) {
		const _a = illust_ids.join(',');
		const url = `/rpc/index.php?mode=get_illust_detail_by_ids&illust_ids=${_a}&tt=${this.tt}`;

		return this.fetch(url)
			.then(json => json.body)
			.catch(console.error);
	}

	getUsersDetail(user_ids) {
		const _a = user_ids.join(',');
		const url = `/rpc/get_profile.php?user_ids=${_a}&tt=${this.tt}`;

		return this.fetch(url)
			.then(json => json.body)
			.then(arr => arr.reduce((a, b) => {
				// make the same output of getIllustsDetail
				a[b.user_id] = b;
				return a;
			}, {}))
			.catch(console.error);
	}

	getPageInformationAndNext(url) {
		return this.fetch(url)
		.then(Pixiv.toDOM)
		.then(doc => {
			Pixiv.rmAnnoyance(doc);
			const _a = doc.querySelector('.next a');
			const next_url = Pixiv.hrefAttr(_a); //FF & Chrome issue
			const _b = doc.querySelectorAll('.image-item img');
			const illusts = Array.from(_b).map(x => ({
								illust_id: x.dataset.id,
								thumb_src: x.dataset.src,
								user_id: x.dataset.userId,
								tags: x.dataset.tags.split(' '),
							})).filter(x => x.illust_id !== '0');
			return {
				next_url,
				illusts,
			};
		})
		.catch(console.error);
	}
}

const utils = {
	linkStyle: function(url) {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.type = 'text/css';
		link.href = url;
		document.head.appendChild(link);
	},
	linkScript: function(url) {
		const script = document.createElement('script');
		script.src = url;
		document.head.appendChild(script);
	},
	createIcon: function(name, options = {}) {
		const el = document.createElement('i');
		el.classList.add('fa');
		el.classList.add(`fa-${name}`);
		el.setAttribute('aria-hidden', 'true');
		return el;
	},
	addStyle: function(text) {
		const style = document.createElement('style');
		style.innerHTML = text;
		document.head.appendChild(style);
	},
	asyncWhile: function(condition, action, options = {}) {
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

const globalStore = {
	api: new Pixiv(),
	books: [],
	filters: {
		limit: 0,
		orderBy: 'illust_id',
	},
	patchouliToMount: (() => {
		return document.querySelector('li.image-item').parentElement;
	})(),
	koakumaToMount: (() => {
		return document.querySelector('#toolbar-items');
	})(),
	page: (() => {
		let type = 'default';
		let supported = true;
		let path = location.pathname;
		let search = new URLSearchParams(location.search);

		/** type - for patchouli <image-item>
		 *
		 *	default: thumb + title + user + count-list
		 *	member-illust: default w/o user
		 *	mybookmark:  default with bookmark-edit
		 */

		switch(path) {
			case '/search.php':
			case '/bookmark_new_illust.php':
			case '/new_illust.php':
			case '/mypixiv_new_illust.php':
			case '/new_illust_r18.php':
			case '/bookmark_new_illust_r18.php':
				break;
			case '/member_illust.php':
				if (search.has('id')) {
					type = 'member-illust';
				} else {
					supported = false;
				}
				break;
			case '/bookmark.php':
				type = search.has('id') ? 'default' : 'mybookmark';
				break;
			default:
				supported = false;
		}

		return {
			supported,
			type,
		};
	})(),
};

globalStore.favorite = (()=>{
	const _f = Object.assign({
		fullwidth: 1,
		order: 0,
	}, Pixiv.storageGet());

	if (_f.fullwidth) {
		document.querySelector('#wrapper').classList.add('fullwidth');
	}

	if (_f.order) {
		globalStore.filters.orderBy = 'bookmark_count';
	}

	Pixiv.storageSet(_f);
	return _f;
})();

Vue.component('koakuma-settings', {
	props: ['favorite'],
	methods: {
		fullwidthClick(event) {
			this.$emit('fullwidthUpdate', event.target.checked);
		},
		orderClick(event) {
			this.$emit('orderUpdate', event.target.checked);
		},
	},
	template: `
	<div>
		<input id="koakuma-settings-fullwidth" type="checkbox"
			:checked="favorite.fullwidth"
			@click="fullwidthClick"> 全寬
		<input id="koakuma-settings-order" type="checkbox"
			:checked="favorite.order"
			@click="orderClick"> 排序
	</div>`,
});

Vue.component('koakuma-bookmark', {
	props: ['limit'],
	methods: {
		blur(event) {
			const self = event.target;
			if(!self.validity.valid) {
				console.error('koakuma-bookmark', self.validationMessage);
			}
		},
		input(event) {
			let val = parseInt(event.target.value);
			val = Math.max(0, val);
			this.limit = val;
			this.$emit('limitUpdate', val);
		},
		wheel(event) {
			let val;
			if (event.deltaY < 0) {
				val = this.limit + 20;
			} else {
				val = Math.max(0, this.limit - 20);
			}
			this.limit = val;
			this.$emit('limitUpdate', val);
		},
	},
	template:`
	<div id="koakuma-bookmark">
		<label for="koakuma-bookmark-input">★書籤</label>
		<input id="koakuma-bookmark-input"
			type="number" min="0" step="1"
			:value="limit"
			@wheel.stop.prevent="wheel"
			@blur="blur"
			@input="input"/>
	</div>`,
});

// Vue.component('koakuma-tag-filter', {
// //todo
// });

const koakuma = new Vue({
	// make koakuma to left side
	data: {
		books: globalStore.books,
		filters: globalStore.filters,
		api: globalStore.api,
		favorite: globalStore.favorite,
		next_url: location.href,
		isStoped: true,
		isEnded: false,
	},
	methods: {
		start(times = Infinity) {
			this.isStoped = false;

			return utils.asyncWhile(next_url => {
				if (!next_url) {
					this.isStoped = this.isEnded = true;
					return false;
				}
				if (times > 0) {
					times--;
				} else {
					this.isStoped = true;
				}
				return !this.isStoped;
			}, url => {
				return this.api.getPageInformationAndNext(url)
					.then(inf => {
						return new Promise((resolve, reject) => {
							if (inf.next_url === this.next_url) {
								reject(`Duplicated url: ${url}`);
							} else {
								resolve(inf);
							}
						});
					})
					.then(inf => {
						this.next_url = inf.next_url;

						const user_ids = inf.illusts.map(x => x.user_id);
						const illust_ids = inf.illusts.map(x => x.illust_id);
						const usersDetail = this.api.getUsersDetail(user_ids);
						const illustsDetail = this.api.getIllustsDetail(illust_ids);
						const illustPagesDetail = this.api.getIllustPagesDetail(illust_ids);
						const bookmarkDetail = this.api.getBookmarksDetail(illust_ids);

						return new Promise((resolve, reject) => {
							Promise.all([usersDetail, illustsDetail, illustPagesDetail, bookmarkDetail])
								.then(resolve)
								.catch(reject);
						})
						.then(details => {
							return {
								next_url: inf.next_url,
								illusts: inf.illusts,
								usersDetail: details[0],
								illustsDetail: details[1],
								illustPagesDetail: details[2],
								bookmarkDetail: details[3],
							};
						})
						.catch(console.error);
					})
					.then(inf => {
						const books = inf.illusts.map(illust => {
							const ud = inf.usersDetail;
							const ild = inf.illustsDetail;
							const ipd = inf.illustPagesDetail;
							const bd = inf.bookmarkDetail;

							return {
								illust_id: illust.illust_id,
								thumb_src: illust.thumb_src,
								user_id: illust.user_id,
								tags: illust.tags,
								user_name: ud[illust.user_id].user_name,
								is_follow: ud[illust.user_id].is_follow,
								illust_title: ild[illust.illust_id].illust_title,
								is_multiple: ild[illust.illust_id].is_multiple,
								is_manga: ild[illust.illust_id].illust_type === '1',
								is_ugoira: !!ild[illust.illust_id].ugoira_meta,
								bookmark_count: bd[illust.illust_id].bookmark_count,
								rating_score: ipd[illust.illust_id].rating_score,
							};
						});

						this.books.push(...books);
						return inf;
					})
					.then(inf => {
						return inf.next_url;
					})
					.catch(console.error);
			}, {
				first: this.next_url,
			});
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
			globalStore.filters.limit = isNaN(value) ? 0 : value;
		},
		fullwidthUpdate(todo) {
			if(todo) {
				document.querySelector('#wrapper').classList.add('fullwidth');
				globalStore.favorite.fullwidth = 1;
			} else {
				document.querySelector('#wrapper').classList.remove('fullwidth');
				globalStore.favorite.fullwidth = 0;
			}
			Pixiv.storageSet(globalStore.favorite);
		},
		orderUpdate(todo) {
			if(todo) {
				globalStore.filters.orderBy = 'bookmark_count';
				globalStore.favorite.order = 1;
			} else {
				globalStore.filters.orderBy = 'illust_id';
				globalStore.favorite.order = 0;
			}
			Pixiv.storageSet(globalStore.favorite);
		},
	},
	computed: {
		switchText() {
			return this.isEnded ? "完" : (this.isStoped ? "找" : "停");
		},
		switchStyle() {
			return {
				ended: this.isEnded,
				toSearch: !this.isEnded && this.isStoped,
				toStop: !this.isEnded && !this.isStoped,
			};
		},
	},
	template: `
		<div id="こあくま">
			<div>已處理 {{books.length}} 張</div>
			<koakuma-bookmark :limit="filters.limit" @limitUpdate="limitUpdate"></koakuma-bookmark>
			<button id="koakuma-switch"
				@click="switchSearching"
				:disabled="isEnded"
				:class="switchStyle">{{ switchText }}</button>
			<koakuma-settings :favorite="favorite"
				@fullwidthUpdate="fullwidthUpdate"
				@orderUpdate="orderUpdate"></koakuma-settings>
		</div>`,
});

Vue.component('image-item-thumb', {
	props:['detail'],
	computed: {
		thumbStyle() {
			return {
				multiple: this.detail.multiple,
				manga: this.detail.manga,
				'ugoku-illust': this.detail.ugoira,
			};
		},
	},
	template:`
		<a class="work _work" :href="detail.href" :class="thumbStyle">
			<div><img :src="detail.src"></div>
		</a>`,
});

Vue.component('image-item-title', {
	props:['detail'],
	template:`
		<a :href="detail.href">
			<h1 class="title" :title="detail.title">{{ detail.title }}</h1>
		</a>`,
});

Vue.component('image-item-user', {
	props:['user'],
	computed: {
		href() {
			return `/member_illust.php?id=${this.user.id}`;
		},
		vClass() {
			return {
				followed: this.user.is_follow,
			};
		},
	},
	template:`
		<a class="user ui-profile-popup"
			:class="vClass"
			:href="href"
			:title="user.name"
			:data-user_id="user.id">{{ user.name }}</a>`,
});

Vue.component('image-item-count-list', {
	props:['detail'],
	computed: {
		tooltip() {
			return `${this.detail.bmkcount}件のブックマーク`;
		},
		shortRating() {
			return (this.detail.rating > 10000) ? `${(this.detail.rating / 1e3).toFixed(1)}K` : this.detail.rating;
		},
	},
	template:`
		<ul class="count-list">
			<li v-if="detail.bmkcount > 0">
				<a class="bookmark-count _ui-tooltip"
					:href="detail.bmkhref"
					:data-tooltip="tooltip">
					<i class="_icon sprites-bookmark-badge"></i>{{ detail.bmkcount }}</a>
			</li>
			<li v-if="detail.rating > 0">
				<span class="rating_score">
					<i class="fa fa-star" aria-hidden="true"></i>{{ shortRating }}
				</span>
			</li>
		</ul>`,
});

Vue.component('image-item', {
	props:['detail', 'pagetype'],
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
			};
		},
	},
	template: `
		<li class="image-item">
			<image-item-thumb :detail="thumb_detail"></image-item-thumb>
			<image-item-title :detail="title_detail"></image-item-title>
			<image-item-user :user="user_detail" v-if="pagetype !== 'member-illust'"></image-item-user>
			<image-item-count-list :detail="count_detail"></image-item-count-list>
		</li>`,
});

const patchouli = new Vue({
	data: {
		books: globalStore.books,
		filters: globalStore.filters,
		pagetype: globalStore.page.type,
	},
	computed: {
		orderedBooks() {
			const _limit = this.filters.limit;
			const _order = this.filters.orderBy;
			const _books = this.books.filter(b => b.bookmark_count >= _limit);
			return _books.sort((a, b) => b[_order] - a[_order]);
		},
	},
	template:`
	<ul id="パチュリー">
		<image-item v-for="book in orderedBooks"
			:detail="book"
			:pagetype="pagetype"></image-item>
	</ul>`,
});

let DEBUG = true;
if(DEBUG) {
	window.utils = utils;
	window.Pixiv = Pixiv;
	window.koakuma = koakuma;
	window.patchouli = patchouli;
	window.globalStore = globalStore;
}

console.log('Vue.version', Vue.version);
if (globalStore.page.supported) {
	koakuma.$mount(globalStore.koakumaToMount);
	koakuma.start(1).then(() => {
		patchouli.$mount(globalStore.patchouliToMount);
	});
}
Pixiv.rmAnnoyance();
utils.linkStyle('https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css');

if (globalStore.page.supported) {
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


	.followed.followed.followed {
		font-weight: bold;
		color: red;
	}
	.rating_score {
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
	#パチュリー {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-around;
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
		left: 10px;
		bottom: 10px;
		z-index: 1;
		background-color: aliceblue;
		border-radius: 10px;
		padding: 5px;
		font-size: 16px;
		text-align: center;
		width: 140px;
	}
	#こあくま > * {
		margin: 2px 0;
	}`);
}
