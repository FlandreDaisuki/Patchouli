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

export const $after = (el, target) => {
  el.parentNode.insertBefore(target, el.nextSibling);
};

export const $parents = (el) => {
  let cur = el;
  const collection = [];
  while (cur.parentElement) {
    collection.push(cur.parentElement);
    cur = cur.parentElement;
  }
  return collection;
};

export const toFormUrlencoded = (o) => {
  // application/x-www-form-urlencoded
  return Object.entries(o)
    .map(p => p.map(encodeURIComponent).join('='))
    .join('&');
};

export async function waitUntil(func, { ms = 100, maxCount = 20 } = {}) {
  return new Promise((resolve, reject) => {
    let c = maxCount;
    const i = setInterval(() => {
      const r = func();
      $print.debug('utils#waitUntil: r, countdown', [r, c]);
      if (r) {
        clearInterval(i);
        resolve(r);
      } else if (c <= 0) {
        clearInterval(i);
        reject();
      } else {
        c -= 1;
      }
    }, ms);
  });
}

export async function $ready(func) {
  return waitUntil(func, { maxCount: Infinity })
    .catch($print.error);
}

export const $sp = () => {
  const s = new URLSearchParams(location.search);
  const ret = {};
  [...s.entries()].reduce((collect, [k, v]) => {
    collect[k] = v;
    return collect;
  }, ret);
  return ret;
};
