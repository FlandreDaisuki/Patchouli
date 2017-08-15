class Pixiv {
	constructor() {
		this.tt = document.querySelector('input[name="tt"]').value;
	}

	static storageGet() {
		const storage = localStorage.getItem('むきゅー');
		if (!storage || storage.version < GM_info.script.version) {
			Pixiv.storageSet({
				version: GM_info.script.version,
			});
		}
		return JSON.parse(localStorage.getItem('むきゅー'));
	}

	static storageSet(obj) {
		localStorage.setItem('むきゅー', JSON.stringify(obj));
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

	async fetch(url) {
		try {
			console.debug('fetch url:', url);
			if (url) {
				const res = await axios.get(url);
				if (res.statusText !== 'OK') {
					throw res;
				} else {
					return res.data;
				}
			} else {
				console.trace('Fetch has no url');
			}
		} catch (e) {
			console.error(e);
		}
	}

	async getDetail(illust_ids, f) {
		const iids = [];
		for (let iid of illust_ids) {
			iids.push(f(iid));
		}
		const processed = await Promise.all(iids);
		const ret = {};
		for (let p of processed) {
			ret[p.illust_id] = p;
		}
		return ret;
	}

	async getBookmarkCountAndTags(illust_id) {
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
				tags,
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
		const _f = this.getBookmarkCountAndTags.bind(this);
		return await this.getDetail(illust_ids, _f);
	}

	async getIllustPageDetail(illust_id) {
		const url = `/member_illust.php?mode=medium&illust_id=${illust_id}`;

		try {
			const html = await this.fetch(url);
			const _a = html.match(/rated-count[^\d]+(\d+)/);
			const rating_score = _a ? parseInt(_a[1]) : 0;
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
		const url = `/rpc/index.php?mode=get_illust_detail_by_ids&illust_ids=${iids}&tt=${this.tt}`;

		return this.fetch(url).then(json => json.body).catch(console.error);
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
			.then(json => {
				let ret = {};
				for (let u of json.body) {
					ret[u.user_id] = u;
				}
				return ret;
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
		const config = {
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
		};

		return axios
			.post('/rpc/index.php', data, config)
			.then(res => {
				return new Promise((resolve, reject) => {
					res.statusText === 'OK' && !res.data.error ? resolve(true) : reject(res);
				});
			})
			.catch(console.error);
	}

	/**
     * Returns array of recommend illust_id
     * @return {String[]}
     */
	async getRecommendIllustids(illust_id = 'auto') {
		const param = ['type=illust', `sample_illusts=${illust_id}`, 'num_recommendations=500', `tt=${this.tt}`].join(
			'&',
		);
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
	async getPageIllustids(url, needBookId) {
		try {
			const html = await this.fetch(url);
			console.debug('getPageIllustids', url);
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
			const iidHTMLs = html.match(/data-id="\d+"/g) || [];
			const illust_ids = [];
			for (let dataid of iidHTMLs) {
				const iid = dataid.replace(/\D+(\d+).*/, '$1');
				if (!illust_ids.includes(iid) && iid !== '0') {
					illust_ids.push(iid);
				}
			}

			const ret = {
				next_url,
				illust_ids,
			};

			if (needBookId) {
				const bookId = {};
				const bimHTMLs = html.match(/name="book_id[^;]+;illust_id=\d+/g) || [];
				for (let bim of bimHTMLs) {
					const [iid, bid] = bim.replace(/\D+(\d+)\D+(\d+)/, '$2 $1').split(' ');
					if (illust_ids.includes(iid)) {
						bookId[iid] = bid;
					}
				}
				ret.bookmark_ids = bookId;
			}
			return ret;
		} catch (e) {
			console.error(e);
		}
	}
}
