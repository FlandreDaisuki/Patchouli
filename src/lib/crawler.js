import {$debug} from './debugger';
import {PageType} from './pagetype';


export default class Crawler {
	constructor(global){
		this.library = global.library;
		this.api = global.api;
		this.pagetype = global.pagetype;
		this.next_url = location.href;
		this.isPaused = true;
		this.isEnded = false;
	}

	async startNextUrlBased(opt) {
		// next_url based
		this.isPaused = false;

		while(this.canContinue() && opt.times) {
			let page = null;
			if (this.pagetype === PageType.SEARCH) {
				page = await this.api.getPageHTMLIllustIds(this.next_url);
			} else {
				page = await this.api.getLegacyPageHTMLIllustIds(this.next_url, {
					needBookmarkId: this.pagetype === PageType.MY_BOOKMARK
				});
			}
			$debug('Crawler#startNextUrlBased: page:', page);

			this.next_url = page.next_url;

			// {[illust_id : IDString]: illust_detail}
			const illust_api_details = await this.api.getIllustsAPIDetail(page.illust_ids);
			$debug('Crawler#startNextUrlBased: illust_api_details:', illust_api_details);

			if (this.pagetype === PageType.MY_BOOKMARK) {
				// {[illust_id : IDString]: {
				//	illust_id,
				//	bookmark_id
				// }}
				const my_bookmark_api_details = page.bookmark_ids;
				for (const [illust_id, illust_detail] of Object.entries(illust_api_details)) {
					const bookmark_id = page.bookmark_ids[illust_id].bookmark_id;
					if (bookmark_id) {
						illust_detail.bookmark_id = bookmark_id;
					}
				}
				$debug('Crawler#startNextUrlBased: my_bookmark_api_details:', my_bookmark_api_details);
			}

			// {[illust_id : IDString]: {
			//	illust_id,
			//	bookmark_count,
			//	tags: string[]
			// }}
			const bookmark_html_details = await this.api.getBookmarkHTMLDetails(Object.keys(illust_api_details));
			$debug('Crawler#startNextUrlBased: bookmark_html_details:', bookmark_html_details);

			const user_ids = Object.values(illust_api_details).map(d => d.user_id);
			// {[user_id : IDString]: {
			//	user_id,
			//	is_follow
			// }}
			const user_api_details = await this.api.getUsersAPIDetail(user_ids);
			$debug('Crawler#startNextUrlBased: user_api_details:', user_api_details);

			const libraryData = this.makeLibraryData({illust_api_details, bookmark_html_details, user_api_details});
			this.library.push(...libraryData);

			opt.times -= 1;
			if (!opt.times) {
				this.pause();
			}

			if (!this.next_url) {
				this.stop();
			}
		}
	}

	async start(options){
		const opt = Object.assign({times: Infinity}, options);
		$debug('Crawler#start: opt:', opt);

		if(this.isEnded || opt.times <= 0) {
			return;
		}

		switch (this.pagetype) {
		case PageType.SEARCH:
		case PageType.NEW_ILLUST:
		case PageType.MY_BOOKMARK:
		case PageType.MEMBER_ILLIST:
			await this.startNextUrlBased(opt);
			break;
		default:
			break;
		}
	}

	pause(){
		this.isPaused = true;
	}

	stop(){
		this.pause();
		this.isEnded = true;
	}


	canContinue() {
		return !(this.isEnded || this.isPaused);
	}

	makeLibraryData({illust_api_details, bookmark_html_details, user_api_details}) {
		if(!illust_api_details || !Object.keys(illust_api_details).length) {
			throw new Error('Crawler#makeLibraryData: illust_api_details is falsy.');
		}

		const vLibrary = [];
		for (const [illust_id, illust_detail] of Object.entries(illust_api_details)) {
			const d = {
				illust_id,
				bookmark_count: bookmark_html_details[illust_id].bookmark_count,
				tags: bookmark_html_details[illust_id].tags.join(', '),
				illust_title: illust_detail.illust_title,
				illust_page_count: Number.toInt(illust_detail.illust_page_count),
				user_id: illust_detail.user_id,
				user_name: illust_detail.user_name,
				is_follow: user_api_details[illust_detail.user_id].is_follow,
				is_bookmarked: illust_detail.is_bookmarked,
				is_ugoira: !!illust_detail.ugoira_meta,
				profile_img: illust_detail.profile_img,
				url: {
					big: illust_detail.url.big,
					sq240: illust_detail.url['240mw'].replace('240x480', '240x240')
				}
			};

			if (this.pagetype === PageType.MY_BOOKMARK) {
				d.bookmark_id = illust_detail.bookmark_id;
			}

			vLibrary.push(d);
		}

		return vLibrary;
	}
}
