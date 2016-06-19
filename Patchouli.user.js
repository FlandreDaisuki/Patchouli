// ==UserScript==
// @name        Patchouli
// @description An image searching/browsing tool on Pixiv
// @namespace   https://github.com/FlandreDaisuki
// @include     http://www.pixiv.net/*
// @require     https://cdnjs.cloudflare.com/ajax/libs/URI.js/1.18.1/URI.min.js
// @version     2016.06.19
// @author      FlandreDaisuki
// @updateURL   https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/Patchouli.user.js
// @grant       none
// @noframes
// ==/UserScript==
/* jshint esnext: true */

const baseURI = document.baseURI;

console.log('jQuery version:', $.fn.jquery);
console.log('URI version:', URI.version);
console.log('baseURI:', baseURI);

function getBaseInfo() {
	const retval = {
		supported: true,
		imgitemConf: {
			selector: 'li.image-item',
			hasAuthor: true,
			hasBookmark: false,
			needFillwidth: true,
		},
	};
	retval.$container = $(retval.imgitemConf.selector).parent();

	const pbu = new URI(baseURI);
	const pn = pbu.pathname();
	const ss = URI.parseQuery(pbu.query());

	if (pn === '/member_illust.php' && ss.id) {
		//作品一覧
		retval.imgitemConf.hasAuthor = false;
		retval.imgitemConf.needFillwidth = false;
	} else if (pn === '/search.php') {
		//作品の検索
		retval.imgitemConf.hasBookmark = true;
	} else if (pn === '/bookmark.php' && !ss.type) {
		//ブックマーク
		retval.imgitemConf.hasBookmark = true;
		retval.imgitemConf.needFillwidth = false;
	} else if (pn === '/bookmark_new_illust.php') {
		//フォロー新着作品
	} else if (pn === '/new_illust.php') {
		//みんなの新着作品
	} else if (pn === 'mypixiv_new_illust.php') {
		//マイピク新着イラスト
	} else if (pn === '/new_illust_r18.php') {
		//みんなのR-18新着作品
	} else if (pn === '/bookmark_new_illust_r18.php') {
		//フォローユーザーR-18新着イラスト
	} else {
		//Not Support Pages
		retval.supported = false;
	}
	return retval;
}

function removeJama($doc = $(document)) {
	[
		'iframe',
		'aside',
		//Ad
		'.ad',
		'.ads_area',
		'.ad-footer',
		'.ads_anchor',
		'.comic-hot-works',
		'.user-ad-container',
		'.ads_area_no_margin',
		//Premium
		'.ad-printservice',
		'.bookmark-ranges',
		'.require-premium',
		'.showcase-reminder',
		'.sample-user-search',
		'.popular-introduction',
	].forEach((e) => {
		$doc.find(e).remove();
	});
}

function getThumbPageInfo(tpageURI) {
	// complete URI String
	return fetch(tpageURI, {
			credentials: 'same-origin' // with cookies
		})
		.then(response => response.text())
		.then(html => new DOMParser().parseFromString(html, 'text/html'))
		.then(doc => $(doc))
		.then(($doc) => {
			removeJama($doc);

			const tpage = {};
			tpage.followed = $doc.find('#favorite-button').hasClass('following');
			tpage.tags = $doc.find('li.tag .text').toArray().map(e => e.innerText);
			tpage.type = (function($wd) {
				if ($wd.find('._work.multiple').length > 0) {
					return 'manga';
				} else if ($wd.find('._ugoku-illust-player-container').length > 0) {
					return 'ugoira';
				} else {
					return 'illust';
				}
			})($doc.find('.works_display'));
			tpage.rating = ~~$doc.find('dd.score-count').text();
			return tpage;
		})
		.catch((err) => {
			console.error(err);
		});
}

// Class Thumb
function Thumb(imgitem) {
	const workURI = new URI(imgitem.querySelector('a.work').getAttribute('href'));
	const bk = imgitem.querySelector('.bookmark-count');

	this.elem = imgitem;
	this.elem.removeAttribute('style');
	this.URI = workURI.absoluteTo(baseURI);
	this.workId = URI.parseQuery(this.URI.query()).illust_id;
	this.autherId = Patchouli.conf.hasAuthor ? imgitem.querySelector('.user').dataset.user_id : null;
	this.bookmark = bk ? ~~bk.innerText : 0;
	this.hide = false;
}

//Main Class
const Patchouli = {
	init: function() {
		this.Tbooks = [];
		const BI = getBaseInfo();
		this.conf = BI.imgitemConf;
		this.supported = BI.supported;
		this.$container = BI.$container;
		this.koakuma = {
			ratingStep: 1000,
			bookmarkStep: 50,
			keywords: '',
			rating: 0,
			bookmark: 0,
			autosort: false,
			markfollowed: true,
		};
		this.intervalFetcherId = null;
		console.log('Patchouli', this);
	},

	getPageInfo: function(pageURI) {
		// complete URI String
		console.log(URI.decode(pageURI));
		return new Promise((resolve, reject) => {
				if (pageURI) {
					resolve();
				} else {
					reject('pageURI is null');
				}
			})
			.then(() => {
				return fetch(pageURI.toString(), {
						credentials: 'same-origin' // with cookies
					})
					.then(response => response.text())
					.then(html => new DOMParser().parseFromString(html, 'text/html'))
					.then(doc => $(doc));
			})
			.then(($doc) => {
				removeJama($doc);
				const page = {};

				page.URI = pageURI;
				const next = $doc.find('.next a').attr('href');
				page.nextURI = (next) ? new URI(baseURI).query(next).toString() : null;

				page.thumbs = $doc.find(this.conf.selector)
					.toArray()
					.filter((elem) => elem.querySelector('a.work'))
					.map((elem) => new Thumb(elem))
					.filter((elem) => {
						// Pixiv inner error, like image been deleted
						return elem.workId;
					});
				return page;
			})
			.then((page) => {
				// valid imgitems

				let innerp = page.thumbs.map((thumb) => {
					return Promise.resolve(getThumbPageInfo(thumb.URI))
						.then((tpi)=> {
							for(let k in tpi) {
								thumb[k] = tpi[k];
							}
							return thumb;
						});
				});

				return Promise.all(innerp).then(() => {
					return page;
				});
			})
			.catch((err) => {
				console.error(err);
			});
	},

	pageGenerator: function* () {
		let next = baseURI;
		while(true) {
			next = yield this.getPageInfo(next)
					.then((p)=> {
						const filtered = this.koakumaFilter(p.thumbs);
						
						[].push.apply(this.Tbooks, filtered);

						filtered.forEach((e) => {
							//append elem reference, Do NOT use jQuery
							this.$container[0].appendChild(e.elem);
						});

						$('#Koakuma-processed').text(this.Tbooks.length);
						return p.nextURI;
					}).catch((err) => {
						console.log(err);
					});
		}
	},

	koakumaFilter: function(thumbs) {
		if (this.koakuma.keywords) {
			const kw = this.koakuma.keywords;

			thumbs.forEach(e => {
				e.hide = true;
				for(let t of e.tags) {
					if(kw.indexOf(t) >= 0) {
						e.hide = false;
						break;
					}
				}
			});
		} else {
			thumbs.forEach(e => e.hide = false);
		}
		thumbs.forEach(e => e.hide = e.hide || e.rating < this.koakuma.rating);
		thumbs.forEach(e => e.hide = e.hide || e.bookmark < this.koakuma.bookmark);
		thumbs.forEach(e => {
			if (e.hide) {
				e.elem.classList.add('filter-hidden');
			} else {
				e.elem.classList.remove('filter-hidden');
			}

			e.elem.style.order = (this.koakuma.autosort) ? -e.bookmark : 0;

			if(this.conf.hasAuthor && this.koakuma.markfollowed && e.followed) {
				e.elem.querySelector('a.user').style.color = 'red';
			}
		});
		return thumbs;
	}
};

function setupHTML() {
	$(`
	<div id="Koakuma">
		<div id="Koakuma-processed-box">
			已處理 <strong id="Koakuma-processed">0</strong> 張 
		</div>
		<div id="Koakuma-main-box">
			<div class="keyword">
				<span>標籤過濾：</span>
				<input type="text" id="Koakuma-keyword">
			</div>
			<div class="rating">
				<span>★評分</span>：
				<span id="Koakuma-rating">0</span>
				以上
			</div>
			<div class="bookmark">
				<span>★書籤</span>：
				<span id="Koakuma-bookmark">0</span>
				以上
			</div>
			<div class="func">
				<a href="javascript:;" id="Koakuma-fetcher">找</a>
				<a href="javascript:;" id="Koakuma-stop">停</a>
			</div>
			<div class="config">
				<a href="javascript:;" id="Koakuma-config">⚒更多選項</a>
			</div>
		</div>
		<div id="Koakuma-config-box">
			<div>標示已追蹤 <input type="checkbox" id="Koakuma-config-markfollowed"/></div>
			<div>滿版頁寬 <input type="checkbox" id="Koakuma-config-fillwidth"/></div>
			<div>書籤排序 <input type="checkbox" id="Koakuma-config-autosort"/></div>
		</div>
	</div>`).appendTo('body');

	$(`
	<style>
	/* Koakuma */
	#Koakuma {
		width: 150px;
		position: fixed;
		left: 10px;
		bottom: 10px;
		background-color: #E4E7EE;
		box-shadow: 0px 0px 3px 0px;
		font-size: 16px;
		padding: 10px;
		border-radius: 10px;
		z-index: 10;
	}

	#Koakuma a{
		text-decoration: none;
		display: inline-block;
	}

	#Koakuma-processed-box,
	#Koakuma-rating,
	#Koakuma-bookmark {
		cursor: pointer;
	}
	#Koakuma-processed-box,
	#Koakuma-main-box > div.func {
		text-align: center;
	}

	#Koakuma-main-box > div {
		margin: 3px auto;
	}

	#Koakuma-keyword {
		width: 140px;
	}

	#Koakuma-main-box .rating span:nth-of-type(1){
		color: #F18300;
	}

	#Koakuma-main-box .bookmark span:nth-of-type(1){
		color: #0069b1;
		background-color: #cceeff;
	}

	#Koakuma-main-box > div.func > a {
		padding: 5px 50px;
		border-radius: 5px;
		font-size: 20px;
		color: black;
	}

	#Koakuma-main-box > div.func > a:hover {
		transform: translate(-2px, -2px);
		box-shadow: 1px 1px 1px #533;
	}

	#Koakuma-main-box > div.func > a:active {
		transform: translate(0px, 0px);
		box-shadow: none;
	}

	#Koakuma-stop {
		background-color: rgb(230, 160, 160);
	}

	#Koakuma-stop:hover {
		background-color: rgb(240, 170, 170);
	}

	#Koakuma-stop:active {
		background-color: rgb(220, 150, 150);
	}

	#Koakuma-fetcher {
		background-color: rgb(160, 230, 160);
	}

	#Koakuma-fetcher:hover {
		background-color: rgb(170, 240, 170);
	}

	#Koakuma-fetcher:active {
		background-color: rgb(150, 220, 150);
	}

	.Tbooks-container {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-around;
		margin-left: initial;
	}

	.Tbooks-container > li.image-item {
		margin: 21px 4px 0;
		padding: 0 8px 0;
	}

	.filter-editing {
		color: red;
		font-size: 18px;
	}

	.filter-hidden {
		display: none;
	}

	/* Pixiv Better */
	#wrapper {
		width: initial;
	}

	.fillwidth {
		width: initial;
	}
	</style>`).appendTo('head');

	Patchouli.$container.children().remove();
	Patchouli.$container.addClass('Tbooks-container');
}

function setupEvent() {
	$('#Koakuma-config-box').hide();
	$('#Koakuma-stop').hide();

	if (!Patchouli.conf.hasAuthor) {
		$('#Koakuma-config-markfollowed').parent().remove();
	} else {
		$('#Koakuma-config-markfollowed').attr('checked', true);
	}

	if (!Patchouli.conf.hasBookmark) {
		$('#Koakuma-config-autosort').parent().remove();
		$('#Koakuma-main-box > .bookmark').remove();
	}

	if (!Patchouli.conf.needFillwidth) {
		$('#Koakuma-config-fillwidth').parent().remove();
	}

	$('#Koakuma-processed-box').on('click', function(event) {
		$('#Koakuma-main-box').toggle(300);
		$('#Koakuma-config-box').hide(300);
	});

	$('#Koakuma-config').on('click', function(event) {
		$('#Koakuma-config-box').toggle(300);
	});

	$('#Koakuma-rating').on('click', function(event) {
		if (!Patchouli.intervalFetcherId) {
			$('#Koakuma-rating').toggleClass('filter-editing');
		}
		$('#Koakuma-bookmark').removeClass('filter-editing');
	});

	$('#Koakuma-bookmark').on('click', function(event) {
		if (!Patchouli.intervalFetcherId) {
			$('#Koakuma-bookmark').toggleClass('filter-editing');
		}
		$('#Koakuma-rating').removeClass('filter-editing');
	});

	$('#Koakuma-stop').on('click', function(event) {
		$('#Koakuma-stop').hide();
		$('#Koakuma-fetcher').show();
		$('#Koakuma-main-box > div:not(.func)').show();

		clearInterval(Patchouli.intervalFetcherId);
		Patchouli.intervalFetcherId = null;
	});

	$('#Koakuma-fetcher').on('click', function(event) {
		$('#Koakuma-fetcher').hide();
		$('#Koakuma-stop').show();
		$('.filter-editing').removeClass('filter-editing');
		$('#Koakuma-main-box > div:not(.func)').hide();
		$('#Koakuma-config-box').hide();

		Patchouli.koakuma.keywords = $('#Koakuma-keyword').val();
		Patchouli.koakumaFilter(Patchouli.Tbooks);
		Patchouli.intervalFetcherId = setInterval(function() {
			Patchouli.np = Patchouli.np.then((n) => Patchouli.page.next(n).value);
		}, 1000);
	});

	$('#Koakuma-config-markfollowed').on('click', function(event) {
		if (event.target.checked) {
			Patchouli.koakuma.markfollowed = true;
			Patchouli.Tbooks.forEach((e) => {
				if (e.followed) {
					e.elem.querySelector('a.user').style.color = 'red';
				}
			});
		} else {
			Patchouli.koakuma.markfollowed = false;
			Patchouli.Tbooks.forEach((e) => {
				e.elem.querySelector('a.user').style.color = '';
			});
		}
	});

	$('#Koakuma-config-autosort').on('click', function(event) {
		if (event.target.checked) {
			Patchouli.koakuma.autosort = true;
		} else {
			Patchouli.koakuma.autosort = false;
		}
	});

	$('#Koakuma-config-fillwidth').on('click', function(event) {
		if (event.target.checked) {
			$('.layout-body').addClass('fillwidth');
		} else {
			$('.layout-body').removeClass('fillwidth');
		}
	});

	$('#Koakuma').on('wheel', function(event) {
		const t = event.originalEvent.deltaY < 0 ? 1 : -1;
		const fe = $('.filter-editing');
		if(fe.length > 0) {
			const feid = fe[0].id;
			if (feid === 'Koakuma-rating') {
				const tt = Patchouli.koakuma.ratingStep * t;
				fe.text(Math.max(0, ~~fe.text() + tt));
				Patchouli.koakuma.rating = ~~fe.text();
			} else if (feid === 'Koakuma-bookmark') {
				const tt = Patchouli.koakuma.bookmarkStep * t;
				fe.text(Math.max(0, ~~fe.text() + tt));
				Patchouli.koakuma.bookmark = ~~fe.text();
			} else {
				console.log(feid);
			}
		} else {
			return;
		}
	});
}

//for debugging
// window.Patchouli = Patchouli;
// window.URI = URI;

// Program Entry Point
Patchouli.init();
removeJama();
if (Patchouli.supported) {
	setupHTML();
	setupEvent();
	Patchouli.page = Patchouli.pageGenerator();
	Patchouli.np = Patchouli.page.next().value;
}
