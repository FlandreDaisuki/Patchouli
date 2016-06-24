// ==UserScript==
// @name        Patchuli MK-II
// @namespace   https://github.com/FlandreDaisuki
// @include     http://www.pixiv.net/*
// @version     1
// @author      FlandreDaisuki
// @require     https://cdnjs.cloudflare.com/ajax/libs/vue/1.0.25/vue.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/URI.js/1.18.1/URI.min.js
// @grant       none
// @noframes
// ==/UserScript==
/* jshint esnext: true */

function fetchWithcookie(url) {
    return fetch(url, {credentials: 'same-origin'})
            .then(response => response.text());
}

function getBookmarkCount(illust_id) {
    const url = `http://www.pixiv.net/bookmark_detail.php?illust_id=${illust_id}`;
    return fetchWithcookie(url)
            .then((html)=>{
                let m = html.match(/<\/i>(\d+)/);
                return m ? parseInt(m[1]) : 0;
            });
}

function getBatch(url) {
    return fetchWithcookie(url)
        .then(html => parseToDOM(html))
        .then(doc => $(doc))
        .then($doc => {
            removeAnnoyance($doc);
            const next = $doc.find('.next a').attr('href');
            const nextLink = (next) ? BASE.baseURI.replace(/\?.*/, next) : null;
            const illust_ids = $doc.find('li.image-item > a.work')
                                .toArray()
                                .map(x => URI.parseQuery(x.href).illust_id);
            return {
                nextLink,
                illust_ids,
            };
        });
}

/**
 * return object which key is illust_id
 */
function getIllustsDetails(illust_ids) {
    const api = `http://www.pixiv.net/rpc/index.php?mode=get_illust_detail_by_ids&illust_ids=${illust_ids.join(',')}&tt=${BASE.tt}`;
    return fetchWithcookie(api).then(json => JSON.parse(json).body);
}

/**
 * return an array
 */
function getUsersDetails(user_ids) {
    const api = `http://www.pixiv.net/rpc/get_profile.php?user_ids=${user_ids.join(',')}&tt=${BASE.tt}`;
    return fetchWithcookie(api).then(json => JSON.parse(json).body);
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

const BASE = (() => {
    const bu = new URI(document.baseURI);
    const pn = bu.pathname();
    const ss = URI.parseQuery(bu.query());
    const baseURI = bu.toString();
    const tt = $('input[name="tt"]').val();
    const container = $('li.image-item').parent()[0];
    if(container){
        container.id = 'Koa-container';
    }

    let supported = true;
    let li_type = 'search';
    /** li_type - the DOM type to show li.image-item
     *
     *  'search'(default) : illust_150 + illust_title + user_name + bookmark_count
     *  'member_illust'   : illust_150 + illust_title +           + bookmark_count
     *  'mybookmark'      : illust_150 + illust_title + user_name + bookmark_count + checkbox + editlink
     */
    if (pn === '/member_illust.php' && ss.id) {
        li_type = 'member_illust';
    } else if (pn === '/search.php') {
    } else if (pn === '/bookmark.php' && !ss.type) {
        if (!ss.id) {
            li_type = 'mybookmark';
        }
    } else if (pn === '/bookmark_new_illust.php') {
    } else if (pn === '/new_illust.php') {
    } else if (pn === '/mypixiv_new_illust.php') {
    } else if (pn === '/new_illust_r18.php') {
    } else if (pn === '/bookmark_new_illust_r18.php') {
    } else {
        supported = false;
    }

    return {
        tt,
        baseURI,
        li_type,
        supported,
        container,
    };
})();

removeAnnoyance();

const VM = new Vue({
    el: '#Koa-container',
    template: '<ul><imageitem v-for="th in thumbs" :content="th"></imageitem></ul>',
    data: {
        thumbs: [{
            msg:'XDXDXD'
        }, {
            msg:'wwwwww'
        }]
    },
    components: {
        imageitem: {
            props:['content'],
            template: '<li class="image-item" style="order: 0;">{{ content.msg }}</li>'
        }
    }
});


//Debugging
window.fetchWithcookie = fetchWithcookie;
window.getBookmarkCount = getBookmarkCount;
window.getBatch = getBatch;
window.getIllustsDetails = getIllustsDetails;
window.getUsersDetails = getUsersDetails;
window.parseToDOM = parseToDOM;
window.removeAnnoyance = removeAnnoyance;
window.BASE = BASE;
window.VM = VM;
window.Vue = Vue;
window.URI = URI;
