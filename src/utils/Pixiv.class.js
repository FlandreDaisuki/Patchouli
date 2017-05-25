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

	async getBookmarksDetail(illust_ids) {
		const _f = this.getBookmarkCount.bind(this);
		return await getDetail(illust_ids, _f);
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

	async getIllustPagesDetail(illust_ids) {
		const _f = this.getIllustPageDetail.bind(this);
		return await getDetail(illust_ids, _f);
	}

	getIllustsDetail(illust_ids) {
		const iids = illust_ids.join(',');
		const url = `/rpc/index.php?mode=get_illust_detail_by_ids&illust_ids=${iids}&tt=${this.tt}`;

		return this.fetch(url)
			.then(json => json.body)
			.catch(console.error);
	}

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

	async getPageInformationAndNext(url) {
		try {
			const doc = await this.fetch(url).then(Pixiv.toDOM);
			Pixiv.rmAnnoyance(doc);
			const next_url = Pixiv.hrefAttr(doc.querySelector('.next a'));
			const imgs = [...doc.querySelectorAll('.image-item img')];
			const illusts = imgs.map(x => ({
				illust_id: x.dataset.id,
				thumb_src: x.dataset.src,
				user_id: x.dataset.userId,
				tags: x.dataset.tags.split(' '),
			})).filter(x => x.illust_id !== '0');

			return {
				next_url,
				illusts,
			};
		} catch (e) {
			console.error(e);
		}
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
	 * @return {Number[]}
	 */
	async getRecommendIllustids(illust_id='auto') {
		const param = [
			'type=illust',
			`sample_illusts=${illust_id}`,
			'num_recommendations=500',
			`tt=${this.tt}`,
		].join('&');
		const url = `/rpc/recommender.php?${param}`;
		try {
			return await this.fetch(url).then(data => data.recommendations);
		} catch (e) {
			console.error(e);
		}
	}

	async getPageIllustids(url) {
		try {
			const doc = await this.fetch(url).then(Pixiv.toDOM);
			Pixiv.rmAnnoyance(doc);
			const next_url = Pixiv.hrefAttr(doc.querySelector('.next a'));
			const imgs = [...doc.querySelectorAll('.image-item img')];
			const illust_ids = imgs.map(x => parseInt(x.dataset.id)).filter(x => x);

			return {
				next_url,
				illust_ids,
			};
		} catch (e) {
			console.error(e);
		}
	}
}
