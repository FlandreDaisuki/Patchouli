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
		switch(this.lang) {
			case 'ja': return 'フォロー中';
			case 'zh-tw': return '關注中';
			case 'zh': return '关注中';
			default: return 'following';
		}
	}

	_bookmark() {
		switch(this.lang) {
			case 'ja': return 'ブックマーク';
			case 'zh-tw':
			case 'zh': return '收藏';
			default: return 'Bookmark';
		}
	}

	_koakumaGo() {
		switch(this.lang) {
			case 'ja': return '捜す';
			case 'zh-tw':
			case 'zh': return '找';
			default: return 'Go';
		}
	}

	_koakumaPause() {
		switch(this.lang) {
			case 'ja': return '中断';
			case 'zh-tw':
			case 'zh': return '停';
			default: return 'Pause';
		}
	}

	_koakumaEnd() {
		switch(this.lang) {
			case 'ja': return '終了';
			case 'zh-tw':
			case 'zh': return '完';
			default: return 'End';
		}
	}

	koakumaProcessed(n) {
		switch(this.lang) {
			case 'ja': return `${n} 件が処理された`;
			case 'zh-tw': return `已處理 ${n} 張`
			case 'zh': return `已处理 ${n} 张`;
			default: return `${n} pics processed`;
		}
	}

	_koakumaFullwidth() {
		switch(this.lang) {
			case 'ja': return '全幅';
			case 'zh-tw': return '全寬';
			case 'zh': return '全宽';
			default: return 'fullwidth';
		}
	}

	_koakumaSort() {
		switch(this.lang) {
			case 'ja': return 'ソート';
			case 'zh-tw':
			case 'zh': return '排序';
			default: return 'sorted';
		}
	}

	bookmarkTooltip(n) {
		switch(this.lang) {
			case 'ja': return `${n}件のブックマーク`;
			case 'zh-tw': return `${n}個收藏`
			case 'zh': return `${n}个收藏`;
			default: return `${n} bookmarks`;
		}
	}
}

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

	postBookmarkadd(illust_id) {
		const data = [
			'mode=save_illust_bookmark',
			`illust_id=${illust_id}`,
			'restrict=0',
			'comment=',
			'tags=',
			`tt=${this.tt}`,
		].join('&');
		const config = {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'};

		return axios.post('/rpc/index.php', data, config)
			.then(res => {
				return new Promise((resolve, reject) => {
					(res.statusText === 'OK' && !res.data.error) ? resolve(true) : reject(res);
				});
			})
			.catch(console.error);
	}
}

(() => {
	// version check
	const s = Pixiv.storageGet();
	if (!s.version || s.version < version) {
		Pixiv.storageSet({
			version,
		});
	}
})();

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
	l10n: new L10N(),
	books: [],
	filters: {
		limit: 0,
		orderBy: 'illust_id',
	},
	patchouliToMount: (() => {
		const _a = document.querySelector('li.image-item');
		return _a ? _a.parentElement : null;
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
				const t = search.get('type')
				if(search.has('id')) {
					type = 'default';
				} else if(!t || t === 'illust_all') {
					type = 'mybookmark';
				} else {
					// e.g. http://www.pixiv.net/bookmark.php?type=reg_user
					supported = false;
				}
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
		sort: 0,
	}, Pixiv.storageGet());

	if (_f.fullwidth) {
		document.querySelector('#wrapper').classList.add('fullwidth');
	}

	if (_f.sort) {
		globalStore.filters.orderBy = 'bookmark_count';
	}

	Pixiv.storageSet(_f);
	return _f;
})();
