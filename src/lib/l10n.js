import en from '../locale/en.json';
import ja from '../locale/ja.json';
import zh from '../locale/zh.json';
import tw from '../locale/tw.json';

export default class L10N {
	constructor() {
		this.dict = {en, ja, zh, tw};

		this.lang = document.documentElement.lang;
		if (this.lang === 'zh-tw') {
			this.lang = 'tw';
		}

		// fallback
		if (!this.dict[this.lang]) {
			this.lang = 'en';
		}
	}
	get following() {
		return this.dict[this.lang]['_msg_following'];
	}

	bookmarkTooltip(n) {
		return this.dict[this.lang]['_msg_bookmark_tooltip'].replace('$bookmark_count$', n);
	}

	koakumaProcessed(n) {
		return this.dict[this.lang]['_msg_koakuma_processed'].replace('$processed_count$', n);
	}

	get koakumaGo() {
		return this.dict[this.lang]['_msg_koakuma_go'];
	}

	get koakumaPause() {
		return this.dict[this.lang]['_msg_koakuma_pause'];
	}

	get koakumaEnd() {
		return this.dict[this.lang]['_msg_koakuma_end'];
	}

	get fitBrowserWidth() {
		return this.dict[this.lang]['_msg_fit_browser_width'];
	}

	get sortByBookmarkCount() {
		return this.dict[this.lang]['_msg_sort_by_bookmark_count'];
	}
	get tagFilterPlaceholder() {
		return this.dict[this.lang]['_msg_tag_filter_placeholder'];
	}
}

