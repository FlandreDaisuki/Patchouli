var DefaultImageItemImage = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"image-item-image"},[_c('a',{attrs:{"href":_vm.illustPageUrl,"rel":"noopener"}},[(_vm.illustPageCount > 1)?_c('div',{staticClass:"multiple"},[_c('span'),_vm._v(" "+_vm._s(_vm.illustPageCount)+" ")]):_vm._e(),_vm._v(" "),_c('img',{attrs:{"data-src":_vm.imgUrl,"src":_vm.imgUrl}}),_vm._v(" "),(_vm.isUgoira)?_c('div',{staticClass:"ugoira"}):_vm._e()]),_vm._v(" "),_c('div',{staticClass:"bookmark _one-click-bookmark",class:{on:_vm.selfIsBookmarked},attrs:{"data-click-action":"illust","data-click-label":_vm.illustId,"data-type":"illust","data-id":_vm.illustId,"title":_vm.selfIsBookmarked},on:{"click":_vm.oneClickBookmarkAdd}}),_vm._v(" "),(_vm.bookmarkId)?_c('div',{staticClass:"bookmark-input-container"},[_c('input',{attrs:{"name":"book_id[]","type":"checkbox"},domProps:{"value":_vm.bookmarkId}})]):_vm._e()])},staticRenderFns: [],_scopeId: 'data-v-23ff0f22',
  name: "DefaultImageItemImage",
  props: {
    imgUrl: String,
    illustId: String,
    illustPageCount: Number,
    isUgoira: Boolean,
    isBookmarked: Boolean,
    bookmarkId: String
  },
  data() {
    return {
      selfIsBookmarked: this.isBookmarked
    };
  },
  computed: {
    illustPageUrl() {
      return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;
    }
  },
  methods: {
    oneClickBookmarkAdd() {
      if (!selfIsBookmarked) {
        selfIsBookmarked = true;
      }
    }
  }
};

var DefaultImageItemTitle = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('figcaption',{staticClass:"image-item-title"},[_c('ul',[_c('li',{staticClass:"title-text"},[_c('a',{attrs:{"href":_vm.illustPageUrl,"title":_vm.illustTitle}},[_vm._v(_vm._s(_vm.illustTitle))])]),_vm._v(" "),(!_vm.isMemberIllistPage)?_c('li',[_c('a',{staticClass:"user-link ui-profile-popup",attrs:{"href":_vm.userPageUrl,"target":"_blank","title":_vm.userName,"data-user_id":_vm.userId,"data-user_name":_vm.userName}},[_c('span',{staticClass:"user-img",style:(_vm.profileImgStyle)}),_vm._v(" "),_c('span',[_vm._v(_vm._s(_vm.userName))])])]):_vm._e(),_vm._v(" "),(_vm.bookmarkCount > 0)?_c('li',[_c('ul',{staticClass:"count-list"},[_c('li',[_c('a',{staticClass:"_ui-tooltip bookmark-count",attrs:{"href":_vm.bookmarkDetailUrl,"data-tooltip":_vm.bookmarkTooltipMsg}},[_c('i',{staticClass:"_icon sprites-bookmark-badge"}),_vm._v(_vm._s(_vm.bookmarkCount))])])])]):_vm._e()])])},staticRenderFns: [],_scopeId: 'data-v-b9e9aa28',
  name: "DefaultImageItemTitle",
  props: {
    illustId: String,
    illustTitle: String,
    userName: String,
    userId: String,
    profileImgUrl: String,
    bookmarkCount: Number,
    bookmarkTooltipMsgFunc: Function,
    pagetype: Symbol
  },
  computed: {
    illustPageUrl() {
      return `/member_illust.php?mode=medium&illust_id=${this.illustId}`;
    },
    userPageUrl() {
      return `/member_illust.php?id=${this.userId}`;
    },
    bookmarkDetailUrl() {
      return `/bookmark_detail.php?illust_id=${this.illustId}`;
    },
    bookmarkTooltipMsg() {
      return this.bookmarkTooltipMsgFunc(this.bookmarkCount);
    },
    profileImgStyle() {
      return {
        backgroundImage: `url(${this.profileImgUrl})`
      };
    },
    isMemberIllistPage() {
      return this.pagetype.toString() === "Symbol(MEMBER_ILLIST)"; // work around for build twice
    }
  }
};

var DefaultImageItem = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"image-item"},[_c('figure',{staticClass:"image-item-inner"},[_c('DefaultImageItemImage',{attrs:{"imgUrl":_vm.imgUrl,"illustId":_vm.illustId,"illustPageCount":_vm.illustPageCount,"isUgoira":_vm.isUgoira,"isBookmarked":_vm.isBookmarked,"bookmarkId":_vm.bookmarkId}}),_vm._v(" "),_c('DefaultImageItemTitle',{attrs:{"illustId":_vm.illustId,"illustTitle":_vm.illustTitle,"userName":_vm.userName,"userId":_vm.userId,"profileImgUrl":_vm.profileImgUrl,"bookmarkCount":_vm.bookmarkCount,"bookmarkTooltipMsgFunc":_vm.bookmarkTooltipMsgFunc,"pagetype":_vm.pagetype}})],1)])},staticRenderFns: [],_scopeId: 'data-v-7313ace1',
  name: "DefaultImageItem",
  components: {
    DefaultImageItemImage,
    DefaultImageItemTitle
  },
  props: {
    imgUrl: String,
    illustId: String,
    illustTitle: String,
    illustPageCount: Number,
    isUgoira: Boolean,
    isBookmarked: Boolean,
    userName: String,
    userId: String,
    profileImgUrl: String,
    bookmarkCount: Number,
    bookmarkTooltipMsgFunc: Function,
    bookmarkId: { type: String, default: "" },
    pagetype: Symbol
  }
};

var _default = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{attrs:{"id":"patchouli"}},_vm._l((_vm.filteredLibrary),function(d){return _c('DefaultImageItem',{key:d.illust_id,attrs:{"imgUrl":d.url.sq240,"illustId":d.illust_id,"illustTitle":d.illust_title,"illustPageCount":d.illust_page_count,"isUgoira":d.is_ugoira,"userName":d.user_name,"userId":d.user_id,"profileImgUrl":d.profile_img,"bookmarkCount":d.bookmark_count,"bookmarkTooltipMsgFunc":_vm.bookmarkTooltipMsgFunc,"isBookmarked":d.is_bookmarked,"bookmarkId":d.bookmark_id,"pagetype":_vm.pagetype}})}))},staticRenderFns: [],_scopeId: 'data-v-186857e1',
  name: "Default",
  components: {
    DefaultImageItem
  },
  props: ["library", "l10n", "pagetype", "filters"],
  computed: {
    bookmarkTooltipMsgFunc() {
      return this.l10n.bookmarkTooltip.bind(this.l10n);
    },
    filteredLibrary() {
      const cloneLibrary = this.library.slice();
      return cloneLibrary
        .filter(el => el.bookmark_count >= this.filters.limit)
        .filter(el => el.tags.match(this.filters.tag))
        .sort(
          (a, b) =>
            Number.toInt(b[this.filters.orderBy]) -
            Number.toInt(a[this.filters.orderBy])
        );
    }
  }
};

var koakuma = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{class:_vm.statusClass,attrs:{"id":"koakuma"}},[_c('div',{staticClass:"processed"},[_vm._v(_vm._s(_vm.processedMsg))]),_vm._v(" "),_c('div',[_c('label',{staticClass:"bookmark-count",attrs:{"for":"koakuma-bookmark-sort-input"}},[_c('i',{staticClass:"_icon sprites-bookmark-badge"}),_vm._v(" "),_c('input',{attrs:{"id":"koakuma-bookmark-sort-input","type":"number","min":"0","step":"1"},domProps:{"value":_vm.filters.limit},on:{"wheel":function($event){$event.stopPropagation();$event.preventDefault();_vm.sortInputWheel($event);},"input":_vm.sortInputInput}}),_vm._v("↑ ")])]),_vm._v(" "),_c('div',[_c('input',{staticClass:"tag-filter",attrs:{"type":"text","placeholder":_vm.l10n.tagFilterPlaceholder},on:{"input":_vm.tagFilterInput}})]),_vm._v(" "),_c('div',[_c('button',{staticClass:"explosion",attrs:{"disabled":_vm.crawler.isEnded},on:{"click":_vm.clickExplosion}},[_vm._v(_vm._s(_vm.buttonMsg))])]),_vm._v(" "),_c('div',[_c('input',{attrs:{"type":"checkbox","id":"koakuma-options-fit-browser-width"},domProps:{"checked":_vm.conf.fitwidth},on:{"change":_vm.optionsChange}}),_vm._v(" "),_c('label',{attrs:{"for":"koakuma-options-fit-browser-width"}},[_vm._v(_vm._s(_vm.l10n.fitBrowserWidth))]),_vm._v(" "),_c('input',{attrs:{"type":"checkbox","id":"koakuma-options-sort-by-bookmark-count"},domProps:{"checked":_vm.conf.sort},on:{"change":_vm.optionsChange}}),_vm._v(" "),_c('label',{attrs:{"for":"koakuma-options-sort-by-bookmark-count"}},[_vm._v(_vm._s(_vm.l10n.sortByBookmarkCount))])])])},staticRenderFns: [],_scopeId: 'data-v-40b353ca',
  name: "Koakuma",
  props: ["crawler", "l10n", "filters", "store", "conf", "applyConf"],
  computed: {
    processedMsg() {
      return this.l10n.koakumaProcessed.call(
        this.l10n,
        this.crawler.library.length
      );
    },
    statusClass() {
      return {
        end: this.crawler.isEnded,
        paused: !this.crawler.isPaused && !this.crawler.isEnded,
        go: this.crawler.isPaused && !this.crawler.isEnded
      };
    },
    buttonMsg() {
      if (this.crawler.isEnded) {
        return this.l10n.koakumaEnd;
      } else if (this.crawler.isPaused) {
        return this.l10n.koakumaGo;
      } else {
        return this.l10n.koakumaPause;
      }
    }
  },
  methods: {
    clickExplosion() {
      if (this.crawler.isPaused) {
        this.crawler.start();
      } else {
        this.crawler.pause();
      }
    },
    sortInputWheel(event) {
      if (event.deltaY < 0) {
        this.filters.limit = Number.toInt(event.target.value) + 20;
      } else {
        this.filters.limit = Math.max(0, Number.toInt(event.target.value) - 20);
      }
    },
    sortInputInput(event) {
      if (this.debounceId0) {
        clearTimeout(this.debounceId0);
      }
      this.debounceId0 = setTimeout(() => {
        this.debounceId0 = null;
        this.filters.limit = Math.max(0, Number.toInt(event.target.value));
      }, 500);
    },
    optionsChange(event) {
      if (event.target.id === "koakuma-options-fit-browser-width") {
        this.conf.fitwidth = event.target.checked;
      } else {
        //koakuma-options-sort-by-bookmark-count
        this.conf.sort = Number.toInt(event.target.checked);
      }
      this.store.set(this.conf);
      this.applyConf();
    },
    tagFilterInput(event) {
      if (this.debounceId1) {
        clearTimeout(this.debounceId1);
      }
      this.debounceId1 = setTimeout(() => {
        this.debounceId1 = null;
        this.filters.tag = new RegExp(event.target.value, "ig");
      }, 1500);
    }
  },
  data() {
    return {
      debounceId0: null,
      debounceId1: null
    };
  }
};

export { _default as Default, koakuma as Koakuma };
