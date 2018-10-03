const GMC = {
  async XHR(details) {
    const xhr = window.GM_xmlhttpRequest || (GM ? GM.xmlHttpRequest : null);
    if (!xhr) {
      return Promise.reject();
    }

    return new Promise((resolve, reject) => {
      Object.assign(details, {
        onabort: reject,
        onerror: reject,
        onload: resolve,
        ontimeout: reject,
      });
      xhr(details);
    });
  },
  async getValue(name, failv = null) {
    if (window.GM_getValue) {
      return Promise.resolve(GM_getValue(name) || failv);
    } else {
      return (await GM.getValue(name)) || failv;
    }
  },
  async setValue(name, value) {
    if (window.GM_setValue) {
      GM_setValue(name, value);
    } else {
      GM.setValue(name, value);
    }
  },
};

export default GMC;
