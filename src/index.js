import Vue from 'vue';
import store from './store/index';
import koakuma from './components/Koakuma.vue';
import patchouli from './components/Patchouli.vue';
import { $error } from './lib/utils';
import { removeAnnoyings } from './lib/pixiv';
import i18n from './lib/i18n';

store.commit('prepareMountPoint');

if (store.state.pageType !== 'NO_SUPPORT') {
  removeAnnoyings();

  const Patchouli = new Vue({
    i18n,
    store,
    computed: {
      currentLocale() {
        return this.$store.state.locale;
      }
    },
    watch: {
      currentLocale(newValue) {
        this.$i18n.locale = newValue;
      }
    },
    render: h => h(patchouli)
  });

  const Koakuma = new Vue({
    i18n,
    store,
    computed: {
      currentLocale() {
        return this.$store.state.locale;
      }
    },
    watch: {
      currentLocale(newValue) {
        this.$i18n.locale = newValue;
      }
    },
    render: h => h(koakuma)
  });

  store.dispatch('start', { times: 1 }).then(() => {
    Patchouli.$mount(store.state.patchouliMountPoint);
    Koakuma.$mount(store.state.koakumaMountPoint);
  }).catch(error => {
    $error('Fail to first mount', error);
  });

  window.store = store;
  window.Patchouli = Patchouli;
  window.Koakuma = Koakuma;
}



