const state = {
  active: false,
  data: null,
  position: { x: -1e7, y: -1e7 },
};

const getters = {
  active: (state) => state.active,
  data: (state) => state.data,
  pos: (state) => state.position,
};

const mutations =  {
  activate: (state, payload) => {
    state.active = true;
    state.position = payload.position;
    state.data = payload.data;
  },
  deactivate: (state) => {
    state.active = false;
    state.position = { x: -1e7, y: -1e7 };
  },
};

export default {
  getters,
  mutations,
  namespaced: true,
  state,
};
