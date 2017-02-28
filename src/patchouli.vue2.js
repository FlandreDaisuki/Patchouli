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
