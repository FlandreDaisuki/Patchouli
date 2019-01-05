export const $ = (selector) => {
  return document.querySelector(selector);
};

export const $$ = (selector) => {
  return [...document.querySelectorAll(selector)];
};

export const $find = (doc, selector) => {
  return doc.querySelector(selector);
};

export const $$find = (doc, selector) => {
  return [...doc.querySelectorAll(selector)];
};

export const $el = (tag, attr = {}, cb = () => {}) => {
  const el = document.createElement(tag);
  Object.assign(el, attr);
  cb(el);
  return el;
};

export const $print = {
  debug(...args) {
    console.debug.apply(console, [...args]);
  },
  error(...args) {
    console.error.apply(console, [...args]);
  },
  log(...args) {
    console.log.apply(console, [...args]);
  },
};

export const toInt = (x) => {
  const t = Number(x);
  return isNaN(t) ? 0 : Math.floor(t);
};

export const toFormUrlencoded = (o) => {
  // application/x-www-form-urlencoded
  return new URLSearchParams(o).toString();
};

export const waitUntil = async(func, { ms = 0, maxCount = 60 } = {}) => {
  return new Promise((resolve, reject) => {

    console.time('utils#waitUntil: time');
    (function wait(c) {
      if (c <= 0) {
        reject();
        return;
      }
      setTimeout(() => {
        const r = func();
        $print.debug('utils#waitUntil: r, countdown', [r, c]);
        if (r) {
          console.timeEnd('utils#waitUntil: time');
          resolve(r);
        } else  {
          wait(c - 1);
        }
      }, ms);
    })(toInt(maxCount));

  });
};
