class PageType {
	constructor() {
		const path = location.pathname;
		const search = new URLSearchParams(location.search);
		const hasid = search.has('id');
		this.DEFAULT = false;
		this.RECOMMEND = false;
		this.MEMBERILLIST = false;
		this.MYBOOKMARK = false;
		this.NOSUP = false;
		switch (path) {
			case '/search.php':
			case '/bookmark_new_illust.php':
			case '/new_illust.php':
			case '/mypixiv_new_illust.php':
			case '/new_illust_r18.php':
			case '/bookmark_new_illust_r18.php':
				this.DEFAULT = true;
				break;
			case '/recommended.php':
				this.RECOMMEND = true;
				break;
			case '/member_illust.php':
				this.MEMBERILLIST = hasid;
				this.NOSUP = !hasid;
				break;
			case '/bookmark.php':
				const t = search.get('type');
				if (hasid) {
					this.DEFAULT = true;
				} else if (!t || t === 'illust_all') {
					this.MYBOOKMARK = true;
				} else {
					// e.g. http://www.pixiv.net/bookmark.php?type=reg_user
					this.NOSUP = true;
				}
				break;
			default:
				this.NOSUP = true;
		}
	}
}
