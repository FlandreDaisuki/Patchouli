import Vue from 'vue';

import { MAIN_PAGE_TYPE as MPT } from './lib/enums';
import { $, $print, $el, $parents } from './lib/utils';
import { removeAnnoyings } from './lib/pixiv';
import i18n from './lib/i18n';
import vuexStore from './store/index';

import ctrlPanel from './components/CtrlPanel.vue';
import mainView from './components/MainView.vue';
import coverLayer from './components/CoverLayer.vue';

if (unsafeWindow) {
  // get pixiv info from real window to sandbox window
  const { globalInitData, pixiv } = unsafeWindow;
  // get API that ZipImagePlayer required
  const { DataView, ArrayBuffer } = unsafeWindow;

  Object.assign(window, {
    ArrayBuffer,
    DataView,
    globalInitData,
    pixiv,
  });
}

vuexStore.dispatch('init')
  .then(() => {
    if (vuexStore.getters.MPT === MPT.NO_SUPPORT) {
      return;
    }

    removeAnnoyings();

    // <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.2.0/css/all.css" integrity="sha384-hWVjflwFxL6sNzntih27bfxkr27PmbbK/iSvJ+a4+0owXq79v+lsFkW54bOGbiDQ" crossorigin="anonymous">
    const fontawesome = $el('link', {
      crossOrigin: 'anonymous',
      href: 'https://use.fontawesome.com/releases/v5.2.0/css/all.css',
      integrity: 'sha384-hWVjflwFxL6sNzntih27bfxkr27PmbbK/iSvJ+a4+0owXq79v+lsFkW54bOGbiDQ',
      rel: 'stylesheet',
    });
    document.head.appendChild(fontawesome);

    // setup koamuma placeholder
    if (vuexStore.getters['pixiv/nppType'] < 0) {
      $('._global-header').classList.add('koakuma-placeholder');
    }

    // hijack link
    if (vuexStore.getters.MPT === MPT.SEARCH) {
      const menuItems = $('ul.menu-items');
      [...menuItems.children].forEach((item, index) => {
        const textContent = item.textContent;
        const a = $el('a', { href: 'javascript:;', textContent });
        item.removeChild(item.firstChild);
        item.appendChild(a);

        item.addEventListener('click', () => {
          [...menuItems.children].forEach(_item => _item.classList.remove('current'));
          item.classList.add('current');

          const target = $('#koakuma-bookmark-tags-filter-input');
          if (index === 1) {
            target.value = '-R-18';
          } else if (index === 2) {
            target.value = 'R-18';
          } else {
            target.value = '';
          }
          Koakuma.$children[0].tagsFilterInput({ target });
        });
      });
    }

    /* eslint-disable sort-keys */
    const Koakuma = new Vue({
      i18n,
      store: vuexStore,
      data: {
        name: 'Koakuma',
      },
      computed: {
        currentLocale() {
          return this.$store.getters.locale;
        },
      },
      watch: {
        currentLocale(newValue) {
          this.$i18n.locale = newValue;
        },
      },
      render(h) {
        return h(ctrlPanel, { props: { id: this.name } });
      },
    });

    const Patchouli = new Vue({
      i18n,
      store: vuexStore,
      data: {
        name: 'Patchouli',
      },
      computed: {
        currentLocale() {
          return this.$store.getters.locale;
        },
      },
      watch: {
        currentLocale(newValue) {
          this.$i18n.locale = newValue;
        },
      },
      render(h) {
        return h(mainView, { props: { id: this.name } });
      },
    });

    const Marisa = new Vue({
      i18n,
      store: vuexStore,
      data: {
        name: 'Marisa',
      },
      computed: {
        currentLocale() {
          return this.$store.getters.locale;
        },
      },
      watch: {
        currentLocale(newValue) {
          this.$i18n.locale = newValue;
        },
      },
      render(h) {
        return h(coverLayer, { props: { id: this.name } });
      },
    });
    /* eslint-enable sort-keys */

    vuexStore.dispatch('pixiv/start', { isFirst: true, times: 1 })
      .then(() => {
        Patchouli.$mount(vuexStore.getters.mountPointMainView);
        Koakuma.$mount(vuexStore.getters.mountPointCtrlPanel);
        Marisa.$mount(vuexStore.getters.mountPointCoverLayer);

        vuexStore.commit('applyConfig');

        // unset koamuma placeholder
        if (vuexStore.getters['pixiv/nppType'] < 0) {
          $('._global-header').classList.remove('koakuma-placeholder');
        }

        // pass current mpt status
        return vuexStore.getters['pixiv/status'];
      })
      .catch(error => {
        $print.error('main#init: Fail to first mount', error);
      });

    // document.addEventListener('scroll', (event) => {
    //   $print.debug('body#scroll event:', event);
    // });

    document.body.addEventListener('click', (event) => {
      $print.debug('body#click event:', event);

      const koakuma = Koakuma.$children[0];
      if (!$parents(event.target).find((el) => el.id === 'koakuma-bookmark-input-usual-switch')) {
        koakuma.usualSwitchOn = false;
      }
      if (!$parents(event.target).find((el) => el.id === 'koakuma-sorting-order-select-switch')) {
        koakuma.sortingOrderSwitchOn = false;
      }

      if (vuexStore.getters['contextMenu/active']) {
        vuexStore.commit('contextMenu/deactivate');
      }
    });

    Object.assign(unsafeWindow, {
      Koakuma,
      Marisa,
      Patchouli,
      vuexStore,
    });
  })
  .catch($print.error);
