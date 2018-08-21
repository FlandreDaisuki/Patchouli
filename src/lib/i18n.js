import Vue from 'vue';
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);

const en = {
  config: {
    blacklist: 'Blacklist',
    contextMenuExtension: 'Right click extension',
    hoverPlay: 'Mouse hover play ugoira',
    userTooltip: 'Illustrator tooltip',
  },
  contextMenu: {
    addToBlacklist: 'Add to Blacklist',
    download: 'Download',
    followUser: 'Follow',
    openBookmarkPage: 'Add Bookmark Page',
    preview: 'Preview',
    thumbUp: 'Like',
  },
  ctrlPanel: {
    buttonEnd: 'End',
    buttonGo: 'Go',
    buttonPause: 'Pause',
    fitWidth: 'fit browser width',
    processed: '{count} imgs processed',
    sortByBookmarkId: 'sort by bookmark id',
    sortByDate: 'sort by date',
    sortByPopularity: 'sort by popularity',
    tagsPlaceholder: 'tags filter example: flandre|sister',
  },
  mainView: {
    bookmarkTooltip: '{count} bookmarks',
    newProfilePage: {
      bookmarks: 'Bookmarks',
      contents: 'Contents',
      illustrations: 'Illustrations',
      manga: 'Manga',
      noResult: 'Not found',
      privateBookmark: 'Private',
      publicBookmark: 'Public',
    },
  },
};
const ja = {
  config: {
    blacklist: 'ブラックリスト',
    contextMenuExtension: '右クリックの拡張機能',
    hoverPlay: 'マウスオーバーでうごイラ再生',
    userTooltip: 'イラストレーターツールチップ',
  },
  contextMenu: {
    addToBlacklist: 'ブラックリストへ',
    download: 'ダウンロード',
    followUser: 'フォローする',
    openBookmarkPage: 'ブックマーク追加ページ',
    preview: 'プレビュー',
    thumbUp: 'いいね',
  },
  ctrlPanel: {
    buttonEnd: '終了',
    buttonGo: '捜す',
    buttonPause: '中断',
    fitWidth: '全幅',
    processed: '{count} 件が処理された',
    sortByBookmarkId: 'ブックマーク順',
    sortByDate: '投稿順',
    sortByPopularity: '人気順',
    tagsPlaceholder: 'タグフィルター 例: フランドール|妹様',
  },
  mainView: {
    bookmarkTooltip: '{count} 件のブックマーク',
    newProfilePage: {
      bookmarks: 'ブックマーク',
      contents: '作品',
      illustrations: 'イラスト',
      manga: 'マンガ',
      noResult: '作品がありません',
      privateBookmark: '非公開',
      publicBookmark: '公開',
    },
  },
};
const zhCN = {
  config: {
    blacklist: '黑名單',
    contextMenuExtension: '右键扩展',
    hoverPlay: '鼠标播放动图',
    userTooltip: '绘师提示框',
  },
  contextMenu: {
    addToBlacklist: '拉黑',
    download: '下载',
    followUser: '加关注',
    openBookmarkPage: '开启添加收藏页',
    preview: '原图预览',
    thumbUp: '赞',
  },
  ctrlPanel: {
    buttonEnd: '完',
    buttonGo: '找',
    buttonPause: '停',
    fitWidth: '自适应浏览器宽度',
    processed: '已处理 {count} 张',
    sortByBookmarkId: '以加入顺序排序',
    sortByDate: '以日期排序',
    sortByPopularity: '以人气排序',
    tagsPlaceholder: '标签过滤 例: 芙兰朵露|二小姐',
  },
  mainView: {
    bookmarkTooltip: '{count} 个收藏',
    newProfilePage: {
      bookmarks: '收藏',
      contents: '作品',
      illustrations: '插画',
      manga: '漫画',
      noResult: '找不到作品',
      privateBookmark: '非公开',
      publicBookmark: '公开',
    },
  },
};
const zhTW = {
  config: {
    blacklist: '黑名單',
    contextMenuExtension: '擴充右鍵',
    hoverPlay: '滑鼠播放動圖',
    userTooltip: '繪師提示框',
  },
  contextMenu: {
    addToBlacklist: '加入黑名單',
    download: '下載',
    followUser: '加關注',
    openBookmarkPage: '開啟添加收藏頁',
    preview: '原圖預覽',
    thumbUp: '讚',
  },
  ctrlPanel: {
    buttonEnd: '完',
    buttonGo: '找',
    buttonPause: '停',
    fitWidth: '自適應瀏覽器寬度',
    processed: '已處理 {count} 張',
    sortByBookmarkId: '以加入順序排序',
    sortByDate: '以日期排序',
    sortByPopularity: '以人氣排序',
    tagsPlaceholder: '標籤過濾 例: 芙蘭朵露|二小姐',
  },
  mainView: {
    bookmarkTooltip: '{count} 個收藏',
    newProfilePage: {
      bookmarks: '收藏',
      contents: '作品',
      illustrations: '插畫',
      manga: '漫畫',
      noResult: '找不到作品',
      privateBookmark: '非公開',
      publicBookmark: '公開',
    },
  },
};

export default new VueI18n({
  fallbackLocale: 'ja',
  locale: document.documentElement.lang.toLowerCase(),
  messages: {
    en,
    ja,
    'zh': zhCN,
    'zh-cn': zhCN,
    'zh-tw': zhTW,
  },
});
