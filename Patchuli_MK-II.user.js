// ==UserScript==
// @name        Patchuli MK-II
// @namespace   https://github.com/FlandreDaisuki
// @include     http://www.pixiv.net/search.php?*
// @version     1
// @author      FlandreDaisuki
// @grant       none
// @noframes
// ==/UserScript==
/* jshint esnext: true */

function fetchWithcookie(url) {
    return fetch(url, { credentials: 'same-origin' })
        .then(response => response.text());
}

function parseToDOM(html) {
    return (new DOMParser()).parseFromString(html, 'text/html');
}

function removeAnnoyance($doc = $(document)) {
    [
        'iframe',
        'aside',
        //Ad
        '.ad',
        '.ads_area',
        '.ad-footer',
        '.ads_anchor',
        '.comic-hot-works',
        '.user-ad-container',
        '.ads_area_no_margin',
        //Premium
        '.ad-printservice',
        '.bookmark-ranges',
        '.require-premium',
        '.showcase-reminder',
        '.sample-user-search',
        '.popular-introduction',
    ].forEach((e) => {
        $doc.find(e).remove();
    });
}

//Debugging
window.fetchWithcookie = fetchWithcookie;
window.parseToDOM = parseToDOM;
window.removeAnnoyance = removeAnnoyance;
