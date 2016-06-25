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
                const bookmark_count =  m ? parseInt(m[1]) : 0;
                return {
                    bookmark_count,
                    illust_id,
                };
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
                                .map(x => URI.parseQuery($(x).attr('href')).illust_id);
            //debugger;
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

function parseDataFromBatch(batch) {
    const illust_d = batch.illust_d;
    const user_d = batch.user_d;
    const bookmark_d = batch.bookmark_d;
    return batch.illust_ids.map(x => {
        const iinfo = illust_d[x];
        const uinfo = user_d[iinfo.user_id];
        const bookmark_count = bookmark_d[x];
        const is_ugoira = iinfo.illust_type === '2';
        const is_manga = iinfo.illust_type === '1';
        const src150 = (is_ugoira) ?
                            iinfo.url.big.replace(/([^-]+)(?:-original)([^_]+)(?:.+)/,'$1-inf$2_s.jpg') : 
                            iinfo.url.m.replace(/600x600/,'150x150');
        return {
            bookmark_count,
            is_ugoira,
            is_manga,
            src150,
            srcbig: iinfo.url.big,
            is_multiple: iinfo.is_multiple,
            illust_id: iinfo.illust_id,
            illust_title: iinfo.illust_title,
            user_id: uinfo.user_id,
            user_name: uinfo.user_name,
            is_follow: uinfo.is_follow,
        };
    });
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
    const fullwidthElement = $('#wrapper div:first-child')[0];

    let supported = true;
    let li_type = 'search';
    /** li_type - the DOM type to show li.image-item
     *
     *  'search'(default) : illust_150 + illust_title + user_name + bookmark_count
     *  'member-illust'   : illust_150 + illust_title +           + bookmark_count
     *  'mybookmark'      : illust_150 + illust_title + user_name + bookmark_count + checkbox + editlink
     */
    if (pn === '/member_illust.php' && ss.id) {
        li_type = 'member-illust';
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

    if(supported && container) {
        container.id = 'Koa-container';
        $('#wrapper').width('initial');
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

Vue.filter('datatooltip', function(bookmark_count) {
    return bookmark_count+'件のブックマーク';
});

Vue.filter('bookmark_detail_href', function(illust_id) {
    return 'http://www.pixiv.net/bookmark_detail.php?illust_id='+illust_id;
});

Vue.filter('illust_href', function(illust_id) {
    return 'http://www.pixiv.net/member_illust.php?mode=medium&illust_id='+illust_id;
});

Vue.filter('user_href', function(user_id) {
    return 'http://www.pixiv.net/member_illust.php?id='+user_id;
});

Vue.filter('edit_href', function(illust_id) {
    return `http://www.pixiv.net/bookmark_add.php?type=illust&illust_id=${ illust_id }&tag=&rest=show&p=1`;
});

Vue.filter('prefix', function(value, prefix) {
    return ''+prefix+value;
});

Vue.component('img150', {
    props:['thd'],
    template: `<a class="work _work" :href="thd.illust_id | illust_href" :class="{'ugoku-illust': thd.is_ugoira, 'manga': thd.is_manga, 'multiple': thd.is_multiple}">
                    <div class="_layout-thumbnail"><img class="_thumbnail" :src="thd.src150"></img></div></a>`
});

Vue.component('illust-title', {
    props:['thd'],
    template: '<a :href="thd.illust_id | illust_href"><h1 class="title" :title="thd.illust_title">{{thd.illust_title}}</h1></a>'
});

Vue.component('user-name', {
    props:['thd'],
    template: `<a class="user ui-profile-popup"
                 :href="thd.user_id | user_href" :title="thd.user_name"
                 :data-user_id="thd.user_id" :data-user_name="thd.user_name">
                    {{thd.user_name}}</a>`
});

Vue.component('count-list', {
    props:['thd'],
    template: `<ul class="count-list">
                    <li v-if="thd.bookmark_count > 0">
                        <a :href="thd.illust_id | bookmark_detail_href" class="bookmark-count _ui-tooltip" :data-tooltip="thd.bookmark_count | datatooltip">
                            <i class="_icon sprites-bookmark-badge"></i>{{thd.bookmark_count}}</a></li></ul>`
});

Vue.component('bookmark-checkbox', {
    // the value is magic number that a can't calculate it
    props:['thd'],
    template: '<input name="book_id[]" id="i_2378092188" value="2378092188" onclick="select_illust(2378092188)" type="checkbox">'
});

Vue.component('edit-link', {
    props:['thd'],
    template: '<a :href="thd.illust_id | edit_href" class="edit-work"><span class="edit-bookmark edit_link">編集</span></a>'
});

Vue.component('imageitem-search', {
    props:['thdata'],
    template: `<li class="image-item" style="order: 0;">
                <img150 :thd="thdata"></img150>
                <illust-title :thd="thdata"></illust-title>
                <user-name :thd="thdata"></user-name>
                <count-list :thd="thdata"></count-list></li>`
});

Vue.component('imageitem-member-illust', {
    props:['thdata'],
    template: `<li class="image-item" style="order: 0;">
                <img150 :thd="thdata"></img150>
                <illust-title :thd="thdata"></illust-title>
                <count-list :thd="thdata"></count-list></li>`
});

Vue.component('imageitem-mybookmark', {
    props:['thdata'],
    template: `<li class="image-item" style="order: 0;">
                <bookmark-checkbox v-if="false" :thd="thdata"></bookmark-checkbox>
                <img150 :thd="thdata"></img150>
                <illust-title :thd="thdata"></illust-title>
                <count-list :thd="thdata"></count-list>
                <edit-link :thd="thdata"></edit-link>
                </li>`
});

const VM = new Vue({
    el: '#Koa-container',
    template: '<ul><component :is="li_type" v-for="th in thumbs" :thdata="th"></component></ul>',
    data: {
        thumbs: []
    },
    computed: {
        li_type: function() {
            return 'imageitem-' + BASE.li_type;
        },
    }
});

function setupHTML() {
$(`
    <style>
    /* Pixiv Better */
    #wrapper {
        width: initial;
    }

    #Koa-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
        margin-left: initial;
    }

    .fullwidth {
        width: initial;
    }

    .layout-a.fullwidth {
        display: flex;
        flex-direction: row-reverse;
    }

    .layout-a.fullwidth .layout-column-2{
        flex: 1;
        margin-left: 20px;
    }

    .layout-body.fullwidth,
    .layout-a.fullwidth {
        margin: 10px 20px;
    }
    </style>`).appendTo('head');
}

setupHTML();

(function() {
    window.testing = getBatch(location.href)
        .then(bat => {
            console.log(bat);
            return getIllustsDetails(bat.illust_ids)
                .then(illust_d => {
                    bat.illust_d = illust_d;
                    return bat;
                });
        })
        .then(bat => {
            //debugger;
            return getUsersDetails(Object.keys(bat.illust_d).map((k) => bat.illust_d[k].user_id))
                .then(user_d => {
                    bat.user_d = {};
                    user_d.forEach(x => bat.user_d[x.user_id] = x);
                    return bat;
                });
        })
        .then(bat => {
            return Promise.all(Object.keys(bat.illust_d).map((k) => bat.illust_d[k]).map(x => getBookmarkCount(x.illust_id)))
                .then(bookmark_d => {
                    bat.bookmark_d = {};
                    bookmark_d.forEach(x => bat.bookmark_d[x.illust_id] = x.bookmark_count);
                    return bat;
                });
        })
        .then(bat => {
            console.log(parseDataFromBatch(bat));
            VM.$data.thumbs.push(...parseDataFromBatch(bat));
            window.testing_bat = bat;
            return bat;
        });
})();

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
