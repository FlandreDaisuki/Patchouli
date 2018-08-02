import Vue from 'vue';
import store from './store/index';
import koakuma from './components/Koakuma.vue';
import patchouli from './components/Patchouli.vue';
import bigComponent from './components/BigComponent.vue';
import { $, $print, $el, $parents } from './lib/utils';
import { removeAnnoyings } from './lib/pixiv';
import i18n from './lib/i18n';

store.commit('prepareMountPoint');
store.commit('loadConfig');
store.commit('applyConfig');

if (store.state.pageType !== 'NO_SUPPORT') {
  removeAnnoyings();

  // <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.0.13/css/all.css" integrity="sha384-DNOHZ68U8hZfKXOrtjWvjxusGo9WQnrNx2sqG0tfsghAvtVlRW3tvkXWZh58N9jp" crossorigin="anonymous">
  const fontawesome = $el('link', {
    rel: 'stylesheet',
    href: 'https://use.fontawesome.com/releases/v5.0.13/css/all.css',
    integrity: 'sha384-DNOHZ68U8hZfKXOrtjWvjxusGo9WQnrNx2sqG0tfsghAvtVlRW3tvkXWZh58N9jp',
    crossOrigin: 'anonymous' });
  document.head.appendChild(fontawesome);

  // Let sandbox can find binary APIs for ZipImagePlayer
  window.DataView = unsafeWindow.DataView;
  window.ArrayBuffer = unsafeWindow.ArrayBuffer;

  /* setup koamuma placeholder */
  $('._global-header').classList.add('koakuma-placeholder');

  const Patchouli = new Vue({
    i18n,
    store,
    computed: {
      currentLocale() {
        return this.$store.state.locale;
      },
    },
    watch: {
      currentLocale(newValue) {
        this.$i18n.locale = newValue;
      },
    },
    render: h => h(patchouli),
  });

  const Koakuma = new Vue({
    i18n,
    store,
    computed: {
      currentLocale() {
        return this.$store.state.locale;
      },
    },
    watch: {
      currentLocale(newValue) {
        this.$i18n.locale = newValue;
      },
    },
    render: h => h(koakuma),
  });

  const BigComponent = new Vue({
    i18n,
    store,
    computed: {
      currentLocale() {
        return this.$store.state.locale;
      },
    },
    watch: {
      currentLocale(newValue) {
        this.$i18n.locale = newValue;
      },
    },
    render: h => h(bigComponent),
  });

  store.dispatch('start', { times: 1 }).then(() => {
    Patchouli.$mount(store.state.patchouliMountPoint);
    Koakuma.$mount(store.state.koakumaMountPoint);
    BigComponent.$mount(store.state.bigComponentMountPoint);
    $('._global-header').classList.remove('koakuma-placeholder');
  }).catch(error => {
    $print.error('Fail to first mount', error);
  });

  document.body.addEventListener('click', (event) => {
    $print.debug('body#click event:', event);

    if (!$parents(event.target).find((el) => el.id === 'koakuma-bookmark-input-usual-switch')) {
      Koakuma.$children[0].usualSwitchOn = false;
    }
    if (!$parents(event.target).find((el) => el.id === 'koakuma-sorting-order-select-switch')) {
      Koakuma.$children[0].sortingOrderSwitchOn = false;
    }
    if (store.state.contextMenu.active) {
      store.commit('deactivateContextMenu');
    }
  });

  // Expose to global
  Object.assign(unsafeWindow, {
    Patchouli,
    Koakuma,
    BigComponent,
  });
}
