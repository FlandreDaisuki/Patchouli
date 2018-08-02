const GMC = {
  async getValue(name, failv = null) {
    if (window.GM_getValue) {
      // eslint-disable-next-line new-cap
      return Promise.resolve(GM_getValue(name) || failv);
    } else {
      return (await GM.getValue(name)) || failv;
    }
  },
  async setValue(name, value) {
    if (window.GM_setValue) {
      // eslint-disable-next-line new-cap
      GM_setValue(name, value);
    } else {
      GM.setValue(name, value);
    }
  },
  async XHR(details) {
    const xhr = window.GM_xmlhttpRequest || (GM ? GM.xmlHttpRequest : null);
    if (!xhr) {
      return Promise.reject();
    }

    return new Promise((resolve, reject) => {
      Object.assign(details, {
        onload: resolve,
        onabort: reject,
        onerror: reject,
        ontimeout: reject,
      });
      xhr(details);
    });
  },
};

export default GMC;
