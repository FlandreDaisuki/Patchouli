import { COVER_LAYER_MODE as CLM } from '../../lib/enums';

const state = {
  data: null,
  mode: CLM.NONE,
};

const mutations = {
  close: (state) => {
    state.mode = CLM.NONE;
  },
  open: (state, payload) => {
    Object.assign(state, payload);
  },
};

const getters = {
  data: (state) => state.data,
  mode: (state) => state.mode,
};

export default {
  getters,
  mutations,
  namespaced: true,
  state,
};
