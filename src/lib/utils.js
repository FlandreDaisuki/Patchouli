function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return [...document.querySelectorAll(selector)];
}

function $find(doc, selector) {
  return doc.querySelector(selector);
}

function $$find(doc, selector) {
  return [...doc.querySelectorAll(selector)];
}

function $el(tag, attr = {}, cb = () => {}) {
  const el = document.createElement(tag);
  Object.assign(el, attr);
  cb(el);
  return el;
}

const $print = {
  log(...args) {
    console.log.apply(console, [...args]);
  },
  error(...args) {
    console.error.apply(console, [...args]);
  },
  debug(...args) {
    console.debug.apply(console, [...args]);
  },
};

const toInt = (x) => {
  const t = Number(x);
  return isNaN(t) ? 0 : Math.floor(t);
};

function $after(el, target) {
  el.parentNode.insertBefore(target, el.nextSibling);
}

function $parents(el) {
  let cur = el;
  const collection = [];
  while (cur.parentElement) {
    collection.push(cur.parentElement);
    cur = cur.parentElement;
  }
  return collection;
}

function toFormUrlencoded(o) {
  // application/x-www-form-urlencoded
  return Object.entries(o)
    .map(p => p.map(encodeURIComponent).join('='))
    .join('&');
}

export {
  $,
  $$,
  $find,
  $$find,
  $el,
  $print,
  $after,
  $parents,
  toInt,
  toFormUrlencoded,
};
