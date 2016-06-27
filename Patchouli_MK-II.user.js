// ==UserScript==
// @name        Patchuli MK-II
// @description An image searching/browsing tool on Pixiv
// @namespace   https://github.com/FlandreDaisuki
// @include     http://www.pixiv.net/*
// @require     https://cdnjs.cloudflare.com/ajax/libs/vue/1.0.25/vue.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/URI.js/1.18.1/URI.min.js
// @version     2016.06.27
// @author      FlandreDaisuki
// @updateURL   https://raw.githubusercontent.com/FlandreDaisuki/Patchouli/master/Patchouli_MK-II.user.js
// @grant       none
// @noframes
// ==/UserScript==
/* jshint esnext: true */

function fetchWithcookie(url) {
    return fetch(url, {credentials: 'same-origin'})
        .then(response => response.text())
        .catch(err => { console.error(err); });
}

function getBookmarkCountAndTags(illust_id) {
    const url = `http://www.pixiv.net/bookmark_detail.php?illust_id=${illust_id}`;
    
    return fetchWithcookie(url)
        .then(html => parseToDOM(html))
        .then(doc => $(doc))
        .then($doc => {
            let m = $doc.find('a.bookmark-count').text();
            const bookmark_count =  m ? parseInt(m) : 0;
            const tags = Array.from($doc.find('ul.tags:first a')).map(x => x.innerText);

            return {
                bookmark_count,
                illust_id,
                tags,
            };
        })
        .catch(err => { console.error(err); });
}

function getBatch(url) {
    return fetchWithcookie(url)
        .then(html => parseToDOM(html))
        .then(doc => $(doc))
        .then($doc => {
            removeAnnoyance($doc);
            const next = $doc.find('.next a').attr('href');
            const nextLink = (next) ? new URI(BASE.baseURI).query(next).toString() : null;
            
            const illust_ids = $doc
                .find('li.image-item > a.work')
                .toArray()
                .map(x => URI.parseQuery($(x).attr('href')).illust_id);

            return {
                nextLink,
                illust_ids,
            };
        })
        .catch(err => { console.error(err); });
}

/**
 * return object which key is illust_id
 */
function getIllustsDetails(illust_ids) {
    const api = `http://www.pixiv.net/rpc/index.php?mode=get_illust_detail_by_ids&illust_ids=${illust_ids.join(',')}&tt=${BASE.tt}`;
    
    return fetchWithcookie(api).then(json => JSON.parse(json).body).catch(err => { console.error(err); });
}

/**
 * return an array
 */
function getUsersDetails(user_ids) {
    const api = `http://www.pixiv.net/rpc/get_profile.php?user_ids=${user_ids.join(',')}&tt=${BASE.tt}`;
    return fetchWithcookie(api).then(json => JSON.parse(json).body).catch(err => { console.error(err); });
}

function parseDataFromBatch(batch) {
    const illust_d = batch.illust_d;
    const user_d = batch.user_d;
    const bookmark_d = batch.bookmark_d;

    return batch.illust_ids
        .filter(x => x)
        .map(x => {
            const iinfo = illust_d[x];
            const uinfo = user_d[iinfo.user_id];
            const binfo = bookmark_d[x];
            const is_ugoira = iinfo.illust_type === '2';
            const is_manga = iinfo.illust_type === '1';
            const src150 = (is_ugoira) ?
                iinfo.url.big.replace(/([^-]+)(?:-original)([^_]+)(?:[^\.]+)(.+)/,'$1-inf$2_s$3') : 
                iinfo.url.m.replace(/600x600/,'150x150');
            
            return {
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
                tags: binfo.tags,
                bookmark_count: binfo.bookmark_count,
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
    const $fullwidthElement = $('#wrapper div:first');

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

    return {
        tt,
        baseURI,
        li_type,
        supported,
        container,
        $fullwidthElement,
    };
})();



Vue.filter('illust_href', function(illust_id) {
    return 'http://www.pixiv.net/member_illust.php?mode=medium&illust_id='+illust_id;
});

Vue.component('img150', {
    props:['thd'],
    template: `<a class="work _work"
                 :href="thd.illust_id | illust_href"
                 :class="{
                    'ugoku-illust': thd.is_ugoira,
                    'manga': thd.is_manga,
                    'multiple': thd.is_multiple}">
                    <div class="_layout-thumbnail"><img class="_thumbnail" :src="thd.src150"></img></div></a>`,

});

Vue.component('illust-title', {
    props:['thd'],
    template: '<a :href="thd.illust_id | illust_href"><h1 class="title" :title="thd.illust_title">{{thd.illust_title}}</h1></a>',
});

Vue.component('user-name', {
    props:['thd'],
    template: `<a class="user ui-profile-popup"
                 :href="thd.user_id | user_href"
                 :title="thd.user_name"
                 :data-user_id="thd.user_id"
                 :data-user_name="thd.user_name"
                 :class="{'followed': thd.is_follow}"> {{thd.user_name}}</a>`,
    filters: {
        user_href: function(user_id) {
            return 'http://www.pixiv.net/member_illust.php?id='+user_id;
        },
    },
});

Vue.component('count-list', {
    props:['thd'],
    template: `<ul class="count-list">
                    <li v-if="thd.bookmark_count > 0">
                        <a class="bookmark-count _ui-tooltip"
                          :href="thd.illust_id | bookmark_detail_href"
                          :data-tooltip="thd.bookmark_count | datatooltip">
                            <i class="_icon sprites-bookmark-badge"></i>{{thd.bookmark_count}}</a></li></ul>`,
    filters: {
        datatooltip: function(bookmark_count) {
            return bookmark_count+'件のブックマーク';
        },
        bookmark_detail_href: function(illust_id) {
            return 'http://www.pixiv.net/bookmark_detail.php?illust_id='+illust_id;
        },
    },
});

Vue.component('edit-link', {
    props:['thd'],
    template: '<a :href="thd.illust_id | edit_href" class="edit-work"><span class="edit-bookmark edit_link">編集</span></a>',
    filters: {
        edit_href: function(illust_id) {
            return `http://www.pixiv.net/bookmark_add.php?type=illust&illust_id=${ illust_id }&tag=&rest=show&p=1`;
        },
    },
});

Vue.component('imageitem-search', {
    props:['thdata'],
    template: `<li class="image-item">
                   <img150 :thd="thdata"></img150>
                   <illust-title :thd="thdata"></illust-title>
                   <user-name :thd="thdata"></user-name>
                   <count-list :thd="thdata"></count-list>
               </li>`,
});

Vue.component('imageitem-member-illust', {
    props:['thdata'],
    template: `<li class="image-item">
                    <img150 :thd="thdata"></img150>
                    <illust-title :thd="thdata"></illust-title>
                    <count-list :thd="thdata"></count-list>
               </li>`,
});

Vue.component('imageitem-mybookmark', {
    props:['thdata'],
    template: `<li class="image-item">
                    <bookmark-checkbox v-if="false" :thd="thdata"></bookmark-checkbox>
                    <img150 :thd="thdata"></img150>
                    <illust-title :thd="thdata"></illust-title>
                    <user-name :thd="thdata"></user-name>
                    <count-list :thd="thdata"></count-list>
                    <edit-link :thd="thdata"></edit-link>
               </li>`,
});

function setupHTML() {
    $(`
    <div id="Koa-controller" class="tachi">
        <div id="Koa-controller-child">
            <div id="Koa-found"><span id="Koa-found-value">0</span></div>
            <div id="Koa-bookmark">
                <span>★書籤</span>：
                <input id="Koa-bookmark-input" type="number" min="0" step="1" value="0" required/>
            </div>
            <div id="Koa-btn">
                <input id="Koa-btn-input" type="button" value="找"/>
            </div>
            <div id="Koa-options">
                全<input id="Koa-fullwidth-input" type="checkbox"/>
                排序<input id="Koa-ordering-input" type="checkbox"/>
            </div>
        </div>
    </div>`).appendTo('body');

    $(`
    <style>
    #Koa-controller.tachi {
        background-color: #8F2019;
        position: fixed;
        bottom: 0px;
        left: 0px;
        margin: 10px 30px;
        padding: 15px 8px 0px;
        border-radius: 15px 15px 8px 8px;
        font-size: 16px;
        cursor: default;
        z-index: 10;
    }

    #Koa-controller::before {
        content: '';
        position: absolute;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 30px 0 0 100px;
        border-color: transparent transparent transparent #000000;
        left: 0px;
        top: 0px;
        z-index: -1;
        transform-origin: 50% 50%;
        transform: translate(-45px,40px) skew(20deg, 0deg) rotate(-20deg);
    }

    #Koa-controller::after {
        border-width: 0 0 30px 100px;
        border-color: transparent transparent #000000 transparent;
        content: '';
        position: absolute;
        width: 0;
        height: 0;
        border-style: solid;
        right: 0px;
        top: 0px;
        z-index: -1;
        transform-origin: 50% 50%;
        transform: translate(45px,40px) skew(-20deg, 0deg) rotate(20deg);
    }

    #Koa-controller.chibi {
        width: 60px;
        background-color: #8F2019;
        position: fixed;
        bottom: 0px;
        left: 0px;
        margin: 10px 30px;
        padding: 10px 4px 15px;
        border-radius: 50%;
        font-size: 16px;
        cursor: default;
        z-index: 10;
        color: white;
    }
    
    #Koa-controller.chibi::before {
        transform: translate(-45px,10px) skew(20deg, 0deg) rotate(-10deg) scale(0.4);
    }

    #Koa-controller.chibi::after {
        transform: translate(45px,10px) skew(-20deg, 0deg) rotate(10deg) scale(0.4);
    }
    
    #Koa-controller.tachi #Koa-controller-child {
        background-color: #FEE6CA;
        border-bottom: 30px solid black;
        border-radius: 10px 10px 20px 20px;
    }

    #Koa-controller.chibi #Koa-controller-child {
        background-color: #8F2019;
        width: 100%;
        height: 30px;
        border-radius: 50%;
        margin-top: -2px;
    }

    #Koa-controller.chibi #Koa-controller-child::after {
        content: " ' ' ";
        display: block;
        text-align: center;
        font-size: 32px;
        padding-right: 5px;
        transform: rotate(10deg);
    }
    
    #Koa-controller.chibi #Koa-controller-child > div {
        display: none;
    }

    #Koa-found,
    #Koa-btn {
        text-align: center;
    }

    #Koa-controller.tachi #Koa-btn {
        border-left: 15px solid white;
        border-right: 15px solid white;
        background-color: black;
        color: white;
    }

    #Koa-controller.tachi #Koa-options {
        border-left: 15px solid white;
        border-right: 15px solid white;
        background-color: black;
        color: white;
    }

    #Koa-bookmark > span {
        color: #0069b1;
        background-color: #cceeff;
    }

    input#Koa-bookmark-input::-webkit-inner-spin-button, 
    input#Koa-bookmark-input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    input#Koa-bookmark-input {
        -moz-appearance: textfield;
    }

    input#Koa-bookmark-input {
        border: none;
        background-color: transparent;
        padding: 0px;
        color: blue;
        font-size: 16px;
        display: inline-block;
        width: 50px;
        cursor: ns-resize;
        text-align: center;
    }

    input#Koa-bookmark-input:focus {
        cursor: initial;
    }

    #Koa-controller.tachi #Koa-btn-input {
        border: none;
        background-color: #FFFF00;
        height: 100%;
        margin: 0px auto;
        display: block;
        border-radius: 0% 0% 50% 50%;
        font-size: 22px;
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
    .followed.followed.followed {
        font-weight: bold;
        color: red;
    }
    </style>`).appendTo('head');
}

function setupEvent() {

    const $KoaController = $('#Koa-controller');
    const $KoaBookmarkInput = $('#Koa-bookmark-input');
    const $KoaBtnInput = $('#Koa-btn-input');
    const $KoaFullwidthInput = $('#Koa-fullwidth-input');
    const $KoaOrderingInput = $('#Koa-ordering-input');

    $KoaController
        .on('click', function() {
            if($(this).hasClass('chibi')){
                $(this).removeClass('chibi');
                $(this).addClass('tachi');
            }
        })
        .on('mouseleave', function() {
            $(this).addClass('chibi');
            $(this).removeClass('tachi');
            $KoaBookmarkInput.focusout();
        });


    $KoaBookmarkInput
        .on('wheel', function(event) {
            this.blur();
            if(event.originalEvent.deltaY > 0) {
                this.stepDown(20);
            } else {
                this.stepUp(20);
            }
            MuQ.Koakuma.$data.limit = parseInt(this.value);
            return false;
        })
        .on('focusout', function(event) {
            this.blur();
            if(!this.validity.valid){
                console.log(this.validationMessage);
            } else {
                MuQ.Koakuma.$data.limit = parseInt(this.value);
            }
        });

    $KoaBtnInput.click(function(event) {
        if(!$KoaBookmarkInput[0].validity.valid){
            console.log($KoaBookmarkInput[0].validationMessage);
        } else {
            if (MuQ.intervalID) {
                clearInterval(MuQ.intervalID);
                MuQ.intervalID = null;
                this.value = '找';
                $KoaController.removeClass('working');
            } else {
                MuQ.intervalID = setInterval(function(){
                    MuQ.nextPage();
                }, 1000);
                this.value = '停';
                $KoaController.addClass('working');
            }
        }
        return false;
    });

    $KoaFullwidthInput.click(function(event){
        const node = BASE.$fullwidthElement;
        if (this.checked) {
            node.addClass('fullwidth');
        } else {
            node.removeClass('fullwidth');
        }
    });

    $KoaOrderingInput.click(function(event){
        const order_t = this.checked ? 'bookmark_count' : '';
        MuQ.Koakuma.$data.order_t = order_t;
    });
}

const MuQ = {
    nextLink: location.href,
    intervalID: null,
    init: function() {
        if(BASE.supported){
            if(BASE.container) {
                BASE.container.id = 'Koa-container';
            }
            $('#wrapper').width('initial');
            setupHTML();
            setupEvent();
            this.Koakuma.$mount('#Koa-container');
            this.Koakuma.$watch('thumbs', function(newVal, oldVal) {
                $('#Koa-found-value').text(newVal.length);
            });

            this.page = this.np_gen();
            this.np = this.page.next().value;
        }
    },
    nextPage: function() {
        this.np = this.np
            .then(n => this.page.next(n.nextLink).value )
            .catch(err => {
                console.error(err);
                clearInterval(this.intervalID);
                this.intervalID = null;
                $('#Koa-btn-input').attr('disabled', true).val('完');
            });
    },
    np_gen: function* () {
        while(this.nextLink) {
            this.nextLink = yield getBatch(this.nextLink)
                .then(bat => {
                    return getIllustsDetails(bat.illust_ids)
                        .then(illust_d => {
                            bat.illust_d = illust_d;
                            return bat;
                        });
                })
                .then(bat => {
                    return getUsersDetails(Object.keys(bat.illust_d)
                        .map((k) => bat.illust_d[k].user_id))
                        .then(user_d => {
                            bat.user_d = {};
                            user_d.forEach(x => bat.user_d[x.user_id] = x);
                            return bat;
                        });
                })
                .then(bat => {
                    return Promise.all(Object.keys(bat.illust_d)
                        .map((k) => bat.illust_d[k])
                        .map(x => getBookmarkCountAndTags(x.illust_id)))
                        .then(bookmark_d => {
                            bat.bookmark_d = {};
                            bookmark_d.forEach(x => bat.bookmark_d[x.illust_id] = x);
                            return bat;
                        });
                })
                .then(bat => {
                    this.Koakuma.$data.thumbs.push(...parseDataFromBatch(bat));
                    return bat;
                }).catch(err => {
                    console.error(err);
                });
        }
    },
    Koakuma: new Vue({
        template: `<ul><component :is="li_type" v-for="th in thumbs | bookmark_gt limit | orderBy order_t -1" :thdata="th"></component></ul>`,
        data: {
            thumbs: [],
            order_t: '',
            limit: 0,
        },
        computed: {
            li_type: function() {
                return 'imageitem-' + BASE.li_type;
            },
        },
        filters: {
            bookmark_gt: function(data, limit) {
                return data.filter(x => x.bookmark_count >= limit);
            },
        },
    }),
};

removeAnnoyance();
MuQ.init();

//Debugging
window.fetchWithcookie = fetchWithcookie;
window.getBookmarkCountAndTags = getBookmarkCountAndTags;
window.getBatch = getBatch;
window.getIllustsDetails = getIllustsDetails;
window.getUsersDetails = getUsersDetails;
window.parseToDOM = parseToDOM;
window.parseDataFromBatch = parseDataFromBatch;
window.removeAnnoyance = removeAnnoyance;
window.BASE = BASE;
window.MuQ = MuQ;
window.Vue = Vue;
window.URI = URI;