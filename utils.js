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

function $log(...args) {
  console.log.apply(console, args);
}

function $error(...args) {
  console.error.apply(console, args);
}

function $debug(...args) {
  console.debug.apply(console, args);
}

(() => {
  Math.clamp = (val, min, max) => Math.min(Math.max(min, val), max);
  Number.toInt = (s) => (isNaN(~~s) ? 0 : ~~s);

  // from: https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/after()/after().md
  (function(arr) {
    arr.forEach(function(item) {
      if (item.hasOwnProperty('after')) {
        return;
      }
      Object.defineProperty(item, 'after', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function after() {
          const argArr = Array.prototype.slice.call(arguments);
          const docFrag = document.createDocumentFragment();

          argArr.forEach(function(argItem) {
            const isNode = argItem instanceof Node;
            docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
          });

          this.parentNode.insertBefore(docFrag, this.nextSibling);
        }
      });
    });
  })([Element.prototype, CharacterData.prototype, DocumentType.prototype]);
})();

export {
  $,
  $$,
  $find,
  $$find,
  $el,
  $log,
  $error,
  $debug
};
