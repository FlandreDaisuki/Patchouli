class L10N {
	constructor() {
		this.lang = document.documentElement.lang;
		this.following = this._following();
		this.bookmark = this._bookmark();
		this.koakumaGo = this._koakumaGo();
		this.koakumaPause = this._koakumaPause();
		this.koakumaEnd = this._koakumaEnd();
		this.koakumaFullwidth = this._koakumaFullwidth();
		this.koakumaSort = this._koakumaSort();
	}

	_following() {
		switch (this.lang) {
			case 'ja':
				return 'フォロー中';
			case 'zh-tw':
				return '關注中';
			case 'zh':
				return '关注中';
			default:
				return 'following';
		}
	}

	_bookmark() {
		switch (this.lang) {
			case 'ja':
				return 'ブックマーク';
			case 'zh-tw':
			case 'zh':
				return '收藏';
			default:
				return 'Bookmark';
		}
	}

	_koakumaGo() {
		switch (this.lang) {
			case 'ja':
				return '捜す';
			case 'zh-tw':
			case 'zh':
				return '找';
			default:
				return 'Go';
		}
	}

	_koakumaPause() {
		switch (this.lang) {
			case 'ja':
				return '中断';
			case 'zh-tw':
			case 'zh':
				return '停';
			default:
				return 'Pause';
		}
	}

	_koakumaEnd() {
		switch (this.lang) {
			case 'ja':
				return '終了';
			case 'zh-tw':
			case 'zh':
				return '完';
			default:
				return 'End';
		}
	}

	koakumaProcessed(n) {
		switch (this.lang) {
			case 'ja':
				return `${n} 件が処理された`;
			case 'zh-tw':
				return `已處理 ${n} 張`
			case 'zh':
				return `已处理 ${n} 张`;
			default:
				return `${n} pics processed`;
		}
	}

	_koakumaFullwidth() {
		switch (this.lang) {
			case 'ja':
				return '全幅';
			case 'zh-tw':
				return '全寬';
			case 'zh':
				return '全宽';
			default:
				return 'fullwidth';
		}
	}

	_koakumaSort() {
		switch (this.lang) {
			case 'ja':
				return 'ソート';
			case 'zh-tw':
			case 'zh':
				return '排序';
			default:
				return 'sorted';
		}
	}

	bookmarkTooltip(n) {
		switch (this.lang) {
			case 'ja':
				return `${n}件のブックマーク`;
			case 'zh-tw':
				return `${n}個收藏`
			case 'zh':
				return `${n}个收藏`;
			default:
				return `${n} bookmarks`;
		}
	}
}
