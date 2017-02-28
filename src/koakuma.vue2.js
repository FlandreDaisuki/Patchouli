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
								is_manga: ild[illust.illust_id].illust_type === 1,
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
