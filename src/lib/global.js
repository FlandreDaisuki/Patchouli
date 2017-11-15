import L10N from './l10n';
import Pixiv from './pixiv';
import {$, $$, $el} from './utils';
import {$debug} from './debugger';
import {PageType} from './pagetype';

export default class Global {
	constructor() {
		this.l10n = new L10N();
		this.api = new Pixiv();
		this.library = [];
		this.filters = {
			limit: 0,
			orderBy: 'illust_id',
			tag: new RegExp('', 'i')
		};
		this.conf = {
			fitwidth: 1,
			sort: 0
		};

		const storeNamespace = this.constructor.NAME;

		this.store = {
			get: (key = null) => {
				$debug('Global#store.get: key:', key);
				const obj = JSON.parse(localStorage.getItem(storeNamespace) || '{}');
				$debug('Global#store.get: obj:', obj);
				if (key) {
					return obj[key];
				}
				return obj;
			},
			set: (obj) => {
				$debug('Global#store.set', obj);
				const storable = JSON.stringify(obj);
				localStorage.setItem(storeNamespace, storable);
			}
		};

		this.classifyPagetype();
	}

	applyConf() {
		if(this.pagetype !== PageType.NO_SUPPORT) {
			if (this.conf.fitwidth) {
				$('.ω').classList.add('↔');
			} else {
				$('.ω').classList.remove('↔');
			}
			if (this.conf.sort) {
				this.filters.orderBy = 'bookmark_count';
			} else {
				this.filters.orderBy = 'illust_id';
			}
			if (this.pagetype === PageType.MY_BOOKMARK) {
				for (const marker of $$('.js-legacy-mark-all, .js-legacy-unmark-all')) {
					marker.addEventListener('click', () => {
						$$('input[name="book_id[]"]').forEach(el => {
							el.checked = marker.classList.contains('js-legacy-mark-all');
						});
					});
				}
			}
		}
	}

	classifyPagetype() {
		const path = location.pathname;
		const searchParam = new URLSearchParams(location.search);
		const spId = searchParam.get('id');
		const spType = searchParam.get('type');

		switch (path) {
		case '/search.php':
			this.pagetype = PageType.SEARCH;
			break;
		case '/bookmark_new_illust.php':
		case '/new_illust.php':
		case '/mypixiv_new_illust.php':
		case '/new_illust_r18.php':
		case '/bookmark_new_illust_r18.php':
			this.pagetype = PageType.NEW_ILLUST;
			break;
		case '/discovery':
			this.pagetype = PageType.DISCOVERY;
			break;
		case '/member_illust.php':
			this.pagetype = spId ? PageType.MEMBER_ILLIST : PageType.NO_SUPPORT;
			break;
		case '/bookmark.php': {
			if (spId) {
				this.pagetype = PageType.NEW_ILLUST;
			} else if (!spType || spType === 'illust_all') {
				this.pagetype = PageType.MY_BOOKMARK;
			} else {
				// e.g. http://www.pixiv.net/bookmark.php?type=reg_user
				this.pagetype = PageType.NO_SUPPORT;
			}
			break;
		}
		default:
			this.pagetype = PageType.NO_SUPPORT;
			break;
		}
		$debug('Global#pagetype:', this.pagetype);

		if(this.pagetype !== PageType.NO_SUPPORT) {
			$('#wrapper').classList.add('ω');

			this.koakumaMountPoint = $el('div', {className: 'koakumaMountPoint'}, (el) => {
				$('header._global-header').after(el);
			});

			if (this.pagetype === PageType.SEARCH) {
				this.patchouliMountPoint = $('#js-react-search-mid');
			} else {
				const _a = $('li.image-item');
				const _b = $('ul._image-items');
				this.patchouliMountPoint = _a ? _a.parentElement : _b;
			}

			$debug('Global#patchouliMountPoint:', this.patchouliMountPoint);
		}
	}

	static get VERSION() {
		return GM_info.script.version;
	}

	static get NAME() {
		return GM_info.script.name;
	}
}
