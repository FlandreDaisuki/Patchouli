export default {
  state: {
    mode: null,
    data: null,
  },
  mutations: {
    openBigComponent(state, payload) {
      Object.assign(state, payload);
    },
    closeBigComponent(state, /*payload*/) {
      state.mode = null;
    }
  }
};
