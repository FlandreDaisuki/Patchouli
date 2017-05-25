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
