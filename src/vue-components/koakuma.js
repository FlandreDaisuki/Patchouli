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
			while(toContinue()) {
				// get illust_ids and next_url
				if (this.pageType === 'default' || this.pageType === 'member-illust') {
					const res = await this.api.getPageIllustids(this.next_url);
					if(res.next_url === this.next_url) {
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
				} else {
					console.error('Unknown pageType:', this.pageType);
				}
				console.info(this.local_ids.length);
				this.local_ids = this.local_ids.slice(20);
				times--;
			}
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
			if(todo) {
				document.querySelector('#wrapper').classList.add('fullwidth');
				global.favorite.fullwidth = 1;
			} else {
				document.querySelector('#wrapper').classList.remove('fullwidth');
				global.favorite.fullwidth = 0;
			}
			Pixiv.storageSet(global.favorite);
		},
		sortUpdate(todo) {
			if(todo) {
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