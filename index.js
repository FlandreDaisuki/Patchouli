import Vue from 'vue';
import store from './store/index';
import koakuma from './components/Koakuma.vue';
import patchouli from './components/Patchouli.vue';

store.commit('prepareMountPoint');

const Patchouli = new Vue({
  store,
  render: h => h(patchouli)
});

const Koakuma = new Vue({
  store,
  render: h => h(koakuma)
});

