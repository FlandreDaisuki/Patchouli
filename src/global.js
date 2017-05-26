const global = {
	api: new Pixiv(),
	l10n: new L10N(),
	library: [],
	filters: {
		limit: 0,
		orderBy: 'illust_id',
	},
	favorite: {
		fullwidth: 1,
		sort: 0,
	},
	patchouliToMount: (() => {
		const _a = document.querySelector('li.image-item');
		const _b = document.querySelector('ul._image-items');
		return _a ? _a.parentElement : _b;
	})(),
	koakumaToMount: (() => {
		return document.querySelector('#toolbar-items');
	})(),
	pageType: (() => {
		const path = location.pathname;
		const search = new URLSearchParams(location.search);

		/** type - for patchouli <image-item>, need (not) next page
		 *
		 *	default: thumb + title + user + count-list , need next page
		 *	member-illust: default w/o user, need next page
		 *	my-bookmark:  default with bookmark-edit, need next page
		 *	recommend: default , need not next page
		 *	ranking: ranking , need not next page
		 */

		switch (path) {
			case '/search.php':
			case '/bookmark_new_illust.php':
			case '/new_illust.php':
			case '/mypixiv_new_illust.php':
			case '/new_illust_r18.php':
			case '/bookmark_new_illust_r18.php':
				return 'default';
			case '/recommended.php':
				return 'recommend';
			case '/member_illust.php':
				return search.has('id') ? 'member-illust' : 'not support';
			case '/bookmark.php':
				const t = search.get('type');
				if (search.has('id')) {
					return 'default';
				} else if (!t || t === 'illust_all') {
					return 'my-bookmark';
				} else {
					// e.g. http://www.pixiv.net/bookmark.php?type=reg_user
					return 'not support';
				}
			default:
				return 'not support';
		}
	})(),
};
global.favorite = (() => {
	const _s = Object.assign(global.favorite, Pixiv.storageGet());
	if (_s.fullwidth) {
		document.querySelector('#wrapper').classList.add('fullwidth');
	}
	if (_s.sort) {
		global.filters.orderBy = 'bookmark_count';
	}
	Pixiv.storageSet(_s);
	return _s;
})();
