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
        sortByPopularity: 'sort by popularity',
        sortByDate: 'sort by date'
      },
      contextMenu: {
        thumbUp: 'Like',
        openBookmarkPage: 'Add Bookmark Page',
        download: 'Download'
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
        sortByPopularity: '人気順',
        sortByDate: '投稿順'
      },
      contextMenu: {
        thumbUp: 'いいね',
        openBookmarkPage: 'ブックマーク追加ページ',
        download: 'ダウンロード'
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
        sortByPopularity: '以人气排序',
        sortByDate: '以日期排序'
      },
      contextMenu: {
        thumbUp: '赞',
        openBookmarkPage: '开启添加收藏页',
        download: '下载'
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
        sortByPopularity: '以人氣排序',
        sortByDate: '以日期排序'
      },
      contextMenu: {
        thumbUp: '讚',
        openBookmarkPage: '開啟添加收藏頁',
        download: '下載'
      }
    }
  }
});
