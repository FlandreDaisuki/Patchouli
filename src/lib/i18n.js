import Vue from 'vue';
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);

export default new VueI18n({
  locale: document.documentElement.lang,
  fallbackLocale: 'ja',
  messages: {
    'en': {
      patchouli: {
        bookmarkTooltip: '{count} bookmarks'
      },
      koakuma: {
        processed: '{count} imgs processed',
        tagsPlaceholder: 'tags filter example: flandre|sister',
        buttonGo: 'Go',
        buttonPause: 'Pause',
        buttonEnd: 'End',
        fitWidth: 'fit browser width',
        sortByBookmarkCount: 'sort by bookmark count'
      }
    },
    'ja': {
      patchouli: {
        bookmarkTooltip: '{count} 件のブックマーク'
      },
      koakuma: {
        processed: '{count} 件が処理された',
        tagsPlaceholder: 'タグフィルター 例: フランドール|妹様',
        buttonGo: '捜す',
        buttonPause: '中断',
        buttonEnd: '終了',
        fitWidth: '全幅',
        sortByBookmarkCount: 'ブックマーク数順'
      }
    },
    'zh': {
      patchouli: {
        bookmarkTooltip: '{count} 个收藏'
      },
      koakuma: {
        processed: '已处理 {count} 张',
        tagsPlaceholder: '标签过滤 例: 芙兰朵露|二小姐',
        buttonGo: '找',
        buttonPause: '停',
        buttonEnd: '完',
        fitWidth: '自适应浏览器宽度',
        sortByBookmarkCount: '书签数排序'
      }
    },
    'zh-tw': {
      patchouli: {
        bookmarkTooltip: '{count} 個收藏'
      },
      koakuma: {
        processed: '已處理 {count} 張',
        tagsPlaceholder: '標籤過濾 例: 芙蘭朵露|二小姐',
        buttonGo: '找',
        buttonPause: '停',
        buttonEnd: '完',
        fitWidth: '自適應瀏覽器寬度',
        sortByBookmarkCount: '書籤數排序'
      }
    }
  }
});
