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
		userStyle() {
			return {
				following: this.user.is_follow,
			};
		},
	},
	template:`
		<span>
			<a class="user ui-profile-popup"
				:href="href"
				:title="user.name"
				:data-user_id="user.id">{{ user.name }}</a>
			<i class="fa fa-feed" aria-hidden="true" v-show="user.is_follow"></i>
		</span>`,
});

Vue.component('image-item-count-list', {
	props:['api', 'detail', 'l10n'],
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
			if(!this.bookmarked) {
				this.api.postBookmarkadd(this.detail.illust_id);
				this.$emit('bookmarkUpdate', this.detail.illust_id);
				this.bookmarked = true;
			}
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
	props:['api', 'l10n', 'detail', 'pagetype'],
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
		api: globalStore.api,
		l10n: globalStore.l10n,
		books: globalStore.books,
		filters: globalStore.filters,
		pagetype: globalStore.page.type,
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
	template:`
	<ul id="パチュリー">
		<image-item v-for="book in sortedBooks"
			:key="book.illust_id"
			:api="api"
			:l10n="l10n"
			:detail="book"
			:pagetype="pagetype"></image-item>
	</ul>`,
});
