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
