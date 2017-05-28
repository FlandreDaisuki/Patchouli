const patchouli = new Vue({
	data: {
		api: global.api,
		l10n: global.l10n,
		library: global.library,
		filters: global.filters,
		pagetype: global.pagetype,
	},
	computed: {
		sortedBooks() {
			const limit = this.filters.limit;
			const order = this.filters.orderBy;
			const books = this.library.filter(b => b.bookmark_count >= limit);
			// https://jsperf.com/javascript-sort/
			for (let i = 1; i < books.length; i++) {
				const tmp = books[i];
				let j = i;
				while (j > 0 && parseInt(books[j - 1][order]) < parseInt(tmp[order])) {
					books[j] = books[j - 1];
					--j;
				}
				books[j] = tmp;
			}
			return books;
		},
	},
	methods: {
		bookmarkUpdate(illust_id) {
			const books = this.library.filter(b => b.illust_id === illust_id);
			if (books.length) {
				books[0].is_bookmarked = true;
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
if (!global.pagetype.NOSUP) {
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
		justify-content: center;
		padding: 0 8px;
	}
	.image-item .count-list li {
		margin: 0 2px !important;
	}
	#パチュリー {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-around;
	}`);
}
