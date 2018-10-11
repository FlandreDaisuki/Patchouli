<template>
  <div id="patchouli-context-menu" :style="inlineStyle">
    <ul v-show="currentType === 'image-item-image'">
      <li>
        <a role="button" @click.left="thumbUp">
          <FontAwesomeIcon :icon="'thumbs-up'"/>
          {{ $t('contextMenu.thumbUp') }}
        </a>
      </li>
      <li v-show="isDownloadable">
        <a role="button" @click.left="downloadOne">
          <FontAwesomeIcon :icon="'download'"/>
          {{ $t('contextMenu.download') }}
        </a>
      </li>
      <li>
        <a role="button" @click.left="openPreview">
          <FontAwesomeIcon :icon="'search-plus'"/>
          {{ $t('contextMenu.preview') }}
        </a>
      </li>
      <li>
        <a
          :href="bookmarkPageLink"
          role="button"
          target="_blank">
          <FontAwesomeIcon :icon="'bookmark'"/>
          {{ $t('contextMenu.openBookmarkPage') }}
        </a>
      </li>
    </ul>
    <ul v-show="currentType === 'image-item-title-user'">
      <li>
        <a role="button" @click.left="addToBlacklist">
          <FontAwesomeIcon :icon="'eye-slash'"/>
          {{ $t('contextMenu.addToBlacklist') }}
        </a>
      </li>
      <li v-show="currentImageItem && !currentImageItem.isFollowed">
        <a role="button" @click.left="followUser">
          <FontAwesomeIcon :icon="'rss'"/>
          {{ $t('contextMenu.followUser') }}
        </a>
      </li>
    </ul>
  </div>
</template>


<script>
import { PixivAPI } from '../lib/pixiv';
import { $el } from '../lib/utils';
import GMC from '../lib/gmc';

import FontAwesomeIcon from './FontAwesomeIcon.vue';

export default {
  components: { FontAwesomeIcon },
  computed: {
    bookmarkPageLink() {
      if (!this.xdata) {
        return '#';
      }
      return `bookmark_add.php?type=illust&illust_id=${this.xdata.illustId}`;
    },
    currentImageItem() {
      if (!this.xdata) {
        return null;
      }
      const lib = this.$store.getters['pixiv/imageItemLibrary'];
      const found = lib.find(i => i.illustId === this.xdata.illustId);
      return found ? found : null;
    },
    currentType() {
      if (!this.xdata) {
        return '';
      }
      return this.xdata.type;
    },
    inlineStyle() {
      const RIGHT_BOUND = 200; // magic number
      const position = this.xpos;
      const ow = document.body.offsetWidth;

      let style = `top: ${position.y}px;`;
      if (ow - position.x < RIGHT_BOUND) {
        style += `right: ${ow - position.x}px;`;
      } else {
        style += `left: ${position.x}px;`;
      }
      return style;
    },
    isDownloadable() {
      return (
        this.currentImageItem &&
        this.currentImageItem.illustPageCount === 1 &&
        !this.currentImageItem.isUgoira // unsupport ugoira currently
      );
    },
    isUgoira() {
      return this.currentImageItem && this.currentImageItem.isUgoira;
    },
    xdata() {
      return this.$store.getters['contextMenu/data'];
    },
    xpos() {
      return this.$store.getters['contextMenu/pos'];
    },
  },
  methods: {
    addToBlacklist() {
      if (this.currentImageItem) {
        const userId = this.currentImageItem.userId;
        const blacklist = this.$store.getters.config.blacklist;
        blacklist.push(userId);
        blacklist.sort((a, b) => a - b);
        this.$store.commit('setConfig', { blacklist });
        this.$store.commit('saveConfig');
      }
    },
    async downloadOne() {
      const imgUrl = this.currentImageItem.urls.original;
      const illustId = this.currentImageItem.illustId;
      const a = $el('a', { href: imgUrl });

      const filename = a.pathname.split('/').pop();
      const ext = filename
        .split('.')
        .pop()
        .toLowerCase();
      /* eslint-disable sort-keys */
      const response = await GMC.XHR({
        method: 'GET',
        url: imgUrl,
        // greasemonkey has no this API
        responseType: 'arraybuffer',
        // for greasemonkey
        binary: true,
        headers: {
          Referer: `https://www.pixiv.net/member_illust.php?mode=medium&illust_id=${illustId}`,
        },
      });
      /* eslint-enable sort-keys */

      if (ext === 'jpg' || ext === 'jpeg') {
        saveAs(new File([response.response], filename, { type: 'image/jpeg' }));
      } else if (ext === 'png') {
        saveAs(new File([response.response], filename, { type: 'image/png' }));
      }
    },
    async followUser() {
      if (this.currentImageItem) {
        const userId = this.currentImageItem.userId;

        if (await PixivAPI.postFollowUser(userId)) {
          this.$store.commit('pixiv/editImgItem', {
            type: 'follow-user',
            userId: this.currentImageItem.userId,
          });
        }
      }
    },
    openPreview() {
      this.$store.commit('coverLayer/open', {
        data: this.currentImageItem,
        mode: 'preview',
      });
    },
    thumbUp() {
      if (this.currentImageItem) {
        PixivAPI.postIllustLike(this.currentImageItem.illustId);
      }
    },
  },
};
</script>

<style scoped>
#patchouli-context-menu {
  box-sizing: border-box;
  border: 1px solid #b28fce;
  position: fixed;
  z-index: 10;
  background-color: #fff;
  font-size: 16px;
  overflow: hidden;
  border-radius: 5px;
}
#patchouli-context-menu > ul {
  margin: 0;
  padding: 0;
  line-height: 20px;
}
#patchouli-context-menu > ul > li {
  display: flex;
  align-items: center;
}
#patchouli-context-menu > ul a {
  color: #85a;
  padding: 3px;
  flex: 1;
  text-decoration: none;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  text-align: center;
}
#patchouli-context-menu > ul a:hover {
  background-color: #b28fce;
  color: #fff;
  cursor: pointer;
}
#patchouli-context-menu > ul svg[role="img"] {
  height: 18px;
  width: 18px;
  margin: 0 4px;
}
</style>
