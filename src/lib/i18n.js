import Vue from 'vue';
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);

export default new VueI18n({
  locale: document.documentElement.lang,
  messages: {
    'en': {
      bookmarkTooltip: '{bookmarkCount} bookmarks'
    },
    'ja': {
      bookmarkTooltip: '{bookmarkCount}件のブックマーク'
    }
  }
});
