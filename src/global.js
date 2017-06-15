const global = {
	api: new Pixiv(),
	l10n: new L10N(),
	pagetype: new PageType(),
	library: [],
	filters: {
		limit: 0,
		orderBy: 'illust_id',
		tag: new RegExp('', 'i'),
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
