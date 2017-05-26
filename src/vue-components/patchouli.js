const patchouli = new Vue({
	data: {
		api: global.api,
		l10n: global.l10n,
		library: global.library,
		filters: global.filters,
		pagetype: global.pageType,
	},
	computed: {
		sortedBooks() {
			const _limit = this.filters.limit;
			const _order = this.filters.orderBy;
			const _books = this.library.filter(b => b.bookmark_count >= _limit);
			return _books.sort((a, b) => b[_order] - a[_order]);
		},
	},
	methods: {
		bookmarkUpdate(illust_id) {
			const _a = this.library.filter(b => b.illust_id === illust_id);
			if (_a.length) {
				_a[0].is_bookmarked = true;
			}
		},
	},
	template: `
	<ul id="パチュリー">
		<image-item v-for="book in sortedBooks"
			:key="book.illust_id"
			:api="api"
			:l10n="l10n"
			:detail="book"
			:pagetype="pagetype"></image-item>
	</ul>`,
});
if (global.pageType !== 'not support') {
	utils.addStyle(`
	.fa-feed {
		color: dodgerblue;
		cursor: default;
	}
	.fa-feed:hover::after {
		content:'${global.l10n.following}';
		position: absolute;
		color: white;
		white-space: nowrap;
		background-color: dodgerblue;
		padding: 2px;
		border-radius: 3px;
		margin-top: -2px;
		margin-left: 8px;
		font-family: "Helvetica Neue","arial","Hiragino Kaku Gothic ProN", Meiryo, sans-serif;
	}
	.rating-score {
		background-color: #FFEE88;
		color: #FF7700;
		border-radius: 3px;
		display: inline-block !important;
		margin: 0 1px;
		padding: 0 6px !important;
		font: bold 10px/18px "lucida grande", sans-serif !important;
		text-decoration: none;
		cursor: default;
	}
	.is-bookmarked {
		cursor: pointer;
		font-size: 1rem;
	}
	.image-item .count-list {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		padding: 0 8px;
	}
	#パチュリー {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-around;
	}`);
}
