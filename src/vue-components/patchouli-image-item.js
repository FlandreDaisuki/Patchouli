const patchouliImageItemTemplate = `
<li class="image-item">
	<a class="work _work" :href="illust_page_href" :class="thumbStyle">
		<div><img :src="detail.thumb_src"></div>
	</a>
	<a :href="illust_page_href">
		<h1 class="title" :title="detail.illust_title">{{ detail.illust_title }}</h1>
	</a>
	<span v-if="pagetype !== 'member-illust'">
		<a class="user ui-profile-popup"
			:href="user_page_href"
			:title="detail.user_name"
			:data-user_id="detail.user_id">{{ detail.user_name }}</a>
		<i class="fa fa-feed" aria-hidden="true" v-show="detail.is_follow"></i>
	</span>
	<ul class="count-list">
		<li v-if="detail.bookmark_count > 0">
			<a class="bookmark-count _ui-tooltip"
				:href="bookmark_detail_href"
				:data-tooltip="tooltip">
				<i class="_icon sprites-bookmark-badge"></i>{{ detail.bookmark_count }}</a>
		</li>
		<li v-if="detail.rating_score > 0">
			<span class="rating-score">
				<i class="fa fa-star" aria-hidden="true"></i>{{ shortRating }}
			</span>
		</li>
		<li v-if="pagetype !== 'my-bookmark'">
			<a class="is-bookmarked" @click.prevent="bookmarkClick">
				<i class="fa" :class="bookmarkStyle" aria-hidden="true"></i>
			</a>
		</li>
	</ul>
</li>`;
Vue.component('image-item', {
	props: ['api', 'l10n', 'detail', 'pagetype'],
	data() {
		return {
			bookmarked: this.detail.bookmarked,
		};
	},
	computed: {
		illust_page_href() {
			return `/member_illust.php?mode=medium&illust_id=${this.detail.illust_id}`;
		},
		bookmark_detail_href() {
			return `/bookmark_detail.php?illust_id=${this.detail.illust_id}`;
		},
		user_page_href() {
			return `/member_illust.php?id=${this.detail.user_id}`;
		},
		thumbStyle() {
			return {
				multiple: this.detail.is_multiple,
				manga: this.detail.is_manga,
				'ugoku-illust': this.detail.is_ugoira,
			};
		},
		bookmarkStyle() {
			return this.detail.is_bookmarked ? 'fa-bookmark' : 'fa-bookmark-o';
		},
		tooltip() {
			return this.l10n.bookmarkTooltip(this.detail.bookmark_count);
		},
		shortRating() {
			return (this.detail.rating_score > 10000) ?
				`${(this.detail.rating_score / 1e3).toFixed(1)}K` :
				this.detail.rating_score;
		},
	},
	methods: {
		bookmarkClick(event) {
			if (!this.bookmarked) {
				this.api.postBookmarkadd(this.detail.illust_id);
				this.$emit('bookmarkUpdate', this.detail.illust_id);
				this.bookmarked = true;
			}
		},
	},
	template: patchouliImageItemTemplate,
});
