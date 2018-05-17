export default {
  state: {
    active: false,
    position: { x: -1e7, y: -1e7 },
    data: null,
  },
  mutations: {
    activateContextMenu(state, payload) {
      state.active = true;
      state.position = payload.position;
      state.data = payload.data;
    },
    deactivateContextMenu(state) {
      state.active = false;
      state.position = { x: -1e7, y: -1e7 };
    }
  }
};
