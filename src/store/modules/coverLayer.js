const state = {
  data: null,
  mode: null,
};

const mutations = {
  close: (state) => {
    state.mode = null;
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
